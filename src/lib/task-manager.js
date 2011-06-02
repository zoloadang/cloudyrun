
var mongoose = require('mongoose'),
    Schema   = mongoose.Schema,
    db       = mongoose.connect('mongodb://127.0.0.1/cloudyrun');

mongoose.model('Task', new Schema({
    taskId:       String,
    taskType:     String,
    command:      String,
    client:       Array,
    clientStatus: Array,
    console:      Array,
    date:         Date
}));


var util = require('./util'),
    uuid = require('node-uuid'),
    ParserManager = require('./parser-manager'),
    SessionManager = require('./session-manager'),
    Task  = db.model('Task'),

    queue = [], // 任务队列
    EXECUTING_TASK_MAX = 1; // 最多同时执行的任务数


var TaskManager = {

    /**
     * Add Task
     * @param data {Object}
     */
    add: function(session, data, success) {
        if (util.isString(data.client)) {
            data.client = [data.client];
        }

        var t = util.extend(new Task(), {
            'taskId':   uuid(),
            // 'taskType': 'execScript',
            'command':  data.command.trim(),
            'room':     session.room,
            'client':   data.client || [],
            'console':  [session.sessionId],
            'date':     new Date()
        });

        // 建立 clientStatus 属性
        var ss = SessionManager.get('client', t.client, t.room);
        var cs = {};
        var dataClient = [];
        for (var k in ss) {
            cs[k] = ['', ss[k].browser];
            dataClient.push(k);
        }
        t.clientStatus = cs;
        t.client = dataClient;
        util.log('[log] t.clientStatus[0]: ' + t.clientStatus[0]);

        // 遍历插件，确定任务类型，并和插件绑定
        var parsers = ParserManager.getParsers();
        for (var i=0; i<parsers.length; i++) {
            var parser = parsers[i];
            var match = data.command.match(parser.pattern);
            if (match) {
                t.taskType = parser.name;
                t.parser = parser;
                if (match[1]) {
                    // TODO: 迁移这个 hack，减少耦合
                    var c = match[1];
                    if (t.taskType === 'runTest' && c.indexOf('http://') === -1) {
                        c = 'http://' + c;
                    }
                    t.command = match[1];
                }
                break;
            }
            if (parser.pattern.test(data.command)) {
                t.taskType = parser.name;
                t.parser = parser;
                break;
            }
        }

        util.log('saving');
        var self = this;
        t.save(function(err) {
            if (err) {
                util.log('[error] task saving failed, error message: ' + err);
                return;
            }

            queue.push(t);
            self.checkQueue();
            if (success && util.isFunction(success)) {
                success.call(this);
            }

            util.log('[success] task saved, command: ' + t.command);
            self.tell(t, 'console', {
                'messageType': 'addTask'
            });
            self.updateQueueToConsole(t.room);
        });
    },

    /**
     * 检查队列，可执行的立即执行
     */
    checkQueue: function() {
        for (var i=0; i<queue.length; i++) {
            var t = queue[i];
            if (t && t.taskType === 'execScript'
                    || (i<EXECUTING_TASK_MAX && !t.executing)) {
                this.execute(t);
            }
        }
    },

    /**
     * 执行任务
     * @param t {Task}
     */
    execute: function(t) {
        t.executing = true;

        if (t.parser && t.parser.executeTask) {
            t.parser.executeTask(t);
            return;
        }

        this.tell(t, 'client', {
            'messageType': 'runTask'
        });
    },

    /**
     * 告诉 t 的 console 或 client 一些数据
     * @param t
     * @param type
     * @param data
     */
    tell: function(t, type, data) {
        util.log('[action] executing, command: ' + t.command);

        for (var i=0; i<t[type].length; i++) {
            var s = SessionManager.get(type, t[type][i], t.room);
            if (s) {
                var cs = [];
                for (var k in t.clientStatus[0]) {
                    cs.push({
                        'sessionId': k,
                        'message': t.clientStatus[0][k][0],
                        'browser': t.clientStatus[0][k][1],
                        'loading': !t.clientStatus[0][k][0],
                        'loaded':  !!t.clientStatus[0][k][0]
                    });
                }
                data = util.extend(data, {
                    'taskId': t.taskId,
                    'taskType': t.taskType,
                    'command': t.command,
                    'clientStatus': cs
                });
                SessionManager.send(s, data);
            }
        }
    },

    /**
     * 更新 Queue 到控制台
     * @param room {String}
     */
    updateQueueToConsole: function(room) {
        var q = [];
        for (var i=0; i<queue.length; i++) {
            if (queue[i].taskType === 'runTest') {
                q.push(queue[i].command);
            }
        }
        
        var s = SessionManager.get('console', null, room);
        if (s) {
            SessionManager.send(s, {
                'messageType': 'updateQueue',
                'queue': q
            });
        }
    },

    /**
     * 更新任务
     * @param data {Object}
     */
    update: function(data) {
        util.log('[action] updating task');
        if (!data.sessionId || !data.taskId || !data.result) {
            return;
        }

        var self = this;
        var t = self.getTaskById(data.taskId);

        util.log(data.taskId);
        util.log(t);

        // 发送 timeout 时，t 可能已经被删除
        if (t && util.isString(t.clientStatus[0][data.sessionId][0])) {
            // 考虑要接收 timeout 的结果，所以不允许重复更新数据
            if (t.clientStatus[0][data.sessionId][0] !== '') {
                util.log('[warn] task updating failed, result existed!');
                return;
            }
            
            var obj = {};
            obj[data.sessionId] = [data.result, t.clientStatus[0][data.sessionId][1]];

            t.clientStatus = util.extend({}, t.clientStatus[0], obj);
            t.save(function(err) {
                if (err) {
                    util.log('[error] task updating failed, taskid: ' + data.taskId);
                    return;
                }
                util.log('[success] task updated: ' + data.taskId);
                self.checkTask(t);

                self.tell(t, 'console', {
                    'messageType': 'updateTask'
                });
                self.updateQueueToConsole(t.room);
            });
        }
    },

    /**
     * 检查任务是否完成
     * @param t {Task}
     */
    checkTask: function(t) {
        util.log('[action] checking task: ' + t.taskId);
        util.log(t.clientStatus[0]);

        for (var k in t.clientStatus[0]) {
            if (!t.clientStatus[0][k][0]) {
                return;
            }
        }

        util.log('[action] deleting task: ' + t.taskId);
        queue.splice(queue.indexOf(t), 1);
        this.checkQueue();
    },

    clearQueue: function() {
        queue = [];
    },

    /**
     * 通过 taskId 获取任务
     * @param taskId {String}
     */
    getTaskById: function(taskId) {

        util.log('tmp----');
        util.log(queue.length);
        for (var i=0; i<queue.length; i++) {
            util.log(queue[i].taskId);
        }
        for (var i=0; i<queue.length; i++) {
            var t = queue[i];
            if (t && t.taskId === taskId) {
                return t;
            }
        }
        return null;
    },

    getTaskInfoById: function(taskId, cb) {
        if (!taskId) return;
        Task.find({taskId:taskId}, function(err, docs) {
            if (err) {
                cb && cb('[err] db finding failed!');
                return;
            }

            var d = docs[0];
            var html = '<link rel="stylesheet" href="/assets/task.css" />';
            html += '<div class="task-status">';
            html += '<div class="task-status-general"><span class="a">&gt;</span><span class="b">:'+d['taskType']+' '+d['command']+'</span><span class="c">completed in '+d['time']+' ms.</span></div>';
            if (d.taskType === 'runTest') {
                html += '<div class="task-status-line task-status-line-header"><span class="s1">Suite</span><span class="s2">Test</span><span class="s3">Result</span><span class="s4">Notes</span></div>';
                for (var k in d.clientStatus[0]) {
                    var data = d.clientStatus[0][k];
                    html += '<div class="task-status-line task-status-line-browser">'+data[1]+'</div>';
                    try {
                        var json = JSON.parse(data[0]);
                        json.result = JSON.parse(decodeURIComponent(json.result));

                        for (var k in json.result['suites']) {
                            var suite = json.result['suites'][k];
                            suite.specs.forEach(function(spec) {
                                html += '<div class="task-status-line task-status-line-'+spec.status+'"><span class="s1">'+suite.description + '</span><span class="s2">' +
                                       spec.description + '</span><span class="s3">' + spec.status + '</span><span class="s4">-</span></div>';
                            });
                        }
                    } catch(e) {
                        html += 'timeout';
                    }
                }
            } else {
                html += '<span style="color:red;font-size:20px;margin-top:40px;">sorry, only jasmine test result supported now!</span>';
            }
            html += '</div>';
            cb && cb(html);
        });
    },

    /**
     * 从数据库里获取任务数据
     * @param taskId {String}
     * @param cb {Function}
     * for debug
     */
    getTasksFromDB: function(taskId, cb) {
        var filter = {};
        if (taskId) {
            filter.taskId = taskId;
        }

        var html = '';
        var q = [];
        for (var i=0; i<queue.length; i++) {
            q.push(queue[i].taskId);
        }
        html += '<h2>Queue</h2>';
        if (q.length) {
            html += '<ol><li>'+q.join('</li><li>')+'</li></ol>';
        } else {
            html += 'empty';
        }

        Task.find(filter, [], {sort:{date:-1},limit:10}, function(err, docs) {
            if (err) {
                cb && cb('[err] db finding failed!');
                return;
            }

            var ret = [];
            for (var i=0; i<docs.length; i++) {
                var d = docs[i];
                ret.push(JSON.stringify({
                    'command': d.command,
                    'clientStatus': d.clientStatus,
                    'date': d.date,
                    'taskId': d.taskId
                }));
            }

            html += '<h2>List</h2><ol><li>'+ret.join('</li><br><li>')+'</li></ol>';
            cb && cb(html);
        });
    },

    /**
     * 获取所有的命令列表
     * @param cb {Function}
     */
    getCommandsFromDB: function(cb) {
        Task.find(null, [], {sort:{date:-1},limit:300}, function(err, docs) {
            if (err || !docs) return;
            var html = '';
            docs.forEach(function(a) {
                html += ':' + a.taskType + ' ' + a.command + ' <span style="display:none;">' + a.taskId + '</span><br>';
            });
            cb && cb(html);
        });
    }
};

module.exports = TaskManager;

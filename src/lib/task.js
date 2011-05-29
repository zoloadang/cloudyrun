
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
    EXECUTING_TASK_MAX = 2; // 最多同时执行的任务数


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
            'command':  data.command,
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

        util.log('----tmp---');
        util.log(t.parser);

        util.log('saving');
		var self = this;
		t.save(function(err) {
			if (err) {
				util.log('[error] task saving failed, error message: ' + err);
				return;
			}

            util.log('[success] task saved, command: ' + t.command);
            self.tell(t, 'console', {
                'messageType': 'addTask'
            });
			
			queue.push(t);
			self.checkQueue();
			if (success && util.isFunction(success)) {
				success.call(this);
			}
		});
	},

    /**
     * 检查队列，可执行的立即执行
     */
	checkQueue: function() {
		for (var i=0; i<EXECUTING_TASK_MAX; i++) {
			if (queue[i] && !queue[i].executing) {
				this.execute(queue[i]);
			}
		}
	},

    /**
     * 执行任务
     * @param t {Task}
     */
	execute: function(t) {
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
        
        if (util.isString(t.clientStatus[0][data.sessionId][0])) {
            var obj = {};
            obj[data.sessionId] = [data.result, t.clientStatus[0][data.sessionId][1]];

            t.clientStatus = util.extend({}, t.clientStatus[0], obj);
            t.save(function(err) {
                if (err) {
                    util.log('[error] task updating failed, taskid: ' + data.taskId);
                    return;
                }
                util.log('[success] task updated: ' + data.taskId);
                util.log('telling');
                self.tell(t, 'console', {
                    'messageType': 'updateTask'
                });
                self.checkTask(t);
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
    }
};

module.exports = TaskManager;

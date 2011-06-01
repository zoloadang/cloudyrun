
var util = require('./lib/util'),
    app  = require('./lib/app'),
    TaskManager = require('./lib/task-manager'),
    ParserManager  = require('./lib/parser-manager'),
    SessionManager = require('./lib/session-manager'),
    io = require('socket.io'),
    socket = io.listen(app);

app.get(/^\/(\w+)(\/room\/(\w+))?/, function(req, res, next) {
    var type = req.params[0],
        room = req.params[2];

    if (type && 'console|client|proxy|empty'.indexOf(type) > -1) {
        res.render(type+'.jade', {layout: false});
    } else {
        next();
    }
});

app.get('/task/:taskId', function(req, res) {
    var taskId = req.params.taskId;
    console.log('taskId: ' + taskId);
    TaskManager.getTaskInfoById(taskId, function(docs) {
        res.send(docs);
    });
});

app.get('/tasks', function(req, res) {
    TaskManager.getTasksFromDB(null, function(docs) {
        res.send(docs);
    });
});

app.post('/post', function(req, res) {
    util.log('-------------post----------');
    util.log(req.body);
    var data = req.body;
    data.result = decodeURIComponent(data.result);
    TaskManager.update(data);
    res.end('');
});

socket.on('connection', function(s) {
    s.on('message', function(data, self) {
        util.log('[log] message getted: ' + data);
        try {
            data = JSON.parse(data);
        } catch(e) {
            util.log('[error] message parsing failed!');
            return;
        }
        self = this;

        switch (data.messageType) {
            case 'connect':
                SessionManager.add(self, data, TaskManager);
                break;
            case 'addTask':
                TaskManager.add(self, data, function() {
                    SessionManager.send();
                });
                break;
            case 'updateTask':
                data.sessionId = s.sessionId;
                TaskManager.update(data);
                break;
        }
    });

    s.on('disconnect', function() {
        SessionManager.remove(this);
    });
});


var port = process.env.PORT || 8080;
app.listen(port);
console.log('[log] server started at '+port);

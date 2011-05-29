//----------------------------------------------------------------------------
// Socket Connect
//----------------------------------------------------------------------------

var socket = new io.Socket();

socket.base = {
    'type': g_config['type'],
    'browser': util.getBrowserInfo(navigator.userAgent),
    'room': util.getRoom(),
    'ip': ''
};

socket.sendData = function(data) {
    data = util.extend({}, this.base, data);
    try {
        data = JSON.stringify(data);
    } catch(e) {
        util.log('[error] json data stringifing failed!');
        return;
    }
    util.log('[data send] ' + data);
    this.send(data);
};

socket.getParserByName = function(name) {
    var parsers = this.base.parsers;
    if (!parsers) {
        return;
    }

    for (var i=0; i<parsers.length; i++) {
        if (parsers[i].name === name) {
            return parsers[i];
        }
    }
}

socket.connect();

socket.on('connect', function() {
    this.sendData({'messageType': 'connect'});
});

socket.on('message', function(data) {
    if (g_config['type'] === 'console') {
        util.log('[data get] '+data);
    }

    try {
        data = JSON.parse(data);
    } catch(e) {
        alert('[error] json data parsing failed!');
        return;
    }

    if (data && data.messageType && handler[data.messageType]) {
        handler[data.messageType].call(this, data);
    }
});

var handler = {

    /**
     * 更新浏览器列表
     * @param data
     */
    updateBrowserList: function(data) {
        var browsers = [];
        var msg = data.message;

        msg.sort(function(a, b) {
            return a.browser.toLowerCase() < b.browser.toLowerCase();
        });
        for (var k in msg) {
            browsers.push('<b>'+msg[k].browser+'</b>');
        }

        jQuery('#browser-list').html('Connected: ' + browsers.join(', '));
    },

    /**
     * 更新 session 信息
     * @param data
     */
    updateSessionInfo: function(data) {
        this.base.sessionId = data.sessionId;
        this.base.room = data.room;
        try {
            this.base.parsers = data.parsers;
        } catch(e) {
            alert(e.message);
        }

        util.log('[success] sessionInfo updated: ' + JSON.stringify(this.base));
    },

    updateParsers: function(data) {
        if (data.parsers) {
            parsers = data.parsers;
        }
    },

    /**
     * 执行任务
     * @param data
     */
    runTask: function(data) {
        if (!data.command || !data.taskId || !data.taskType) {
            util.log('[error] runTask failed, data not valid!')
            return;
        }

        var parser = this.getParserByName(data.taskType);
        if (parser && parser.runTask) {
            var runTask = eval('('+parser.runTask+')');
            runTask.call(this, data, Client);
        }
    },

    addTask: function(data) {
        handler.updateTask.call(this, data);
    },

    updateTask: function(data) {
        var parser = this.getParserByName(data.taskType);
        var template = parser['outputTemplate'];
        var html = Mustache.to_html(template, data);

        if (jQuery('#'+data.taskId)) {
            jQuery('#'+data.taskId).remove();
        }
        $('#output').prepend(html);
    }
};

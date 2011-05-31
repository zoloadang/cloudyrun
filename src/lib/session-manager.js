/**
 * Session Manager
 */

var util = require('./util');
var ParserManager  = require('./parser-manager');
var DEFAULT_ROOM = 'cloudyrun_default_room'; // 默认房间号
var sessions = {
    console: {},
    client: {}
};

var SessionManager = {

    /**
     * Add Session
     * @param s {Session}
     * @param data {Object}
     */
    add: function(s, data, tm) {
        if (s.type || !data.type || !sessions[data.type]) {
            return;
        }

        for (var k in data) {
            s[k] = data[k];
        }
        if (!s.room) {
            s.room = DEFAULT_ROOM;
        }
        sessions[data.type][s.sessionId] = s;

        this.send(s, {
            'messageType': 'updateSessionInfo',
            'sessionId': s.sessionId,
            'room': s.room,
            'parsers': ParserManager.getParsers()
        });
        this.updateToConsole(s.room);
        tm.updateQueueToConsole(s.room);
    },

    send: function(s, data) {
        if (!s) return;

        if (!s.sessionId && typeof s === 'object') {
            for (var k in s) {
                if (s[k] && s[k].sessionId) {
                    this.send(s[k], data);
                } else {
                    util.log('[------------]');
                    util.log(k);
                    util.log(s[k]);
                }
            }
            return;
        }

        if (util.isObject(data)) {
            try {
                data = JSON.stringify(data);
            } catch(e) {
                util.log('[error] json data stringifing failed!');
                util.log(data);
                return;
            }
        }

        util.log('[log] send message to: '+s.type+', browser: '+s.browser);
        util.log('[log] send content: ' + data);
        s.send(data);
    },

    /**
     * Get Sessions By Type[ and Room]
     * @param type {String}
     * @param ids  {Array}
     * @param room {String} optional
     */
    get: function(type, ids, room) {
        if (!sessions[type]) return;

        var ss = sessions[type];
        var ret = {};
        if (util.isString(ids)) {
            ids = [ids];
        }

        for (var k in ss) {
            if ( (!room || (ss[k]['room'] && ss[k]['room'] === room))
                    && (!ids || !ids.length || ids.indexOf(ss[k].sessionId) > -1) ) {
                if (ids && ids.length === 1) {
                    ret = ss[k];
                    break;
                } else {
                    ret[k] = ss[k];
                }
            }
        }

        return ret;
    },

    /**
     * Remove Session
     */
    remove: function(s) {
        if (s && s.type && s.sessionId) {
            delete sessions[s.type][s.sessionId];
            this.updateToConsole(s.room);
        }
    },

    /**
     * 更新信息到 Console
     * @param room
     */
    updateToConsole: function(room) {
        var cons = this.get('console', null, room);
        var clis = this.get('client', null, room);
        var message = [];

        for (var k in clis) {
            message.push({
                'sessionId': clis[k].sessionId,
                'browser': clis[k].browser,
                'room': clis[k].room,
                'ip': clis[k].ip
            });
        }

        this.send(cons, {
            'messageType': 'updateBrowserList',
            'message': message
        });
    }
};

module.exports = SessionManager;

/*
TODO:
1. room
2. queue same client
*/

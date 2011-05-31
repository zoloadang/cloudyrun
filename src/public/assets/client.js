
(function() {

    var sandboxframe = document.createElement('iframe');
    sandboxframe.id = 'sandboxframe';
    sandboxframe.src = '/empty';
    document.body.appendChild(sandboxframe);
    var sandbox = sandboxframe.contentDocument || sandboxframe.contentWindow.document;

    /* rewrite functions */
    sandboxframe.contentWindow.alert = function() {};
    if (({}).toString.call(setTimeout) === '[object Object]') {
        var _setTimeout = sandboxframe.contentWindow.setTimeout;
        sandboxframe.contentWindow.setTimeout = function(a, b, c, d) {
            _setTimeout(a, b, c, d);
        };
        var _setInterval = sandboxframe.contentWindow.setInterval;
        sandboxframe.contentWindow.setInterval = function(a, b, c, d) {
            _setInterval(a, b, c, d);
        };
    }

    // custom because I want to be able to introspect native browser objects *and* functions
    var stringify = function(o, simple) {
        var json = '', i, type = ({}).toString.call(o), parts = [], names = [];

        if (type == '[object String]') {
            json = '"' + o.replace(/"/g, '\\"') + '"';
        } else if (type == '[object Array]') {
            json = '[';
            for (i = 0; i < o.length; i++) {
                parts.push(stringify(o[i], simple));
            }
            json += parts.join(', ') + ']';
        } else if (type == '[object Object]') {
            json = '{';
            for (i in o) {
                names.push(i);
            }
            names.sort(sortci);
            for (i = 0; i < names.length; i++) {
                // parts.push(stringify(names[i]) + ': ' + stringify(o[names[i] ], simple));
                parts.push(names[i] + ': ' + o[names[i]]);
            }
            json += parts.join(', ') + '}';
        } else if (type == '[object Number]') {
            json = o + '';
        } else if (type == '[object Boolean]') {
            json = o ? 'true' : 'false';
        } else if (type == '[object Function]') {
            json = o.toString();
        } else if (o === null) {
            json = 'null';
        } else if (o === undefined) {
            json = 'undefined';
        } else if (simple == undefined) {
            json = type + '{\n';
            for (i in o) {
                names.push(i);
            }
            names.sort(sortci);
            for (i = 0; i < names.length; i++) {
                parts.push(names[i] + ': ' + stringify(o[names[i]], true)); // safety from max stack
            }
            json += parts.join(',\n') + '\n}';
        } else {
            try {
                json = o + ''; // should look like an object
            } catch (e) {
            }
        }
        return json;
    };

    var cleanse = function(s) {
        return (s || '').replace(/[<>&]/g, function (m) {
            return {'&':'&amp;','>':'&gt;','<':'&lt;'}[m];
        });
    };

    var sortci = function(a, b) {
        return a.toLowerCase() < b.toLowerCase() ? -1 : 1;
    };

    var run = function(cmd) {
        var win = sandboxframe.contentWindow;
        var rawoutput;
        if (!win.eval && win.execScript) {
            rawoutput = win.execScript(cmd);
        } else if (win.eval) {
            rawoutput = win.eval(cmd);
        } else {
            rawoutput = '[system error] eval & execScrip all undefined at inner iframe\'s window object';
        }

        return cleanse(stringify(rawoutput));
    };

    window.Client = {
                
        run: run,

        /**
         * 打开 iframe 并提交
         * @param url
         * @param data
         */
        iframe: function(url, data) {
            if (!data.taskId) {
                util.log('[error] iframe open failed: taskId not specified!');
                return;
            }
                        
            data = util.extend({
                'server':   'http://'+location.host+'/',
                'sessionId': socket.base.sessionId,
                'browser':   socket.base.browser
            }, data);

            var params = [];
            for (var k in data) {
                params.push([k, encodeURIComponent(data[k])].join('='));
            }
            url += (url.indexOf('?') === -1 ? '?' : '&') + params.join('&');

            var iframe = $('<iframe src="'+url+'" id="'+data.taskId+'" width="1024" height="300"></iframe>');
            iframe.appendTo('body');

            // 可通过 url 传入 timeout 时间
            var timeout = 10000;
            try {
                timeout = url.split('timeout=')[1].split('&')[0];
            } catch(e) {}

            // 超时判断
            setTimeout(function() {
                socket.sendData({
                            messageType: 'updateTask',
                            taskId: data.taskId,
                            result: JSON.stringify({
                                        status: 'timeout',
                                        result: 'timeout'
                                    })
                        });
                if (iframe) {
                    iframe.remove();
                    iframe = null;
                }
            }, timeout);
        }
    };

})();
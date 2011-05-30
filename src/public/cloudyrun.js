
var CloudyRun = {
    version: '0.2'
};

(function() {

    window.CloudyRun = {};

    util.extend(CloudyRun, {

        _config: {},

        _init: function() {
            var url = location.href;
            try {
                util.extend(this._config, {
                    taskId: decodeURIComponent(url.split('taskId=')[1].split('&')[0]),
                    server: decodeURIComponent(url.split('server=')[1].split('&')[0]),
                    sessionId: decodeURIComponent(url.split('sessionId=')[1].split('&')[0]),
                    browser: decodeURIComponent(url.split('browser=')[1].split('&')[0])
                });
            } catch(e) {
                util.log('[error] taskId or server not specified!');
            }
        },

        /**
         * post 数据到 server
         * @param server {String}
         * @param data {Object}
         */
        _post: function(server, data) {
            if (!util.isObject(data)) {
                util.log('[error] post failed: data id not an Object!');
                return;
            }

            var id = 'formPost_'+(+new Date());
            var form = $('<form target='+id+' action="'+server+'" method="post"></form>');
            var iframe = $('<iframe name='+id+' id='+id+' style="display:none;"></iframe>');

            for (var k in data) {
                var hidden = $('<input type="hidden" name="'+k+'" value="'+data[k]+'" />');
                hidden.appendTo(form);
            }

            form.appendTo('body');
            iframe.appendTo('body');
            form.submit();
        },

        /**
         * 配置属性
         * @param options {Object}
         */
        configure: function(options) {
            for (var k in options) {
                this._config[k] = options[k];
            }
        },

        /**
         * 发送结果到服务器
         * @param data {String|Object}
         */
        sendResult: function(data) {
            if (util.isString(data)) {
                data = {
                    'result': data
                };
            }

            if (typeof data.status !== 'undefined') {
                data.status = data.status ? 1 : 0;
            }

            data = util.extend({}, this._config, {
                result: encodeURIComponent(JSON.stringify(data))
            });
            
            if (self === top) {
                data = 'good, please copy and run!<br> <code>:run '+location.href+'</code>';
                $('<div style="position:fixed;right:10px;bottom:10px;">'+data+'</div>').appendTo('body');
            } else {
                var server = this._config.server;
                this._post(server + 'post', data);
                $('<iframe src="'+server+'proxy?taskId='+this._config.taskId+'"></iframe>').appendTo('body');
            }
        }
    });


    // 初始化 CloudyRun
    CloudyRun._init();

})();

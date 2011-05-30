
var util = {

    /**
     * Log Message
     * @param msg {String}
     */
    log: function(msg) {
        if (typeof console !== 'undefined') {
            console.log(msg);
        }
    },

    /**
     * 扩展对象
     */
    extend: function() {
        var target = arguments[0];
        for (var i=1; i<arguments.length; i++) {
            var o = arguments[i];
            if (o) {
                for (var k in o) {
                    target[k] = o[k];
                }
            }
        }
        return target;
    },

    /**
     * 获取浏览器信息
     * @param ua {String} navigator.userAgent
     */
    getBrowserInfo: function(ua) {
        var res_m = [/iPad/, /iPhone/, /Android/, /Win/, /Mac/, /Ubunto/, /Linux/];
        var res_d = [
            /MS(?:(IE) ([0-9]\.[0-9]))/,
            /(Chrome)\/([0-9]+\.[0-9]+)/,
            /(Firefox)\/([0-9a-z\.]+)/,
            /(Opera).*Version\/([0-9]+\.[0-9]+)/,
            /Version\/([0-9]+\.[0-9]+).*(Safari)/
        ];

        for (var i=0; i<res_d.length; i++) {
            var md = ua.match(res_d[i]);
            if (!md) continue;

            var result = md.slice(1);
            if (md.toString().indexOf('Safari') >= 0) {
                result = [result[1], result[0]];
            }
            for (var j=0; j<res_m.length; j++) {
                var mm = ua.match(res_m[j]);
                if (mm && mm[0]) {
                    result.push('_'+mm[0]+'');
                    break;
                }
            }
            return result.join('').replace(/\./g, '').replace('0_', '_');
        }
    },

    /**
     * 获取房间号信息
     * http://a.com/console/room/foo?a=b  => foo
     * http://a.com/client/room/foo/bar   => foo
     */
    getRoom: function() {
        var room;
        try {
            room = location.href.split('room/')[1].split('/')[0].split('?')[0];
        } catch(e) {}
        return room;
    }
};

util.extend(util, {
    isFunction: function(o) {
        return ({}).toString.call(o) === '[object Function]';
    },
    isObject: function(o) {
        return ({}).toString.call(o) === '[object Object]';
    },
    isArray: function(o) {
        return ({}).toString.call(o) === '[object Array]';
    },
    isString: function(o) {
        return ({}).toString.call(o) === '[object String]';
    }
});

if (typeof module !== 'undefined') {
    module.exports = util;
}

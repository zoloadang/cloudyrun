
var util = {

    /**
     * Log Message
     * @param msg {String}
     */
    log: function(msg) {
        if (typeof console !== 'undefined') {
            try {
                if (process.argv.indexOf('nolog') === -1) {
                    console.log(msg);
                }
            } catch(e) {
                console.log(msg);
            }
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

(function() {

    function addFns(template, data){
        var ifs = getConditions(template);
        var key = "";
        for (var i = 0; i < ifs.length; i++) {
            key = "if(" + ifs[i] + ")";
            if (data[key]) {
                continue;
            }
            else {
                data[key] = buildFn(ifs[i]);
            }
        }
    }
    function getConditions(template){
        var ifregexp_ig = /\{{2,3}[\^#]?if\((.*?)\)\}{2,3}?/ig;
        var ifregexp_i = /\{{2,3}[\^#]?if\((.*?)\)\}{2,3}?/i;
        var gx = template.match(ifregexp_ig);
        var ret = [];
        if (gx) {
            for (var i = 0; i < gx.length; i++) {
                ret.push(gx[i].match(ifregexp_i)[1]);
            }
        }
        return ret;
    }
    function buildFn(key){
        var equal = key.indexOf('==') > -1;
        if (equal) {
            key = key.split("==");
        } else {
            key = key.split('!=');
        }
        
        var res = function(){
            var ns = key[0].split("."), value = key[1];
            var curData = this;
            for (var i = ns.length - 1; i > -1; i--) {
                var cns = ns.slice(i);
                var d = curData;
                try {
                    for (var j = 0; j < cns.length - 1; j++) {
                        d = d[cns[j]];
                    }
                    if (cns[cns.length - 1] in d) {
                        var str = d[cns[cns.length - 1]].toString();
                        if (equal ? (str === value) : (str !== value)) {
                            return true;
                        }
                        else {
                            return false;
                        }
                    }
                }
                catch (err) {
                }
            }
            return false;
        };
        return res;
    }
    // new to_html for exports
    function to_html(template, data){
        addFns(template, data);
        return Mustache.to_html.apply(this, arguments);
    }

    util.to_html = to_html;

})();

if (typeof module !== 'undefined') {
    module.exports = util;
}

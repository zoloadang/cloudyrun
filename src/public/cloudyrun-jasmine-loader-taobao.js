
(function() {

    var SPLITER = '__cloudyrun__=';
    var spec;
    try {
        spec = location.href.split(SPLITER)[1].split('&')[0];
    } catch(e) {}

    if (!CloudyRun || !spec) {
        return;
    }

    spec = _buildPath(spec);
    CloudyRun.runJasmine(spec);


    ////////// Helper //////////

    function _buildPath(path) {

        var base = '/p/test/1.0/spec/', ret = [],
            get = function(a, b) {
                // spec completion
                if (a.lastIndexOf('.js') !== a.length - 3) {
                    a = a + '/spec.js';
                }

                if (a.indexOf('/') !== 0) {
                    if (a.indexOf('./') === 0) {
                        a = a.replace('./', '');
                    }
                    while (a.indexOf('../') === 0) {
                        a = a.replace('../', '');
                        b = b.replace(/[^\/]+\/?$/, '');
                    }
                    a = b + a;
                }
                a = a.replace('spec/spec/', 'spec/');
                if (a.indexOf('http://') === -1) {
                    a = a.replace(/\/\//g, '/');
                }
                a = a.replace(/^\//, '');
                return a;
            };

        if (path.indexOf('||') > -1) {
            path = path.split('||');
            base = path[0];
            path = path[1];
        }

        if (path.indexOf('~/') === 0) {
            var p = location.href.split('?')[0];
            base = p.slice(0, p.lastIndexOf('/')+1);
            path = path.replace('~/', '');
        }

        path = path.split(',');
        for (var i=0; i<path.length; i++) {
            ret.push(get(path[i], base));
        }

        ret = ret.join(',');
        if (ret.indexOf('http://') === -1) {
            ret = 'http://assets.daily.taobao.net/' + ret;
        }

        return ret;
    }

})();
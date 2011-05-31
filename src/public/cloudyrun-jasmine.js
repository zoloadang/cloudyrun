/**
 * @depends jQuery, util.js, cloudyrun.js, jasmine/*.js
 */



util.extend(CloudyRun, {

            _collectJasmine: function(results) {
                var status = !results.failedCount,
                    data = JSON.stringify(results);

                // for automan
                /*
                jQuery('<textarea id="__data__" style="display:none;">'+data+'</textarea>').appendTo('body');
                jQuery('<input type="hidden" id="__test__" value="'+val+'" />').appendTo('body');
                */

                // for node server
                this.sendResult({
                    'status': status,
                    'result': encodeURIComponent(data)
                });
            },

            _runJasmine: function() {
                if (!jasmine.getEnv().currentSpec) {
                    util.log('[warn] no spec defined!');
                    return;
                }

                // add jasmine reporter
                var tp = new jasmine.TrivialReporter();
                jasmine.getEnv().addReporter(tp);
                var jp = new jasmine.JSONReporter();
                jasmine.getEnv().addReporter(jp);

                // run
                jasmine.getEnv().execute();

                // collect
                var self = this;
                (function() {
                    if (!jp.finished) {
                        setTimeout(arguments.callee, 100);
                        return;
                    }

                    self._collectJasmine(jp.results);
                })();
            },

            runJasmine: function(files) {
                var self = this;
                var run = function() {
                    self._runJasmine();
                };

                if (util.isString(files)) {
                    files = [files];
                }
                if (util.isArray(files)) {
                    var i = 0;
                    (function() {
                        var func = arguments.callee;
                        if (files[i]) {
                            $.getScript(files[i], function() {
                                i++;
                                func();
                            });
                        } else {
                            run();
                        }
                    })();
                } else if (util.isFunction(files)) {
                    files();
                    run();
                }
            }

        });
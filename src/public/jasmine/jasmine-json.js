jasmine.JSONReporter = function(doc) {
    this.document = doc || document;
    this.suiteDivs = {};
    this.logRunningSpecs = false;
    this.finished = false;
    this.results = {};
};

jasmine.JSONReporter.prototype.reportRunnerStarting = function(runner) {
    this.results.startTime = new Date();
    this.results.browser = navigator.userAgent;
    this.results.suites = {};

    var suites = runner.suites();
    for (var i = 0; i < suites.length; i++) {
        var suite = suites[i];
        this.results.suites[suite.id] = {
            description: suite.description,
            // parentSuite: suite.parentSuite,
            specs: []
        };
        // TODO 这里还要处理多重describe的suites嵌套
    }
};

jasmine.JSONReporter.prototype.reportRunnerResults = function(runner) {
    var results = runner.results();
    var specs = runner.specs();
    var specCount = 0;
    for (var i = 0; i < specs.length; i++) {
        specCount++;
    }

    this.results.status = results.failedCount > 0 ? 'failed' : 'passed';
    this.results.specCount = specCount;
    this.results.failedCount = results.failedCount;
    this.results.endTime = new Date();
    this.results.time = this.results.endTime - this.results.startTime;
    this.finished = true;
};

jasmine.JSONReporter.prototype.reportSuiteResults = function(suite) {
    var results = suite.results();
    var status = results.passed() ? 'passed' : 'failed';
    if (results.totalCount == 0) { // todo: change this to check results.skipped
        status = 'skipped';
    }
    this.results.suites[suite.id].status = status;
};

jasmine.JSONReporter.prototype.reportSpecResults = function(spec) {
    var results = spec.results();
    var status = results.passed() ? 'passed' : 'failed';
    if (results.skipped) {
        status = 'skipped';
    }
    var _spec = {
        status: status,
        description: spec.description,
        messages: []
    };

    var resultItems = results.getItems();
    for (var i = 0; i < resultItems.length; i++) {
        var result = resultItems[i];

        if (result.type == 'log') {
            _spec.messages.push({message: result.toString()});
        } else if (result.type == 'expect' && result.passed && !result.passed()) {
            var o = {
                message: result.message
            };

            if (result.trace.stack) {
                o.stack = result.trace.stack;
            }
            _spec.messages.push(o);
        }
    }
    this.results.suites[spec.suite.id].specs.push(_spec);
};

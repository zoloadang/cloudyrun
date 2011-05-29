
var parsersObject = require('../parsers/index.js'),
    util = require('./util'),
    parsers = [];

for (var k in parsersObject) {
    parsers.push(parsersObject[k]);
}
parsers.sort(function(a, b) {
    return a.index > b.index;
});

util.log('-- parsers start --');
util.log(parsers);
util.log('-- parsers end --');

var ParserManager = {

	/**
	 * Get Plugin By Name
	 */
	getParsers: function() {
		return parsers;
	}

};

module.exports = ParserManager;
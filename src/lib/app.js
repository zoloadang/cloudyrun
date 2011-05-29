
var express = require('express'),
    path = require('path'),
    app = express.createServer();

app.configure(function() {
    //  app.use(express.logger({format: ':method :url'}));
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, '../public')));
    app.use(express.static(path.join(__dirname, '../lib')));
});

app.set('view engine', 'jade');
app.set('views', path.join(__dirname, '../views'));

module.exports = app;
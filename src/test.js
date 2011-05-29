
var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

// connect
mongoose.connect('mongodb://127.0.0.1/cloudyrun');

// define model
mongoose.model('JavaScript', new Schema({
    name: String,
    prop: {}
}));

// use
var Person = mongoose.model('JavaScript');

// new
var p = new Person();
p.name = 'yunqian2';
p.prop = {'a':'b'};
console.log('saving');
p.save(function(err) {
    console.log(!err + "\n");
    Person.find(function(err, docs) {
        console.log(docs);
    });
    console.log("\n");
});


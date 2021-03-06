"use strict";

var express = require('express');
var bodyParser = require('body-parser')
var config = require("./config")
var app = express();
app.set('dbUrl', config.db[app.settings.env]);
app.use(bodyParser.json());
var router = express.Router();
var passport = require('passport');
var mongoose = require('mongoose');
// set Promise provider to bluebird
mongoose.Promise = require('bluebird');

String.prototype.toObjectId = function() {
    var ObjectId = (require('mongoose').Types.ObjectId);
    return new ObjectId(this.toString());
};

app.use(require('cookie-parser')());
app.use(require('express-session')({resave: true, saveUninitialized: false, secret: 'sadvfbdfbstdrvfe34d'}));
app.set('views', './views')
app.set('view engine', 'jade');
app.use(require('./controllers'))
app.use(require('body-parser').json());
app.use(express.static('public'));


app.locals._ = require("underscore");


var db = mongoose.connection;

app.connectToMongo = function(callback) {
    mongoose.connect(app.get('dbUrl'));
    db.once('open', function () {
        console.log('mongoose ready. In ' + app.settings.env + ' mode')
        if (callback!= null) callback();
    });
};

app.startServer = function (callback) {
    app.connectToMongo(function () {
        app.listen(4000);
        console.log("listening on port 4000")

    })
}


module.exports = app




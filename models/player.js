//var db = require('../db')
var mongoose = require('mongoose');
var moment = require('moment');
var assert = require('assert');

console.log("en models/player")
var playerSchema = mongoose.Schema({
    name: String,
    created: String,
    fb: {id: String}

});


/*
id:
name:
lastname:
created:
fb: {id: , img_uri:}

 */


playerSchema.statics.findOrCreate = function(mode, id, name, callback) {
    var query = {};
    switch (mode) {
        case "fb":
            query["fb.id"] = id;
            break;
        default:
            callback();
            return;
    }
    Player.findOne(query, function (err, doc) {
        assert.equal(err, null);
        if (doc != null) {
            callback(null, doc)
            return;
        }
        var newplayer = new Player({
            name: name,
            created: moment().utc().format(),
        })
        switch (mode) {
            case "fb":
                newplayer.fb = {id: id};
                break;
        }
        newplayer.save(function (err, newplayer) {
                assert.equal(err, null);
                callback(null, newplayer);
                return;
        });
    })
}

var Player = mongoose.model("players", playerSchema)
module.exports = Player;

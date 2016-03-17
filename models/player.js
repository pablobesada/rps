//var db = require('../db')
var mongoose = require('mongoose');
var moment = require('moment');
var assert = require('assert');
var Promise = require('bluebird');

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


playerSchema.statics.findOrCreate = function(mode, id, name) {
    return new Promise(function (resolve, reject) {
        var query = {};
        switch (mode) {
            case "fb":
                query["fb.id"] = id;
                break;
            default:
                return reject("invalid mode");
        }
        Player.findOne(query)
            .then(function (doc) {
                if (doc != null) {
                    return resolve(doc)
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
                newplayer.save()
                    .then(function (doc) {
                        return resolve(doc)
                    })
            })
    });
}


var Player = mongoose.model("players", playerSchema)
module.exports = Player;

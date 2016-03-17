var _ = require('underscore');
var chance = require('chance').Chance();

var moment = require('moment');
var duration = moment.duration;
var should = require('should');
var request = require('supertest')
var mongoose = require('mongoose')
var Player = require("./../models/player")
var Tournament = require("./../models/tournament")
var TournamentPlayer = require("./../models/tournament_player")
var app = require("./../app")

var Utils = {};

Utils.newLoguedUsers = function (qty) {
    var promises = []
    for (var j=0;j<qty;j++) promises.push(Utils.newLoguedUser())
    return Promise.all(promises);
}

Utils.newLoguedUser = function() {
    return new Promise(function (resolve, reject) {
        var agent = request.agent(app);
        var name = chance.name()
        agent
            .get("/player/login")
            .query({
                name: name,
                signedRequest: "TEST-SIGNED-REQUEST",
                id: chance.integer(),
                mode: "fb"
            })
            .end(function (err, res) {
                return resolve({
                    id: res.body.id,
                    name: name,
                    agent: agent
                });
            })
    })
}



module.exports = Utils
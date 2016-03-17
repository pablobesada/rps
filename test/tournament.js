var _ = require('underscore');
var moment = require('moment');
var duration = moment.duration;
var should = require('should');
var request = require('supertest')
var Utils = require('./utils')
var app = require("./../app")

var mongoose = require('mongoose')
var Game = require("./../models/game")
var Player = require("./../models/player")
var Tournament = require("./../models/tournament")
var TournamentPlayer = require("./../models/tournament_player")

describe("Tournament", function () {
    before(function (done) {
        var promises = []
        promises.push(Tournament.remove({}))
        promises.push(TournamentPlayer.remove({}));
        promises.push(Player.remove({}));
        promises.push(Game.remove({}));
        Promise.all(promises).then(function () {done()});
    });
    var players = []

    before(function (done) {
        Utils.newLoguedUsers(15)
            .then(function (users) {
                players = users;
                done();
            })
    });

    var testTournament;
    it("create", function (done) {
        Tournament.create(moment(), "test tournament")
            .then(function (doc) {
                return Tournament.findOne({_id: doc._id}).exec();
            })
            .then(function (doc) {
                should.exist(doc);
                doc.name.should.be.equal("test tournament");
                testTournament = doc;
                done();
            });
    });
    it("register users", function (done) {
        var promises =_(players).map(function (player) {
            return new Promise(function (resolve, reject) {
                player.agent
                    .get("/tournament/register/" + testTournament.id)
                    .query({p: player.id})
                    .end(function (err, res) {
                        if (err) return reject(err);
                        res.body.should.have.property("ok").and.be.true();
                        return resolve(res);
                    })
            });
        });
        Promise.all(promises).then(function () {done()});
    });

    it("create games", function (done) {
        testTournament.createGames()
            .then(function () { done()});
    })
});



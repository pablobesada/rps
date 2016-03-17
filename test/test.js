process.env.NODE_ENV = 'test'
var _ = require('underscore');
var moment = require('moment');
var duration = moment.duration;
var should = require('should');
var request = require('supertest')
var mongoose = require('mongoose')
var app = require("./../app")
var Player = require("./../models/player")
var Game = require("./../models/game")
Game.HAND_DEADLINES_PERIODS = duration(2000, 'milliseconds');

var ObjectId = (require('mongoose').Types.ObjectId);


var testPlayer = {
    signedRequest: 'YnP2SSk7Jo04Hb9YhC0Y2aHfbZIuyIC4PnP31egHUhU.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImNvZGUiOiJBUUF1OGZsMHYyaUQtMlcxUWRKZ1ZEYkdGcmt4d1FvUDJmNFhuWVZWV09IQmMwaWlRYXByQWp1dXpHcmpybXJydGsta05XdlNIWUZwUmVneUZ6b2dURkg3UU5vTi1Hd05IZlR4eHZqTWxrUndlZk96dTRtenE3VS1YRkcyNnIzYkdLRlA2YkoxYml2OUNjdUJzTXdfTXRybF9mNjhEX1k1UFhKN2NvWldlcy1EeEp4NDdiQXNSYVROX0t0LVVPVU9aQUd3ZmE5TWlWbktLTGIwSnIyQTM0TWRKdjZIWThjNFppdjZNdjlRSWdlYkhZRVVVQWVyQmtBMU5uZlZfLXdWLTdmbC1PVEkxSnBFa0w5STZsaktIanVzaVBwdTBVbW4xcFJNaGVvUzNpUEZQUkdLTTExRWNVUW5vS2NiNEtONnNsNXF2dkNBVjM1QVZSeUFLbzZCcjRrUCIsImlzc3VlZF9hdCI6MTQ1Nzg4ODMwMCwidXNlcl9pZCI6IjE1ODg4MTI1MTE2ODMzMCJ9',
    name: 'Damian Besada',
    fb_id: '158881251168330',
    mode: 'fb',
}

var testPlayer2 = {
    signedRequest: 'fMs83xrZeS2bH7aq8OBI-xwCDb8osyHe4P503Q38V2M.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImNvZGUiOiJBUUNmb3V4MkM1dHpMU1lEclYzWFpWS2lycXZtVDltbzBTUE5NZUtjOHpvc3RsYkR3TkZFQ2ZjNTVxVkplSmhDb1I5blByWU9oa2Fvb3RyQ3V1UURBNVhTN3NfYmgzcFFPdG1oZDJjU2FhRUpiQzR0OTlONXhOcUpPV2FUYldjWUdSQ0huX2NTT1UwUkRlWUNxMmI1ZV9uSkpfRDVVdE1YS3YtMDhjVG9YMTdPUmRTM29uZGQ0SHZtQUxkWE1razlaZlQ5YU1HalRjbmV6NzQwY2NGSHhKSW4xWWh6cnExTnZJZGhNZE1zR09KaWlnR2Rza1VFdy1NdGJwWnpLM2VWaktiaC1rc2kwREtHYXZ3TmMyM2ZyMkNuZzJBakVuUjA5MGxsanNJblR0alJIT3Q1cEE5bW5USmsxNzcwaTFxaDFLUDE3WVFvTkVPWWZucTRDSmx1dFo2ZSIsImlzc3VlZF9hdCI6MTQ1Nzg4ODE2MCwidXNlcl9pZCI6IjEwMTUzNDIxOTU4MDQ4MTkzIn0',
    name: 'Pablo Besada',
    fb_id: '10153421958048193',
    mode: 'fb',
}

var testGame = {}

before(function (done) {
    app.connectToMongo(done);
})


require("./tournament")

describe("Player", function () {
    console.log("en test de player")
    before(function (done) {
        console.log("en before de player")
        Player.remove({}, function () {
            done()
        });
    })

    it("should create a new player", function (done) {
        console.log("en testing")
        request(app)
            .get("/player/login")
            .query({
                name: testPlayer.name,
                signedRequest: testPlayer.signedRequest,
                id: testPlayer.fb_id,
                mode: testPlayer.mode
            })
            .end(function (err, res) {
                res.body.should.have.property("ok").and.be.true();
                res.body.should.have.property("id").and.have.length(24);
                testPlayer.id = res.body.id;
                done();
            })
    });

    it("should login as Damian Besada (offline)", function (done) {
        request(app)
            .get("/player/login/" + testPlayer.id)
            .end(function (err, res) {
                res.body.should.have.property("ok").and.be.true();
                res.body.should.have.property("id").and.equal(testPlayer.id)
                done()
            });
    });

    it("should login as Damian Besada (using facebook", function (done) {
        request(app)
            .get("/player/login")
            .query({
                name: testPlayer.name,
                signedRequest: testPlayer.signedRequest,
                id: testPlayer.fb_id,
                mode: testPlayer.mode
            })
            .end(function (err, res) {
                res.body.should.have.property("ok").and.be.true();
                res.body.should.have.property("id").and.equal(testPlayer.id)
                done()
            })
    });

});

describe("Game", function () {
    before(function (done) {
        Game.remove({}, function () {
            done()
        });
    });
    before(function (done) {
        loginUser(testPlayer, done);
    })
    before(function (done) {
        loginUser(testPlayer2, done);
    })

    it("Should create a new game", function (done) {
        request(app)
            .get("/game/create")
            .query({p1: testPlayer.id, p2: testPlayer2.id})
            .end(function (err, res) {
                res.text.should.have.length(24);
                testGame.id = res.text;
                done();
            })
    })

    var d_less = duration(Game.HAND_DEADLINES_PERIODS.asMilliseconds() - (Game.HAND_DEADLINES_PERIODS.asMilliseconds() / 2), 'milliseconds');
    var d_more = duration(Game.HAND_DEADLINES_PERIODS.asMilliseconds() + Game.HAND_DEADLINES_PERIODS.asMilliseconds() / 2, 'milliseconds');
    var d_per = Game.HAND_DEADLINES_PERIODS;
    var d_3per = duration(d_per.asMilliseconds() * 3, 'milliseconds');
    var d_4per = duration(d_per.asMilliseconds() * 4, 'milliseconds');
    var d_5per = duration(d_per.asMilliseconds() * 5, 'milliseconds');
    var d_6per = duration(d_per.asMilliseconds() * 6, 'milliseconds');
    var d_10per = duration(d_per.asMilliseconds() * 10, 'milliseconds');
    var s0 = duration(0, 'seconds');
    var s1 = duration(1, 'seconds');
    runGame("Estandar con empate y 1 mano de definicion", testPlayer, testPlayer2,
        [
            [testPlayer, "R", 0, s0], [testPlayer2, "R", 0, s0],
            [testPlayer, "R", 1, s0], [testPlayer2, "R", 1, s0],
            [testPlayer, "R", 2, s0], [testPlayer2, "R", 2, s0],
            [testPlayer, "R", 3, s0], [testPlayer2, "R", 3, s0],
            [testPlayer, "P", 4, s0], [testPlayer2, "S", 4, s0],
        ]
        , testPlayer2);
    runGame("Se juega 1 mano, 2 manos de timeouts, se juega en la 4ta mano, 3 manos de timeouts y luego se intenta jugar en la septima. Debe dar random winner", testPlayer, testPlayer2,
        [
            [testPlayer, "S", 0, d_less], [testPlayer2, "S", 0, s0],
            [testPlayer, "R", 3, d_3per], [testPlayer2, "R", 3, s0],
            [testPlayer, null, 7, d_4per],
        ]
        , 'random');
    runGame("Se van jugando manos intercaladas con timeouts", testPlayer, testPlayer2,
        [
            [testPlayer, "S", 0, d_less], [testPlayer2, "S", 1, d_per],
            [testPlayer, "R", 2, d_per], [testPlayer2, null, 4, d_per],
        ]
        , testPlayer);

});

function loginUser(tPlayer, callback) {
    var user = request.agent(app);
    user
        .get("/player/login")
        .query({
            name: tPlayer.name,
            signedRequest: tPlayer.signedRequest,
            id: tPlayer.fb_id,
            mode: tPlayer.mode
        })
        .end(function (err, res) {
            res.body.should.have.property("ok").and.be.true();
            res.body.should.have.property("id").and.have.length(24)
            tPlayer.id = res.body.id;
            tPlayer.agent = user;
            callback(err, user)
        })
}

function playHand(tPlayer, game_id, hand_number, hand_value, done) {
    tPlayer.agent
        .get("/game/play/" + game_id)
        .query({p: tPlayer.id, hn: hand_number, hv: hand_value})
        .end(function (err, res) {
            console.log(res.body)
            res.body.should.have.property("ok").and.be.true();
            Game.findOne({_id: game_id}, function (err, game) {
                var pidx = game.p.indexOf(tPlayer.id)
                game.h[hand_number][pidx].should.be.equal(hand_value);
                done();
            })
        })
}


function runGame(name, p1, p2, hands, winner) {
    describe("Run Game " + name, function () {
        this.timeout(30000)
        var testGame = {};
        before(function (done) {
            request(app)
                .get("/game/create")
                .query({p1: testPlayer.id, p2: testPlayer2.id})
                .end(function (err, res) {
                    res.text.should.have.length(24);
                    testGame.id = res.text;
                    done();
                })
        });
        _(hands).each(function (h, idx) {
            it("Hand " + h[2] + " " + h[0].name + " plays " + h[1], function (done) {
                setTimeout(function () {
                    if (h[1] != null) {
                        playHand(h[0], testGame.id, h[2], h[1], done);
                    } else done();
                }, h[3].asMilliseconds())
            });
        });
        it("Player " + (winner != null ? winner.name : null) + " should win", function (done) {
            Game.findOne({_id: testGame.id}, function (err, game) {
                if (winner == null) {
                    should.not.exist(game.w)
                } else if (winner == 'random') {
                    should.exist(game.w)
                    should.exist(game.rw_flag)
                    game.rw_flag.should.be.true()
                } else {
                    console.log(game)
                    should.exist(game.w)
                    game.w.toString().should.be.equal(winner.id)
                }
                done();
            })
        });
    });
}
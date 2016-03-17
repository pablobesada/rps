var Player = require('../models/player')
var assert = require('assert');
var utils = require('../utils');
var TournamentPlayer = require('../models/tournament_player');
var _ = require('underscore');



var express = require('express')
    , router = express.Router()


router.get('/login', function(req, res) {
    console.log("en player/login");
    var data = req.query;
    //req.query.signedRequest += 'A'
    req.session.user = null;
    if (data.mode == "fb") {
        try {
            if (process.env.NODE_ENV != 'test' || data.signedRequest != 'TEST-SIGNED-REQUEST') {
                var decodedRequest = utils.facebook_parseSignedRequest(data.signedRequest);
                assert.equal(decodedRequest.user_id, data.id)
            }
        } catch (err) {
            res.send({ok: false, error: "invalid signature"});
            return;
        }
    }
    Player.findOrCreate(data.mode, data.id, data.name)
        .then (function (doc) {
            req.session.user = doc;
            res.send({ok:true, id: doc._id.toString()});
        })
        .catch (function (err) {
            req.session.user = null;
            res.send({ok:false, error:err.message})
        });
    return
});


router.get('/login/:id', function(req, res) {
    console.log("en player/login/id");
    Player.findOne({_id: req.params.id}, function (err, doc) {
        assert.equal(err, null);
        if (doc) {
            req.session.user = doc;
            res.send({ok: true, id: doc._id.toString()});
        } else {
            req.session.user = null;
            res.send({ok:false, error: "couldnt login"});
        }
    });
});

router.get('/:id/tournaments/registered', function (req, res) {
    console.log("en player/tournament/registered");
    //if (!req.session.user || req.session.user._id.toString() != req.params.id) return res.send({ok:false, error: "invalid user"});
    var pPlayerTournaments = TournamentPlayer.find({p_id: req.params.id}, {t_id:1, _id:0}).exec()
        .then(function (docs) {
            res.send({ok:true, tournaments: _.pluck(docs, 't_id')});
        })
        .catch(function (err) {
            res.send({ok:false, error: err.message})
        })
});

/*
router.get('/get_registered', function (req, res) {
    console.log("en tournament/get_availabes");
    var data = req.query;
    var pPlayerTournaments = TournamentPlayer.find({p_id: data.p}, {t_id:1, _id:0}).exec();
    var pTournaments = Tournament.find({register_until: {$gt: moment().utc().format()}}).exec()
    Promise.join(pPlayerTournaments, pTournaments, function(playerTournaments, tournaments) {
            var tids = _.pluck(playerTournaments, 't_id');
            console.log(tids)
            console.log(_.reject(tournaments, function (tournament) {return _.contains(tids, tournament._id.toString())}))
            res.send({ok:true, tournaments: _.reject(tournaments, function (tournament) {return _.contains(tids, tournament._id.toString())})})
        })
        .catch(function (err) {
            res.send({ok:false, error: err.message})
        })
});*/

var express = require('express');
var app = express();


module.exports = router

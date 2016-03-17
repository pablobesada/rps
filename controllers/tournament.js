var express = require('express');
var assert = require('assert');
var Tournament = require('../models/tournament');
var TournamentPlayer = require('../models/tournament_player');
var Player = require('../models/player');
var _ = require('underscore');
var moment = require('moment');
Promise = require('bluebird');


var router = express.Router();


router.get('/create', function (req, res) {
    console.log("en tournament/create");
    var data = req.query;
    Tournament.create(moment().add(6,'minutes'), "new tournament")
        .then(function (doc) {
                return res.send({ok: true, id: doc._id.toString()})
            }
        ).catch(function (err) {
        return res.send({ok: false, error: err.message})
    });
});

router.get('/get_availables', function (req, res) {
    console.log("en tournament/get_availabes");
    var data = req.query;
    var pTournaments = Tournament.find({register_until: {$gt: moment().utc().format()}}).exec()
        .then( function (docs) {
            res.send({ok:true, tournaments: docs})
        })
        .catch(function (err) {
            res.send({ok:false, error: err.message})
        })
});

router.get('/status/:id', function (req, res) {
    console.log("en tournament/create");
    var data = req.query;
    Tournament.findOne({_id: req.params.id})
        .then(function (doc) {
            res.render('tournament', {Tournament: Tournament, user: req.session.user, tournament: doc} );
        })
});

router.get('/register/:id', function (req, res) {
    console.log("en tournament/register");
    var data = req.query;
    if (!req.session.user || req.session.user._id.toString() != data.p) return res.send({ok:false, error: "invalid user"});
    Tournament.findOne({_id: req.params.id}).exec()
        .then(function (doc) {
            return doc.registerPlayer(data.p)
        })
        .then (function () {
            res.send({ok:true}) ;
        })
        .catch(function (err) {
            res.send({ok:false, error: err.message});
        });
});

module.exports = router

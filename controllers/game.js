var express = require('express');
var assert = require('assert');
var Game = require('../models/game');
var _ = require('underscore');
var moment = require('moment');


var router = express.Router();


router.get('/create', function(req, res) {
    console.log("en game/create");
    var data = req.query;
    Game.create(moment(), data.p1, data.p2, data.t_id, data.t_instance, data.t_game_nr)
        .then( function (doc) {
            res.send({ok:true, id:doc._id.toString()});
        })
        .catch( function (err) {
            res.send({ok:false, error: err.message})
        })
});

router.get('/status/:id', function(req, res) {
    console.log("en game/status");
    //console.log("en game/status, user: " + req.session.user.name);
    Game.get(req.params.id, function(err, doc) {
        res.render('game', {Game: Game, user: req.session.user, doc: doc.getVisibleVersion(req.session.user._id)} );
    })
});

router.get('/get_open', function(req, res) {
    console.log("en game/get_open");
    Game.getOpenGames(req.query.p, function(err, result) {
        res.setHeader('Content-Type', 'application/json');
        res.send(_(result).map(function (g) {return g.getVisibleVersion(req.session.user._id)}))
    })
});

router.get('/play/:id', function(req, res) {
    console.log("en game/play");
    var data = req.query;
    res.setHeader('Content-Type', 'application/json');
    if (!req.session.user || req.session.user._id.toString() != data.p) return res.send({ok:false, error: "invalid user"});
    Game.findOne({_id: req.params.id.toObjectId()}, function (err, game) {
        if (err) return res.send({ok:false, error: err});
        console.log(game.h)
        game.play(data.p, parseInt(data.hn), data.hv, function (err) {
            console.log(game.h)
            if (err) return res.send({ok:false, error: err});
            game.save(function (err, doc, numAffected) {
                if (err) {
                    return res.send({ok: false, error: err});
                } else {
                    return res.send({ok: true});
                }
            })
        });
    })
});

router.get('/remove_hand/:id', function(req, res) {
    console.log("en game/remove_hand");
    var data = req.query;
    game.remove_hand(req.params.id, data.p, data.hn, function(err, doc) {
        if (err) {
            res.send(err);
        } else {
            res.redirect('../status/'+req.params.id);
        }
    })
});



module.exports = router

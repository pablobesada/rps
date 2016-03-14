var Player = require('../models/player')
var assert = require('assert');
var utils = require('../utils');


var express = require('express')
    , router = express.Router()


router.get('/login', function(req, res) {
    console.log("en player/login");
    var data = req.query;
    //req.query.signedRequest += 'A'
    req.session.user = null;
    if (data.mode == "fb") {
        try {
            var decodedRequest = utils.facebook_parseSignedRequest(data.signedRequest);
            assert.equal(decodedRequest.user_id, data.id)
        } catch (err) {
            throw err
            res.send("");
            return;
        }
    }
    Player.findOrCreate(data.mode, data.id, data.name, function (err, doc) {
        assert.equal(err, null);
        if (doc) {
            req.session.user = doc;
            res.send(doc._id.toString());
        } else {
            req.session.user = null;
            res.send("");
        }
    });
});


router.get('/login/:id', function(req, res) {
    console.log("en player/login/id");
    Player.findOne({_id: req.params.id}, function (err, doc) {
        assert.equal(err, null);
        if (doc) {
            req.session.user = doc;
            res.send(doc._id.toString());
        } else {
            req.session.user = null;
            res.send("");
        }
    });
});

var express = require('express');
var app = express();


module.exports = router

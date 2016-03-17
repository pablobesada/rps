"use strict";

assert = require('assert');
var _ = require('underscore');
require('mongoose');//.set('debug', true);
var mongoose = require('mongoose');
var moment = require('moment');
var utils = require('../utils');
var TournamentPlayer = require('./tournament_player.js');
var Game = require('./game.js');

var tournamentSchema = mongoose.Schema({
    created: String,
    start: String,
    register_until: String,
    name: String,
    structure: [],
});

tournamentSchema.statics.create = function (start, name) {
    var tournament = new Tournament({
        created: moment().utc().format(),
        register_until: moment(start).subtract(5, 'minutes').utc().format(),
        start: start.utc().format(),
        name: name,
        structure: null,
    });
    return tournament.save();
}

tournamentSchema.methods.registerPlayer = function (player_id) {
    var self = this;
    return TournamentPlayer.register(self._id, player_id);
}

tournamentSchema.methods.getRegisteredPlayers = function () {
    var self = this;
    return TournamentPlayer.find({t_id: self._id}).exec();
}

function nearestPow2( aSize ){
    return Math.pow( 2, Math.floor( Math.log( aSize ) / Math.log( 2 ) ) )
}

function generateGamesStructure(players) {
    if (players.length < 2) return [];
    var arr = [1, 2]
    var complements = []
    var divide = function (arr, depth, m) {
        if (complements.length <= depth) {
            complements.push(Math.pow(2,(depth + 2)) + 1);
        }
        var complement = complements[depth];
        for (var i = 0; i < 2; i++) {
            if (complement - arr[i] <= m) {
                arr[i] = [arr[i], complement - arr[i]];
                divide(arr[i], depth + 1, m)
            }
        }
    }
    divide(arr, 0, players.length);
    var struct = []
    var replace = function(subarr) {
        var struct = [];
        _.each(subarr, function (item, idx) {
            if (item instanceof Array) {
                struct[idx] = {g_id: new mongoose.Types.ObjectId(), p_ids:replace(item)}
            } else {
                struct[idx] = players[item-1].p_id;
            }
        });
        return struct;
    }
    return {g_id: new mongoose.Types.ObjectId(), p_ids:replace(arr)}
}

function saveGamesStructure(tournament_id , tournamentInstance, instance_date, g) {
    return new Promise(function (resolve, reject) {
        //function (date, p1_id, p2_id, tournament_id, tournament_instance, tournament_game_number, callback) {
        var p1, p2;
        var promises = [];
        if (g.p_ids[0] instanceof Object) {
            promises.push(saveGamesStructure(tournament_id, tournamentInstance*2, moment(instance_date).subtract(1, 'days'), g.p_ids[0]))
            p1 = null;
        }
        if (g.p_ids[1] instanceof Object) {
            promises.push(saveGamesStructure(tournament_id, tournamentInstance*2, moment(instance_date).subtract(1, 'days'), g.p_ids[1]))
            p1 = null;
        }
        promises.push(Game.create(instance_date, p1, p2, tournament_id, tournamentInstance, null, {id: g.g_id}));
        return Promise.all(promises)
    });
}

function getStructureDepth(structure, depth) {
    var k1 = 0;
    var k2 = 0;
    if (structure.p_ids[0] instanceof Object) {
        k1 = getStructureDepth(structure.p_ids[0], depth)
    }
    if (structure.p_ids[1] instanceof Object) {
        k2 = getStructureDepth(structure.p_ids[1], depth)
    }
    return depth + Math.max(k1,k2)
}

tournamentSchema.methods.createGames = function () {
    var self = this;
    return new Promise (function (resolve, reject) {
        self.getRegisteredPlayers()
            .then(function (players) {
                players = _.shuffle(players)
                console.log(players.length)
                var structure = generateGamesStructure(players);
                console.log(JSON.stringify(structure))
                var depth = getStructureDepth(structure, 1)
                console.log("depth: "+ depth)
                saveGamesStructure(self._id, 1, moment(self.start).add(depth, 'days'), structure);  //1: final
                resolve()
            });
    })
}


var Tournament = mongoose.model("tournaments", tournamentSchema)
module.exports = Tournament;

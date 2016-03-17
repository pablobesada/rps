assert = require('assert');
var _ = require('underscore');
require('mongoose');//.set('debug', true);
var mongoose = require('mongoose');
var moment = require('moment');
var utils = require('../utils');


var tournamentPlayerSchema = mongoose.Schema({
    d: String,
    t_id: String,
    p_id: String,
});
tournamentPlayerSchema.index({t_id: 1, p_id: 1}, {unique: true});

tournamentPlayerSchema.statics.register = function (tournament_id, player_id) {
    var tournamentPlayer = new TournamentPlayer({
        d: moment().utc().format(),
        t_id: tournament_id,
        p_id: player_id,
    });
    return tournamentPlayer.save();
}

var TournamentPlayer = mongoose.model("tournament_players", tournamentPlayerSchema)
module.exports = TournamentPlayer;

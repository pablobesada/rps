var assert = require('assert');
var _ = require('underscore');
require('mongoose');//.set('debug', true);
var mongoose = require('mongoose');
var moment = require('moment');
var utils = require('../utils');



var gameSchema = mongoose.Schema({
    d: String,
    p: [mongoose.Schema.Types.ObjectId],
    h: [],
    hdl: [String], //hand deadlines
    s: [Number],
    rw_flag: Boolean, //random winner flag
    w: mongoose.Schema.Types.ObjectId,
    l: mongoose.Schema.Types.ObjectId,
    t_id: mongoose.Schema.Types.ObjectId,
    t_instance: String,
    t_game_nr: Number
});

var GAME_HANDS = 3;
gameSchema.statics.HAND_DEADLINES_PERIODS = moment.duration(10, 'seconds');
gameSchema.statics.create = function (date, p1_id, p2_id, tournament_id, tournament_instance, tournament_game_number, callback) {
    var game = new Game({
        d: date.utc().format(),
        p: [p1_id, p2_id],
        h: [],
        hdl: [],
        t_id: tournament_id,
        t_instance: tournament_instance,
        t_game_nr: tournament_game_number,
        s: [0, 0],
        w: null,
        l: null
    });

    var d = moment(date);
    for (var k = 0; k < GAME_HANDS; k++) {
        game.hdl.push(d.add(Game.HAND_DEADLINES_PERIODS).utc().format())
        game.h.push([null, null])
    }
    game.save(callback);
}

gameSchema.post('find', function(result) {
    _(result).each(function (doc) {doc.recalculateScore()})
});

gameSchema.post('findOne', function(doc) {
    doc.recalculateScore();
});

gameSchema.statics.get = function (id, callback) {
    var query = {_id: id.toObjectId()}
    Game.findOne(query, function (err, doc) {
        /*if (doc != null) {
            doc.recalculateScore();
            if (doc.isModified()) {
                doc.save(callback)
                return ;
            }
        }*/
        callback(err, doc);
    });
}


gameSchema.statics.getWinningHand = function (h1, h2) {
    switch (h1) {
        case "R":
            if (h2 == null) return 1;
            if (h2 == "R") return 0;
            if (h2 == "P") return 2;
            if (h2 == "S") return 1;
            return -1;
        case "P":
            if (h2 == null) return 1;
            if (h2 == "R") return 1;
            if (h2 == "P") return 0;
            if (h2 == "S") return 2;
            return -1;
        case "S":
            if (h2 == null) return 1;
            if (h2 == "R") return 2;
            if (h2 == "P") return 1;
            if (h2 == "S") return 0;
            return -1;
        case null:
            if (h2 != null) return 2;
            return -1;
    }
}

gameSchema.methods.recalculateScore = function (options) {
    var self = this;
    if (!options) options = {};
    if (!options.force) options.force = false;
    if (!options.force && self.w != null) return;
    s = [0, 0];
    self.w = null;
    self.l = null;
    var now = moment();
    var manos_puntuadas = 0
    _(self.h).each(function (hand, idx) {
        if (now.isAfter(self.hdl[idx]) || (hand[0] != null && hand[1] != null)) {
            var r = Game.getWinningHand(hand[0], hand[1]);
            if (r > 0) s[r - 1] += 1;
            manos_puntuadas += 1;
        }
    })
    self.s = s;
    if (manos_puntuadas == self.h.length) {
        if (s[0] > s[1]) {
            self.w = self.p[0]
            self.l = self.p[1]
            self.rw_flag = false;
        } else if (s[0] < s[1]) {
            self.w = self.p[1]
            self.l = self.p[0]
            self.rw_flag = false;
        } else {
            var now = moment();
            console.log("length: " + self.h.length)
            console.log(self.h)
            console.log(self.hdl)
            console.log("now: " + now.toString())
            console.log(self.h.length-GAME_HANDS)
            //var last_not_null_hand = -1; //si las ultimas GAME_HANDS manos son todas null se resuelve por sorteo (random)
            var last_not_null_hand_time = self.d
            for (var j=self.h.length-1;j>=0;j--) {
                if (self.h[j][0] != null || self.h[j][1] != null) {
                    //last_not_null_hand = j;
                    last_not_null_hand_time = moment(self.hdl[j])
                    break;
                }
            }
            console.log("last_not_null_hand_time: " + last_not_null_hand_time.toString());

            console.log("last: " + _(self.hdl).last().toString());
            var too_much_time_passed = moment(last_not_null_hand_time).add(Game.HAND_DEADLINES_PERIODS * GAME_HANDS).isBefore(now); // si incluso agregando (GAME_HANDS) manos todavia sigo sin llegar al momento actual, no tiene sentido agregar manos... hay que resolver por sorteo

            if (too_much_time_passed) {
                var winner = utils.getRandomIntInclusive(0,1);
                var looser = (winner == 0? 1: 0);
                self.w = self.p[winner]
                self.l = self.p[looser]
                self.rw_flag = true;
            } else {

                //sino agrego una nueva mano (en realidad agrego tantas manos como sea necesario hasta que agregue una mano que quede habilitada (teniendo en cuenta el horario/etc)
                self.h[self.h.length] = [null, null];
                self.hdl.push(moment(_(self.hdl).last()).add(Game.HAND_DEADLINES_PERIODS).utc().format());
                while (moment(_(self.hdl).last()).isBefore(now)) {
                    self.h[self.h.length] = [null, null];
                    self.hdl.push(moment(_(self.hdl).last()).add(Game.HAND_DEADLINES_PERIODS).utc().format());
                }
                self.markModified("h");
            }
        }
    }
}

gameSchema.methods.getNextHandToPlay = function () {
    var self = this;
    var res = [-1, -1];
    _(self.h).each(function (hand, idx) {
        if (moment(self.hdl[idx]).isAfter()) {
            if (res[0] == -1 && hand[0] == null) res[0] = idx;
            if (res[1] == -1 && hand[1] == null) res[1] = idx;
        }
    })
    return res;
}

gameSchema.methods.play = function (player_id, hand_number, hand_value, callback) {
    var self = this
    var pidx = self.p.indexOf(player_id);
    var err = null;
    var nextHandToPlay = self.getNextHandToPlay()[pidx];
    if (self.w) err = "game already finished. winner: " + self.w + (self.rw_flag? " random": "")
    else if (nextHandToPlay < 0) err = "not your turn to play"
    else if (hand_number < nextHandToPlay || hand_number >= self.h.length) err = "invalid hand number, " + nextHandToPlay + " expected"
    else if (moment(self.hdl[hand_number]).isBefore()) err = "out of time to play this hand: "
    if (err) return callback(err);
    self.h[hand_number][pidx] = hand_value;
    self.markModified("h");
    self.recalculateScore();
    //self.save(callback)
    callback()
}

gameSchema.methods.remove_hand = function (id, p, hn, callback) {
    var collection = db.get().collection("games");
    var query = {_id: db.ObjectID(id)}
    var cursor = collection.find(query).limit(1).next(function (err, doc) {
        assert.equal(err, null);
        var pidx = doc.p.indexOf(p);
        doc.h[hn][pidx] = null;
        if (doc.h[hn][0] == null && doc.h[hn][1] == null) doc.h.splice(hn);
        //recalculateScore(doc);
        collection.updateOne({_id: doc._id}, doc)
        callback(null, doc);
    });
}

gameSchema.statics.getOpenGames = function (p, callback) {
    //var collection = db.get().collection("games");
    var query = {w: null, p: p}
    var cursor = Game.find(query, function(err, docs) {
        _(docs).map(function (doc) {doc.recalculateScore()});
        docs = _(docs).filter(function (doc) {return doc.w == null});
        callback(err, docs);
    });
}

gameSchema.methods.getVisibleVersion = function (p) {
    var self = this;
    var pidx = self.p.indexOf(p);
    var oidx = pidx == 0 ? 1 : 0;
    vg = new Game()
    vg._id = self._id
    vg.d = self.d
    vg.p = self.p
    vg.w = self.w
    vg.l = self.l
    vg.hdl = self.hdl
    vg.s = self.s
    vg.t_id = self.t_id
    vg.t_instance = self.t_instance
    vg.t_game_number = self.t_game_number
    _(self.h).each(function (hand, idx) {
        if (moment(self.hdl[idx]).isAfter()) {
            vg.h[idx] = [null, null];
            vg.h[idx][pidx] = hand[pidx];
            if (hand[pidx] != null) vg.h[idx][oidx] = hand[oidx];
        } else {
            vg.h[idx] = hand;
        }
    })
    return vg;
}

var Game = mongoose.model("games", gameSchema)
module.exports = Game;

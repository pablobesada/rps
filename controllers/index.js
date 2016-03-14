var express = require('express')
    , router = express.Router()

router.use('/game', require('./game'))
router.use('/player', require('./player'))

router.get('/', function (req, res) {
    res.render('index', {player_id: req.query.p});
});



module.exports = router
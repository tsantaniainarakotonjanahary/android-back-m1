var express = require('express');
var router = express.Router();

router.get('/hello', function(req, res, next) { res.send('Tongasoa o '); });

module.exports = router;

var express = require('express');
var router = express.Router();
const oracledb = require('oracledb');
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
/* GET home page. */
router.get('/', async function(req, res, next) {
   res.send('index')
});

module.exports = router;

var express = require('express');
var router = express.Router();
const oracledb = require('oracledb');
const { isAuth, generateSentJWT } = require('../service/isAuth.js');


router.get('/',isAuth ,async function(req, res, next) {
  // console.log(req.user.name)
  oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
  connection = await oracledb.getConnection({
    user          : process.env.DATABASE_USER,
    password      : process.env.DATABASE_PASSWORD,
    connectString : process.env.DATABASE_CONNECT
  })
  console.log('資料庫連線成功1122')
  const result = await connection.execute(
    `SELECT * FROM VUE_BILLTEST WHERE USERNAME = '${req.user.name}'`,
  )
  console.log('result',result)
  res.status(200).json({
    "customer" : result.rows[0],
    "status": "success"
 })
  
});

module.exports = router;

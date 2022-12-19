var express = require('express');
var router = express.Router();
const bcrypt = require('bcryptjs')
const validator = require('validator')
const oracledb = require('oracledb');
const appError = require('../service/appError.js')
const { isAuth, generateSentJWT } = require('../service/isAuth.js');
oracledb.autoCommit = true;
//註冊帳號
router.post('/sign_up', async function(req, res, next) {
  oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
  //各種驗證及防呆
  let {username, password, checkpassword, email} = req.body
  if(!username || !password  || !checkpassword || !email ){
     return appError(400,'Field is missing',next)
  }
  if(password !== checkpassword) {
     return appError(400,'Confirm that the passwords do not match',next)
  }
  if(!validator.isLength(password,{min:8}) || !validator.matches(password, /[a-z]/,/[A-Z]/)){
    return next(appError(400,'The password must be greater than eight characters and contain English!',next))
 }
  if(!validator.isEmail(email)){
    return next(appError(400,'Mailbox format error',next))
  }
  console.log(username,password,checkpassword,email)
  //密碼加密
  password = await bcrypt.hash(password,12)
  
  try{                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 
    connection = await oracledb.getConnection({
        user          : process.env.DATABASE_USER,
        password      : process.env.DATABASE_PASSWORD,
        connectString : process.env.DATABASE_CONNECT
    })
    //這邊檢查帳號是否重複註冊
    const checkRepeat = await connection.execute(
      `SELECT * FROM VUE_BILLTEST WHERE USERNAME = '${username}'`
    )
    console.log('check',checkRepeat.rows.length)
    if(checkRepeat.rows.length !== 0){
       return appError(400,'Duplicate account registration',next)
    }

    const sqlQuery = `INSERT INTO "PLMUSER"."VUE_BILLTEST" VALUES (:1, :2, :3)`;
    binds = [ [`${username}`, `${password}`, `${email}` ]];
    const result = await connection.executeMany(sqlQuery, binds, {});
    console.log("Number of inserted rows:", result);


    const newUser = await connection.execute(
      `SELECT * FROM VUE_BILLTEST WHERE USERNAME = '${username}' `,
    )
    console.log('newUser',newUser.rows[0])
    generateSentJWT(newUser.rows[0],200,res)
  }
  catch(err){
    next(err)
  }
});

//這邊是FCU的訂單API
router.post('/order', async function(req, res, next) {
  
  oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
  let data = req.body
  try{
    connection = await oracledb.getConnection({
        user          : process.env.DATABASE_USER,
        password      : process.env.DATABASE_PASSWORD,
        connectString : process.env.DATABASE_CONNECT
    })
    // const sqlQuery = `INSERT INTO "PLMUSER"."VUE_BILLFCU" VALUES (:1,:2,:3,:4,:5,:6,:7,:8,:9,:10,:11,:12,:13,:14,:15,
    //   :16,:17,:18,:19,:20,:21,:22,:23,:24,:25,:26,:27,:28,:29,:30,:31,:32,:33,:34,:35,:36,:37,:38,:39,:40,:41,:42,:43,:44,:45,:46,:47,:48,:49,:50,
    //   :51,:52,:53,:54,:55,:56,:57,:58,:59,:60,:61,:62,:63,:64,:65,:66,:67,:68)`;
    const sqlQuery = `INSERT INTO "PLMUSER"."VUE_BILLINSERT" VALUES (:1,:2,:3,:4,:5,:6,:7,:8,:9,:10,:11)`;
    // binds = [ [`${username}`, `${password}`, `${email}` ]];
    console.log('totaldata', data)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 
    let ordertotal = data
    const result = await connection.executeMany(sqlQuery, ordertotal, {});
    console.log("Number of inserted rows:", result);
    res.status(200).json({
      "status" : "success",
      "result" : result
    })
    // const newUser = await connection.execute(
    //   `SELECT * FROM VUE_BILLTEST WHERE USERNAME = '${username}' `,
    // )
    // console.log('newUser',newUser.rows[0])
    // generateSentJWT(newUser.rows[0],200,res)
  }
  catch(err){
    next(err)
  }
});

router.post('/sign_in', async function(req, res ,next){
  oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
  try{
    connection = await oracledb.getConnection({
        user          : process.env.DATABASE_USER,
        password      : process.env.DATABASE_PASSWORD,
        connectString : process.env.DATABASE_CONNECT
    })
    const { username, password } = req.body
    if(!username || !password){
      return next(appError(400,'Password or account number is missing!',next))
    }
    const user =  await connection.execute(
      `SELECT * FROM VUE_BILLTEST WHERE USERNAME = '${username}' `,
    )
    if(user.rows[0] == undefined) {
      return next(appError(400,'User does not exist',next))
    }
    const currnUser = user.rows[0]
    console.log('currenuser',currnUser)
    generateSentJWT(currnUser,200,res)
  }
  catch(err){

  }
})

// 測試取得員工資料
router.get('/personFile', async function(req, res, next) {
  
  oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
  let data = req.body
  try{
    connection = await oracledb.getConnection({
        user          : process.env.DATABASE_USER,
        password      : process.env.DATABASE_PASSWORD,
        connectString : process.env.DATABASE_CONNECT
    })
    // const sqlQuery = `INSERT INTO "PLMUSER"."VUE_BILLFCU" VALUES (:1,:2,:3,:4,:5,:6,:7,:8,:9,:10,:11,:12,:13,:14,:15,
    //   :16,:17,:18,:19,:20,:21,:22,:23,:24,:25,:26,:27,:28,:29,:30,:31,:32,:33,:34,:35,:36,:37,:38,:39,:40,:41,:42,:43,:44,:45,:46,:47,:48,:49,:50,
    //   :51,:52,:53,:54,:55,:56,:57,:58,:59,:60,:61,:62,:63,:64,:65,:66,:67,:68)`;
    const sqlQuery = `Select GEN01 AS 工號,GEN02 AS 姓名,GEN03 AS 部門代號,GEM02 AS 部門名稱
    From TDTEST2.GEN_FILE LEFT OUTER JOIN
    TDTEST2.GEM_FILE ON GEM01 = GEN03
    Where GENACTI = 'Y'
    `;
    // binds = [ [`${username}`, `${password}`, `${email}` ]];
    console.log('totaldata', sqlQuery)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 
    // let ordertotal = data
    const result = await connection.execute(`Select SMYSLIP,SMYDESC From TD.SMY_FILE Where SMYSYS = 'aim' and SMYKIND = '1'
    `);
    console.log("Number of inserted rows:", result);
    // res.status(200).json({
    //   "status" : "success",
    //   "result" : result
    // })
    // const newUser = await connection.execute(
    //   `SELECT * FROM VUE_BILLTEST WHERE USERNAME = '${username}' `,
    // )
    // console.log('newUser',newUser.rows[0])
    // generateSentJWT(newUser.rows[0],200,res)
  }
  catch(err){
    next(err)
  }
});
module.exports = router;

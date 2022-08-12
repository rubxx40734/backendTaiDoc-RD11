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
module.exports = router;

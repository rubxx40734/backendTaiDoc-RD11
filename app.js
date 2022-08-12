var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors')
const dotenv = require('dotenv')

dotenv.config({path:'./config.env'})

process.on('uncaughtException', err => {
  // 記錄錯誤下來，等到服務都處理完後，停掉該 process 這是express內建
	console.error('Uncaughted Exception！')
	console.error(err);
	process.exit(1);
});

// 資料庫連線
const oracledb = require('oracledb');
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
async function run() {
    let connection;
    try {
      connection = await oracledb.getConnection( {
        user          : process.env.DATABASE_USER,
        password      : process.env.DATABASE_PASSWORD,
        connectString : process.env.DATABASE_CONNECT
      });
      console.log('資料庫連線成功')
    } catch (err) {
      console.error(err,'錯誤');
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (err) {
          console.error(err,'連結錯誤');
        }
      }
    }
  } 
  run();
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var customerRouter = require('./routes/customer.js');

var app = express();
app.use(cors())
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/customer',customerRouter)
//這邊捕捉404錯誤路由
app.use(function(req,res,next){
    res.status(404).json({
        "status" : "error",
        "message": "找無此路由!"
    })
})
//自行定義Production的錯誤模式
const resErrorPro = function(err,res) {
  //出現預期內的錯誤
  if(err.isOperational) {
    res.status(err.statusCode).json({
      "message" : err.message
    })
  }else if(err.messageFormat == undefined) {
    res.status(500).json({
      "status" : "error 罐頭訊息",
      "message" : "您的帳號重複註冊或錯誤"
    })
  }
  else{
    //發生不可預期的錯誤
    console.error('不可預期錯誤', err)
    console.log(err.messageFormat)
    res.status(500).json({
      "status" : "error 罐頭訊息",
      "message" : "出現重大錯誤 請聯絡系統管理員"
    })
  }
}
//自行定義dev模式的錯誤模式
const resErrorDev = function(err,res) {
  res.status(err.statusCode).json({
    "message": err.message,
    "name" : err.name,
    "error" : err,
    "stack" : err.stack
  })
}
//express 處理錯誤
app.use(function(err,req,res,next){
  //dev
   err.statusCode = err.statusCode || 500
   if(process.env.NODE_ENV === "dev"){
     return resErrorDev(err,res)
   }
   if(err.name === 'Error'){
     err.message = err.message,
     err.isOperational = true
     return resErrorPro(err,res)
   }
    resErrorPro(err,res)
})


process.on('unhandledRejection', (err, promise) => {
  console.error('未捕捉到的 rejection：', promise, '原因：', err);
  // 記錄於 log 上
});

module.exports = app;

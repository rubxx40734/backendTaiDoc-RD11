const express = require('express')
const jwt = require('jsonwebtoken')
const appError = require('./appError')
// const handleErrorAsync = require('../server/handleErrorAsync')


const generateSentJWT = async (user, statusCode, res) => {
    //產申JWT
    try{
        console.log('JWT',user)
        const token = jwt.sign({name:user.USERNAME},process.env.JWT_SECRET,{
         expiresIn:process.env.JWT_EXPIRES_DAY
     })
        user.PASSWORD = undefined
        res.status(statusCode).json({
          "statue": "success",
          user : {
            token,
            name: user.USERNAME
          }
        })
    }
    catch(err){
       console.log(err)
    }
 }

 const isAuth = (async (req,res,next) => {
    // 這邊確認token是否有帶入
    try{
        let token = ''
        if(req.headers.authorization &&
         req.headers.authorization.startsWith('Bearer')){
           token = req.headers.authorization.split(' ')[1]
           console.log(token)
        }
        if(!token) {
          return next(appError(400,'You are not logged in',next))
        }
     
        //驗證token是否正確
        const decoded = await new Promise((resolve, reject) => {
          jwt.verify(token,process.env.JWT_SECRET,(err,payload) => {
             if(err) {
               reject(err)
               return next(appError(400,'Your token is incorrect or expired',next))
             }else{
                resolve(payload)
             }
          })
        })
        // console.log('decoded',decoded)
        // const currentUser = await User.findById(decoded.id)
        req.user = decoded
        console.log('currentUser',decoded)
        next()
        
    }
    catch(err){
       console.log(err)
    }
  })

module.exports = {generateSentJWT,isAuth }
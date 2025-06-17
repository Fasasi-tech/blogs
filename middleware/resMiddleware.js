const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
dotenv.config()

const signToken = id =>{
    return jwt.sign({id},  process.env.SECRET_STR, {
        expiresIn: process.env.LOGIN_EXPIRES
    })
}

createSendResponseAuth = (user, statusCode, res) =>{
    const token = signToken(user._id)

    const options = {
        maxAge: process.env.LOGIN_EXPIRES,
        httpOnly:true
    }

    if (process.env.NODE_ENV ==='production'){
        options.secure = true
    }

    res.cookie('jwt', token, options)

    user.password= undefined

    res.status(statusCode).json({
        status:'success',
        data:{
            user
        }
    })
}

module.exports={createSendResponseAuth}
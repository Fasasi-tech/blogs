const jwt = require('jsonwebtoken');
const User = require('../models/users.model')
const { promisify } = require('util');
const Blacklist = require('../models/BlacklistModel')
const dotenv= require('dotenv')
dotenv.config();

const AuthorizeUser = async (req, res, next) =>{

    const token = req.cookies.jwt

    if (!token){
        return (res.status(401).json({message:  'Authorization failed'}))
    }

    //check if the token is blacklisted. 
    //adding the token to blacklist upon logging out so the user wont use the token to login again

    const checkIfBlacklisted = await Blacklist.findOne({token})

    if (checkIfBlacklisted){
        return res.status(401).json({message:"This session has expired. please login again"})
    }

    //used to check the token if it is still valid
    // response will give { id: 'userId123', iat: 1718200000, exp: 1718286400 }

        const decodedToken=  await promisify(jwt.verify)(token, process.env.SECRET_STR)

        const user = await User.findById(decodedToken.id)

        if (!user){
            return res.status(401).json({message:"This user with the given token does not exists"})
        }

        const isPasswordChanged = await user.isPasswordChanged(decodedToken.iat)
    //if the user changed password after the token was issued, you would not be able to access the route.
    if(isPasswordChanged){
        return res.status(401).json({message:"The password has been changed recently, please login again"})
    }
    // allow user to access route
    req.user = user
    next()

}

module.exports ={AuthorizeUser}
const Users = require('../models/users.model')
const Blacklist = require('../models/BlacklistModel')
const {createSendResponseAuth} = require('../middleware/resMiddleware')
const {sendEmail} = require('../utils/email')
const {plainEmailTemplate, generatePasswordResetTemplate} = require('../utils/mail')
const crypto = require('crypto')


const createUsers = async(req, res) =>{
    try{
        const {first_name, last_name,  email, password, role} = req.body

        const existinguser = await Users.findOne({email})

        if (existinguser){
            return res.status(400).json({
                message: 'User already exists'
            })
        }
        const user ={first_name, last_name, email, password, role}

        const createNewUser = await Users.create(user)

        const sent_to = createNewUser.email;
        const sent_from = process.env.EMAIL_OWNER;
        const reply_to = createNewUser.email;
        const subject = "WELCOME EMAIL";
        const message = plainEmailTemplate(
            "You are now registered",
             `Dear ${createNewUser.first_name}, You are now a blog owner. We are glad to have you. `

        );

         try {
        await sendEmail(subject, message, sent_to, sent_from, reply_to);
      } catch (err) {
        console.error("Failed to send email:", err);
      }

   

        createSendResponseAuth(createNewUser, 201, res)


    } catch(err){
        return res.status(500).json({
        message:'internal server error',
        error:err.message
    })
    }
}

const loginUser= async(req, res) =>{
    try{

        const {email, password} = req.body

        if (!email || !password){
            return res.status(400).json({
                message:'please provide email or password'
            })
        }

        const findUser= await Users.findOne({email}).select('+password')

        
        if (!findUser) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!findUser.active){
            return res.status(403).json({
                message:"user has been deactivated"
            })
        }

        
        if (!findUser || !(await findUser.comparePassword(password))){
            return res.status(400).json({
                message:"user not found in database or password is invalid"
            })
        }



        createSendResponseAuth(findUser, 200, res )


    }catch(error){
         return res.status(500).json({
        message:'internal server error',
        error:error.message})
    }
} 

const verifyUserStatus = async(req, res, next) =>{
    const userId = req.user._id

    const user = await Users.findById(userId)

    if (!user || !user.active){
        return (res.status(401).json({
                message: 'Your account is disabled'
            }))
    }
    next()
}

const restrict = (...roles)=>{
    return (req, res, next) =>{
        if (!roles.includes(req.user.role)){
            return (res.status(403).json({
                message: 'you do not have permission for this action'
            }))
        } 
        next()
    }
}

const forgotPassword = async (req, res)=>{
    try{
        const user = await Users.findOne({email:req.body.email})

        if (!user){
            return res.status(401).json({message:'user not found!'})
        }

          // Generate a random reset token if users exists
    const resetToken = user.createResetPasswordToken()

        await user.save({validateBeforeSave:false})

        const resetUrl=`${req.protocol}://${req.get('host')}/api/v1/auth/resetPassword/${resetToken}`

         const sent_to = user.email;
     const sent_from = process.env.EMAIL_USER;
    const reply_to = user.email;
    const subject = "PASSWORD RESET";
    const message = generatePasswordResetTemplate(resetUrl)

       
    try{
        await sendEmail(subject, message, sent_to, sent_from, reply_to)
        res.status(200).json({
            status:'success',
            message:'Password reset link sent successfully'
    })
} catch(err){
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    await user.save({validateBeforeSave:false})

    return res.status(400).json({message:'There was an error sending password reset email. Please try again later'});
}
    
    }catch(error){
        return res.status(500).json({
        message:'internal server error',
        error:err.message})
    }
}

const resetPassword = async(req, res) =>{
    try{
            // IF THE USER EXISTS WITH THE GIVEN TOKEN AND TOKEN HAS NOT EXPIRED
    const token = crypto.createHash('sha256').update(req.params.token).digest('hex')
    const user = await Users.findOne({passwordResetToken:token, passwordResetTokenExpires: {$gt:Date.now()}});
    if(!user){
       return res.status(400).json({message:'Token is invalid or has expired'})
    }
    // RESETTING THE USER PASSWORD
    user.password = req.body.password
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    user.passwordChangedAt = Date.now()

   await  user.save()

   console.log({user})

    return res.status(200).json({
        message: 'password reset successfully'
    })

    }catch(error){
         return res.status(500).json({
        message:'internal server error',
        error:err.message})
    }
 
}

const logout = async(req, res) =>{
    const authHeader = req.headers['cookie']

    if (!authHeader){
        return res.status(204).json({message:"No cookie header provided"})
    }

    
    const cookie = authHeader.split('=')[1]
    const accessToken = cookie.split(';')[0]
    const checkIfBlacklisted = await Blacklist.findOne({token: accessToken});

    if (checkIfBlacklisted) {
        return res.status(200).json({ message: 'Already logged out' });
    }

    const newBlacklist = new Blacklist({
        token: accessToken,
    })

    await newBlacklist.save();

    res.setHeader('Clear-site-Data', '"cookies"');
    res.status(200).json({
        message: 'You are logged out'
    })
}
module.exports={
    createUsers,
    verifyUserStatus,
    restrict,
    resetPassword,
    forgotPassword,
    loginUser,
    logout
}
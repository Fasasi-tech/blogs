const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto')

const userSchema = new mongoose.Schema({
    first_name: {
        type: String,
        required: true
    },
     last_name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    active:{
    type:Boolean,
    default:true,
   },
    password: {
        type: String,
        required: true,
        select:false
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user',
        required: true
    },

    passwordChangedAt:Date,
   passwordResetToken:String,
   passwordResetTokenExpires:Date
}, {timestamps:true});

// create a pre save hook
userSchema.pre('save', async function(next){
    if(!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});



// create compare password
userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};


// changing password function. you will have to login first before you get your token again
userSchema.methods.isPasswordChanged = async function (JWTTimestamp){
    // only if the password was changed, that is when you will see the field passwordChangedAt
    if (this.passwordChangedAt){
         const pswdChangedTimeStamp = parseInt(this.passwordChangedAt.getTime()/10000, 10)
         return JWTTimestamp < pswdChangedTimeStamp // password was changed after jwt was issued
        }
    return false

}
userSchema.methods.createResetPasswordToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex')
    this.passwordResetToken=crypto.createHash('sha256').update(resetToken).digest('hex')
    this.passwordResetTokenExpires = Date.now() + 10*60*1000

    return resetToken
}

const User = mongoose.model('User', userSchema);

module.exports = User;


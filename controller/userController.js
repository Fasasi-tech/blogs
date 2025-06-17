// const { findByIdAndUpdate } = require('../models/jobs.model')
const User= require('../models/users.model')

const getAllUsers = async (req, res) =>{
    try{

        const users = await User.find({}).select('-password -passwordChangedAt -__v')
        const usersCount = users.length

        res.status(200).json({message:'users returned successfully!',
            data: users,
            count: usersCount
        })
    }catch(error){
          return res.status(500).json({
            message: 'Internal server error',
            error: error.message
        })
    }
    

}

const getSingleUser = async (req, res) =>{

    const  singleUser = await User.findById(req.params.id).select('-passwordChangedAt -__v')

    if (!singleUser){
        return res.status(400).json({message: 'user not found!'})
    }

    res.status(200).json({message:'user found successfully', 
        data: singleUser
    })
}

const myProfile = async (req, res) =>{
    try{
         const myProfiles = await User.find({_id: req.user._id}).select('-__v -passwordChangedAt')

    if (!myProfiles){
        return res.status(400).json({message:"profile not found!"})


    }

    res.status(200).json({message:'profile retrieved successfully', data: myProfiles})
    } catch(error){
        return res.status(500).json({
            message: 'Internal server error',
            error: error.message    
        })
    }
   
}

const updateMe = async (req, res) =>{
    try{
        const {first_name, last_name} = req.body
        const editProfile = await User.findByIdAndUpdate(req.user._id, {first_name, last_name}, {runValidators:true, new:true})

        res.status(200).json({'message': 'Your profile has been updates successfully',
            data: editProfile

        })


    }catch(error){
          return res.status(500).json({
            message: 'Internal server error',
            error: error.message    
        })
    }
}

const updateUser = async (req, res) =>{
    try{
        const {first_name, last_name} = req.body
        const editProfile = await User.findByIdAndUpdate(req.params.id, {first_name, last_name}, {runValidators:true, new:true})

        res.status(200).json({'message': 'user profile has been updates successfully',
            data: editProfile

        })


    }catch(error){
          return res.status(500).json({
            message: 'Internal server error',
            error: error.message    
        })
    }
}

const deactivateUser = async (req, res) =>{
    try{
       
        const deactivate =  await User.findByIdAndUpdate(req.params.id, {active:false},  {runValidators:true, new:true})

        if (!deactivate){
            return res.status(404).json({
                message:'user not found!'
            })
        }

          return res.status(200).json({
            message: 'User deactivated successfully',
            user: deactivate
        });
    } catch(error){
        return res.status(500).json({
            message: 'Internal server error',
            error: error.message    
        })
    }
}

const reactivateUser = async (req, res) =>{
    try{
        const user = await User.findByIdAndUpdate(req.params.id,  {active:true},  {runValidators:true, new:true})

        // if (!user){
        //     return res.status(404).json({
        //         message:'user not found or already active'
        //     })
        // }

          return res.status(200).json({
            message: 'User activated successfully',
            user
        });
    }catch(error){
         return res.status(500).json({
            message: 'Internal server error',
            error: error.message    
        })
    }
}

const updatePassword = async (req, res) =>{
    try{

        if (req.body.password === req.body.currentPassword){
            return  res.status(400).json({
                message:'Your new password cannot be the same as your current password'
            })

           
        }

         const user = await User.findById(req.user._id).select('+password')

            if (!(await user.comparePassword(req.body.currentPassword, user.password))){
                return res.status(401).json({
                    message:"The current password you provided is wrong"
                })           
            }

             user.password = req.body.password

             await user.save()

             res.status(200).json({message:'password updated successfully'})


    }catch(error){
         return res.status(500).json({
            message: 'Internal server error',
            error: error.message    
        })
    }
}





module.exports={getAllUsers, getSingleUser, myProfile, updateUser, updateMe, deactivateUser, reactivateUser, updatePassword}
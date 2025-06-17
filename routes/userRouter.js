const express = require('express')

const router = express.Router()
const userController = require('../controller/userController')
const {AuthorizeUser} = require('../middleware/authmiddleware')
const {restrict} = require('../controller/authController')
const authController = require('../controller/authController')


router.get('/', AuthorizeUser, authController.verifyUserStatus,  restrict('admin'), userController.getAllUsers )
router.patch('/update-self', AuthorizeUser, authController.verifyUserStatus, userController.updateMe)
router.get('/profile', AuthorizeUser, authController.verifyUserStatus, userController.myProfile)
router.patch('/update-password', AuthorizeUser, authController.verifyUserStatus, userController.updatePassword)
router.get('/:id', AuthorizeUser, authController.verifyUserStatus, restrict('admin'), userController.getSingleUser)
router.patch('/deactivate-user/:id', AuthorizeUser, authController.verifyUserStatus, restrict('admin'), userController.deactivateUser)
router.patch('/:id', AuthorizeUser, authController.verifyUserStatus, restrict('admin'), userController.updateUser)
router.patch('/reactivate-user/:id', AuthorizeUser, authController.verifyUserStatus, restrict('admin'), userController.reactivateUser)


module.exports= router
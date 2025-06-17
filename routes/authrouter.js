const express= require('express')
const router = express.Router();
const authController = require('../controller/authController')
const authJoiMiddleware = require('../middleware/authJoiMiddleware')

router.post('/signup',  authController.createUsers )
router.post('/login', authController.loginUser)
router.post('/forgot-password', authController.forgotPassword )
router.post('/resetPassword/:token', authController.resetPassword)
router.post('/logout', authController.logout)
module.exports = router;


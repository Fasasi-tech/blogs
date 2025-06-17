const express = require('express')

const router = express.Router()
const {AuthorizeUser} = require('../middleware/authmiddleware')
const {restrict} = require('../controller/authController')
const authController = require('../controller/authController')
const blogController = require('../controller/blogsController')

//public routes
router.get('/', blogController.AllBlogsExternal)
router.get('/:id', blogController.singleBlogs)

//protected routes
// The owner of the blog should be able to get a list of their blogs.
router.get('/my-blog', AuthorizeUser, authController.verifyUserStatus, restrict('admin', 'user'), blogController.getUserBlogs)
router.post('/', AuthorizeUser, authController.verifyUserStatus, restrict('admin', 'user'), blogController.createBlog )
//The owner of the blog should be able to update the state of the blog to published
router.patch('/edit/:id', AuthorizeUser, authController.verifyUserStatus, restrict('user', 'admin'), blogController.editBlog)
//delete blog
router.delete('/:id', AuthorizeUser,authController.verifyUserStatus, restrict('admin', 'user'), blogController.deleteBlog )
//update state of the blog
router.patch('/:id', AuthorizeUser, authController.verifyUserStatus, restrict('admin', 'user'), blogController.updateBlogState)


module.exports= router
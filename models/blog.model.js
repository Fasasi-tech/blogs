const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
     title: {
        type: String,
        required: true,
        unique:true
    },
    description:{
        type:String,
        required: true,
    },
    author:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    state:{
        type:String,
        enum:['draft', 'published'],
        default:'draft'
    },
    body:{
        type:String,
        required:true
    },
    read_count:{
        type:Number
    },
    tags:{
        type:[String],
        required:true
    },
    reading_time:String
}, {timestamps:true})

blogSchema.index({ title: 'text', tags: 'text', author:'text' });

const Blog = mongoose.model('Blog', blogSchema)

module.exports=Blog
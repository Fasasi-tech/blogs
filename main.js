const express = require('express')
const app = express()

const authRoutes = require('./routes/authrouter')
const userRoutes = require('./routes/userRouter')
const blogRoutes = require('./routes/blogrouter')

const cookieParser = require('cookie-parser');


app.use(express.json({limit:'10mb'}))
app.use(cookieParser());



// db.connectDB();



app.get('/', (req, res) =>{
    res.send('jobs api')
})

app.use ('/api/v1/auth', authRoutes )
app.use ('/api/v1/users', userRoutes)
app.use('/api/v1/blogs', blogRoutes)


module.exports= app
const app = require('./main')
const db = require('./config/database')
const dotenv = require('dotenv')
dotenv.config()

db.connectDB()


const port = process.env.PORT || 8000

app.listen(port, () =>{
    console.log(`server running on port ${port}`)
})

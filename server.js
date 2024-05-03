require("dotenv").config({path: "./config/config.env"})

const express = require("express")
const app = express()

const fileUpload = require("express-fileupload")
const path = require("path")

const port = process.env.PORT || 3000

const connectDB = require("./server/database/connection")

// Connect DB

connectDB()


// Load body-parser

app.use(express.json())
app.use(express.urlencoded({extended: false}))


app.use(
    fileUpload({
        useTempFiles: true,
        tempFileDir: path.join(__dirname, "tmp"),
        createParentPath: true,
        limits: {
            fieldSize: 6 * 1024 * 1024 * 8, // 6mb
        }
    })
)



app.use("/posts", require("./server/routes/post"))

app.listen(port, ()=> console.log(`server running on http://localhost:${port}`))
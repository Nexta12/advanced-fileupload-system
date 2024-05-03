const mongoose = require("mongoose")


const connectDB = async () =>{

    try {

       await mongoose.connect( process.env.Mongo_URI)

       console.log("Server Connected to database")

        
    } catch (error) {
        console.log(error)
        process.exit(1)
    }
}

module.exports = connectDB
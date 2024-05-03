const mongoose = require("mongoose")

const postSchema = new mongoose.Schema({
    title: String,
    uploads: Array
})


module.exports = mongoose.model("Post", postSchema)
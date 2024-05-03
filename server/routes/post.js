const router = require("express").Router()
const postController = require("../controllers/postController")
const { cloudinaryUploader } = require("../middlewares/cloudinary")

// post routs

router.post("/", cloudinaryUploader, postController.createPost)











module.exports = router
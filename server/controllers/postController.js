const Post = require("../models/postModel");

module.exports = {
  createPost: async (req, res) => {
    try {
      const { title } = req.body;

      if (title == "") {
        return res.status(403).json({ err: "Provide Post title" });
      }

      const post = await Post.create(req.body);

      res.status(201).json(post);
    } catch (error) {
      res.status(422).json(error);
    }
  },
};

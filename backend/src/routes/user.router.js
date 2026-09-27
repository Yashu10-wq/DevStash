const express = require('express');
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middlewares");
const userController = require("../controllers/user.controllers");
const {upload} = require("../middlewares/file.middlewares");

router.patch("/profile",authMiddleware.isLoggedIn,upload.single("profileUri"),userController.updateProfile);
module.exports = router;
const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controllers");
const authMiddleware = require("../middlewares/auth.middlewares");
router.post("/register",authController.register);
router.post("/login",authController.login);
router.get("/refresh",authController.refresh);
router.post("/logout",authMiddleware.isLoggedIn,authController.logout);
router.post("/verify-email",authController.verifyEmail)
module.exports = router;
import express from "express";

import { forgotPassword, login, logout, signup, verifyEmail, resetPassword, checkAuth } from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.post('/signup', signup)
router.post('/login', login)
router.post('/logout', logout)

router.post('/verify-email', verifyEmail);
// forgot the password route
router.post('/forgot-password', forgotPassword);
// reset password
router.post('/reset-password/:token', resetPassword);
// check the authentication
router.get('/check-auth', verifyToken, checkAuth)
export default router;

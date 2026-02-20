import express from "express";
import {
  loginUser,
  logoutUser,
  registerUser
} from "../controllers/auth.controller.js";

import authUser from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", authUser, logoutUser);

export default router;

import express from "express";
import {
  loginUser,
  logoutUser,
  registerUser
} from "../controllers/auth.controller.js";

import authUser from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { loginSchema, registerSchema } from "../validators/auth.validator.js";

const router = express.Router();

router.post("/register", validate(registerSchema), registerUser);
router.post("/login", validate(loginSchema), loginUser);
router.post("/logout", authUser, logoutUser);

export default router;

import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import UserModel from "../models/User.model.js";


//  TOKEN GENERATOR (Reusable)
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};


//  COOKIE SETTER (Reusable)
const setAuthCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};



// ================= REGISTER =================
export const registerUser = async (req, res) => {
  try {

    const { name, email, password } = req.body;

    // Validate
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields required"
      });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be >= 8 chars"
      });
    }

    // Existing check
    const exists = await UserModel.findOne({ email }).lean();
    if (exists) {
      return res.status(409).json({
        success: false,
        message: "Email already registered"
      });
    }

    // Hash
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create
    const user = await UserModel.create({
      name,
      email,
      password: hashedPassword
    });

    // Token
    const token = generateToken(user._id);
    setAuthCookie(res, token);

    return res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      }
    });

  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false });
  }
};



// ================= LOGIN =================
export const loginUser = async (req, res) => {
  try {

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email & password required"
      });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const token = generateToken(user._id);
    setAuthCookie(res, token);

    return res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false });
  }
};



// ================= LOGOUT =================
export const logoutUser = async (req, res) => {
  try {

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    });

    return res.json({
      success: true,
      message: "Logged out"
    });

  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ success: false });
  }
};

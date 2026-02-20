import jwt from "jsonwebtoken";

const authUser = (req, res, next) => {
  try {
    // 1️ Get token from cookies
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated. Please login."
      });
    }

    // 2️ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3️ Attach user info to request
    req.user = {
      userId: decoded.userId
    };

    // 4️ Continue
    next();

  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
};

export default authUser;

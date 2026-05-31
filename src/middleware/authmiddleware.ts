import { type Response, type NextFunction } from "express";
const jwt = require("jsonwebtoken");
module.exports = (req: any, res: Response, next: NextFunction) => {
  try {
    const token =
      req.cookies.token || req.headers.authorization?.split(" ")[1] || null;
    if (!token) {
      console.log("No token provided");
      return res.json({ message: "auth failed" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.id = decoded.id;
    req.role = decoded.role;
    next();
  } catch (err: any) {
    res.json({ message: "auth failed", error: err.message });
  }
};

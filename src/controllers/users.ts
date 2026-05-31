import { type Request, type Response } from "express";
const bcrypt = require("bcrypt");
const Users = require("../models/users.js");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
exports.register = async (req: Request, res: Response) => {
  if (
    req.body.password.length < 6 ||
    req.body.password.length > 20 ||
    req.body.username.length < 3 ||
    req.body.username.length > 20 ||
    req.body.email.length < 5 ||
    req.body.email.length > 50 ||
    req.body.password !== req.body.confirmPassword
  ) {
    return res.status(400).json({ message: "Invalid input" });
  }
  const existingUser = await Users.findOne({ email: req.body.email });
  if (existingUser) {
    return res.status(400).json({ message: "Email already in use" });
  }
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  const newUser = await Users.create({
    username: req.body.username,
    email: req.body.email,
    password: hashedPassword,
    role: req.body.role,
  });
  const token = jwt.sign(
    { id: newUser._id, role: newUser.role, time: Date.now() },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );
  res.cookie("token", token, { httpOnly: true,secure:true,sameSite:"none",maxAge:24*60*60*1000, });
  res
    .status(201)
    .json({ message: "User registered successfully", role: newUser.role });
};
exports.login = async (req: Request, res: Response) => {
  const user = await Users.findOne({ email: req.body.email });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  const isMatch = await bcrypt.compare(req.body.password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Invalid credentials" });
  }
  const token = jwt.sign(
    { id: user._id, role: user.role, time: Date.now() },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );
  res.cookie("token", token, { httpOnly: true,secure:true,sameSite:"none",maxAge:24*60*60*1000, });
  res
    .status(200)
    .json({ message: "User logged in successfully", role: user.role });
};
exports.refreshToken = (req: Request | any, res: Response) => {
  try {
    const id = req.id;
    const role = req.role;
    const newToken = jwt.sign(
      { id: id, role: role, time: Date.now() },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );
    res.cookie("token", newToken, { httpOnly: true,secure:true,sameSite:"none",maxAge:24*60*60*1000, });
    res
      .status(200)
      .json({ message: "Token refreshed successfully", role: role });
  } catch (err: any) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
exports.roleCheck = (req: Request | any, res: Response) => {
  const role = req.role;
  res.status(200).json({ role: role });
};
exports.logout = (req: Request, res: Response) => {
  res.clearCookie("token");

  res.status(200).json({ message: "User logged out successfully" });
};
exports.name = async (req: Request | any, res: Response) => {
  const id = req.id;
  const user = await Users.findById(id);
  res
    .status(200)
    .json({ name: user.username, role: user.role, image: user.profilePicture });
};

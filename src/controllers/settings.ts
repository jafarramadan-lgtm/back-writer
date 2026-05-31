import { type Request, type Response } from "express";
const bcrypt = require("bcrypt");
const Users = require("../models/users.js");
const cloudinary = require("../config/cloudinary");
const Rating = require("../models/ratingStory.js");
const Story = require("../models/stories.js");
const Scene = require("../models/scene.js");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
exports.changePassword = async (req: Request | any, res: Response) => {
  if (req.body.newPassword !== req.body.confirmNewPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }
  if (req.body.newPassword.length < 6 || req.body.newPassword.length > 20) {
    return res
      .status(400)
      .json({ message: "Password must be between 6 and 20 characters" });
  }
  const id = req.id;
  const user = await Users.findById(id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  const isMatch = await bcrypt.compare(req.body.oldPassword, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Invalid old password" });
  }
  const hashedPassword = await bcrypt.hash(req.body.newPassword, 10);
  user.password = hashedPassword;
  await user.save();
  res.status(200).json({ message: "Password changed successfully" });
};
exports.editeName = async (req: Request | any, res: Response) => {
  const id = req.id;
  const user = await Users.findById(id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  if (req.body.newName.length < 3 || req.body.newName.length > 20) {
    return res
      .status(400)
      .json({ message: "Name must be between 3 and 20 characters" });
  }
  const isMatch = await bcrypt.compare(req.body.password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Invalid password" });
  }

  user.username = req.body.newName;
  await user.save();
  res.status(200).json({ message: "Name updated successfully" });
};
exports.deleteAccount = async (req: Request | any, res: Response) => {
  const id = req.id;
  const user = await Users.findById(id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  const isMatch = await bcrypt.compare(req.body.password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Invalid password" });
  }
  await user.deleteOne();
  await cloudinary.uploader.destroy(user.profilePictureId);
  const stories = await Story.find({ idWriter: id });
  await Story.deleteMany({ idWriter: id });
  await Scene.deleteMany({ idStory: { $in: stories.map((s: any) => s._id) } });
  await Rating.deleteMany({ idStory: { $in: stories.map((s: any) => s._id) } });
  await Rating.deleteMany({ idUser: id });
  res.clearCookie("token");
  res.status(200).json({ message: "Account deleted successfully" });
};
exports.uploadImage = async (req: Request | any, res: Response) => {
  try {
    const id = req.id;
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const user = await Users.findById(id);

    if (user.profilePictureId) {
      await cloudinary.uploader.destroy(user.profilePictureId);
    }
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "user_images",
      public_id: `${req.id}_${Date.now()}`,
    });

    user.profilePicture = result.secure_url;
    user.profilePictureId = result.public_id;
    await user.save();
    res.json({
      message: "Image uploaded successfully",
      Imageurl: result.secure_url,
      publicid: result.public_id,
    });
  } catch (e: any) {
    res.json({ message: "Image upload failed", error: e.message });
  }
};

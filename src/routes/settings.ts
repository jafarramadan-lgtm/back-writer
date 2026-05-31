const { changePassword } = require("../controllers/settings.js");
const { editeName } = require("../controllers/settings.js");
const { deleteAccount } = require("../controllers/settings.js");
const { uploadImage } = require("../controllers/settings.js");
const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const authMiddleware = require("../middleware/authmiddleware.js");
router.post("/changePassword", authMiddleware, changePassword);
router.post("/editeName", authMiddleware, editeName);
router.delete("/deleteAccount", authMiddleware, deleteAccount);
router.post(
  "/uploadImage",
  authMiddleware,
  upload.single("image"),
  uploadImage,
);
module.exports = router;

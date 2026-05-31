const { homePageWriter } = require("../controllers/writer.js");
const { createStory } = require("../controllers/writer.js");
const { createScene } = require("../controllers/writer.js");
const { getScenes } = require("../controllers/writer.js");
const { updateScene } = require("../controllers/writer.js");
const { getAllStories } = require("../controllers/writer.js");
const { deleteStory } = require("../controllers/writer.js");
const { deleteScene } = require("../controllers/writer.js");
const { finishedStory } = require("../controllers/writer.js");
const { finishedStoryget } = require("../controllers/writer.js");
const { CoverImage } = require("../controllers/writer.js");
const { readAlert } = require("../controllers/writer.js");
const { getAlert } = require("../controllers/writer.js");
const { getAlertsnum } = require("../controllers/writer.js");
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authmiddleware.js");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
router.get("/homePageWriter", authMiddleware, homePageWriter);
router.post("/createStory", authMiddleware, createStory);
router.post("/createScene", authMiddleware, createScene);
router.get("/getScenes/:idstory", authMiddleware, getScenes);
router.post("/updateScene", authMiddleware, updateScene);
router.get("/getAllStories", authMiddleware, getAllStories);
router.delete("/deleteStory/:idstory", authMiddleware, deleteStory);
router.delete("/deleteScene/:idscene", authMiddleware, deleteScene);
router.put("/finishedStory/:idstory", authMiddleware, finishedStory);
router.get("/finishedStoryget/:idstory", authMiddleware, finishedStoryget);
router.post(
  "/CoverImage/:idstory",
  authMiddleware,
  upload.single("image"),
  CoverImage,
);
router.get("/getAlert", authMiddleware, getAlert);
router.put("/readAlert", authMiddleware, readAlert);
router.get("/getAlertsnum", authMiddleware, getAlertsnum);
module.exports = router;

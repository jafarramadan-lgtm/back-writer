import { type Request, type Response } from "express";
const Users = require("../models/users.js");
const Story = require("../models/stories.js");
const Scene = require("../models/scene.js");
const cloudinary = require("../config/cloudinary");
const Rating = require("../models/ratingStory.js");
const Alert = require("../models/alert.js");
const dotenv = require("dotenv");
dotenv.config();
exports.homePageWriter = async (req: Request | any, res: Response) => {
  const id = req.id;
  const user = await Users.findById(id);
  const stories = await Story.find();

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.status(200).json({
    userstories: user.stories,
    liveSessions: user.storieslife,
    readingEvaluation: user.evaluations,
    stories: stories.slice(0, 6),
  });
};

exports.createStory = async (req: Request | any, res: Response) => {
  try {
    const id = req.id;
    enum Category {
      fantasy = "fantasy",
      romance = "romance",
      mystery = "mystery",
      sciencefiction = "science-fiction",
      horror = "horror",
      historical = "historical",
      adventure = "adventure",
      thriller = "thriller",
      other = "other",
    }
    const { title, description, category, keywords, isPublic, useAI } =
      req.body;
    if (
      !title ||
      !description ||
      !category ||
      !keywords ||
      title.length < 4 ||
      title.length > 30 ||
      description.length < 10 ||
      description.length > 200 ||
      category.length < 3 ||
      category.length > 20 ||
      keywords.length < 3 ||
      keywords.length > 50 ||
      !Object.values(Category).includes(category)
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const user = await Users.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.storieslife += 1;
    await user.save();

    const story = new Story({
      title,
      description,
      category,
      keywords,
      useAI,
      isPublic,
      idWriter: id,
      nameWriter: user.username,
    });
    await story.save();
    res.status(201).json({
      message: "Story created successfully",
      data: {
        userstories: user.stories,
        liveSessions: user.storieslife,
        readingEvaluation: user.evaluations,
        storyId: story.id,
      },
    });
  } catch (err: any) {
    console.error("Error creating story:", err);
    res
      .status(500)
      .json({ message: "Error creating story", error: err.message });
  }
};

exports.createScene = async (req: Request | any, res: Response) => {
  const idWriter = req.id;
  const { title, content, isEnd, nextScenes, idstory } = req.body;

  if (
    !title ||
    !content ||
    title.length < 4 ||
    title.length > 30 ||
    content.length < 10 ||
    content.length > 500
  ) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const story = await Story.findById(idstory);

  const nextSceneid: { id: string; title: string }[] = [];
  await Promise.all(
    nextScenes.map(async (e: { [key: string]: any }) => {
      const nextS = await Scene.create({
        idStory: idstory,
        title: e.title,
        choices: e.choices || [],
      });
      nextSceneid.push({ id: nextS.id, title: nextS.title });
    }),
  );
  const newScene = new Scene({
    idStory: idstory,
    title,
    content,
    choices: nextSceneid,
    isEnd,

    numberOfScene: 0,
  });

  if (!story) {
    return res.status(404).json({ message: "Story not found" });
  }
  if (story.idWriter !== idWriter) {
    return res.status(403).json({ message: "Unauthorized" });
  }
  if (!story.start) {
    story.start = newScene.id;
    await story.save();
  }
  await newScene.save();
  const allScene = await Scene.find({ idStory: idstory });
  res.status(201).json({
    message: "Scene created successfully",
    scene: newScene,
    scenes: allScene,
  });
};
exports.getScenes = async (req: Request | any, res: Response) => {
  const idstory = req.params.idstory;
  const st = await Story.findById(idstory);
  const scenes = await Scene.find({ idStory: idstory });
  if (!scenes) {
    return res.status(404).json({ message: "Scenes not found" });
  }
  res.status(200).json({ scenes, story: st });
};
exports.updateScene = async (req: Request | any, res: Response) => {
  try {
    const { title, content, idScene, idStory, choices } = req.body;
    const scene = await Scene.findById(idScene);
    if (!scene) {
      return res.status(404).json({ message: "Scene not found" });
    }
    const story = await Story.findById(idStory);
    if (story.finished) {
      return res
        .status(400)
        .json({ message: "Cannot update scene of a finished story" });
    }
    scene.title = title || scene.title;
    scene.content = content || scene.content;
    if (scene.choices.length > 0) {
      console.log(scene.choices.length);
      await Scene.deleteMany({
        idStory: idStory,
        _id: { $in: scene.choices.map((c: any) => c.id) },
      });
    }

    const nextSceneid: { id: string; title: string }[] = [];

    if (choices && choices.length > 0) {
      await Promise.all(
        choices.map(async (e: { [key: string]: any }) => {
          const nextS = await Scene.create({
            idStory: idStory,
            title: e.title,
            choices: e.choices || [],
          });
          nextSceneid.push({ id: nextS.id, title: nextS.title });
        }),
      );
    }

    scene.choices = nextSceneid;
    const allScene = await Scene.find({ idStory: idStory });

    await scene.save();

    res
      .status(200)
      .json({ message: "Scene updated successfully", scene, scenes: allScene });
  } catch (err: any) {
    console.error("Error updating scene:", err);
    res
      .status(500)
      .json({ message: "Error updating scene", error: err.message });
  }
};
exports.getAllStories = async (req: Request | any, res: Response) => {
  const stories = await Story.find();
  res.status(200).json({ stories });
};
exports.deleteStory = async (req: Request | any, res: Response) => {
  try {
    const id = req.id;
    const idStory = req.params.idstory;
    const story = await Story.findById(idStory);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    const user = await Users.findById(id);
    async function evalution() {
      const allStory = await Story.find({ idWriter: req.id });

      const allRatingArray = await Rating.find({
        idStory: { $in: allStory.map((s: any) => s._id) },
      });
      const allRating = allRatingArray.reduce(
        (acc: number, curr: { [name: string]: any }) => {
          return acc + curr.rating;
        },
        0,
      );
      return Number((allRating / allRatingArray.length).toFixed(1));
    }
    if (story.finished) {
      user.stories -= 1;
      await user.save();
    } else {
      user.storieslife -= 1;

      await user.save();
    }
    await Story.findByIdAndDelete(idStory);
    await Rating.deleteMany({ idStory: idStory });
    await Scene.deleteMany({ idStory: idStory });
    const stories = await Story.find({ idWriter: id });
    user.evaluations = await evalution();
    await user.save();

    res.status(200).json({
      message: "Story and associated scenes deleted",
      stories: stories,
    });
  } catch (err: any) {
    res.json({ message: "Error deleting story", error: err.message });
  }
};
exports.deleteScene = async (req: Request | any, res: Response) => {
  try {
    const SceneId = req.params.idscene;
    const scene = await Scene.findById(SceneId);
    await Scene.findByIdAndDelete(SceneId);
    const scenes = await Scene.find({ idStory: scene.idStory });
    res.json({ message: "Scene deleted successfully", scenes });
  } catch (err: any) {
    res.json({ message: "Error deleting scene ", error: err.message });
  }
};
exports.finishedStory = async (req: Request | any, res: Response) => {
  try {
    const idStory = req.params.idstory;
    const story = await Story.findById(idStory);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    story.finished = !story.finished;
    await story.save();
    const user = await Users.findById(story.idWriter);
    if (story.finished) {
      user.storieslife -= 1;
      user.stories += 1;
      await user.save();
    } else {
      user.storieslife += 1;
      user.stories -= 1;
      await user.save();
    }
    res.status(200).json({ message: "Story marked as finished", story: story });
  } catch (err: any) {
    res.json({ message: "Error finishing story ", error: err.message });
  }
};
exports.finishedStoryget = async (req: Request | any, res: Response) => {
  try {
    const idStory = req.params.idstory;
    const story = await Story.findById(idStory);
    const coverStory = story.Image;

    return res
      .status(200)
      .json({ finished: story.finished, cover: coverStory });
  } catch (err: any) {
    res.json({ message: "Error finishing story ", error: err.message });
  }
};
exports.CoverImage = async (req: Request | any, res: Response) => {
  try {
    const idStory = req.params.idstory;
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const story = await Story.findById(idStory);

    if (story.Image) {
      await cloudinary.uploader.destroy(story.Image);
    }
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "story_images",
      public_id: `${idStory}_${Date.now()}`,
    });

    story.Image = result.secure_url;
    await story.save();
    res.json({
      message: "Image uploaded successfully",
      Imageurl: result.secure_url,
      publicid: result.public_id,
    });
  } catch (e: any) {
    res.json({ message: "Image upload failed", error: e.message });
  }
};
exports.getAlert = async (req: Request | any, res: Response) => {
  const idWriter = req.id;
  const alerts = await Alert.find({ idWriter: idWriter }).sort({
    isRead: 1,
    createdAt: -1,
  });
  res.status(200).json({ alerts });
};
exports.readAlert = async (req: Request | any, res: Response) => {
  try {
    const idWriter = req.id;
    await Alert.updateMany(
      { idWriter: idWriter, isRead: false },
      { isRead: true },
    );
    res.status(200).json({ message: "All alerts marked as read" });
  } catch (e: any) {
    res.json({ message: "Error reading alert", error: e.message });
  }
};

exports.getAlertsnum = async (req: Request | any, res: Response) => {
  try {
    const idWriter = req.id;
    const alertsnum = await Alert.countDocuments({ idWriter: idWriter, isRead: false });
    res.status(200).json({ alertsnum });
  } catch (e: any) {
    res.json({ message: "Error getting alert", error: e.message });
  }
};

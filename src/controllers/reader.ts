import { type Request, type Response } from "express";
import puppeteer = require("puppeteer");
const { PDF } = require ("../config/pdf");
const Users = require("../models/users.js");
const Story = require("../models/stories.js");
const Scene = require("../models/scene.js");
const Rating = require("../models/ratingStory.js");
const Alert = require("../models/alert.js");
const Folowers = require("../models/followers.js");
const dotenv = require("dotenv");

dotenv.config();
exports.searchStory = async (req: Request | any, res: Response) => {
  try {
    const Search = req.query.writer as string;
    const writers = await Users.find({
      username: { $regex: Search, $options: "i" },
      role: "writer",
    }).select("username profilePicture");
    const stories = await Story.find({
      idWriter: { $in: writers.map((w: any) => w._id) },
      finished: true,
      isPublic: true,
    });
    const folowers = await Folowers.findOne({ idUser: req.id });
    res
      .status(200)
      .json({ stories, writers, folowers: folowers ? folowers.folowers : [] });
  } catch (error) {
    return res.status(400).json({ message: "Invalid query parameter" });
  }
};
exports.getStory = async (req: Request | any, res: Response) => {
  try {
    const idStory = req.params.idStory;
    const story = await Story.findById(idStory);
    const ratings = await Rating.findOne({ idStory: idStory, idUser: req.id });
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    const idStart = story.start;
    const sceneStart = await Scene.findById(idStart);
    const user = await Users.findOne({ _id: req.id });
    const isFavourite = user.favourite.includes(idStory);
    res.status(200).json({
      story,
      scene: sceneStart,
      rating: ratings ? ratings.rating : 0.5,
      favourite: isFavourite,
    });
  } catch (error) {
    return res.status(400).json({ message: "Invalid query parameter" });
  }
};

exports.rateStory = async (req: Request | any, res: Response) => {
  try {
    const idStory = req.params.idStory;
    const idUser = req.id;
    const reader = await Users.findById(idUser);
    const { rating } = req.body;
    if (rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5" });
    }
    const story = await Story.findById(idStory);
    const writer = await Users.findById(story.idWriter);
    async function evalution() {
      const allStory = await Story.find({ idWriter: writer._id });

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

    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    const createAlert = async function (idWriter: string, Rating: number) {
      const newAlert = await new Alert({
        idReader: req.id,
        idWriter: idWriter,
        role: "reader",
        type: "newRating",
        title: "new Rating",
        body: ` بتقييم ${story.title}   ب  ${Rating} نجوم ${reader.username} لقد قام القارئ `,
      });
      newAlert.save();
    };
    const oldRating = await Rating.findOne({ idStory, idUser });
    if (oldRating) {
      oldRating.rating = rating;
      await oldRating.save();
      await createAlert(story.idWriter, rating);

      story.averageRating = Number(
        (
          (story.averageRating * (story.totalRatings - 1) + rating) /
          story.totalRatings
        ).toFixed(1),
      );
      await story.save();
      writer.evaluations = await evalution();
      await writer.save();
      return res.json({ message: "update rating success" });
    } else {
      const newRating = new Rating({ idStory, idUser, rating });
      await newRating.save();
      story.totalRatings += 1;
      story.averageRating = Number(
        (
          (story.averageRating * (story.totalRatings - 1) + rating) /
          story.totalRatings
        ).toFixed(1),
      );
      await story.save();
      await createAlert(story.idWriter, rating);

      writer.evaluations = await evalution();
      await writer.save();
      return res.status(201).json({ message: "Rating submitted successfully" });
    }
  } catch (error) {
    return res.status(400).json({ message: "Invalid query parameter" });
  }
};
exports.getTopStoriesRating = async (req: Request | any, res: Response) => {
  try {
    const topStories = await Story.find({ finished: true, isPublic: true })
      .sort({ averageRating: -1 })
      .limit(10);
    const writerIds = topStories.map((story: any) => story.idWriter);
    const writers = await Users.find({ _id: { $in: writerIds } }).select(
      "username profilePicture",
    );
    const folowers = await Folowers.findOne({ idUser: req.id });

    return res.status(200).json({
      stories: topStories,
      writers,
      folowers: folowers ? folowers.folowers : [],
    });
  } catch (e) {
    return res.status(400).json({ message: "Invalid query parameter" });
  }
};
exports.appendToFavourite = async (req: Request | any, res: Response) => {
  try {
    const idStory = req.params.idStory;
    const idUser = req.id;
    const user = await Users.findById(idUser);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.favourite.includes(idStory)) {
      user.favourite = user.favourite.filter((id: string) => id !== idStory);
      await user.save();
      return res.json({ message: "تم حذف القصة من المفضلة" });
    } else {
      user.favourite.push(idStory);
      await user.save();
      return res.json({ message: "تم إضافة القصة إلى المفضلة" });
    }
  } catch (e: any) {
    return res.json({
      message: "Error appending to favourite",
      error: e.message,
    });
  }
};
exports.getFavouriteStories = async (req: Request | any, res: Response) => {
  try {
    const idUser = req.id;
    const user = await Users.findById(idUser);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const favouriteStories = await Story.find({ _id: { $in: user.favourite } });
    res.status(200).json({ favourites: favouriteStories });
  } catch (e: any) {
    return res.json({
      message: "Error getting favourite stories",
      error: e.message,
    });
  }
};

exports.getScene = async (req: Request | any, res: Response) => {
  const idScene = req.params.idScene;
  const scene = await Scene.findById(idScene);
  if (!scene) {
    return res.status(404).json({ message: "Scene not found" });
  }
  res.status(200).json({ scene });
};
exports.folowers = async (req: Request | any, res: Response) => {
  try {
    const idWriter = req.params.idWriter;
    const idUser = req.id;
    const Writer = await Users.findById(idWriter);
    const reader = await Users.findById(idUser);
    const folowers = await Folowers.findOne({ idUser: idUser });
    const createAlert = async function (idWriter: string, follow: boolean) {
      const newAlert = await new Alert({
        idReader: req.id,
        idWriter: idWriter,
        role: "reader",
        type: "newFollow",
        title: "new Follow",
        body: `  ${follow ? "بمتابعتك" : "بالغاء متابعتك  "} ${reader.username} لقد قام القارئ  `,
      });
      newAlert.save();
    };
    if (!folowers) {
      const newFolowers = new Folowers({
        idUser: idUser,
        folowers: [idWriter],
      });
      await newFolowers.save();
      await createAlert(idWriter, true);
      return res
        .status(200)
        .json({ message: "تم متابعة الكاتب", action: "follow" });
    } else {
      if (folowers.folowers.includes(idWriter)) {
        folowers.folowers = folowers.folowers.filter(
          (id: string) => id !== idWriter,
        );
        await folowers.save();

        return res
          .status(200)
          .json({ message: "تم إلغاء متابعة الكاتب", action: "unfollow" });
      } else {
        folowers.folowers.push(idWriter);
        await folowers.save();
        await createAlert(idWriter, true);

        return res
          .status(200)
          .json({ message: "تم متابعة الكاتب", action: "follow" });
      }
    }
  } catch (e) {
    res.status(404).json({ message: e });
  }
};
exports.getMyStory = async (req: Request | any, res: Response) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";
    const browser = await puppeteer.launch({
      executablePath:
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    });
    const page = await browser.newPage();
    const scenes = await Scene.find({ _id: { $in: req.body.myScene } }).sort({
      createdAt: 1,
    });
    const story = await Story.findById(scenes[0]?.idStory);

    const writer = await Users.findById(story.idWriter);
    await page.setContent(PDF(scenes, writer.username, story.Image));
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });
    await browser.close();
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=my_story.pdf",
    });
    res.send(pdfBuffer);
  } catch (e) {
    res.status(400).json({ message: e });
  }
};

exports.getstoryAll = async (req: Request | any, res: Response) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";
    const browser =  isProduction
      ? await puppeteer.connect({
          browserWSEndpoint: "wss://chrome.browserless.io?token=" + process.env.BROWSERLESS_TOKEN,
        })
        :await puppeteer.launch({
          executablePath:
            "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        });
    const page = await browser.newPage();
    const scenes = await Scene.find({ idStory: req.params.idstory }).sort({
      createdAt: 1,
    });
    const story = await Story.findById(req.params.idstory);

    const writer = await Users.findById(story.idWriter);
    await page.setContent(PDF(scenes, writer.username, story.Image));
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });
    await browser.close();
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=my_story.pdf",
    });
    res.send(pdfBuffer);
  } catch (e) {
    console.log(e);
    res.json({ message: e });
  }
};

const mongoose = require("mongoose");
const sceneSchema = new mongoose.Schema({
  idStory: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String },
  choices: { type: Array, default: [] },
  isEnd: { type: Boolean, default: false },
  numberOfScene: { type: Number },
},  { timestamps: true },
);
const Scene = mongoose.model("Scene", sceneSchema);
module.exports = Scene;

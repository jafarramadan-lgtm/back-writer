const mongoose = require("mongoose");
const storiesSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  keywords: { type: String, required: true },
  isPublic: { type: Boolean, default: false },
  useAI: { type: Boolean, default: false },
  idWriter: { type: String, required: true },
  nameWriter: { type: String, required: true },
  finished: { type: Boolean, default: false },
  start: { type: String },
  Image: { type: String, default: "" },
  averageRating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
});
const Story = mongoose.model("Story", storiesSchema);
module.exports = Story;

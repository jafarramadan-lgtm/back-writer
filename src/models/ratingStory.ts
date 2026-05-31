const mongoose = require("mongoose");
const ratingSchema = new mongoose.Schema({
  idStory: { type: String, required: true },
  idUser: { type: String, required: true },
  rating: { type: Number, required: true },
});
const Rating = mongoose.model("Rating", ratingSchema);
module.exports = Rating;

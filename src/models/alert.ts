const { mongoose } = require("mongoose");
const alertSchema = new mongoose.Schema(
  {
    idReader: { type: String, ref: "Users" },
    idWriter: { type: String, ref: "Users" },
    role: { type: String },
    type: { type: String, enum: ["newRating", "newFollow", "newStory"] },
    title: { type: String },
    body: { type: String },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);
alertSchema.index({ idUser: 1, isRead: 1, createdAt: -1 });
module.exports = mongoose.model("Alert", alertSchema);

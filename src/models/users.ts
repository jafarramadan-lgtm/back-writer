const mongoose = require("mongoose");
const usersSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "reader" },
  profilePicture: { type: String, default: "" },
  profilePictureId: { type: String, default: "" },
  stories: { type: Number, default: 0 },
  storieslife:{ type: Number, default: 0 },
  evaluations: { type: Number, default: 0 },
  favourite:{ type: [String], default: [] },
});
const User = mongoose.model("User", usersSchema);
module.exports = User;

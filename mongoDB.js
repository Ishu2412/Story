import mongoose from "mongoose";

const storySchema = new mongoose.Schema({
  story: String,
  images: [String],
});

const userSchema = new mongoose.Schema({
  name: String,
  password: String,
  age: Number,
  gender: String,
  country: String,
  email: String,
  interestedGenre: [String],
  publishedStories: [storySchema],
});

const UserData = mongoose.model("UserData", userSchema);

export { UserData };

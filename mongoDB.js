import mongoose from "mongoose";

const storySchema = new mongoose.Schema({
  story: String,
  images: [String],
  videos: [String],
  audio: [String],
  likes: Number,
  genre: String,
  aigenerated: Boolean,
  writer: String,
});

const userSchema = new mongoose.Schema({
  name: String,
  password: String,
  age: Number,
  gender: String,
  country: String,
  email: String,
  publicImage: String,
  dashboardBars: [Number, Number, Number, Number, Number],
  publishedStories: [storySchema],
  seenStories: [],
  isWriter: Boolean,
});

const UserData = mongoose.model("UserData", userSchema);
const StoryData = mongoose.model("StoryData", storySchema);

export { UserData, StoryData };

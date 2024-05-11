import express from "express";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import env from "dotenv";
import cors from "cors";
import {
  connect,
  closeConnection,
  registerUser,
  addUser,
  getGenAge,
  findUser,
  saveStory,
  findStories,
} from "./mongoMethods.js";
import { storyGenerator } from "./llm.js";

const app = express();
const port = process.env.PORT || 3000;
const saltRounds = 10;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
env.config();

connect();

app.get("/", (req, res) => {
  res.status(200).send("Hello");
});

// new registration
app.post("/register", async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const data = {
      email,
      password,
    };
    const check = await findUser(data);
    console.log(email);
    console.log(password);

    //if user already exists
    if (check) {
      console.log(check);
      res.status(409).send(`User already exists. Try loggin in.`);
    } else {
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.log(`Error while hashing the password ${err}`);
        } else {
          const user = {
            email: email,
            password: hash,
          };
          await registerUser(user);
          res.status(200).send("registered");
        }
      });
    }
  } catch (err) {
    console.error(`Error while registering the user: ${err}`);
    res.status(500).send(`Internal server error`);
  }
});

app.post("/login", async (req, res) => {
  try {
    const data = {
      email: req.body.email,
      password: req.body.password,
    };
    const user = await findUser(data);
    if (user) {
      const storedHashedPassword = user.password;
      bcrypt.compare(data.password, storedHashedPassword, (err, result) => {
        if (err) {
          res.status(500).send(`Error while Authorizing`);
        } else {
          if (result) {
            res.status(200).send("logined");
          } else {
            res.status(401).send(`Password not match`);
          }
        }
      });
    } else {
      res.status(401).send(`User not found`);
    }
  } catch {
    res.status(500).send(`Internal Server Error`);
  }
});

// add new user
app.post("/addUser", async (req, res) => {
  try {
    const data = {
      email: req.body.email,
      name: req.body.name,
      age: req.body.age,
      gender: req.body.gender,
      country: req.body.country,
      publicImage: req.body.publicImage,
    };
    await addUser(data);
    res.status(200).send("User added");
  } catch (err) {
    console.log(`Error while adding user - ${err}`);
    res.status(500).send(`Internal Server Error`);
  }
});

// getting profile of the user
app.post("/profile", async (req, res) => {
  try {
    const email = req.body.email;
    const data = { email: email };
    const user = await findUser(data);
    res.status(200).json(user);
  } catch (err) {
    console.log(`Error while getting profile ${err}`);
    res.status(500).send(`Internal server error`);
  }
});

//generate story through AI
app.post("/storyai", async (req, res) => {
  try {
    const email = req.body.email;
    const { gender, age } = await getGenAge(email);
    //provide genre or character like action or kindness
    const genre = req.body.genre;
    const language = req.body.language;
    const prompt = `Write a story of ${genre} for age group of ${age} for ${gender} in ${language} language`;
    const story = await storyGenerator(prompt);
    const data = {
      story: story,
      likes: 0,
      aigenerated: true,
      genre: genre,
    };
    await saveStory(data);
    res.status(200).json(story);
  } catch (err) {
    console.log(`Error while generating story ${err}`);
    res.status(500).send(`Internal server error`);
  }
});

//publishing user stories
app.post("/publish", async (req, res) => {
  try {
    const email = req.body.email;
    const data = {
      story: req.body.story,
      images: req.body.images,
      videos: req.body.videos,
      audio: req.body.audio,
      genre: req.body.genre,
      likes: 0,
      aigenerated: false,
      writer: email,
    };
    await saveStory(data);
    res.status(200).send(`Story saved`);
  } catch (err) {
    console.log(`Internal server error`);
    res.status(500).send(`Internal server error`);
  }
});

//getting stories on the basis of genre
app.post("/get-stories", async (req, res) => {
  try {
    const genre = req.body.genre;
    const stories = await findStories(genre);
    res.status(200).json(stories);
  } catch (err) {
    console.log(`Error while getting stories ${err}`);
    res.status(500).send(`Internal server error`);
  }
});

//verifying user as writer
app.post("/verify", async (req, res) => {
  try {
    const email = req.body.email;
    const user = await findUser(email);
    user.isWriter = true;
    await user.save();
  } catch (err) {
    console.log(`Error while verifying the user ${err}`);
    res.status(500).send(`Internal server error`);
  }
});

//check verificatoin of user for writer
app.post("/is-verified", async (req, res) => {
  try {
    const email = req.body.email;
    const user = await findUser(email);
    if (user.isWriter) {
      res.status(200).send(`Verified`);
    } else {
      res.status(401).send(`Not verified`);
    }
  } catch (err) {
    console.log(`Error while verifying the user ${err}`);
    res.status(500).send(`Internal server error`);
  }
});

app.post("/generate-quiz", async (req, res) => {
  try {
    const story = req.body.story;
    const genre = req.body.genre;
    const prompt = `Write a quiz based on the story for checking did the child get the moral for ${genre}: ${story}`;
    const quiz = await storyGenerator(prompt);
  } catch (err) {
    console.log(`Error while generating the quiz ${err}`);
    res.status(500).send(`Internal server error`);
  }
});

app.listen(port, (req, res) => {
  console.log(`Server is running at port ${port}`);
});

process.on("SIGINT", () => {
  closeConnection();
  process.exit();
});

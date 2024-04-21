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
    const check = await findUser(email);
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
    };
    await addUser(data);
  } catch (err) {
    console.log(`Error while adding user - ${err}`);
    res.status(500).send(`Internal Server Error`);
  }
});

//generate story
app.post("/story", async (req, res) => {
  try {
    const email = req.body.email;
    const { gender, age } = await getGenAge(email);
    //provide genre or character like action or kindness
    const genre = req.body.genre;
    const prompt = `Write a story of ${genre} for age group ${age} for ${gender}`;
    const story = await storyGenerator(prompt);
    res.status(200).json(story);
  } catch (err) {
    console.log(`Error while generating story ${err}`);
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

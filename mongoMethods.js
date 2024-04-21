import { UserData } from "./mongoDB.js";
import mongoose from "mongoose";

const uri =
  "mongodb+srv://ishu:lNwKH7FlCS8wwZBx@cluster0.bbugwp2.mongodb.net/?retryWrites=true&w=majority";

async function connect() {
  try {
    mongoose.connect(uri);
    console.log("Connected to Database");
  } catch (err) {
    console.error(`Error in connecting to Database${err}`);
  }
}

async function closeConnection() {
  try {
    mongoose.connection.close();
    console.log("Disconnected");
  } catch (err) {
    console.error(`Error while disconnecting ${err}`);
  }
}

async function registerUser(data) {
  try {
    const user = new UserData(data);
    await user.save();
    console.log(`User saved`);
  } catch (err) {
    console.log(`Error while registering the user`);
  }
}

async function addUser(data) {
  try {
    const user = await UserData.findOne({ email: data.email });
    if (user) {
      user.gender = data.gender;
      user.age = data.age;
      user.name = data.name;
      await user.save();
      console.log("User data updated:", user);
    } else {
      console.log("User not found");
    }
  } catch (err) {
    console.log(`Error while adding the user ${err}`);
  }
}

// async function addUser(data) {
//   try {
//     const user = new AuthorizationData(data);
//     await user.save();
//     console.log(data);
//   } catch (err) {
//     console.error(`Error while adding new user ${err}`);
//   }
// }

async function getGenAge(email) {
  try {
    const user = await UserData.findOne({ email: email });
    return { gender: user.gender, age: user.age };
  } catch (err) {
    console.log(`Error while getting age from db.`);
  }
}

async function findUser(email) {
  try {
    const user = await UserData.findOne({ email: email });
    if (user) return user;
    else return user;
  } catch (err) {
    console.log(`Error while finding the user`);
    return null;
  }
}

export { connect, closeConnection, addUser, getGenAge, findUser, registerUser };

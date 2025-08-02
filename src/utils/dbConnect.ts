import mongoose from "mongoose";
const MONGO_URI = process.env.MONGO_URI!;
export default async function dbConnect() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected!");
  } catch (err) {
    console.log(err);
  }
}

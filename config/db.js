require("dotenv").config();
const mongoose = require("mongoose");

function connectDB() {
  //DataBase Connection
  mongoose.connect(process.env.MONGO_CONNECTION_URL);

  const connection = mongoose.connection;

  connection
    .once("open", () => {
      console.log("Database Connected");
    })
    .on("error", (err) => {
      console.log("connection Failed");
    });
}

module.exports = connectDB;

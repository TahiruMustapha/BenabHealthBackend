const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI);

const connection = mongoose.connection;
connection.on("connected", () => {
  console.log("MongoDb connected successfully!!!");
});
connection.on("error", (error) => {
  console.log("Error connecting MongoDb!", error);
});
module.exports = mongoose;

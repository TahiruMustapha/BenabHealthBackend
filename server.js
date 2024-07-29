const express = require("express");
const dotenv = require("dotenv").config();
const dbConfig = require("./config/dbConfig");
const userRoute = require("./route/userRoute");
const app = express();
app.use(express.json());
app.use("/api/user", userRoute);

const port = process.env.PORT || 8000;
app.listen(port, () => console.log(`Server started on port   ${port}!`));

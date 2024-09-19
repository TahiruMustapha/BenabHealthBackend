const express = require("express");
const dotenv = require("dotenv").config();
const dbConfig = require("./config/dbConfig");
const userRoute = require("./route/userRoute");
const cors = require('cors')
const app = express();
app.use(cors({
    origin: 'https://benabhealth.netlify.app', // Update with your React app URL
  }));
app.use(express.json());
app.use("/api/user", userRoute);

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server started on port   ${port}!`));

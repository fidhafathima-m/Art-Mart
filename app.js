const express = require("express");
const env = require("dotenv").config();
const db = require('./config/db');

db()
const app = express();

app.listen(process.env.PORT, () => {
  console.log(`Server listening to port ${process.env.PORT}`);
});

module.exports = app;

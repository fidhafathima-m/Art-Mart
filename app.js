const express = require("express");
const env = require("dotenv").config();
const path = require('path');
const session = require('express-session');

// custom
const db = require('./config/db');
const userRoute = require('./routes/userRouter');
const passport = require('./config/passport');

db()
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session 
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 72 * 60 * 60 * 1000 // 72 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Prevent caching
app.use((req, res, next) => {
  res.set('cache-control', 'no-store');
  next();
});

// Set view engine and static files
app.set('view engine', 'ejs');
app.set('views', [path.join(__dirname, 'views/user'), path.join(__dirname, 'views/admin')]);
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', userRoute);

// Start server
app.listen(process.env.PORT, () => {
  console.log(`Server listening to port ${process.env.PORT}`);
});

module.exports = app;

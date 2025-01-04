const User = require("../../models/userSchema");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const env = require("dotenv").config();
const bcrypt = require("bcrypt");

// generate OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// verification mail
const sendVeificationMail = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.NODEMAILER_EMAIL,
      to: email,
      subject: "Password Reset Request",
      text: `Your otp is ${otp}`,
      html: `<b><h4>Your OTP: ${otp}</h4><br></b>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: ", info.messageId);
    return true;
  } catch (error) {
    console.log("Error sending mail", error);
    return false;
  }
};

//securing password
const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.error("Error in hashing");
  }
};

const getForgetPass = async (req, res) => {
  try {
    res.render("forgot-password");
  } catch (error) {
    res.redirect("/pageNotFound");
  }
};

const forgotPassValid = async (req, res) => {
  try {
    const { email } = req.body;
    const findUser = await User.findOne({ email: email });

    if (findUser) {
      const otp = generateOtp();
      const emailSent = await sendVeificationMail(email, otp);

      if (emailSent) {
        req.session.otp = otp;
        req.session.email = email;
        res.render("forgotPassOtp");
        console.log("OTP: ", otp);
      } else {
        res.json({
          success: false,
          message: "Failed to send OTP, please try again",
        });
      }
    } else {
      res.render("forgot-password", {
        message: "User with this email does not exists.",
      });
    }
  } catch (error) {
    res.redirect("/pageNotFound");
  }
};

const verifyForgetPassOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    // console.log('Received OTP:', otp);
    // console.log('Stored OTP in session:', req.session.otp);

    if (otp === req.session.otp) {
      res.json({ success: true, redirectUrl: "/reset-password" });
    } else {
      res.status(400).json({ success: false, message: "OTP doesn't match" });
    }
  } catch (error) {
    console.error("Error verifying OTP", error);
    res.status(500).json({ success: false, message: "An error occured." });
  }
};

const resendForgetPassOtp = async (req, res) => {
  try {
    const otp = generateOtp();
    req.session.otp = otp;
    const email = req.session.email;
    console.log("Resending OTP to mail: ", email);
    const emailSent = sendVeificationMail(email, otp);

    if (emailSent) {
      console.log("Resent OTP: ", otp);
      res
        .status(200)
        .json({ success: true, message: "OTP Resent Successfully" });
    }
  } catch (error) {
    console.error("Error resending OTP", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const resetPasswordLoad = async (req, res) => {
  try {
    res.render("reset-password");
  } catch (error) {
    res.redirect("/pageNotFound");
  }
};

const resetPassword = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;
    const email = req.session.email;
    if (password === confirmPassword) {
      const passwordHashh = await securePassword(password);
      await User.updateOne({ email: email }, { password: passwordHashh });
      res.redirect("/login");
    } else {
      res.render("reset-password", { message: "Passwords does't match" });
    }
  } catch (error) {
    res.redirect("/pageNotFound");
  }
};

const loadUserProfile = async(req, res)=> {
  try {
    const userId = req.session.user;
    const userData = await User.findOne({_id: userId});
    if(userData) {
      res.render('profile', {user: userData, currentPage: '/userProfile'});
    } else {
      res.redirect('/login');
    }

  } catch (error) {
    console.log('Error in loading user profile', error);
    res.redirect('/pageNotFound');
  }
}

const loadChangeEmail = async(req, res) => {
  try {
    res.render('change-email');
  } catch (error) {
    console.log('Error in changing email');
    res.redirect('/userProfile');  
  }
}

const changeEmail = async(req, res) => {
  try {
    
    const {currentEmail} = req.body;
    const userExists = await User.findOne({email: currentEmail});
    if (userExists) {
      const otp = generateOtp();
      const emailSent = await sendVeificationMail(currentEmail, otp);

      if(emailSent) {
        req.session.userOtp = otp;
        req.session.userData = req.body;
        req.session.email = currentEmail;
        res.render('change-email-otp');
        console.log('Email sent: ', currentEmail);
        console.log('otp: ', otp);
      } else{
        cosnole.log('Email error')
      } 
    } else {
      res.render('change-email', {message: 'User with this mail doesn\'t exists'});
    }

  } catch (error) {
    console.log('error', error);
    res.redirect('/pageNotFound');
  }
}

const verifyEmailOtp = async(req, res) => {
  try {
    const { otp } = req.body;
    const sessionOtp = req.session.userOtp;
    console.log('Entered otp: ', otp)
    console.log('session otp: ', sessionOtp);
    console.log('user data: ', req.session.userData);

    // Ensure both OTPs are strings and trimmed of any leading/trailing spaces
    if (otp.trim() === sessionOtp.trim()) {
      req.session.userData = req.body.userData;
      res.render('new-email', {
        userData: req.session.userData
      });
    } else {
      res.render('change-email-otp', {
        message: "OTP not matching",
        userData: req.session.userData
      });
    }
  } catch (error) {
    console.log('error:', error);
    res.redirect('/pageNotFound');
  }
};


module.exports = {
  getForgetPass,
  forgotPassValid,
  verifyForgetPassOtp,
  resendForgetPassOtp,
  resetPasswordLoad,
  resetPassword,
  loadUserProfile,
  loadChangeEmail,
  changeEmail,
  verifyEmailOtp
};

const User = require('../../models/userSchema');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const env = require('dotenv').config();
const bcrypt = require('bcrypt');

// generate OTP
const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// verification mail
const sendVeificationMail = async (email, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            }
        });

        const info = await transporter.sendMail({
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: 'Verify your account',
            text: `Your otp is ${otp}`,
            html: `<b>Your OTP: ${otp}</b>`
        });

        return info.accepted.length > 0;

    } catch (error) {
        console.log('Error sending mail', error);
        throw new Error('Failed to send verification email');
    }
}

// securing password
const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.error('Error in hashing');
        throw new Error('Failed to secure password');
    }
}

const pageNotFound = async (req, res) => {
    try {
        res.render('page-404');
    } catch (error) {
        console.log('Error loading 404 page', error);
        res.status(500).send('Internal Server Error: Unable to load page.');
    }
}

const loadHomePage = async (req, res) => {
    try {
        const user = req.session.user; 

        if (user) {
            const userData = await User.findOne({ _id: user });

            if (userData) {
                res.locals.user = userData;
                res.render('home', { user: userData });
            } else {
                console.log('No user found with that ID');
                res.render('home');
            }
        } else {
            res.render('home');
        }
    } catch (error) {
        console.log('Error loading home page', error);
        res.status(500).send('Internal Server Error: Unable to load home page.');
    }
};

const loadSignUp = async (req, res) => {
    try {
        res.render('signup');
    } catch (error) {
        console.log('Error loading sign-up page', error);
        res.status(500).send('Internal Server Error: Unable to load sign-up page.');
    }
}

const loadShopping = async (req, res) => {
    try {
        res.render('shop');
    } catch (error) {
        console.log('Error loading shopping page', error);
        res.status(500).send('Internal Server Error: Unable to load shopping page.');
    }
}

const signUp = async (req, res) => {
    try {
        const {name, phone, email, password, confirm_password} = req.body;

        if(password !== confirm_password) {
            return res.render('signup', {message: 'Passwords do not match'});
        }

        const findUser = await User.findOne({email});
        if(findUser) {
            return res.render('signup', {message: 'User with this email exists'});
        }

        const otp = generateOtp();
        const sendOtp = sendVeificationMail(email, otp);

        if(!sendOtp) {
            return res.json('email-error');
        }

        req.session.userOtp = otp;
        req.session.userData = {name, phone, email, password};

        res.render('verify-otp');
        console.log('OTP sent', otp);

    } catch (error) {
        console.error('Error during signup', error);
        res.status(500).send('Internal Server Error: Failed to complete signup.');
    }
}

const verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;  
        console.log('Received OTP:', otp);
        console.log('Stored OTP in session:', req.session.userOtp);

        if(otp === req.session.userOtp) {
            const user = req.session.userData;
            const passwordHashed = await securePassword(user.password);

            const saveUser = new User({
                name: user.name,
                email: user.email,
                phone: user.phone,
                password: passwordHashed
            });

            await saveUser.save();
            req.session.user = saveUser._id;
            res.json({success: true, redirectUrl: '/'});
        } else {
            res.status(400).json({success: false, message: 'Invalid OTP, Please try again.'})
        }

    } catch (error) {
        console.error('Error verifying OTP', error);
        res.status(500).json({success: false, message: 'Internal Server Error: Unable to verify OTP.'});
    }
}

const resendOtp = async (req, res) => {
    try {
        if (!req.session.userData || !req.session.userData.email) {
            return res.status(400).json({ success: false, message: 'Email not found in session' });
        }

        const { email } = req.session.userData;

        const otp = generateOtp();
        req.session.userOtp = otp; 

        const emailSent = await sendVeificationMail(email, otp);

        if (emailSent) {
            console.log('Resent OTP:', otp);
            res.status(200).json({ success: true, message: 'OTP resent successfully' });
        } else {
            res.status(400).json({ success: false, message: 'Failed to resend OTP, please try again' });
        }

    } catch (error) {
        console.error('Error resending OTP:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error: Failed to resend OTP' });
    }
};

const loadLogin = async (req, res) => {
    try {
        if(!req.session.user) {
            return res.render('login');
        } else {
            res.redirect('/')
        }

    } catch (error) {
        console.log('Error loading login page', error);
        res.status(500).send('Internal Server Error: Unable to load login page.');
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const findUser = await User.findOne({ isAdmin: 0, email: email });

        if (!findUser) {
            return res.render('login', { message: 'User not found' });
        }

        if (findUser.isBlocked) {
            return res.render('login', { message: 'User blocked by admin' });
        }

        if (!findUser.password) {
            return res.render('login', { message: 'Password is missing or corrupted' });
        }

        const passMatch = await bcrypt.compare(password, findUser.password);

        if (!passMatch) {
            return res.render('login', { message: 'Incorrect Password' });
        }

        req.session.user = findUser._id;
        req.session.save((err) => {
            if (err) {
                console.log("Session save error", err);
            }
            console.log("Session saved after login");
        });
        // console.log('Session after login:', req.session);
        res.redirect('/');

    } catch (error) {
        console.error('Login error', error);
        res.status(500).render('login', { message: 'Internal Server Error: Login failed. Please try again later.' });
    }
};

const logout = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if(err) {
                console.log('Session destruction error', err.message);
                return res.status(500).redirect('/pageNotFound');
            } 
            return res.redirect('/');
        });

    } catch (error) {
        console.log('Log out error', error);
        res.status(500).redirect('/pageNotFound');
    }
}

module.exports = {
    loadHomePage,
    pageNotFound,
    loadSignUp,
    loadShopping,
    signUp,
    verifyOtp,
    resendOtp,
    loadLogin,
    login,
    logout
}

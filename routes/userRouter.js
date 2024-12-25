const express = require('express');
const router = express.Router();
const userController = require('../controllers/user/userController');
const passport = require('passport');

router.get('/pageNotFound', userController.pageNotFound);
router.get('/', userController.loadHomePage);

//signup
router.get('/signup', userController.loadSignUp);
router.post('/signup', userController.signUp);
router.post('/verify-otp', userController.verifyOtp);
router.post('/resend-otp', userController.resendOtp);
// google signup routes
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback', passport.authenticate('google', {
    failureRedirect: '/signup'
}), (req, res) => {
    console.log('Authenticated user:', req.user);  // For debugging
    req.session.user = req.user._id;
    res.redirect('/');
});

router.get('/login', userController.loadLogin);
router.post('/login', userController.login);

router.get('/shop', userController.loadShopping);

router.get('/logout', userController.logout);


module.exports = router;
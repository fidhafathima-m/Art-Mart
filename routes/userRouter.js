const express = require("express");
const router = express.Router();
const userController = require("../controllers/user/userController");
const profileController = require("../controllers/user/profileController");
const productController = require("../controllers/user/productController");
const userAuth = require("../middlewares/auth");
const passport = require("passport");

router.get("/pageNotFound", userController.pageNotFound);
router.get("/", userController.loadHomePage);

//signup
router.get("/signup", userAuth.isLogout, userController.loadSignUp);
router.post("/signup", userController.signUp);
router.post("/verify-otp", userController.verifyOtp);
router.post("/resend-otp", userController.resendOtp);
// google signup routes
router.get(
  "/auth/google",
  userAuth.isLogout,
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/auth/google/callback",
  userAuth.isLogout,
  passport.authenticate("google", {
    failureRedirect: "/signup",
  }),
  (req, res) => {
    console.log("Authenticated user:", req.user); // For debugging
    req.session.user = req.user._id;
    res.redirect("/");
  }
);

router.get("/login", userAuth.isLogout, userController.loadLogin);
router.post("/login", userController.login);

// Shopping page
router.get("/shop", userController.loadShopping);
router.get("/filter", userController.filterProduct);
router.get("/filterPrice", userController.filterByPrice);
router.get("/search", userController.searchProducts);

router.get("/logout", userController.logout);

// profile management
router.get(
  "/forgot-password",
  userAuth.isLogout,
  profileController.getForgetPass
);
router.post("/forgot-pass-valid", profileController.forgotPassValid);
router.post("/verify-forgotPassOtp", profileController.verifyForgetPassOtp);
router.post("/resend-forgot-otp", profileController.resendForgetPassOtp);
router.get(
  "/reset-password",
  profileController.resetPasswordLoad
);
router.post("/reset-password", profileController.resetPassword);
router.get('/userProfile', profileController.loadUserProfile);
router.get('/profile/change-email', profileController.loadChangeEmail);
router.post('/profile/change-email', profileController.changeEmail);
router.post('/profile/verify-email-otp', profileController.verifyEmailOtp);
router.get('/profile/new-email', profileController.loadNewMail);
router.post('/profile/update-email', profileController.updateEmail);
router.get('/profile/change-password', profileController.loadEmailPageforPassChange);
router.post('/profile/change-password', profileController.changePassValid);
router.post('/profile/verify-pass-otp', profileController.verifyChangePassOtp);

//address management
router.get('/profile/address/add', profileController.loadAddAddress);
router.post('/profile/address/addAddress', profileController.addAddress);
router.get('/profile/address/edit', profileController.loadEditAddress);
router.post('/profile/address/edit', profileController.editAddress);
router.get('/profile/address/delete', profileController.deleteAddress);

// Product Managemrnt
router.get("/product-details", productController.loadProductDetails);

// Cart management
router.get("/cart", productController.loadCart);
router.get('/addToCart', productController.addToCart);
router.post('/update-cart', productController.updateCartQuantity);

module.exports = router;

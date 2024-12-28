const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin/adminController");
const adminProfileController = require('../controllers/admin/adminProfileController');
const adminAuth = require('../middlewares/adminAuth');
const customerController = require("../controllers/admin/customerController");
const categoryController = require('../controllers/admin/categoryController');

router.get("/pageError", adminController.pageError);
router.get("/login", adminAuth.isLogout, adminController.loadLogin);
router.post("/login", adminController.login);

// profile management
router.get('/forgot-password',adminAuth.isLogout, adminProfileController.getForgetPass);
router.post('/forgot-pass-valid', adminProfileController.forgotPassValid);
router.post('/verify-forgotPassOtp', adminProfileController.verifyForgetPassOtp);
router.post('/resend-forgot-otp', adminProfileController.resendForgetPassOtp);
router.get('/reset-password',adminAuth.isLogout, adminProfileController.resetPasswordLoad);
router.post('/reset-password', adminProfileController.resetPassword);

router.get("/", adminController.loadDashboard);
router.get("/logout", adminController.logout);

// Customer management

router.get("/users", adminAuth.isLogin, customerController.customerInfo);
router.get("/blockCustomer", adminAuth.isLogin, customerController.customerBlocked);
router.get("/unblockCustomer", adminAuth.isLogin, customerController.customerUnblocked);

//Category Management

router.get('/categories', adminAuth.isLogin,  categoryController.categoryInfo);
router.get('/listCategory', adminAuth.isLogin, categoryController.getListCategory);
router.get('/unlistCategory', adminAuth.isLogin, categoryController.getUnlistCategory);
router.get('/add-category', adminAuth.isLogin,  categoryController.loadAddCategory);
router.post('/add-category',  categoryController.addCategory);
router.get('/edit-category', adminAuth.isLogin,  categoryController.loadEditCategory);
router.post('/edit-category/:id',  categoryController.editCategory);
router.delete('/delete-category/:id',  categoryController.deleteCategory);

module.exports = router;

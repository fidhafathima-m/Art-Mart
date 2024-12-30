const express = require("express");
const multer = require('multer');
const path = require('path');
const router = express.Router();
const adminController = require("../controllers/admin/adminController");
const adminProfileController = require('../controllers/admin/adminProfileController');
const adminAuth = require('../middlewares/adminAuth');
const customerController = require("../controllers/admin/customerController");
const categoryController = require('../controllers/admin/categoryController');
const productController = require('../controllers/admin/productController');

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
router.post("/blockCustomer", adminAuth.isLogin, customerController.customerBlocked);
router.post("/unblockCustomer", adminAuth.isLogin, customerController.customerUnblocked);

//Category Management

router.get('/categories', adminAuth.isLogin,  categoryController.categoryInfo);
router.get('/listCategory', adminAuth.isLogin, categoryController.getListCategory);
router.get('/unlistCategory', adminAuth.isLogin, categoryController.getUnlistCategory);
router.get('/add-category', adminAuth.isLogin,  categoryController.loadAddCategory);
router.post('/add-category',  categoryController.addCategory);
router.get('/edit-category', adminAuth.isLogin,  categoryController.loadEditCategory);
router.post('/edit-category/:id',  categoryController.editCategory);
router.delete('/delete-category/:id',  categoryController.deleteCategory);

//Product Management


// Set storage options
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/product-images/'); // Specify the folder to store uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Give the file a unique name
    }
});

// Initialize multer with the storage configuration
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit to 5 MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});



router.get('/products', adminAuth.isLogin,  productController.productInfo);
router.get('/add-product', adminAuth.isLogin,  productController.loadAddProduct);
router.post('/add-product', adminAuth.isLogin,upload.array("images", 3),  productController.addProduct);
router.get('/edit-product', adminAuth.isLogin,  productController.loadEditProduct);
router.delete('/delete-product/:id',  productController.deleteProduct);



module.exports = router;

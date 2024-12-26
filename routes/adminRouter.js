const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin/adminController");
const customerController = require("../controllers/admin/customerController");
const categoryController = require('../controllers/admin/categoryController');
const { userAuth, adminAuth } = require("../middlewares/auth");

router.get("/pageError", adminController.pageError);
router.get("/login", adminController.loadLogin);
router.post("/login", adminController.login);

router.get("/", adminAuth, adminController.loadDashboard);
router.get("/logout", adminController.logout);

// Customer management

router.get("/users", adminAuth, customerController.customerInfo);
router.get("/blockCustomer", adminAuth, customerController.customerBlocked);
router.get("/unblockCustomer", adminAuth, customerController.customerUnblocked);

//Category Management

router.get('/categories', adminAuth, categoryController.categoryInfo);
router.get('/add-category', adminAuth, categoryController.loadAddCategory);
router.post('/add-category', adminAuth, categoryController.addCategory);
router.get('/edit-category', adminAuth, categoryController.loadEditCategory);
router.post('/edit-category/:id', adminAuth, categoryController.editCategory);
router.delete('/delete-category/:id', adminAuth, categoryController.deleteCategory);

module.exports = router;

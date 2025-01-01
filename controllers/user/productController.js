const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const User = require('../../models/userSchema');
const Coupon = require('../../models/couponSchema');


const loadProductDetails = async(req, res) => {
    try {
        
        const userId = req.session.user;
        const userData = await User.findById(userId);
        const productId = req.query.id;
        const product = await Product.findById(productId).populate('category');
        const category = product.category;
        const couponData = await Coupon.find({isList: true});
        res.render('product-details', {
            user: userData,
            products: product,
            category: category,
            quantity: product.quantity,
            coupons: couponData
        });

    } catch (error) {
        console.log(error);
        res.redirect('/pageNotFound');
    }
}

module.exports = {
    loadProductDetails
}
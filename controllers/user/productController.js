const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const User = require('../../models/userSchema');
const Coupon = require('../../models/couponSchema');
const Review = require('../../models/reviewSchema');
const mongoose = require('mongoose');


const loadProductDetails = async(req, res) => {
    try {
        
        const userId = req.session.user;
        const userData = await User.findById(userId);
        const productId = req.query.id;
        const product = await Product.findById(productId).populate('category');
        const category = product.category;
        const couponData = await Coupon.find({isList: true});

         // Define a price range tolerance (e.g., ±20% of the product's price)
            const priceLowerBound = product.salePrice - (product.salePrice * 0.20); // 20% less than the sale price
            const priceUpperBound = product.salePrice + (product.salePrice * 0.20); // 20% more than the sale price

            // Get related products based on the same category and within the price range (excluding the current product)
            const relatedProducts = await Product.find({
            category: product.category._id, // Same category
            salePrice: { $gte: priceLowerBound, $lte: priceUpperBound }, // Price range
            _id: { $ne: product._id }, // Exclude the current product
            isBlocked: false,
            isDeleted: false
            }).limit(4); // Limit the number of related products to 4

            const relatedProductIds = relatedProducts.map(product => product._id);

             // Get some random products (excluding the current product)
    const randomProducts = await Product.aggregate([
        { 
            $match: { 
              _id: { $nin: relatedProductIds }, // Exclude related products
              isBlocked: false, // Exclude blocked products
              isDeleted: false // Exclude deleted products
            } 
          },
          { 
            $sample: { size: 4 } // Randomly pick 4 products
          }
      ]);

      const reviews = await Review.find({ product_id: productId })
            .populate('user_id', 'name')
            .sort({ review_date: -1 });  
        // Calculate average rating
        const averageRating = await Review.aggregate([
            { $match: { product_id: new mongoose.Types.ObjectId(productId) } },
            { $group: { _id: null, avgRating: { $avg: '$rating' } } }
        ]);
        const avgRating = averageRating.length > 0 ? averageRating[0].avgRating : 0;

        res.render('product-details', {
            user: userData,
            products: product,
            category: category,
            quantity: product.quantity,
            coupons: couponData,
            relatedProducts: relatedProducts,
            randomProducts: randomProducts,
            reviews: reviews,
            avgRating: avgRating
        });

    } catch (error) {
        console.log(error);
        res.redirect('/pageNotFound');
    }
}

module.exports = {
    loadProductDetails
}
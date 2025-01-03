const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const User = require("../../models/userSchema");
const Coupon = require("../../models/couponSchema");
const Review = require("../../models/reviewSchema");
const mongoose = require("mongoose");

const loadProductDetails = async (req, res) => {
  try {
    const userId = req.session.user;
    const userData = await User.findById(userId);
    const productId = req.query.id;
    const product = await Product.findById(productId).populate("category");
    const category = product.category;
    const couponData = await Coupon.find({ isList: true });

    const priceLowerBound = product.salePrice - product.salePrice * 0.2;
    const priceUpperBound = product.salePrice + product.salePrice * 0.2;

    // Get related products based on the same category and within the price range (excluding the current product)
    const relatedProducts = await Product.find({
      category: product.category._id,
      salePrice: { $gte: priceLowerBound, $lte: priceUpperBound },
      _id: { $ne: product._id },
      isBlocked: false,
      isDeleted: false,
    }).limit(4);

    const relatedProductIds = relatedProducts.map((product) => product._id);

    // Get some random products (excluding the current product and the related products)
    const randomProducts = await Product.aggregate([
      {
        $match: {
          _id: {
            $nin: [...relatedProductIds, product._id], // Exclude both related products and the currently viewed product
          },
          isBlocked: false,
          isDeleted: false,
        },
      },
      {
        $sample: { size: 4 }, // Randomly sample 4 products
      },
    ]);

    const reviews = await Review.find({ product_id: productId })
      .populate("user_id", "name")
      .sort({ review_date: -1 });
    // Calculate average rating
    const averageRating = await Review.aggregate([
      { $match: { product_id: new mongoose.Types.ObjectId(productId) } },
      { $group: { _id: null, avgRating: { $avg: "$rating" } } },
    ]);
    const avgRating = averageRating.length > 0 ? averageRating[0].avgRating : 0;

    res.render("product-details", {
      user: userData,
      products: product,
      category: category,
      quantity: product.quantity,
      coupons: couponData,
      relatedProducts: relatedProducts,
      randomProducts: randomProducts,
      reviews: reviews,
      avgRating: avgRating,
    });
  } catch (error) {
    console.log(error);
    res.redirect("/pageNotFound");
  }
};

module.exports = {
  loadProductDetails,
};

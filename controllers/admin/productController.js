const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const User = require('../../models/userSchema');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');


const productInfo = async (req, res) => {
    try {
        // Get search query from the request (defaults to an empty string if not provided)
        let search = req.query.search || '';
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;

        // Construct a filter object that will search based on the category name
        const searchQuery = {
            isDeleted: { $ne: true },
        };

        if (search) {
            // Modify the query to include a search condition for category name
            searchQuery.productName = { $regex: '.*' + search + '.*', $options: 'i' };  // 'i' makes it case-insensitive
        }

        // Fetch categories with the applied search filter
        const productData = await Product.find(searchQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('category', 'name');

        // Count the total categories matching the search criteria
        const totalProducts = await Product.countDocuments(searchQuery);
        const totalPages = Math.ceil(totalProducts / limit);

        // Render the categories page with the search results
        res.render('products', {
            product: productData,
            currentPage: page,
            totalProducts: totalProducts,
            totalPages: totalPages,
            search: search // Pass the search term to the view to keep it in the input box
        });

    } catch (error) {
        console.error(error);
        res.redirect('/admin/pageError');
    }
};



const loadAddProduct = async (req, res) => {
    try {
        const category = await Category.find({isListed: true, isDeleted: false});
        res.render('add-product', {categories: category });
    } catch (error) {
        console.log(error.message);
        res.redirect('/pageError');
    }
};

const addProduct = async (req, res) => {
    try {
        const products = req.body;
        const productExists = await Product.findOne({
            productName: products.productName, isDeleted: false
        });

        if (!productExists) {
            const images = [];

            // Process cropped images (base64 data)
            for (let i = 1; i <= 3; i++) {
                const base64Data = products[`croppedImage${i}`];

                if (base64Data) {
                    const buffer = Buffer.from(base64Data.split(",")[1], 'base64');
                    const croppedImagePath = path.join('public', 'uploads', 'product-images', Date.now() + `-cropped-image${i}.jpg`);

                    await sharp(buffer)
                        .resize({ width: 440, height: 440 })
                        .toFile(croppedImagePath);
                    
                    images.push(croppedImagePath.replace('public', ''));
                }
            }

            const categoryId = await Category.findOne({ 
                _id: new mongoose.Types.ObjectId(products.category.trim()), // Convert string to ObjectId
                isListed: true,
                isDeleted: false
            });

            if (!categoryId) {
                return res.status(400).json('Invalid category ID');
            }

            const newProduct = new Product({
                productName: products.productName,
                description: products.description,
                category: categoryId._id,
                regularPrice: products.regularPrice,
                salePrice: products.salePrice,
                createdAt: new Date(),
                quantity: products.quantity,
                productImage: images, // Save the processed image paths
                status: 'Available'
            });

            await newProduct.save();
            return res.redirect('/admin/products');
        } else {
            return res.status(400).json('Product already exists');
        }
    } catch (error) {
        console.log('Error: ', error);
        res.redirect('/admin/pageError');
    }
};


const loadEditProduct = async (req, res) => {
    try {
        const id = req.query.id;

        // Check if ID is missing or empty
        if (!id || id.trim() === "") {
            console.log("ID is missing or empty");
            return res.redirect('/admin/pageError');  // Redirect to error page if ID is invalid
        }

        // Validate if the ID is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.log("Invalid ID format");
            return res.redirect('/admin/pageError');  // Redirect to an error page if invalid ID
        }

        // Find the category by ID
        const product = await Product.findOne({ _id: id });

        // If category not found, handle it gracefully
        if (!product) {
            console.log("Product not found");
            return res.redirect('/admin/pageError');  // Redirect if category is not found
        }

        const category = await Category.find({isListed: true, isDeleted: false});
        // Render the edit-category view and pass the category data
        res.render('edit-product', { product: product, categories: category });

    } catch (error) {
        console.log(error.message);
        res.redirect('/admin/pageError');  // Redirect to error page if any other error occurs
    }
};



const deleteProduct = async (req, res) => {
    try {
      const { id } = req.params; // Get the category ID from the URL
  
      // Soft delete by setting 'isListed' to false and 'isDeleted' to true
      const product = await Product.findByIdAndUpdate(
        id, { 
          isListed: false,
          isDeleted: true,
        }, { new: true }
      );
  
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
  
      res.status(200).json({ message: 'Product soft deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  



module.exports = {
    productInfo,
    loadAddProduct,
    addProduct,
    loadEditProduct,
    // editCategory,
    deleteProduct,
}
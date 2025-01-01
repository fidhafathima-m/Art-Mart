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
        const searchQuery = {};

        if (search) {
            // Modify the query to include a search condition for product name
            searchQuery.productName = { $regex: '.*' + search + '.*', $options: 'i' };  // 'i' makes it case-insensitive
        }

        // Fetch all products (including soft-deleted) and populate categories
        const productData = await Product.find(searchQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('category', 'name');

        // Count the total products matching the search criteria for pagination
        const totalProducts = await Product.countDocuments(searchQuery);
        const totalPages = Math.ceil(totalProducts / limit);

        // Render the products page with all products, including soft-deleted
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
                return res.status(400).json({ success: false, message: 'Invalid category ID' });
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
            return res.status(200).json({ success: true, message: 'Product added successfully' });
        } else {
            return res.status(400).json({ success: false, message: 'Product already exists' });
        }
    } catch (error) {
        if (err instanceof multer.MulterError) {
            res.status(400).json({ success: false, message: 'Only image files are allowed' });
          } else {
            console.log(error);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
          }
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
    const { id } = req.params;

    try {
        // Soft delete the product by setting 'isDeleted' to true and updating the 'deletedAt' timestamp
        const product = await Product.findByIdAndUpdate(
            id,
            { isDeleted: true, deletedAt: new Date() },
            { new: true }
        );

        // Respond with success if the product was found and updated
        if (product) {
            res.json({ message: 'Product soft deleted successfully' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error deleting product', error });
    }
  };

  const restoreProduct = async (req, res) => {
    const { id } = req.params;

    try {
        // Restore the product by setting 'isDeleted' to false and clearing 'deletedAt'
        const product = await Product.findByIdAndUpdate(
            id,
            { isDeleted: false, deletedAt: null },
            { new: true }
        );

        // Respond with success if the product was found and updated
        if (product) {
            res.json({ message: 'Product restored successfully' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error restoring product', error });
    }
  }
  
  const editProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const products = req.body;

        // Find the existing product by ID
        const product = await Product.findById(id);

        // If the product doesn't exist, return an error
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const images = [...product.productImage]; // Start with existing images

        // Process cropped images (base64 data)
        for (let i = 1; i <= 3; i++) {
            const base64Data = products[`croppedImage${i}`];

            if (base64Data) {
                // Convert base64 to a buffer
                const buffer = Buffer.from(base64Data.split(",")[1], 'base64');

                // Define the image path
                const croppedImagePath = path.join('public', 'uploads', 'product-images', Date.now() + `-cropped-image${i}.jpg`);

                // Resize and save the image using sharp
                await sharp(buffer)
                    .resize({ width: 440, height: 440 })
                    .toFile(croppedImagePath);

                // Push the relative path to the images array
                images.push(croppedImagePath.replace('public', ''));
            }
        }

        // Ensure category is valid
        const categoryId = await Category.findOne({ 
            _id: new mongoose.Types.ObjectId(products.category.trim()), 
            isListed: true,
            isDeleted: false
        });

        if (!categoryId) {
            return res.status(400).json({ success: false, message: 'Invalid category ID' });
        }

        // Prepare updated data for the product
        const updateData = {
            productName: products.productName,
            description: products.description,
            category: categoryId._id,
            regularPrice: products.regularPrice,
            salePrice: products.salePrice,
            quantity: products.quantity,
            productImage: images,  // Use the updated images array (existing + new images)
            status: 'Available',  // Assuming you want to maintain the same status
        };

        // Update the product in the database
        await Product.findByIdAndUpdate(id, updateData, { new: true });

        // Return success response
        res.status(200).json({ success: true, message: 'Product updated successfully' });
    } catch (error) {
        console.log('Error: ', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};




const deleteSingleImage = async (req, res) => {
    try {
        const { imageNameToServer, productIdToServer } = req.body;

        if (!imageNameToServer || !productIdToServer) {
            return res.status(400).json({ status: false, message: 'Missing image name or product ID.' });
        }

        // Find the product by ID
        const product = await Product.findById(productIdToServer);
        if (!product) {
            return res.status(404).json({ status: false, message: 'Product not found.' });
        }

        // Find and remove the image from the product's image array
        const imageIndex = product.productImage.indexOf(imageNameToServer);
        if (imageIndex === -1) {
            return res.status(404).json({ status: false, message: 'Image not found in product.' });
        }

        // Remove the image path from the product's image array
        product.productImage.splice(imageIndex, 1);

        // Construct the correct image file path
        // Ensure imageNameToServer does not contain the 'uploads/product-images' part
        // Just use the file name from the client side (e.g. '1735616685331-cropped-image1.jpg')
        const imagePath = path.join(__dirname, '..', '..', 'public', 'uploads', 'product-images', path.basename(imageNameToServer));

        console.log("Deleting image at path:", imagePath); // Log the correct image path for debugging

        // Check if the image exists before trying to delete it
        if (!fs.existsSync(imagePath)) {
            return res.status(404).json({ status: false, message: 'Image not found on server.' });
        }

        // Delete the image file from the server
        await fs.promises.unlink(imagePath);

        // Save the updated product document
        await product.save();

        return res.json({ status: true, message: 'Image deleted successfully.' });

    } catch (error) {
        console.error("Error deleting image:", error.message || error); // Log error message
        return res.status(500).json({ status: false, message: 'Error deleting image or updating product.' });
    }
};

// Block Product
const blockProduct = async (req, res) => {
    try {
        const productId = req.body.id;
        await Product.updateOne({ _id: productId }, { $set: { isBlocked: true } });
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, message: 'Error blocking product' });
    }
};

// Unblock Product
const unblockProduct = async (req, res) => {
    try {
        const productId = req.body.id;
        await Product.updateOne({ _id: productId }, { $set: { isBlocked: false } });
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, message: 'Error unblocking product' });
    }
};



module.exports = {
    productInfo,
    loadAddProduct,
    addProduct,
    loadEditProduct,
    editProduct,
    deleteSingleImage,
    blockProduct,
    unblockProduct,
    deleteProduct,
    restoreProduct,
}
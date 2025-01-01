const Category = require('../../models/categorySchema');
const Coupon = require('../../models/couponSchema');
const User = require('../../models/userSchema');

const loadCoupon = async(req, res) => {
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
            searchQuery.name = { $regex: '.*' + search + '.*', $options: 'i' };  // 'i' makes it case-insensitive
        }

        // Fetch all products (including soft-deleted) and populate categories
        const couponData = await Coupon.find(searchQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Count the total products matching the search criteria for pagination
        const totalCoupon = await Coupon.countDocuments(searchQuery);
        const totalPages = Math.ceil(totalCoupon / limit);

        // Render the products page with all products, including soft-deleted
        res.render('coupons', {
            coupons: couponData,
            currentPage: page,
            totalCoupon: totalCoupon,
            totalPages: totalPages,
            search: search // Pass the search term to the view to keep it in the input box
        });

    } catch (error) {
        console.error(error);
        res.redirect('/admin/pageError');
    }
}

const LoadAddCoupon = async(req, res) => {
    try {
        const userData = await User.find({isBlocked: false});
        res.render('add-coupon', {users: userData});
    } catch (error) {
        console.log(error);
        res.redirect('/admin/pageError');
    }
}


const addCoupon = async (req, res) => {
    const { name, expireOn, offerPrice, minPurchaseAmount } = req.body;

    // Convert the name to lowercase and remove extra spaces (similar to category name)
    const lowerCaseName = name.trim().replace(/\s+/g, ' ').toLowerCase();

    try {
        // Check if the coupon already exists (based on name)
        const existingCoupon = await Coupon.findOne({
            name: { $regex: new RegExp("^" + lowerCaseName + "$", "i") }
        });

        if (existingCoupon) {
            return res.json({ success: false, message: 'Coupon already exists.' });
        }

        // Create the new coupon object
        const newCoupon = new Coupon({
            name,
            expireOn: new Date(expireOn),  // Ensure the expiration date is in the correct format
            offerPrice,
            minPurchaseAmount,
        });

        // Save the coupon to the database
        await newCoupon.save();

        // Respond with a success message
        return res.json({ success: true, message: 'Coupon added successfully.' });

    } catch (error) {
        // If an error occurs, send a server error message
        console.error('Error adding coupon:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const listCoupon = async (req, res) => {
    try {
        let id = req.query.id;
        await Coupon.updateOne({_id: id}, {$set: {isList: false}});
        // Send success response for AJAX
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: 'Error unlisting coupon' });
    }
}

const unlistCoupon = async (req, res) => {
    try {
        let id = req.query.id;
        await Coupon.updateOne({_id: id}, {$set: {isList: true}});
        // Send success response for AJAX
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: 'Error listing coupon' });
    }
}

const loadEditCoupon = async(req, res) => {
    try {
        const id = req.query.id; 
        const couponData = await Coupon.findOne({ _id: id }); 

        if (!couponData) {
            return res.redirect('/admin/pageError'); // If coupon not found, redirect to an error page
        }

        // Render the edit coupon page, passing coupon data
        res.render('edit-coupon', { coupon: couponData }); // Ensure you're passing the correct data structure (couponData)

    } catch (error) {
        console.log(error);
        res.redirect('/admin/pageError'); // Redirect to an error page in case of failure
    }
}

const editCoupon = async (req, res) => {
    try {
        const id = req.params.id;
        const { name, expireOn, offerPrice, minPurchaseAmount } = req.body;

        const updatedCoupon= await Coupon.findByIdAndUpdate(
            id,
            { 
                name: name,
                expireOn: expireOn,
                offerPrice: offerPrice,
                minPurchaseAmount: minPurchaseAmount
            },
            { new: true }
        );

        if (updatedCoupon) {
            return res.status(200).json({ success: true, message: 'Coupon updated successfully!' });
        } else {
            return res.status(500).json({ success: false, message: 'Failed to update coupon' });
        }

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success: false, message: 'An error occurred' });
    }
};



module.exports = {
    loadCoupon,
    LoadAddCoupon,
    addCoupon,
    listCoupon,
    unlistCoupon,
    loadEditCoupon,
    editCoupon,
}
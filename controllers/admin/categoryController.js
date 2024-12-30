const Category = require('../../models/categorySchema');


const categoryInfo = async (req, res) => {
    try {
        // Get search query from the request (defaults to an empty string if not provided)
        let search = req.query.search || '';
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;

        // Construct a filter object that will search based on the category name
        const searchQuery = {
            isDeleted: { $ne: true }
        };

        if (search) {
            // Modify the query to include a search condition for category name
            searchQuery.name = { $regex: '.*' + search + '.*', $options: 'i' };  // 'i' makes it case-insensitive
        }

        // Fetch categories with the applied search filter
        const categoryData = await Category.find(searchQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Count the total categories matching the search criteria
        const totalCategories = await Category.countDocuments(searchQuery);
        const totalPages = Math.ceil(totalCategories / limit);

        // Render the categories page with the search results
        res.render('categories', {
            category: categoryData,
            currentPage: page,
            totalCategories: totalCategories,
            totalPages: totalPages,
            search: search // Pass the search term to the view to keep it in the input box
        });

    } catch (error) {
        console.error(error);
        res.redirect('/admin/pageError');
    }
};

const getListCategory = async (req, res) => {
    try {
        let id = req.query.id;
        await Category.updateOne({_id: id}, {$set: {isListed: false}});
        // Send success response for AJAX
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: 'Error unlisting category' });
    }
}

const getUnlistCategory = async (req, res) => {
    try {
        let id = req.query.id;
        await Category.updateOne({_id: id}, {$set: {isListed: true}});
        // Send success response for AJAX
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: 'Error listing category' });
    }
}


const loadAddCategory = async (req, res) => {
    try {
        res.render('add-category')
    } catch (error) {
        console.log(error.message);
    }
};

const addCategory = async (req, res) => {
    const { name, description } = req.body;
    const lowerCaseName = name.trim().replace(/\s+/g, ' ').toLowerCase();
    try {
        // Check if the category already exists
        const existingCategory = await Category.findOne({
            name: { $regex: new RegExp("^" + lowerCaseName + "$", "i") }
        });
        if (existingCategory) {
            return res.json({ success: false, message: 'Category already exists.' });
        }

        // Create new category
        const newCategory = new Category({
            name,
            description,
        });
        await newCategory.save();

        // Respond with success message
        return res.json({ success: true, message: 'Category added successfully.' });

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const mongoose = require('mongoose');

const loadEditCategory = async (req, res) => {
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
        const category = await Category.findOne({ _id: id });

        // If category not found, handle it gracefully
        if (!category) {
            console.log("Category not found");
            return res.redirect('/admin/pageError');  // Redirect if category is not found
        }

        // Render the edit-category view and pass the category data
        res.render('edit-category', { category: category });

    } catch (error) {
        console.log(error.message);
        res.redirect('/admin/pageError');  // Redirect to error page if any other error occurs
    }
};


const editCategory = async (req, res) => {
    try {
        const id = req.params.id;
        const { categoryName, description } = req.body;

        const existingCategory = await Category.findById(id);
        if (!existingCategory) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            { name: categoryName, description: description },
            { new: true }
        );

        if (updatedCategory) {
            return res.status(200).json({ success: true, message: 'Category updated successfully!' });
        } else {
            return res.status(500).json({ success: false, message: 'Failed to update category' });
        }

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success: false, message: 'An error occurred' });
    }
};



const deleteCategory = async (req, res) => {
    try {
      const { id } = req.params; // Get the category ID from the URL
  
      // Soft delete by setting 'isListed' to false and 'isDeleted' to true
      const category = await Category.findByIdAndUpdate(
        id, { 
          isListed: false,
          isDeleted: true,
        }, { new: true }
      );
  
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
  
      res.status(200).json({ message: 'Category soft deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  



module.exports = {
    categoryInfo,
    getListCategory,
    getUnlistCategory,
    loadAddCategory,
    addCategory,
    loadEditCategory,
    editCategory,
    deleteCategory,
}
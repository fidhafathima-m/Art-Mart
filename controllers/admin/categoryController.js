const Category = require('../../models/categorySchema');


const categoryInfo = async (req, res) => {
    try {
        
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;


        const categoryData = await Category.find({ isDeleted: { $ne: true } })
        .sort({createdAt: -1})
        .skip(skip)
        .limit(limit);
        

        const totalCategories = await Category.countDocuments();
        const totalPages = Math.ceil(totalCategories / limit);

        res.render('categories', {
            category: categoryData,
            currentPage: page,
            totalCategories: totalCategories,
            totalPages: totalPages
        })

    } catch (error) {
        console.error(error);
        res.redirect('/admin/pageError');
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
    const {name, description} = req.body;
    try {
        
        const existingCategory = await Category.findOne({name});
        if(existingCategory) {
            return res.status(400).json({error: 'Category already exists...'});
        }

        const newCatgory = new Category({
            name,
            description
        })
        await newCatgory.save();
        return res.redirect('/admin/categories');

    } catch (error) {
        return res.status(500).json({error: 'Internal Server Error'});
    }
}

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
            return res.status(404).json({error: 'Category not found'});
        }

        const updateCategory = await Category.findByIdAndUpdate(
            id, 
            { name: categoryName, description: description },
            { new: true } 
        );

        if (updateCategory) {
            return res.redirect('/admin/categories');  
        } else {
            return res.status(404).json({error: 'Category not found after update'});
        }

    } catch (error) {
        console.error(error); 
        return res.status(500).json({error: 'Internal Server Error'});
    }
};

const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params; // Get the category ID from the URL
    
        // Soft delete by setting 'deleted' to true
        const category = await Category.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    
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
    loadAddCategory,
    addCategory,
    loadEditCategory,
    editCategory,
    deleteCategory,
}
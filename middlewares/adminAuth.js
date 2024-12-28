// adminAuth.js

const isLogin = async (req, res, next) => {
    try {
        // Check if the admin is logged in by verifying req.session.admin
        if (req.session.admin) {
            return next(); // If admin is logged in, proceed to the requested route
        } else {
            return res.redirect('/admin/login'); // If not logged in, redirect to login
        }
    } catch (error) {
        console.log("Error in isLogin middleware:", error.message);
        return res.redirect('/admin/login'); // Ensure redirection to login in case of error
    }
};

const isLogout = async (req, res, next) => {
    try {
        // Check if the admin is logged in by verifying req.session.admin
        if (req.session.admin) {
            return res.redirect('/admin'); // If logged in, redirect to the dashboard
        }
        return next(); // Otherwise, proceed to the next middleware (login)
    } catch (error) {
        console.log("Error in isLogout middleware:", error.message);
        return res.redirect('/admin/login'); // Ensure redirection to login in case of error
    }
};

module.exports = {
    isLogin,
    isLogout
};

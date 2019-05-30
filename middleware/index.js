var Campground  =   require("../models/campground"),
    Comment     =   require("../models/comment"),
    User        =   require("../models/user");

var middlewareObj = {};

middlewareObj.checkCommentOwnership = function (req, res, next){
    if(req.isAuthenticated()){
        Comment.findById(req.params.c_id, function(err, foundComment){
            if (err) {
                console.log(err);
                res.redirect("back");
            } else {
                if (foundComment.author.id && foundComment.author.id.equals(req.user._id) || req.user.isAdmin){
                    return next();
                } else {
                    req.flash("error", "You can only modify comments that you created");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "Please login");
        res.redirect("/login");
    }
};

middlewareObj.checkCampgroundOwnership = function (req, res, next){
    if(req.isAuthenticated()){
        Campground.findById(req.params.id, function(err, foundCampground){
            if (err) {
                console.log(err);
                req.flash("error", "Campground not found");
                res.redirect("back");
            } else {
                // Added this block, to check if foundCampground exists, and if it doesn't to throw an error via connect-flash and send us back to the homepage
                if (!foundCampground) {
                    req.flash("error", "Item not found.");
                    return res.redirect("back");
                }
                if (foundCampground.author.id && foundCampground.author.id.equals(req.user._id) || req.user.isAdmin){
                    return next();
                } else {
                    req.flash("error", "You can only modify campgrounds that you created");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "Please login");
        res.redirect("/login");
    }
};

middlewareObj.isLoggedIn = function (req, res, next){
    if (req.isAuthenticated()){
        return next();
    }
    req.session.redirectTo = req.originalUrl;
    req.flash("error", "Please login");
    res.redirect("/login");
};


middlewareObj.checkUserOwnership = function (req, res, next){
    if(req.isAuthenticated()){
        User.findById(req.params.id, function(err, foundUser){
            if (err) {
                req.flash("error", err.message);
                res.redirect("back");
            } else {
                if (!foundUser) {
                    req.flash("error", "User not found");
                    return res.redirect("back");
                } 
                if (foundUser._id.equals(req.user._id)){
                    return next();
                } else {
                    req.flash("error", "You can only view your profile");
                    res.redirect("back"); 
                }
            }
        });
    }
};

                
module.exports = middlewareObj;
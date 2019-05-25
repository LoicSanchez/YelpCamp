var express = require("express");
var Campground  =   require("../models/campground"),
    Comment     =   require("../models/comment");
var middleware  =   require("../middleware");
var router = express.Router({mergeParams: true});

// Show form
router.get("/new", middleware.isLoggedIn, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
        if(err){
            console.log(err);
            req.flash("error", "Campground not found");
            res.redirect("back");
        } else {
            res.render("comments/new", {campground: foundCampground});
        }
    });
});

// Create
router.post("/", middleware.isLoggedIn, function(req, res) {
    Campground.findById(req.params.id, function(err, foundCampground){
        if (err){
            console.log(err);
        } else {
            Comment.create(req.body.comment, function(err, newComment){
                if(err){
                    console.log(err);
                } else {
                    //Add author to comemnt
                    newComment.author.id = req.user._id;
                    newComment.author.username = req.user.username;
                    newComment.save();
                    //Link comment to campground
                    foundCampground.comments.push(newComment);
                    foundCampground.save();
                    req.flash("success", "Comment added!");
                    res.redirect("/campgrounds/"+foundCampground._id);
                }
            });
        }
    });
});

//Edit route
router.get("/:c_id/edit", middleware.checkCommentOwnership, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
        if (err){
            console.log(err);
        } else {
            Comment.findById(req.params.c_id, function(err, foundComment){
                if(err){
                    console.log(err);
                } else {
                    res.render("comments/edit", {campground: foundCampground, comment: foundComment});
                }
            });
        }
    });
});

//Update route
router.put("/:c_id", middleware.checkCommentOwnership, function (req, res){
    Comment.findByIdAndUpdate(req.params.c_id, req.body.comment, function(err, updatedComment){
        if (err) {
            res.redirect("back");
        } else {
            req.flash("success", "Comment updated!");
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
});

//DELETE route
router.delete("/:c_id", middleware.checkCommentOwnership, function(req, res){
    Comment.findByIdAndRemove(req.params.c_id, function(err, removedComment){
        if(err){
            console.log(err);
        } else {
            req.flash("success", "Comment deleted!");
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
});

module.exports = router;
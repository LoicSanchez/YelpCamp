var express = require("express");
var Campground  =   require("../models/campground"),
    Comment     =   require("../models/comment");
var middleware  =   require("../middleware");
var router = express.Router();

//INDEX - show all campgrounds
router.get("/", function(req, res){
    Campground.find({}, function(err, allCampgrounds){
        if (err) {
            console.log(err);
        } else {
            res.render("campgrounds/index", {campgrounds:allCampgrounds});
        }
    });
});

//CREATE
router.post("/", middleware.isLoggedIn, function(req, res) {
	//Get data from form and create object
	var newCampground = req.body.campground;
	var author = {
	    id: req.user._id,
	    username: req.user.username
	};
	newCampground.author = author;
    Campground.create(newCampground, function(err, createdCampground){
    	if (err){
    		console.log("Error creating a campground");
    		console.log(err);
    	} else {
			//Redirect to page
            res.redirect("/campgrounds/"+createdCampground._id);
    	}
    });
});

//NEW - show form to create new campground
router.get("/new", middleware.isLoggedIn, function(req, res){
	res.render("campgrounds/new");
});

//SHOW
router.get("/:id", function(req, res){
    //find the campground with provided ID
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if (err){
            console.log(err);
        } else {
            //render show template with that campground
            res.render("campgrounds/show", {campground:foundCampground});
        }
    });
});

//EDIT route - Show edit form
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res) {
    Campground.findById(req.params.id, function(err, foundCampground){
        res.render("campgrounds/edit", {campground: foundCampground});
    });
});

//UPDATE route - Update campground
router.put("/:id", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground){
        if (err) {
            res.redirect("/campgrounds");
        } else {
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
});

//DELETE route
router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findByIdAndRemove(req.params.id, function(err, removedCampground){
        if (err) {
            res.redirect("/campgrounds");
        } else {
            Comment.deleteMany({_id: { $in: removedCampground.comments } }, function(err){
                if (err) {
                    console.log(err);
                }
            });
            res.redirect("/campgrounds");
        }
    });
});

module.exports = router;
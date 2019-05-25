var express     =   require("express"),
    passport    =   require("passport");
var User        =   require("../models/user");
var router = express.Router();

router.get("/", function(req, res) {
	res.render("landing");
});

// ================
// Auth routes
// ===============
//Show sign up form
router.get("/register", function(req, res) {
    res.render("auth/register");
});

//handling user signup
router.post("/register", function(req, res){
    User.register(new User({username: req.body.username}), req.body.password, function(err, newUser){
        if (err){
            req.flash("error", err.message);
            return res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function(){
                req.flash("success", "Welcome to YelpCamp "+ newUser.username);
                res.redirect("/campgrounds");
            });
        }
    });
});

//Login routes
//Login form
router.get("/login", function(req, res) {
    res.render("auth/login");
});
//Login logic with middleware
router.post("/login", passport.authenticate("local", {
    successRedirect: "/campgrounds",
    failureRedirect: "/login",
    failureFlash: true
}), function(req, res){
});

//Logout routes
router.get("/logout", function(req, res) {
    req.logout();
    req.flash("success", "You are logged out");
    res.redirect("/campgrounds");
});

module.exports = router;
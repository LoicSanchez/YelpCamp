var express     =   require("express"),
    passport    =   require("passport"),
    async       =   require("async"),
    nodemailer  =   require("nodemailer"),
    crypto      =   require("crypto");
var middleware  =   require("../middleware");
var User        =   require("../models/user"),
    Campground  =   require("../models/campground"),
    Comment  =   require("../models/comment");
    
var router = express.Router();

router.get("/", function(req, res) {
	res.render("landing");
});

// ================
// Auth routes
// ===============
//Show sign up form
router.get("/register", function(req, res) {
    res.render("auth/register", {page: 'register'});
});

//handling user signup
router.post("/register", function(req, res){
    var newUser = new User({username: req.body.username, email: req.body.email});
    if (req.body.adminCode === process.env.ADMIN_CODE) {
        newUser.isAdmin = true;
    }
    User.register(newUser, req.body.password, function(err, createdUser){
        if (err){
            return res.render("auth/register", {error: err.message});
        } else {
            passport.authenticate("local")(req, res, function(){
                req.flash("success", "Welcome to YelpCamp "+ createdUser.username);
                res.redirect("/campgrounds");
            });
        }
    });
});

//Login routes
//Login form
router.get("/login", function(req, res) {
    res.render("auth/login", {page: 'login'});
});

router.post('/login', function(req, res, next) {
    passport.authenticate('local', {failureFlash: true}, function(err, user, info) {
        if (err) { 
            return next(err); 
        }
        if (!user) { 
            req.flash('error', info.message);
            return res.redirect('/login'); 
        }
        req.logIn(user, function(err) {
            if (err) { 
                return next(err); 
            }
            var redirectTo = req.session.redirectTo ? req.session.redirectTo : '/campgrounds';
            delete req.session.redirectTo;
            req.flash("success", "You are logged in");
            res.redirect(redirectTo);
        });
    })(req, res, next);
});

//Logout routes
router.get("/logout", function(req, res) {
    req.logout();
    req.flash("success", "You are logged out");
    res.redirect("/campgrounds");
});

//forgot route
router.get('/forgot', function(req, res){
	res.render('auth/forgot');
});

//forgot password logic
router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
        crypto.randomBytes(20, function(err, buf) {
            var token = buf.toString('hex');
            done(err, token);
        });
    },
    function(token, done) {
        User.findOne({ email: req.body.email }, function(err, user) {
            if (!user) {
                req.flash('error', 'There is no account with that email address.');
                return res.redirect('/forgot');
            }
            user.resetPasswordToken = token;
            user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
            user.save(function(err) {
                done(err, token, user);
            });
        });
    },
    function(token, user, done) {
        var smtpTransport = nodemailer.createTransport({
            service: 'Gmail', 
            auth: {
                user: 'yelpcampinfo68@gmail.com',
                pass: process.env.GMAILPW
            }
        });
        var mailOptions = {
            to: user.email,
            from: '"YelpCamp Admin 🏕" <yelpcampinfo68@gmail.com>',
            subject: 'YelpCamp Password Reset',
            text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
            'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
            'http://' + req.headers.host + '/reset/' + token + '\n\n' +
            'If you did not request this, please ignore this email and your password will remain unchanged.\n'
        };
        smtpTransport.sendMail(mailOptions, function(err) {
            console.log('mail sent');
            req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
            done(err, 'done');
        });
    }
    ], function(err) {
        if (err) return next(err);
        res.redirect('/forgot');
    });
});

//reset route
router.get('/reset/:token', function(req, res) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
        req.flash('error', 'Password reset token is invalid or has expired.');
        return res.redirect('/forgot');
    }
        res.render('auth/reset', {token: req.params.token});
    });
});

//reset logic
router.post('/reset/:token', function(req, res) {
    async.waterfall([
    function(done) {
        User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
            if (!user) {
                req.flash('error', 'Password reset token is invalid or has expired.');
                return res.redirect('back');
            }
            if(req.body.password === req.body.confirm) {
                user.setPassword(req.body.password, function(err) {
                    user.resetPasswordToken = undefined;
                    user.resetPasswordExpires = undefined;
                    user.save(function(err) {
                        req.logIn(user, function(err) {
                            done(err, user);
                        });
                    });
                });
            } else {
                req.flash("error", "Passwords do not match.");
                return res.redirect('back');
            }
        });
    },
    function(user, done) {
        var smtpTransport = nodemailer.createTransport({
            service: 'Gmail', 
            auth: {
                user: 'yelpcampinfo68@gmail.com',
                pass: process.env.GMAILPW
            }
        });
        var mailOptions = {
            to: user.email,
            from: '"YelpCamp Admin 🏕" <yelpcampinfo68@gmail.com>',
            subject: 'Your password has been changed',
            text: 'Hello,\n\n' +
            'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
        };
        smtpTransport.sendMail(mailOptions, function(err) {
            req.flash('success', 'Success! Your password has been changed.');
            done(err);
        });
    }
    ], function(err) {
        res.redirect('/campgrounds');
    });
});


//User profile route
router.get('/users/:id', middleware.checkUserOwnership, function(req, res){
    User.findById(req.params.id, async function(err, foundUser){
        if(err){
            req.flash("error", err.message);
            res.redirect('/campgrounds');
        } else {
            let campgrounds = await Campground.find().where('author.id').equals(foundUser._id);
            let comments = await Comment.find().where('author.id').equals(foundUser._id);
            res.render('users/show', {user: foundUser, campgrounds, comments});
        }
    });
});

//EDIT route - Show edit form for User
router.get("/users/:id/edit", middleware.checkUserOwnership, function(req, res) {
    User.findById(req.params.id, function(err, foundUser){
        res.render("users/edit", {user: foundUser});
    });
});

//UPDATE route - Update User
router.put("/users/:id", middleware.checkUserOwnership, function(req, res){
    User.findByIdAndUpdate(req.params.id, req.body, function(err, updatedUser){
        if (err) {
            req.flash('error', err.message);
            res.redirect("/users/" + req.params.id);
        } else {
            req.flash('success', 'User profile updated');
            res.redirect("/users/" + req.params.id);
        }
    });
});


module.exports = router;
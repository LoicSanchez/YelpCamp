var express                 =   require("express"),
    mongoose                =   require("mongoose"),
    passport                =   require("passport"),
    bodyParser              =   require("body-parser"),
    localStrategy           =   require("passport-local"),
    flash                   =   require("connect-flash"),
    methodOverride          =   require("method-override");

var User        =   require("./models/user"),
    seedDB      =   require("./seeds");

var campgroundRoutes    =   require("./routes/campgrounds"),
    commentRoutes       =   require("./routes/comments"),
    authRoutes          =   require("./routes/index");

var app = express();
var envUrl = process.env.DB_URL || "mongodb://localhost/yelp_camp_v12";
mongoose.connect(envUrl, { useNewUrlParser: true, useFindAndModify: false});

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + '/public'));
//seedDB();
app.use(methodOverride("_method"));
app.use(flash());


//Passport configuration
app.use(require("express-session")({
    secret: "Batman is incredible and powerful and has a cave",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.locals.moment = require('moment');

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

app.use("/", authRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);

app.listen(process.env.PORT, process.env.IP, function(){
	console.log("YelpCamp server started!");
});
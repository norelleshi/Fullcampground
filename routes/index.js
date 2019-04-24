var express = require("express");
var router  = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Campground = require("../models/campground");
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter});

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: process.env.Cloud_Name, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// root route
router.get("/", function(req, res){
   res.render("landing"); 
});

// Show register form
router.get("/register", function(req, res) {
   res.render("register"); 
});

// handle sugn up logic
router.post("/register", function(req, res) {
    var newUser = new User({
            username: req.body.username,
            email: req.body.email,
            avatar: req.body.avatar
        });
    if(req.body.adminCode === process.env.ADMIN_KEY){
        newUser.isAdmin = true;
    }
   User.register(newUser, req.body.password, function(err, user){
      if(err){
           return res.render("register", {"error": err.message});
      } 
      passport.authenticate("local")(req, res, function(){
          req.flash("success", "Successfully signed up! Nice to meet you, " + user.username); 
         res.redirect("/campgrounds"); 
      });
   });
});

// Show login form
router.get("/login", function(req, res){
   res.render("login"); 
});

// handling login logic
router.post("/login", passport.authenticate("local", 
    {
        successRedirect: "/campgrounds",
        successFlash: "Welcome to YelpCamp!",
        failureRedirect: "/login",
        failureFlash: true,
    }), function(req, res) {
});

// Logout route
router.get("/logout", function(req, res) {
   req.logout();
   req.flash("success", "See you later!");
   res.redirect("/campgrounds");
});

//User profile
router.get("/users/:id", function(req, res) {
   User.findById(req.params.id, function(err, foundUser){
        if(err || !foundUser){
           req.flash("error", "User not found.");
           res.redirect("back");
        } else {
            Campground.find().where("author.id").equals(foundUser._id).exec(function(err, campgrounds){
                if(err || !campgrounds){
                    req.flash("error", "Campgrounds not found.");
                    res.redirect("back");
                }  
                res.render("users/show", {user:foundUser, campgrounds: campgrounds});
            });
        }    
   }) ;
});

module.exports = router;
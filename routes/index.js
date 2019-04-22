var express = require("express");
var router  = express.Router();
var passport = require("passport");
var User = require("../models/user");

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
    var newUser = new User({username: req.body.username});
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

module.exports = router;
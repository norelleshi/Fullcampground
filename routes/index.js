var express = require("express");
var router  = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Campground = require("../models/campground");
var middleware = require("../middleware");
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
	if(req.user){
		res.redirect("back");
	} else {
   		res.render("register"); 
	}
});

// handle sign up logic
router.post("/register", upload.single('avatar'), function(req, res) {
    if(req.file){
        cloudinary.v2.uploader.upload(req.file.path, {angle: 'exif'}, function(err, result) {
            if(err || !result){
                req.flash('error', err.message);
                return res.redirect('back');
            }
            req.body.avatar = result.secure_url;
            req.body.avatarId = result.public_id;
            
            var newUser = new User({
                username: req.body.username,
                email: req.body.email,
                avatar: req.body.avatar,
                avatarId: req.body.avatarId
            });
            // eval(require('locus')); 
            if(req.body.adminCode === process.env.ADMIN_KEY){
                req.body.isAdmin = true;
            }
            User.register(newUser, req.body.password, function(err, user){
                if(err || !user){
                   return res.render("register", {"error": err.message});
                } 
                passport.authenticate("local")(req, res, function(){
                    
                    req.flash("success", "Successfully signed up! Nice to meet you, " + user.username); 
                    res.redirect("/campgrounds/"); 
                });
            });
        });  
    } else {
        if(req.body.adminCode === process.env.ADMIN_KEY){
            req.body.isAdmin = true;
        }
        User.register(req.body, req.body.password, function(err, user){
            if(err || !user){
               return res.render("register", {"error": err.message});
            } 
            passport.authenticate("local")(req, res, function(){
                
                req.flash("success", "Successfully signed up! Nice to meet you, " + user.username); 
                res.redirect("/campgrounds/"); 
            });
        });
    }
});

// Show login form
// router.get("/login", function(req, res){
//    res.render("login"); 
// });

// handling login logic
// router.post("/login", passport.authenticate("local", 
//     {
//         successRedirect: "/campgrounds",
//         // successFlash: "Welcome to YelpCamp!",
//         failureRedirect: "/login",
//         failureFlash: true,
//     }), function(req, res) {
// });

router.post("/", passport.authenticate("local", 
    {
        successRedirect: "/campgrounds",
        // successFlash: "Welcome to YelpCamp!",
        failureRedirect: "/",
        failureFlash: true,
    }), function(req, res) {
});

// Logout route
router.get("/logout", function(req, res) {
   req.logout();
   req.flash("success", "See you later!");
   res.redirect("/");
});

//User profile show route
router.get("/users/:user_id", function(req, res) {
   User.findById(req.params.user_id, function(err, foundUser){
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

//User profile edit route
// router.get("/users/:id/edit", middleware.isLoggedIn, function(req, res) {
//     User.findById(req.params.id, function(err, foundUser){
//         if(err || !foundUser){
//             req.flash("error", "User not found.");
//             console.log(err);
//         } else {
//             res.render("users/edit", {user: foundUser});
//         }    
//     });        
// });

// User profile update route
router.put("/users/:user_id", middleware.isLoggedIn, upload.single('avatar'), function (req, res) {
    User.findById(req.params.user_id, async function(err, user){
        if(err || !user){
            req.flash("error", err.message);
            return res.redirect("back");
        }
		let existAvatar = user.avatarId;
		if(existAvatar){
			try{
				await cloudinary.v2.uploader.destroy(existAvatar);
			}  catch(err) {
				req.flash("error", err.message);
				console.log(err);
				return res.redirect("back");
			}   
		} 
		if (req.file) {
			try {
				var result = await cloudinary.v2.uploader.upload(req.file.path, {angle: 'exif'});
				// eval(require('locus'));
				user.avatarId = result.public_id;
				user.avatar = result.secure_url;
			} catch(err) {
				req.flash("error", err.message);
				console.log(err);
				return res.redirect("back");
			}
		}
		user.email = req.body.email;
		user.save();
		// req.flash("success","Profile updated successfully!");
		res.redirect("/users/" + user._id);
    });
});    

// User avatar delete route
router.delete("/users/:user_id", middleware.isLoggedIn, function(req, res){
    User.findById(req.params.user_id, async function(err, user) {
        if(err || !user) {
          req.flash("error", err.message);
          return res.redirect("back");
        }
        try {
            await cloudinary.v2.uploader.destroy(user.avatarId);
            user.avatarId = null;
            user.avatar = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";
            // req.flash('success', 'Avatar deleted successfully!');
            res.redirect("/users/" + user._id);
        } catch(err) {
            if(err) {
                req.flash("error", "Something went wrong");
                return res.redirect("back");
            }
        }
        user.save();
    });
});


function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;
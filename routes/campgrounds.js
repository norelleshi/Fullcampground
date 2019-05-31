var express = require("express");
var router  = express.Router();
var Campground = require("../models/campground");
var Review = require("../models/review");
var User = require("../models/user");
// var Comment = require("../models/comment");
var middleware = require("../middleware");
var NodeGeocoder = require('node-geocoder');
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
 
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);

//INDEX - show all campgrounds
router.get("/", function(req, res){
    // eval(require('locus'));
    var noMatch = null; 
	var matchResult = null;
	var oneMatch = null;
	var searchInput = null;
    if(req.query.search){
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        //Get all campgrounds from DB
        Campground.find({$or:[{name: regex}, {location: regex}, {"author.username":regex}, {price: regex}, {description: regex}]}, function(err, allCampgrounds){
          if(err){
              console.log(err);
          } else {
                if(allCampgrounds.length < 1) {
                    noMatch = "Found 0 result for ";
                } else {
					if(allCampgrounds.length == 1) {
                    	oneMatch = "Found 1 result for ";
					} else {
						matchResult = "Found " + allCampgrounds.length + " results for ";
					}
				}
					searchInput = req.query.search;
                res.render("campgrounds/index", {campgrounds: allCampgrounds, noMatch: noMatch, matchResult: matchResult, searchInput: searchInput, oneMatch: oneMatch});
            }
        });
    } else {
        //Get all campgrounds from DB
        Campground.find({}, function(err, allCampgrounds){
          if(err){
              console.log(err);
          } else {
              res.render("campgrounds/index", {campgrounds: allCampgrounds, noMatch: noMatch, matchResult: matchResult, oneMatch: oneMatch});
          }
        });
    }
});

//NEW - show form to create new campground
router.get("/new", middleware.isLoggedIn, function(req, res){
  res.render("campgrounds/new"); 
});

//CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res){
    geocoder.geocode(req.body.location, function (err, data) {
        if (err || !data.length) {
          req.flash('error', 'Invalid address');
          return res.redirect('back');
        }
        cloudinary.v2.uploader.upload(req.file.path, {angle: 'exif'}, function(err, result) {
            if(err) {
                req.flash('error', err.message);
                return res.redirect('back');
            }
            req.body.campground.lat = data[0].latitude;
            req.body.campground.lng = data[0].longitude;
            req.body.campground.location = data[0].formattedAddress;
            req.body.campground.image = result.secure_url;
            req.body.campground.imageId = result.public_id;
              // add author to campground
            req.body.campground.author = {
                id: req.user._id,
                username: req.user.username
            };
			
            // Create a new campground and save to DB
            Campground.create(req.body.campground, function(err, newlyCreated){
                if(err){
                    console.log(err);
                } else {
                    //redirect back to campgrounds page
                    console.log(newlyCreated);
                    // req.flash("success", "Campground created successfully!");
                    res.redirect("/campgrounds/" + newlyCreated._id);
                }
            });
        });
    });    
});

//SHOW - shows more info about one campground
router.get("/:id", function(req, res){
    //find the campground with provided ID
    Campground.findById(req.params.id).populate({
        path: "reviews",
        options: {sort: {createdAt: -1}}
    }).exec(function(err, foundCampground){
      if(err || !foundCampground){
          req.flash("error", "Campground not found");
          res.redirect("back");
        } else {
          	// console.log(foundCampground);
            //render show template with that campground
            res.render("campgrounds/show", {campground: foundCampground});
        }
    });
});

//EDIT CAMPGROUND ROUTE
// router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res) {
//     Campground.findById(req.params.id, function(err, foundCampground){
//         if(err){
//             console.log(err);
//         } else {
//             res.render("campgrounds/edit", {campground: foundCampground});
//         }    
//     });        
// });

// UPDATE CAMPGROUND ROUTE
router.put("/:id", middleware.checkCampgroundOwnership, upload.single("image"), function (req, res) {
    // delete req.body.campground.rating;
    geocoder.geocode(req.body.location, function (err, data) {
        if (err || !data.length) {
            req.flash('error', 'Invalid address');
            return res.redirect('back');
        } 
        Campground.findById(req.params.id, async function(err, campground){
            if(err){
                req.flash("error", err.message);
                res.redirect("back");
            } else {
                if (req.file) {
                    try {
                        await cloudinary.v2.uploader.destroy(campground.imageId);
                        var result = await cloudinary.v2.uploader.upload(req.file.path, {angle: 'exif'});
                        campground.imageId = result.public_id;
                        campground.image = result.secure_url;
                    } catch(err) {
                        req.flash("error", err.message);
                        console.log(err);
                        return res.redirect("back");
                    }
                }
                campground.name = req.body.name;
                campground.description = req.body.description;
                campground.price = req.body.price;
                campground.lat = data[0].latitude;
                campground.lng = data[0].longitude;
                campground.location = data[0].formattedAddress;
                campground.save();
                // req.flash("success","Campground updated successfully!");
                res.redirect("/campgrounds/" + campground._id);
            }
        });
    }); 
});

// DESTROY CAMPGROUND ROUTE
router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findById(req.params.id, async function(err, campground) {
        if(err) {
          req.flash("error", err.message);
          return res.redirect("back");
        }
        try {
            await cloudinary.v2.uploader.destroy(campground.imageId);
            // await Comment.remove({"_id": {$in: campground.comments}});
            await Review.remove({"_id": {$in: campground.reviews}});
            campground.remove();
            req.flash('success', 'Campground deleted successfully!');
            res.redirect('/campgrounds');
        } catch(err) {
            if(err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
        }
    });
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;
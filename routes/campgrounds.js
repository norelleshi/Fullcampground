const express = require("express");
const router  = express.Router();
const Campground = require("../models/campground");
const Review = require("../models/review");
const User = require("../models/user");
const middleware = require("../middleware");
const NodeGeocoder = require('node-geocoder');
const multer = require('multer');
const storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
const imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
const upload = multer({ storage: storage, fileFilter: imageFilter});

const cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: process.env.Cloud_Name, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});
 
const options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
const geocoder = NodeGeocoder(options);

//INDEX - show all campgrounds
router.get("/", function(req, res){
    // eval(require('locus')); 
	let matchResult = null;
	let searchInput = null;
    if(req.query.search){
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        //Get all campgrounds from DB
        Campground.find({$or:[{name: regex}, {location: regex}, {"author.username":regex}, {price: regex}, {description: regex}]}, function(err, allCampgrounds){
          	if(err){
              	console.log(err);
          	} else {  
				let campgroundAmt = allCampgrounds.length;
				matchResult = `Found ${campgroundAmt} result${campgroundAmt === 1 ? '' : 's'} for `;
				searchInput = req.query.search;
                res.render("campgrounds/index", {campgrounds: allCampgrounds, matchResult: matchResult, searchInput: searchInput});
            }
        });
    } else {
        //Get all campgrounds from DB
        Campground.find({}, function(err, allCampgrounds){
          if(err){
              console.log(err);
          } else {
              res.render("campgrounds/index", {campgrounds: allCampgrounds, matchResult: matchResult});
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
                    res.redirect("/campgrounds/" + newlyCreated._id);
                }
            });
        });
    });    
});

//SHOW - shows more info about one campground
router.get("/:id", function(req, res){
	const publicMapKey = process.env.MAP_PUBLIC_KEY;
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
            res.render("campgrounds/show", {campground: foundCampground, publicMapKey: publicMapKey});
        }
    });
});

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
                        const result = await cloudinary.v2.uploader.upload(req.file.path, {angle: 'exif'});
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
                req.flash("success","Campground updated successfully!");
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
}

module.exports = router;
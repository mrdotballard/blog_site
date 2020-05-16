const passport = require('passport');

const authMiddleware = {};

authMiddleware.register = passport.authenticate('local.register', {

});

authMiddleware.signIn = passport.authenticate('local.signin', {
    successRedirect: '/blogs',
    failureRedirect: '/blogs',
    failureFlash: true
});

authMiddleware.isLoggedIn = (req, res, next) => {
    if(req.isAuthenticated()) 
        next();
    req.flash("error", "Plese login first");
    res.redirect("/register");
    }
module.exports = authMiddleware;

// ==============================================

var Campground = require('../models/campground');
var Comment = require('../models/comment');

// all middleware goes here

var middlewareObj = {};

middlewareObj.checkCampgroundOwnerShip = function (req, res, next) {
  if (req.isAuthenticated()) {
    // var user =
    Campground.findById(req.params.id, function (err, foundCampground) {
      if (err || !foundCampground) {
        req.flash("error", "campground not found - error returned from DB");
        res.redirect("back");
      } else {
        // does user own it?
        // does user id match acmpground authoer id
        // author.id returns mongoose object while user._id is string
        if (foundCampground.author.id.equals(req.user._id) || req.user.username == "admin") {
          // pass foundCampground back to prevous function to save querying DB again (see edit route)
          res.locals.foundCampground = foundCampground;
          next();
        } else {
          req.flash("error", "You don't have permission to do that");
          res.redirect('back');
        }
      }
    });
  } else {
    req.flash("error", "You don't have permission to do that");
    res.redirect('back');
  }
}

middlewareObj.checkCommentOwnerShip = function (req, res, next) {
  if (req.isAuthenticated()) {
    Comment.findById(req.params.comment_id, function (err, foundComment) {
      if (err || !foundComment) {
        req.flash("error", "Can not find comment - error from DB");
        res.redirect("back");
      } else {
        // does user own comment?
        // does user id match comment authoer id
        // author.id returns mongoose object while user._id is string
        if (foundComment.author.id.equals(req.user._id) || req.user.username == "admin") {
          next();
        } else {
          req.flash("error", "You can only edit your comments");
          res.redirect('back');
        }
      }
    });
  } else {
    req.flash("error", "You must be logged in edit your comments");
    res.redirect('back');
  }
}

middlewareObj.isLoggedIn = function (req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash("error", "Plese login first");
  res.redirect("/login");
}



module.exports = middlewareObj;
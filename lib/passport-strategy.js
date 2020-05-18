const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const pool = require('./database'); // use pool to get connection


passport.use(new LocalStrategy((username, password, done) => {
    pool.query("SELECT * FROM user WHERE username = ?", [username], (err, results, fields) => {
      if(err) return done(err);
    
      if(results.length < 1) return done(null, false, { message: 'No such user' });
  
      user = results[0];
  
      bcrypt.compare(password, user.password, (err, isValid) => {
        if(err) return done(err);
  
        if(!isValid)
          return done(null, false, { message: 'Incorrect password' });
  
        return done(null, user, { message: `Welcom, ${user.first_name}` });
      });
    });
  
  }));

  passport.serializeUser((user, done) => {
    console.log('here');
    done(null, user.user_id);
  });
  
  passport.deserializeUser((id, done) => {
    pool.query("SELECT * FROM user WHERE user_id = ? ", [id], (err, result) => {
      if (err) return done(err); // err from mysql
      if (result.length < 1) done(null, false); // user_id not found in user table
      done(null, result[0]); // user returned for deserializing
    });
  });

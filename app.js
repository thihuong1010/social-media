
// load modules
const express = require('express');
const exphbs = require('express-handlebars');
const mongoose = require('mongoose'); // bring mongoose 
const passport = require('passport');
const session = require("express-session");
const bodyParser = require('body-parser');
const Handlebars = require('handlebars');
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');

const cookieParser = require('cookie-parser');

const keys = require('./config/keys'); // connect to MongoURI from external file
const User = require('./models/user'); // user collection

require('./passport/google-passport'); // link gg-passport.js
require('./passport/facebook-passport'); // link facebook-passport

const app = express(); // initialize app

// express config
app.use(cookieParser());
app.use(bodyParser.urlencoded({ 
    extended: false 
}));
app.use(bodyParser.json());
app.use(session({ 
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

// set global vars for user
app.use((req, res, next) => {
    res.locals.user = req.user || null;
    next();
});

// set handlebars as view engine
app.engine('handlebars', exphbs({
    defaultLayout: 'main',
    handlebars: allowInsecurePrototypeAccess(Handlebars)
}));
app.set('view engine', 'handlebars');

// express static folder to css or activate img... bla
app.use(express.static('public'));

// connect to remote database
mongoose.Promise = global.Promise;
mongoose.connect(keys.MongoURI, {
    useNewUrlParser: true
})
.then(() => {
    console.log('Connected to Remote db...');
});

// set port, deploy || local
const port =process.env.PORT || 3000; 

// visit home page, message sent, send() method to send somethings on the screen
app.get('/', (req, res) => {
    res.render('home');
});

// bring express module
app.get('/about', (req, res) => {
    res.render('about');
});
// gg auth route
app.get('/auth/google',
  passport.authenticate('google', { 
      scope: ['profile', 'email'] 
    }));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    // Successful authentication, redirect home.
    res.redirect('/profile');
});
// facebook authenticate requests
app.get('/auth/facebook',
    passport.authenticate('facebook', { scope : ['email'] }));
app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {failureRedirect: '/'}),
    (req, res) => {
        // successful authentication, redirect home
        res.redirect('/profile');
    });

app.get('/profile', (req, res) => {
    User.findById({_id: req.user._id})
    .then((user) => {
        res.render('profile', {
            user:user
        });
    })
});

// user log out route
app.get('/logout', (req, res) => {
    req.logOut();
    res.redirect('/');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
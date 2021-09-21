// load modules
const express = require('express');
const exphbs = require('express-handlebars');
const mongoose = require('mongoose'); // bring mongoose 
const passport = require('passport');
const session = require("express-session");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

const keys = require('./config/keys'); // connect to MongoURI from external file
const User = require('./models/user'); // user collection
const user = require('./models/user');

require('./passport/google-passport'); // link gg-passport.js
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
})

// set handlebars as view engine
app.engine('handlebars', exphbs({
    defaultLayout: 'main'
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

const port =process.env.PORT || 3000; // set port, deploy || local

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
app.get('/profile', (req, res) => {
    User.findById({_id: req.user._id})
    .then((user) => {
        res.render('profile', {
            user:user
        });
    })
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
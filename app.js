
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
const methodOverride = require('method-override');

const keys = require('./config/keys'); // connect to MongoURI from external file

const User = require('./models/user'); // user collection
const Post = require('./models/post'); // post collection

require('./passport/google-passport'); // link gg-passport.js
require('./passport/facebook-passport');// link facebook-passport
// link helpers
const {
    ensureAuthentication,
    ensureGuest
} = require('./helpers/auth');
const user = require('./models/user');
const { use } = require('passport');
const post = require('./models/post');

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
app.use(methodOverride('_method'));
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
app.get('/', ensureGuest, (req, res) => {
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

//handle email post route
app.post('/addEmail', (req, res) => {
    const email = req.body.email;
    User.findById({_id: req.user._id})
    .then((user) => {
        user.email = email;
        user.save()
        .then(() => {
            res.redirect('/profile');
        });
    });
});
// handle phone post route
app.post('/addphone', (req, res) => {
    const phone = req.body.phone;
    User.findById({_id: req.user._id})
    .then((user) => {
        user.phone = phone;
        user.save()
        .then(() => {
            res.redirect('/profile');
        });
    });
});
// handle location post route
app.post('/addLocation', (req, res) => {
    const location = req.body.location;
    User.findById({_id: req.user._id})
    .then((user) => {
        user.location = location;
        user.save()
        .then(() => {
            res.redirect('/profile');
        });
    });
});
// handle get route for posts
app.get('/addPost', (req, res) => {
    res.render('addPost');
});
// handle post route for save post
app.post('/savePost', (req, res) => {
    var allowComments;
    if(req.body.allowComments) {
        allowComments = true;
    } else {
        allowComments = false;
    }
    const newPost = {
        title: req.body.title,
        body: req.body.body,
        status: req.body.status,
        allowComments: allowComments,
        user: req.user._id
    }
    new Post(newPost).save()
    .then(() => {
        res.redirect('/posts')
    });
});
// handle edit post route
app.get('/editPost/:id', (req, res) => {
    Post.findOne({_id: req.params.id})
    .then((post) => {
        res.render('editingPost', {
            post:post
        });
    });
});
//handle save comment
app.post('/addComment/:id', (req, res) => {
    Post.findOne({_id: req.params.id})
    .then((post) => {
        const newComment = {
            commentBody: req.body.commentBody,
            commentUser: req.user._id
        }
        post.comments.push(newComment)
        post.save()
        .then(() => {
            res.redirect('/posts');
        });
    });
});
// put route after edit post to save
app.put('/editingPost/:id', (req, res) => {
    Post.findOne({_id: req.params.id})
    .then((post) => {
        var allowComments;
        if(req.body.allowComments) {
            allowComments = true;
        } else {
            allowComments = false;
        }
        post.title = req.body.title;
        post.body = req.body.body;
        post.status = req.body.status;
        post.allowComments = allowComments;
        post.save()
        .then(() => {
            res.redirect('/profile');
        });
    });
});
// handle delete route
app.delete('/:id', (req, res) => {
    Post.remove({_id: req.params.id})
    .then(() => {
        res.redirect('profile');
    });
});
// handle posts route - posts after people write a status
app.get('/posts', ensureAuthentication, (req, res) => {
    Post.find({status: 'public'}) 
    .populate('user')
    .populate('comments.commentUser')
    .sort({date: 'desc'})
    .then((posts) => {
        res.render('publicPosts', {
            posts:posts
        });
    });
});
// handle profile route
app.get('/profile', ensureAuthentication, (req, res) => {
    Post.find({user: req.user._id})
    .populate('user')
    .sort({date: 'desc'}) // set last post shown first
    .then((posts) => {
        res.render('profile', {
            posts:posts
        });
    });
});
// handle users in collection route
app.get('/users', ensureAuthentication, (req, res) => {
    User.find({}).then((users) => {
        res.render('users', {
            users:users
        });
    });
});
// handle one user profile
app.get('/user/:id', (req, res) => {
    User.findById({_id: req.params.id})
    .then((user) => {
        res.render('user', {
            user:user
        });
    });
});

// user log out route
app.get('/logout', (req, res) => {
    req.logOut();
    res.redirect('/');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
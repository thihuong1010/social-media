// load modules
const express = require('express');
const exphbs = require('express-handlebars');
const mongoose = require('mongoose'); // bring mongoose 

const keys = require('./config/keys'); // connect to MongoURI from external file

const app = express(); // initialize app

// set handlebars as view engine
app.engine('handlebars', exphbs({
    defaultLayout: 'main'
}));

app.set('view engine', 'handlebars');

// express static folder to css or activate img... bla
app.use(express.static('public'));

// connect to remote database
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

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
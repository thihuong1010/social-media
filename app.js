const express = require('express');
const exphbs = require('express-handlebars');
const app = express();

// set handlebars as view engine
app.engine('handlebars', exphbs({
    defaultLayout: 'main'
}));

app.set('view engine', 'handlebars');

// express static folder to css or activate img... bla
app.use(express.static('public'));

const port = 3000;

// visit home page, message sent, send() method to send somethings on the screen
app.get('/', (req, res) => {
    res.render('home');
});

// bring express module
app.get('/about', (req, res) => {
    res.send('About page !');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
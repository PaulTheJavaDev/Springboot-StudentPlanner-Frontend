const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')));

// Direct root URL to login page
app.get('/', (req, res) => {
    res.redirect('/public/login/index.html');
});

app.listen(port);

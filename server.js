const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/modules', express.static(path.join(__dirname, 'modules')));

// Direct root URL to login page
app.get('/', (res) => {
    res.redirect('/public/login/index.html');
});

app.listen(port);

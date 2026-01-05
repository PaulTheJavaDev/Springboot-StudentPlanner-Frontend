const express = require('express');
const path = require('path');

const app = express();
const port = 3000;
const appURL = `http://localhost:${port}`;

app.use(express.json());

// Statische Dateien aus dem public-Ordner
app.use(express.static(path.join(__dirname, 'public')));

app.listen(port, () => console.log(`Server läuft auf ${appURL}`));
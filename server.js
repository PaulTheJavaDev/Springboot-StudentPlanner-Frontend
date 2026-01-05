const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());

// Statische Dateien aus dem public-Ordner
app.use(express.static(path.join(__dirname, 'public')));

app.listen(3000, () => console.log('Server läuft auf http://localhost:3000'));

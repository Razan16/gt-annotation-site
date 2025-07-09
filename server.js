const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.static('src'));

const RESULTS_FILE = 'results.csv';

app.post('/submit', (req, res) => {
  const annotations = req.body;
  const rows = annotations.map(seg => {
    return `"${seg.timestamp}","${seg.non_verbal_behavior}","${seg.evaluation || ''}","${seg.correction || ''}","${seg.comment || ''}"`;
  }).join('\n') + '\n';

  fs.appendFile(RESULTS_FILE, rows, err => {
    if (err) return res.status(500).send('Failed to save.');
    res.sendStatus(200);
  });
});

app.post('/login', (req, res) => {
  res.redirect('index.html');
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

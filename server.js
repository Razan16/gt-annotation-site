const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.static('.'));
app.use(express.json());

app.post('/submit', (req, res) => {
  const { username, results } = req.body;

  let lines = results.map((entry, idx) => {
    return `${username},${idx + 1},${entry.status},${entry.comment.replace(/"/g, '""')}`;
  });

  const output = lines.join("\n") + "\n";

  fs.appendFileSync(path.join(__dirname, 'results.csv'), output, 'utf8');
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

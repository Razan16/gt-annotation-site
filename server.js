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
  const { user, video, segments = [], subsegments = [] } = req.body;

  // Build header dynamically for up to 10 subsegments per segment
  let header = [
    '"user"',
    '"video"',
    '"segmentIndex"',
    '"segmentTitle"',
    '"mainEvaluation"',
    '"mainCorrection"',
    '"mainComment"'
  ];
  for (let i = 1; i <= 10; i++) {
    header.push(
      `"sub${i}_index"`,
      `"sub${i}_title"`,
      `"sub${i}_evaluation"`,
      `"sub${i}_correction"`,
      `"sub${i}_comment"`
    );
  }
  header = header.join(',') + '\n';

  // Add header if file is empty
  if (!fs.existsSync(RESULTS_FILE) || fs.statSync(RESULTS_FILE).size === 0) {
    fs.appendFileSync(RESULTS_FILE, header);
  }

  let rows = '';
  segments.forEach(mainSeg => {
    // Find subsegments for this main segment
    const subs = subsegments.filter(sub => sub.segmentIndex === mainSeg.segmentIndex);

    let row = [
      `"${user}"`,
      `"${video}"`,
      `"${mainSeg.segmentIndex || ''}"`,
      `"${mainSeg.topic || ''}"`,
      `"${mainSeg.evaluation || ''}"`,
      `"${mainSeg.correction || ''}"`,
      `"${mainSeg.comment || ''}"`
    ];

    // Add subsegment data (up to 10 per row)
    for (let i = 0; i < 10; i++) {
      const sub = subs[i];
      if (sub) {
        row.push(
          `"${sub.subsegmentIndex || ''}"`,
          `"${sub.topic || ''}"`,
          `"${sub.evaluation || ''}"`,
          `"${sub.correction || ''}"`,
          `"${sub.comment || ''}"`
        );
      } else {
        row.push('""', '""', '""', '""', '""');
      }
    }

    rows += row.join(',') + '\n';
  });

  fs.appendFile(RESULTS_FILE, rows, err => {
    if (err) {
      console.error('Failed to save:', err);
      return res.status(500).send('Failed to save.');
    }
    res.sendStatus(200);
  });
});

app.post('/login', (req, res) => {
  res.redirect('index.html');
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

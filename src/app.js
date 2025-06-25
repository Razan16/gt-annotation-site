let segments = [];
let currentSegment = 0;

fetch('../public/gemini_video_analysis_output_v2.json')
  .then(response => response.json())
  .then(data => {
    const transcription = data.video_analysis[0].transcription;
    segments = transcription.slice(0, 5); // only first 5 segments
    loadSegment(currentSegment);
    updateProgress();
  });

function loadSegment(index) {
  const segment = segments[index];
  const annotationDiv = document.getElementById("annotation-section");
  const videoPlayer = document.getElementById("videoPlayer");

  annotationDiv.innerHTML = "";

  const block = document.createElement("div");
  block.className = "annotation-block active";
  block.innerHTML = `
    <h3>Segment ${index + 1} of ${segments.length}</h3>
    <p><strong>Speaker:</strong> ${segment.speaker}</p>
    <p><strong>Time:</strong> ${segment.timestamp}</p>
    <p><strong>Utterance:</strong> ${segment.utterance}</p>
    <button onclick="markCorrect()">✅ Correct</button>
    <button onclick="markIncorrect()">❌ Incorrect</button>
    <div id="correctionBox" style="display:none;">
      <textarea placeholder="Enter your correction here..."></textarea>
    </div>
  `;
  annotationDiv.appendChild(block);

  // Jump video to segment timestamp
  videoPlayer.currentTime = timestampToSeconds(segment.timestamp);
}

function timestampToSeconds(ts) {
  const [min, sec] = ts.split(":").map(Number);
  return min * 60 + sec;
}

function markCorrect() {
  document.getElementById("correctionBox").style.display = "none";
}

function markIncorrect() {
  document.getElementById("correctionBox").style.display = "block";
}

function updateProgress() {
  const total = segments.length;
  document.getElementById("progressBar").textContent =
    `Segment ${currentSegment + 1} of ${total} evaluated`;
}

document.getElementById("prevSegment").onclick = () => {
  if (currentSegment > 0) {
    currentSegment--;
    loadSegment(currentSegment);
    updateProgress();
  }
};

document.getElementById("nextSegment").onclick = () => {
  if (currentSegment < segments.length - 1) {
    currentSegment++;
    loadSegment(currentSegment);
    updateProgress();
  }
};

document.getElementById("replaySegment").onclick = () => {
  const video = document.getElementById("videoPlayer");
  const timestamp = segments[currentSegment].timestamp;
  video.currentTime = timestampToSeconds(timestamp);
  video.play();
};

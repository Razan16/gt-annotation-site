let segments = [];
let currentSegment = 0;

// Load the JSON 
fetch('./public/gemini_video_analysis_output_v2.json')
  .then(response => response.json())
  .then(data => {
    const transcription = data.video_analysis[0].transcription;
    segments = transcription.slice(0, 5); // Only first 5 segments
    loadSegment(currentSegment);
    updateProgress();
  });

// Load the selected segment
function loadSegment(index) {
  const segment = segments[index];
  const annotationDiv = document.getElementById("annotation-section");
  const videoPlayer = document.getElementById("videoPlayer");

  annotationDiv.innerHTML = ""; // Clear previous segment

  const textareaId = `correctionBox-${index}`;

  const block = document.createElement("div");
  block.className = "annotation-block active";
  block.innerHTML = `
    <h3>Segment ${index + 1} of ${segments.length}</h3>
    <p><strong>Speaker:</strong> ${segment.speaker}</p>
    <p><strong>Time:</strong> ${segment.timestamp}</p>
    <p><strong>Utterance:</strong> ${segment.utterance}</p>

    <div class="button-group">
      <button onclick="markCorrect('${textareaId}')">✅ Correct</button>
      <button onclick="markIncorrect('${textareaId}')">❌ Incorrect</button>
    </div>

    <div id="${textareaId}" class="correction-box" style="display:none;">
      <textarea placeholder="Write your correction or comment..."></textarea>
    </div>
  `;

  annotationDiv.appendChild(block);

  // Sync video
  videoPlayer.currentTime = timestampToSeconds(segment.timestamp);
}

// Convert MM:SS to total seconds
function timestampToSeconds(ts) {
  const [min, sec] = ts.split(":").map(Number);
  return min * 60 + sec;
}

// Show/hide correction box
function markCorrect(textareaId) {
  document.getElementById(textareaId).style.display = "none";
}

function markIncorrect(textareaId) {
  document.getElementById(textareaId).style.display = "block";
}

// Navigation
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

function updateProgress() {
  const total = segments.length;
  document.getElementById("progressBar").textContent =
    `Segment ${currentSegment + 1} of ${total} evaluated`;
}

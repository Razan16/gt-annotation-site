let segments = [];
let currentSegment = 0;
let results = [];

const username = localStorage.getItem("annotatorName");
if (!username) {
  window.location.href = "login.html";
}

fetch('./public/gemini_video_analysis_output_v2.json')
  .then(response => response.json())
  .then(data => {
    segments = data.video_analysis[0].transcription.slice(0, 5);
    loadSegment(currentSegment);
    updateProgress();
  });

function loadSegment(index) {
  const seg = segments[index];
  const annotationDiv = document.getElementById("annotation-section");
  annotationDiv.innerHTML = "";

  const textareaId = `correction-${index}`;
  const saved = results[index] || { status: null, comment: "" };

  const block = document.createElement("div");
  block.className = "annotation-block";
  block.innerHTML = `
    <h3>Segment ${index + 1}</h3>
    <p><strong>Speaker:</strong> ${seg.speaker}</p>
    <p><strong>Time:</strong> ${seg.timestamp}</p>
    <p><strong>Utterance:</strong> ${seg.utterance}</p>

    <button onclick="markCorrect(${index})" ${saved.status === 'correct' ? 'disabled' : ''}>✅ Correct</button>
    <button onclick="markIncorrect(${index})">❌ Incorrect</button>

    <div id="${textareaId}" style="display:${saved.status === 'incorrect' ? 'block' : 'none'};">
      <textarea placeholder="Write correction..." oninput="updateComment(${index}, this.value)">${saved.comment}</textarea>
    </div>
  `;

  document.getElementById("videoPlayer").currentTime = timestampToSeconds(seg.timestamp);
  annotationDiv.appendChild(block);
}

function timestampToSeconds(ts) {
  const [min, sec] = ts.split(":").map(Number);
  return min * 60 + sec;
}

function markCorrect(index) {
  results[index] = { status: "correct", comment: "" };
  loadSegment(index);
}

function markIncorrect(index) {
  results[index] = results[index] || { status: "incorrect", comment: "" };
  results[index].status = "incorrect";
  loadSegment(index);
}

function updateComment(index, value) {
  results[index].comment = value;
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
  const ts = segments[currentSegment].timestamp;
  document.getElementById("videoPlayer").currentTime = timestampToSeconds(ts);
  document.getElementById("videoPlayer").play();
};

function updateProgress() {
  document.getElementById("progressBar").innerText = `Segment ${currentSegment + 1} of ${segments.length}`;
}

document.getElementById("submitResults").onclick = () => {
  const previousResults = JSON.parse(localStorage.getItem("results") || "{}");
  previousResults[username] = results;
  localStorage.setItem("results", JSON.stringify(previousResults));
  window.location.href = "thankyou.html";
};

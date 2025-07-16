let mainSegments = [];
let allSubsegments = [];
let currentIndex = 0;
let userName = localStorage.getItem("annotatorName") || "Unknown";
let results = [];
let subsegmentResults = [];
let selectedSubsegmentIndex = null;

function parseTimestamp(ts) {
  if (!ts) return null;
  let match = ts.match(/(\d{2}):(\d{2})/);
  if (!match) return null;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

fetch("gemini_video_analysis_output_v2.json")
  .then((res) => res.json())
  .then((data) => {
    const source = data.video_analysis[0];

    // 1. Prepare main segments (context mapping topic_shifts)
    mainSegments = source.context_mapping.topic_shifts.map((entry, i, arr) => {
      let start = parseTimestamp(entry.timestamp);
      let end = (i < arr.length - 1)
        ? parseTimestamp(arr[i + 1].timestamp)
        : null;
      return {
        topic: entry.topic,
        start,
        end,
        index: i,
        timestamp: entry.timestamp
      };
    });

    // 2. Prepare all subsegments with type and timestamp
    allSubsegments = [];
    // When building subsegments, keep all original fields for display
    if (source.non_verbal_behavior_analysis) {
      source.non_verbal_behavior_analysis.forEach((entry) => {
        entry.timestamp.split(',').forEach(ts => {
          allSubsegments.push({
            type: "Non-Verbal Behavior",
            raw: entry, // keep the full entry
            timestamp: ts.trim(),
            time: parseTimestamp(ts)
          });
        });
      });
    }
    if (source.fau_analysis) {
      source.fau_analysis.forEach((entry) => {
        allSubsegments.push({
          type: "FAU Codes",
          raw: entry,
          timestamp: entry.timestamp,
          time: parseTimestamp(entry.timestamp)
        });
      });
    }
    if (source.plutchiks_wheel_mapping) {
      source.plutchiks_wheel_mapping.forEach((entry) => {
        allSubsegments.push({
          type: "Plutchik’s Wheel",
          raw: entry,
          timestamp: entry.timestamp,
          time: parseTimestamp(entry.timestamp)
        });
      });
    }
    if (source.emotion_intensity_measurement) {
      source.emotion_intensity_measurement.forEach((entry) => {
        allSubsegments.push({
          type: "Emotional Intensity",
          raw: entry,
          timestamp: entry.timestamp,
          time: parseTimestamp(entry.timestamp)
        });
      });
    }

    // Show overall context in first segment
    if (source.context_mapping && source.context_mapping.overall_context) {
      document.getElementById("overall-context-block").innerHTML =
        `<b>Overall Context:</b> ${source.context_mapping.overall_context}`;
    }

    updateSegmentDisplay();
    updateProgressBar();
  });

function updateSegmentDisplay() {
  const segment = mainSegments[currentIndex];

  // Show the exact JSON text for this segment (timestamp + topic)
  document.getElementById("main-segment-context").textContent =
    `(${segment.timestamp}) ${segment.topic}`;

  // Only show overall context in the first segment
  document.getElementById("overall-context-block").style.display = currentIndex === 0 ? "block" : "none";

  // Find subsegments within this main segment's time window
  let subsegments = allSubsegments.filter(sub => {
    if (sub.time == null || segment.start == null) return false;
    if (segment.end !== null)
      return sub.time >= segment.start && sub.time < segment.end;
    else
      return sub.time >= segment.start;
  });

  // Render carousel (only show type and timestamp, not details)
  const carousel = document.getElementById("subsegment-carousel");
  carousel.innerHTML = subsegments.length === 0
    ? "<div style='color:#b6ccd8'>No subsegments in this range.</div>"
    : subsegments.map((sub, idx) => `
        <div class="carousel-item${selectedSubsegmentIndex === idx ? " selected-carousel-item" : ""}" 
             onclick="selectSubsegment(${idx})">
          <span class="type">${sub.type}</span>
          <span class="timestamp">${sub.raw.timestamp || ""}</span>
        </div>
      `).join("");

  // Store subsegments for this segment for selection
  window.currentSubsegments = subsegments;
  selectedSubsegmentIndex = null;
  document.getElementById("subsegment-annotation-block").style.display = "none";

  // Update counters
  document.getElementById("segment-counter").textContent = `Segment ${currentIndex + 1}/${mainSegments.length}`;
  document.getElementById("evaluation-progress").textContent = `Evaluation Progress: ${currentIndex + 1}/${mainSegments.length}`;

  document.getElementById("correction").value = "";
  document.getElementById("comment").value = "";
  clearButtonHighlights();

  const submitBtn = document.getElementById("submitBtn");
  if (submitBtn) submitBtn.style.display = currentIndex === mainSegments.length - 1 ? "block" : "none";
}

window.selectSubsegment = function(idx) {
  selectedSubsegmentIndex = idx;
  // Highlight selected
  document.querySelectorAll('.carousel-item').forEach((el, i) => {
    el.classList.toggle('selected-carousel-item', i === idx);
  });
  // Show annotation block for subsegment with details
  const sub = window.currentSubsegments[idx];
  let text = "";
  if (sub.type === "Non-Verbal Behavior") {
    text = `<b>Behavior:</b> ${sub.raw.behavior || ""}<br>
            <b>Context:</b> ${sub.raw.context || ""}<br>
            <b>Timestamp:</b> ${sub.raw.timestamp || ""}`;
  } else if (sub.type === "FAU Codes") {
    text = `<b>FAU Code:</b> ${sub.raw.fau_code || ""}<br>
            <b>Description:</b> ${sub.raw.description || ""}<br>
            <b>Linked Non-Verbal:</b> ${sub.raw.linked_non_verbal_behavior || ""}<br>
            <b>Timestamp:</b> ${sub.raw.timestamp || ""}`;
  } else if (sub.type === "Plutchik’s Wheel") {
    text = `<b>Emotion Category:</b> ${sub.raw.emotion_category || ""}<br>
            <b>Reasoning:</b> ${sub.raw.reasoning || ""}<br>
            <b>Timestamp:</b> ${sub.raw.timestamp || ""}`;
  } else if (sub.type === "Emotional Intensity") {
    text = `<b>Emotion Category:</b> ${sub.raw.emotion_category || ""}<br>
            <b>Intensity Level:</b> ${sub.raw.intensity_level || ""}<br>
            <b>Timestamp:</b> ${sub.raw.timestamp || ""}`;
  }
  const block = document.getElementById("subsegment-annotation-block");
  block.innerHTML = `
    <div class="subsegment-annotation-block">
      <div>${text}</div>
      <div class="evaluation-buttons">
        <button class="btn correct" onclick="markSubCorrect()">✔ Correct</button>
        <button class="btn incorrect" onclick="markSubIncorrect()">✘ Incorrect</button>
      </div>
      <div class="input-block">
        <label>Correction</label>
        <textarea id="sub-correction" placeholder="Suggest a correction if incorrect..."></textarea>
      </div>
      <div class="input-block">
        <label>Comment</label>
        <textarea id="sub-comment" placeholder="Add a comment..."></textarea>
      </div>
    </div>
  `;
  block.style.display = "block";
  clearSubButtonHighlights();
};

function markSubCorrect() {
  clearSubButtonHighlights();
  document.querySelector("#subsegment-annotation-block .btn.correct").classList.add("active");
}
function markSubIncorrect() {
  clearSubButtonHighlights();
  document.querySelector("#subsegment-annotation-block .btn.incorrect").classList.add("active");
}
function clearSubButtonHighlights() {
  document.querySelectorAll("#subsegment-annotation-block .evaluation-buttons .btn").forEach((btn) => {
    btn.classList.remove("active");
  });
}

function nextSegment() {
  saveCurrentEvaluation();
  saveCurrentSubsegmentEvaluation();
  if (currentIndex < mainSegments.length - 1) {
    currentIndex++;
    updateSegmentDisplay();
    updateProgressBar();
  }
}
function previousSegment() {
  saveCurrentEvaluation();
  saveCurrentSubsegmentEvaluation();
  if (currentIndex > 0) {
    currentIndex--;
    updateSegmentDisplay();
    updateProgressBar();
  }
}
function replaySegment() {
  const video = document.getElementById("segmentVideo");
  if (video) {
    video.currentTime = Math.max(video.currentTime - 2, 0);
    video.play();
  }
}
function markCorrect() {
  clearButtonHighlights();
  document.querySelector(".btn.correct").classList.add("active");
}
function markIncorrect() {
  clearButtonHighlights();
  document.querySelector(".btn.incorrect").classList.add("active");
}
function clearButtonHighlights() {
  document.querySelectorAll(".evaluation-buttons .btn").forEach((btn) => {
    btn.classList.remove("active");
  });
}
function updateProgressBar() {
  // No progress bar, but keep for compatibility
}
function saveCurrentEvaluation() {
  const segment = mainSegments[currentIndex];
  const isCorrect = document.querySelector("#main-segment-annotation-block .btn.correct.active") !== null;
  const isIncorrect = document.querySelector("#main-segment-annotation-block .btn.incorrect.active") !== null;
  const correction = document.getElementById("correction").value.trim();
  const comment = document.getElementById("comment").value.trim();

  results[currentIndex] = {
    user: userName,
    segmentIndex: currentIndex + 1,
    type: "Context Mapping",
    timestamp: segment.timestamp,
    topic: segment.topic,
    evaluation: isCorrect ? "Correct" : isIncorrect ? "Incorrect" : "Not Marked",
    correction: correction,
    comment: comment,
  };
}
function saveCurrentSubsegmentEvaluation() {
  if (selectedSubsegmentIndex === null) return;
  const sub = window.currentSubsegments[selectedSubsegmentIndex];
  const isCorrect = document.querySelector("#subsegment-annotation-block .btn.correct.active") !== null;
  const isIncorrect = document.querySelector("#subsegment-annotation-block .btn.incorrect.active") !== null;
  const correction = document.getElementById("sub-correction").value.trim();
  const comment = document.getElementById("sub-comment").value.trim();

  subsegmentResults[currentIndex] = subsegmentResults[currentIndex] || [];
  subsegmentResults[currentIndex][selectedSubsegmentIndex] = {
    user: userName,
    segmentIndex: currentIndex + 1,
    subsegmentIndex: selectedSubsegmentIndex + 1,
    type: sub.type,
    timestamp: sub.timestamp,
    content: sub.content,
    evaluation: isCorrect ? "Correct" : isIncorrect ? "Incorrect" : "Not Marked",
    correction: correction,
    comment: comment,
  };
}

function submitEvaluation() {
  saveCurrentEvaluation();
  saveCurrentSubsegmentEvaluation();
  fetch("/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ main: results, subsegments: subsegmentResults }),
  })
    .then((res) => {
      if (res.ok) window.location.href = "thankyou.html";
      else alert("Submission failed.");
    })
    .catch((err) => {
      console.error("Submission error:", err);
      alert("Error submitting data.");
    });
}

// Place this at the end of your JS file, after DOM is loaded

document.addEventListener("DOMContentLoaded", function () {
  const showBtn = document.getElementById("show-help-btn");
  const helpBox = document.getElementById("help-images-box");
  const closeBtn = document.getElementById("close-help-btn");

  if (showBtn && helpBox && closeBtn) {
    showBtn.addEventListener("click", function () {
      helpBox.style.display = "flex";
      window.scrollTo({ top: helpBox.offsetTop - 40, behavior: "smooth" });
    });
    closeBtn.addEventListener("click", function () {
      helpBox.style.display = "none";
    });
  }

  // Image enlarge logic
  document.querySelectorAll('.help-img').forEach(img => {
    img.addEventListener('click', function () {
      showImageModal(this.src, this.alt);
    });
  });
});

// Modal logic
function showImageModal(src, alt) {
  let modal = document.getElementById('image-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'image-modal';
    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-content">
        <button class="modal-close" title="Close">&times;</button>
        <img src="" alt="" class="modal-img" />
        <div class="modal-caption"></div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('.modal-close').onclick = () => modal.style.display = 'none';
    modal.querySelector('.modal-backdrop').onclick = () => modal.style.display = 'none';
  }
  modal.querySelector('.modal-img').src = src;
  modal.querySelector('.modal-img').alt = alt;
  modal.querySelector('.modal-caption').textContent = alt;
  modal.style.display = 'flex';
}
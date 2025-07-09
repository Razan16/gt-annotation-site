let segments = [];
let currentIndex = 0;
let userName = localStorage.getItem("userName") || "Unknown";
let results = [];

// Load JSON segments and split into logical sub-segments
fetch("gemini_video_analysis_output_v2.json")
  .then((res) => res.json())
  .then((data) => {
    const source = data.video_analysis[0];
    segments = [];

    // Create segments from all data fields
    source.non_verbal_behavior_analysis.forEach((entry, i) => {
      segments.push({
        type: "Nonverbal Behavior",
        content: `${entry.behavior}: ${entry.context} (${entry.timestamp})`,
        timestamp: entry.timestamp,
      });
    });

    source.context_mapping.topic_shifts.forEach((entry) => {
      segments.push({
        type: "Topic Shift",
        content: `${entry.topic} (${entry.timestamp})`,
        timestamp: entry.timestamp,
      });
    });

    source.fau_analysis.forEach((entry) => {
      segments.push({
        type: "FAU Analysis",
        content: `${entry.fau_code}: ${entry.description} — Linked to ${entry.linked_non_verbal_behavior} (${entry.timestamp})`,
        timestamp: entry.timestamp,
      });
    });

    source.plutchiks_wheel_mapping.forEach((entry) => {
      segments.push({
        type: "Plutchik Emotion Mapping",
        content: `${entry.emotion_category}: ${entry.reasoning} (${entry.timestamp})`,
        timestamp: entry.timestamp,
      });
    });

    source.emotion_intensity_measurement.forEach((entry) => {
      segments.push({
        type: "Emotion Intensity",
        content: `${entry.emotion_category} — Intensity: ${entry.intensity_level} (${entry.timestamp})`,
        timestamp: entry.timestamp,
      });
    });

    updateSegmentDisplay();
    updateProgressBar();
  });

// Display one segment at a time
function updateSegmentDisplay() {
  const segment = segments[currentIndex];

  document.getElementById("timestamp").textContent = segment.timestamp || "N/A";
  document.getElementById("nonverbal-behavior-text").textContent = `${segment.type}\n\n${segment.content}`;
  document.getElementById("segment-counter").textContent = `Segment ${currentIndex + 1}/${segments.length}`;
  document.getElementById("evaluation-progress").textContent = `Evaluation Progress: ${currentIndex + 1}/${segments.length}`;

  document.getElementById("correction").value = "";
  document.getElementById("comment").value = "";
  clearButtonHighlights();

  const submitBtn = document.getElementById("submitBtn");
  if (submitBtn) submitBtn.style.display = currentIndex === segments.length - 1 ? "block" : "none";
}

function nextSegment() {
  if (currentIndex < segments.length - 1) {
    saveCurrentEvaluation();
    currentIndex++;
    updateSegmentDisplay();
    updateProgressBar();
  }
}

function previousSegment() {
  if (currentIndex > 0) {
    saveCurrentEvaluation();
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
  const bar = document.getElementById("overallProgress");
  bar.max = segments.length;
  bar.value = currentIndex + 1;
}

function saveCurrentEvaluation() {
  const segment = segments[currentIndex];
  const isCorrect = document.querySelector(".btn.correct.active") !== null;
  const isIncorrect = document.querySelector(".btn.incorrect.active") !== null;
  const correction = document.getElementById("correction").value.trim();
  const comment = document.getElementById("comment").value.trim();

  results[currentIndex] = {
    user: userName,
    segmentIndex: currentIndex + 1,
    type: segment.type,
    timestamp: segment.timestamp,
    content: segment.content,
    evaluation: isCorrect ? "Correct" : isIncorrect ? "Incorrect" : "Not Marked",
    correction: correction,
    comment: comment,
  };
}

function submitEvaluation() {
  saveCurrentEvaluation();
  fetch("/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(results),
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

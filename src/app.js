let mainSegments = [];
let allSubsegments = [];
let currentIndex = 0;
let userName = localStorage.getItem("annotatorName") || "Unknown";
let results = [];
let subsegmentResults = [];
let selectedSubsegmentIndex = null;

// Helper: parse timestamp "HH:MM:SS.xxx" to seconds
function parseTimestamp(ts) {
  if (!ts) return null;
  let match = ts.match(/(\d{2}):(\d{2}):(\d{2})/);
  if (!match) return null;
  return (
    parseInt(match[1], 10) * 3600 +
    parseInt(match[2], 10) * 60 +
    parseInt(match[3], 10)
  );
}

// Load new JSON 
fetch("gemini_video_analysis_output_v2.json")
  .then((res) => res.json())
  .then((data) => {
    mainSegments = data.segments.map((seg, i) => ({
      topic: seg.topic,
      context: seg.context,
      timestamp_start: seg.timestamp_start,
      timestamp_end: seg.timestamp_end,
      index: i,
      segment_id: seg.segment_id,
    }));

    // Flatten all subsegments for carousel
    allSubsegments = [];
    data.segments.forEach((seg, segIdx) => {
      // Non-Verbal Behavior
      (seg.non_verbal_behavior_analysis || []).forEach((entry) => {
        allSubsegments.push({
          type: "Non-Verbal Behavior",
          raw: entry,
          timestamp: entry.timestamp,
          time: parseTimestamp(entry.timestamp),
          segmentIndex: segIdx,
        });
      });
      // FAU Analysis
      (seg.fau_analysis || []).forEach((entry) => {
        allSubsegments.push({
          type: "FAU Codes",
          raw: entry,
          timestamp: entry.timestamp,
          time: parseTimestamp(entry.timestamp),
          segmentIndex: segIdx,
        });
      });
      // Plutchik's Wheel
      (seg.plutchiks_wheel_mapping || []).forEach((entry) => {
        allSubsegments.push({
          type: "Plutchik’s Wheel",
          raw: entry,
          timestamp: entry.timestamp,
          time: parseTimestamp(entry.timestamp),
          segmentIndex: segIdx,
        });
      });
      // Emotion Intensity
      (seg.emotion_intensity_measurement || []).forEach((entry) => {
        allSubsegments.push({
          type: "Emotional Intensity",
          raw: entry,
          timestamp: entry.timestamp,
          time: parseTimestamp(entry.timestamp),
          segmentIndex: segIdx,
        });
      });
    });

    // Add overall context text (custom text as requested)
    document.getElementById("overall-context-block").innerHTML =
      `<b>Overall Context:</b> The human (Gina) is participating in the final session of a multi-week wellness program facilitated by the Jibo robot. The session involves Jibo recapping topics covered (gratitude, meaningful connections, self-compassion, character strengths) and asking for feedback. There are initial technical difficulties with Jibo, which resolve before the main part of the session.`;

    // Set currentIndex and update UI
    currentIndex = 0;
    updateSegmentDisplay();
    updateProgressText(); // <-- update progress text after loading

    // Debug: Check mainSegments
    console.log("mainSegments loaded:", mainSegments.length, mainSegments);
  });

function updateSegmentDisplay() {
  const segment = mainSegments[currentIndex];
  document.getElementById("main-segment-context").innerHTML =
    `<b>${segment.topic}</b> <span style="color:#b6ccd8;">(${segment.timestamp_start} - ${segment.timestamp_end})</span><br>
     <span style="color:#b6ccd8;">${segment.context || ""}</span>`;

  document.getElementById("overall-context-block").style.display = currentIndex === 0 ? "block" : "none";
  document.getElementById("subsegment-carousel").innerHTML = "";
  document.getElementById("subsegment-annotation-block").style.display = "none";

  window.currentSubsegments = allSubsegments.filter(
    (sub) => sub.segmentIndex === currentIndex
  );
  selectedSubsegmentIndex = null;

  updateProgressText();

  // Restore main segment answers
  const mainResult = results[currentIndex];
  if (mainResult) {
    document.getElementById("correction").value = mainResult.correction || "";
    document.getElementById("comment").value = mainResult.comment || "";
    clearButtonHighlights();
    if (mainResult.evaluation === "Correct") {
      document.querySelector("#main-segment-annotation-block .btn.correct").classList.add("active");
    } else if (mainResult.evaluation === "Incorrect") {
      document.querySelector("#main-segment-annotation-block .btn.incorrect").classList.add("active");
    }
  } else {
    document.getElementById("correction").value = "";
    document.getElementById("comment").value = "";
    clearButtonHighlights();
  }

  const submitBtn = document.getElementById("submitBtn");
  if (submitBtn) submitBtn.style.display = currentIndex === mainSegments.length - 1 ? "block" : "none";

  const nextBtn = document.getElementById("next-segment-btn");
  if (nextBtn) nextBtn.style.display = currentIndex === mainSegments.length - 1 ? "none" : "inline-block";

  // Render subsegments in columns below all boxes, incollapsed
  renderAllSubsegmentsColumns();

  // Restore subsegment answers after rendering
  if (subsegmentResults[currentIndex]) {
    subsegmentResults[currentIndex].forEach((subRes, subIdx) => {
      if (!subRes) return;
      const subItem = document.querySelector(`.subsegment-item[data-subidx="${subIdx}"]`);
      if (subItem) {
        subItem.querySelector(`#sub-correction-${subIdx}`).value = subRes.correction || "";
        subItem.querySelector(`#sub-comment-${subIdx}`).value = subRes.comment || "";
        subItem.querySelectorAll(".btn").forEach(btn => btn.classList.remove("active"));
        if (subRes.evaluation === "Correct") {
          subItem.querySelector(".btn.correct").classList.add("active");
        } else if (subRes.evaluation === "Incorrect") {
          subItem.querySelector(".btn.incorrect").classList.add("active");
        }
      }
    });
  }
}

// Add this function to render subsegments in columns, each with full evaluation UI
function renderAllSubsegmentsColumns() {
  const container = document.getElementById("all-subsegments-container");
  if (!container) return;
  container.innerHTML = "";

  // Only show subsegments for the current segment
  const segment = mainSegments[currentIndex];
  const subsegments = allSubsegments.filter(sub => sub.segmentIndex === currentIndex);

  if (subsegments.length === 0) {
    container.innerHTML = `<div class="subsegment-column">
      <div style="color:#b6ccd8; font-size:1.2em; text-align:center; padding:2em;">
        No subsegments for this segment.
      </div>
    </div>`;
    return;
  }

  // Split subsegments into up to 4 columns
  const numColumns = Math.min(4, subsegments.length || 1);
  const columns = Array.from({ length: numColumns }, () => []);
  subsegments.forEach((sub, idx) => {
    columns[idx % numColumns].push({ ...sub, idx });
  });

  // Create columns
  columns.forEach(col => {
    const colDiv = document.createElement("div");
    colDiv.className = "subsegment-column";
    col.forEach(sub => {
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
                <b>Primary Emotion:</b> ${sub.raw.primary_emotion || ""}<br>
                <b>Secondary Dyad:</b> ${sub.raw.secondary_dyad || ""}<br>
                <b>Timestamp:</b> ${sub.raw.timestamp || ""}`;
      } else if (sub.type === "Emotional Intensity") {
        text = `<b>Emotion Category:</b> ${sub.raw.emotion_category || ""}<br>
                <b>Intensity Level:</b> ${sub.raw.intensity_level || ""}<br>
                <b>Justification:</b> ${sub.raw.justification || ""}<br>
                <b>Timestamp:</b> ${sub.raw.timestamp || ""}`;
      }
      colDiv.innerHTML += `
        <div class="subsegment-item" data-subidx="${sub.idx}">
          <div>${text}</div>
          <div class="evaluation-buttons">
            <button type="button" class="btn correct" onclick="markSubCorrectColumn(${sub.idx})">✔ Correct</button>
            <button type="button" class="btn incorrect" onclick="markSubIncorrectColumn(${sub.idx})">✘ Incorrect</button>
          </div>
          <div class="input-block">
            <label for="sub-correction-${sub.idx}">Correction</label>
            <textarea id="sub-correction-${sub.idx}" placeholder="Suggest a correction if incorrect..."></textarea>
          </div>
          <div class="input-block">
            <label for="sub-comment-${sub.idx}">Comment</label>
            <textarea id="sub-comment-${sub.idx}" placeholder="Add a comment..."></textarea>
          </div>
        </div>
      `;
    });
    container.appendChild(colDiv);
  });
}

// Button highlight logic remains unchanged
window.markSubCorrectColumn = function(idx) {
  document.querySelectorAll(`.subsegment-item[data-subidx="${idx}"] .btn`).forEach(btn => btn.classList.remove("active"));
  document.querySelector(`.subsegment-item[data-subidx="${idx}"] .btn.correct`).classList.add("active");
};
window.markSubIncorrectColumn = function(idx) {
  document.querySelectorAll(`.subsegment-item[data-subidx="${idx}"] .btn`).forEach(btn => btn.classList.remove("active"));
  document.querySelector(`.subsegment-item[data-subidx="${idx}"] .btn.incorrect`).classList.add("active");
};

function nextSegment() {
  if (!isCurrentSegmentComplete()) {
    alert("Please complete all evaluations (Correct/Incorrect) for the segment and its subsegments before proceeding.");
    return;
  }
  saveCurrentEvaluation();
  saveCurrentSubsegmentEvaluation();
  if (currentIndex < mainSegments.length - 1) {
    currentIndex++;
    updateSegmentDisplay();
    updateProgressText();
  }
}
function previousSegment() {
  saveCurrentEvaluation();
  saveCurrentSubsegmentEvaluation();
  if (currentIndex > 0) {
    currentIndex--;
    updateSegmentDisplay();
    updateProgressText(); // <-- update progress text after navigation
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
  const progressBar = document.getElementById("progress-bar");
  if (progressBar && mainSegments.length > 0) {
    progressBar.value = currentIndex + 1;
    progressBar.max = mainSegments.length;
  }
  const progressInfo = document.getElementById("evaluation-progress");
  if (progressInfo) {
    progressInfo.textContent = `Evaluation Progress: ${mainSegments.length === 0 ? 0 : currentIndex + 1}/${mainSegments.length}`;
  }
}
function updateProgressText() {
  // This function updates the progress info text at the top of the page
  const progressInfo = document.getElementById("evaluation-progress");
  if (progressInfo) {
    // If there are no segments, show 0/0
    if (!mainSegments || mainSegments.length === 0) {
      progressInfo.textContent = "Evaluation Progress: 0/0";
    } else {
      progressInfo.textContent = `Evaluation Progress: ${currentIndex + 1}/${mainSegments.length}`;
    }
  }
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

function isCurrentSegmentComplete(showHighlight = false) {
  let incomplete = [];

  // Check main segment
  const mainBlock = document.getElementById("main-segment-annotation-block");
  const mainCorrect = mainBlock.querySelector(".btn.correct.active");
  const mainIncorrect = mainBlock.querySelector(".btn.incorrect.active");
  if (!mainCorrect && !mainIncorrect) {
    incomplete.push({ type: "main", element: mainBlock });
  }

  // Check all subsegments in columns
  const subItems = document.querySelectorAll(".subsegment-item");
  subItems.forEach((item, idx) => {
    const correct = item.querySelector(".btn.correct.active");
    const incorrect = item.querySelector(".btn.incorrect.active");
    if (!correct && !incorrect) {
      incomplete.push({ type: "sub", element: item, idx });
    }
  });

  // Highlight incomplete items if requested
  if (showHighlight) {
    // Remove previous alerts
    document.querySelectorAll('.missing-alert').forEach(e => e.remove());
    incomplete.forEach(obj => {
      let alertDiv = document.createElement("div");
      alertDiv.className = "missing-alert";
      alertDiv.style.cssText = "color:#fff; background:#b92b27; border-radius:6px; padding:0.5em 1em; margin:0.7em 0; font-weight:bold; text-align:center;";
      alertDiv.textContent = obj.type === "main"
        ? "Please evaluate the main segment (Correct/Incorrect)!"
        : `Please evaluate subsegment #${obj.idx + 1} (Correct/Incorrect)!`;
      obj.element.prepend(alertDiv);
    });
  }

  return incomplete.length === 0;
}

// Prevent next/submit if not complete, highlight missing
function nextSegment() {
  if (!isCurrentSegmentComplete(true)) {
    return;
  }
  saveCurrentEvaluation();
  saveCurrentSubsegmentEvaluation();
  if (currentIndex < mainSegments.length - 1) {
    currentIndex++;
    updateSegmentDisplay();
    updateProgressText();
  }
}

function submitEvaluation() {
  if (!isCurrentSegmentComplete(true)) {
    return;
  }
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
  const helpImages = document.querySelectorAll('.help-img');

  if (showBtn) {
    showBtn.addEventListener("click", function () {
      // Open a new window with both help images and their titles
      const html = `
        <html>
        <head>
          <title>Help & Reference</title>
          <style>
            body { background:#1c2b33; color:#fff; font-family:sans-serif; margin:0; padding:2em; }
            .help-title { text-align:center; font-weight:bold; color:#66b0ff; margin-bottom:0.5em; font-size:1.2em; }
            img { max-width:90%; max-height:350px; display:block; margin:0 auto 2em auto; border-radius:10px; box-shadow:0 0 16px #0008; }
            .caption { text-align:center; font-size:1.3em; color:#66b0ff; margin-bottom:1em; }
          </style>
        </head>
        <body>
          <div class="caption">Help & Reference</div>
          ${Array.from(helpImages).map(img => {
            const title = img.closest('div').querySelector('.help-title')?.textContent || '';
            return `
              <div>
                <div class="help-title">${title}</div>
                <img src="${img.src}" alt="${title}" />
              </div>
            `;
          }).join('')}
        </body>
        </html>
      `;
      const win = window.open("", "_blank", "width=950,height=700");
      win.document.write(html);
      win.document.close();
    });
  }

  helpImages.forEach(img => {
    img.addEventListener('click', function () {
      showImageModal(this.src, this.alt);
    });
  });
});

// Single image modal logic (for clicking individual images)
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
  modal.querySelector('.modal-content').innerHTML = `
    <button class="modal-close" title="Close">&times;</button>
    <img src="${src}" alt="${alt}" class="modal-img" style="max-width:90%; max-height:350px; display:block; margin:0 auto; border-radius:10px; box-shadow:0 0 16px #0008;">
    <div class="modal-caption" style="text-align:center; font-weight:bold; color:#66b0ff; margin-top:1em;">${alt}</div>
  `;
  modal.querySelector('.modal-close').onclick = () => modal.style.display = 'none';
  modal.style.display = 'flex';
}

document.addEventListener("DOMContentLoaded", function () {
  // Main menu/side menu logic
  const mainMenu = document.getElementById('mainMenu');
  const sideMenu = document.getElementById('sideMenu');
  const closeBtn = document.getElementById('closeSideMenu');
  mainMenu.onclick = function() {
    sideMenu.classList.add('open');
  };
  closeBtn.onclick = function() {
    sideMenu.classList.remove('open');
  };
  document.addEventListener('click', function(e) {
    if (!sideMenu.contains(e.target) && !mainMenu.contains(e.target)) {
      sideMenu.classList.remove('open');
    }
  });

  // Collapsible completed videos
  const completedToggle = document.getElementById('completedToggle');
  const completedList = document.getElementById('completed-list');
  const completedArrow = document.getElementById('completedArrow');
  completedToggle.onclick = function() {
    const isOpen = completedList.style.display === "block";
    completedList.style.display = isOpen ? "none" : "block";
    completedArrow.style.transform = isOpen ? "rotate(0deg)" : "rotate(90deg)";
  };

  // Render completed videos from localStorage
  function getCompletedVideos() {
    try {
      return JSON.parse(localStorage.getItem('completedVideos') || "[]");
    } catch {
      return [];
    }
  }
  function renderCompletedVideos() {
    const completed = getCompletedVideos();
    completedList.innerHTML = completed.length
      ? completed.map(v => `<li>${v}</li>`).join("")
      : `<li style="color:#888;font-style:italic;">No videos completed yet.</li>`;
  }
  renderCompletedVideos();

  // Video list logic (your existing code)
  const videoList = document.getElementById("video-list");

  // Video 1 is active, rest are "coming soon"
  const videos = [
    {
      id: 1,
      name: "Gemini Video Analysis",
      file: "public/gemini_video_analysis_output_v2.json",
      active: true
    }
  ];

  // Add placeholders for videos 2-200
  for (let i = 2; i <= 200; i++) {
    videos.push({
      id: i,
      name: `Video ${i}`,
      file: null,
      active: false
    });
  }

  videos.forEach(video => {
    const btn = document.createElement("button");
    btn.className = "video-btn" + (video.active ? "" : " soon-btn");
    btn.innerHTML = `<span class="video-icon"></span> ${video.name}${video.active ? " (Active)" : " (Coming Soon)"}`;
    if (video.active) {
      btn.onclick = () => {
        window.location.href = `index.html?video=${video.id}`;
      };
    } else {
      btn.disabled = true;
    }
    videoList.appendChild(btn);
  });

  // Example: Mark video as completed
  function markVideoCompleted(videoName) {
    let completed = [];
    try {
      completed = JSON.parse(localStorage.getItem('completedVideos') || "[]");
    } catch {}
    if (!completed.includes(videoName)) {
      completed.push(videoName);
      localStorage.setItem('completedVideos', JSON.stringify(completed));
    }
  }
});
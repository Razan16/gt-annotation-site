document.addEventListener("DOMContentLoaded", function () {
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
    btn.innerHTML = `<span class="video-icon">&#128250;</span> ${video.name}${video.active ? " (Active)" : " (Coming Soon)"}`;
    if (video.active) {
      btn.onclick = () => {
        window.location.href = `index.html?video=${video.id}`;
      };
    } else {
      btn.disabled = true;
    }
    videoList.appendChild(btn);
  });
});
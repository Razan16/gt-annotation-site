document.getElementById("startBtn").onclick = function () {
  const name = document.getElementById("username").value.trim();
  if (name) {
    localStorage.setItem("annotatorName", name);
    window.location.href = "main.html";
  } else {
    alert("Please enter your name.");
  }
};

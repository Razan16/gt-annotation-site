document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  if (username) {
    localStorage.setItem("annotatorName", username);
    window.location.href = "index.html";
  }
});

let countdownInterval;

document.getElementById("startFocus").addEventListener("click", () => {
  const duration = parseInt(document.getElementById("duration").value);
  const startTime = Date.now();

  chrome.storage.local.set({
    focusStart: startTime,
    focusDuration: duration
  });

  chrome.alarms.create("focusReminder", { periodInMinutes: duration });
  alert("Focus session started!");

  startCountdown(startTime, duration);
  updateStats();
});

document.getElementById("stopFocus").addEventListener("click", () => {
  chrome.alarms.clear("focusReminder");
  chrome.storage.local.remove(["focusStart", "focusDuration"]);
  alert("Focus session stopped.");
  clearInterval(countdownInterval);
  document.getElementById("countdown").textContent = "";
});

function startCountdown(startTime, duration) {
  const endTime = startTime + duration * 60000;

  clearInterval(countdownInterval); // prevent multiple intervals
  countdownInterval = setInterval(() => {
    const remaining = endTime - Date.now();
    if (remaining <= 0) {
      clearInterval(countdownInterval);
      document.getElementById("countdown").textContent = "Session complete!";
    } else {
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      document.getElementById("countdown").textContent = `Time left: ${mins}m ${secs}s`;
    }
  }, 1000);
}

// 🕒 When popup opens, check if session is active
window.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(["focusStart", "focusDuration"], (data) => {
    if (data.focusStart && data.focusDuration) {
      startCountdown(data.focusStart, data.focusDuration);
    }
    updateStats();
  });
});

function updateStats() {
  const today = new Date().toDateString();

  chrome.storage.local.get(["sessionCount", "lastSessionDate"], (data) => {
    let count = data.sessionCount || 0;
    const lastDate = data.lastSessionDate;

    if (lastDate !== today) {
      count = 0;
      chrome.storage.local.set({ sessionCount: 0, lastSessionDate: today });
    }

    document.getElementById("stats").textContent = `Sessions today: ${count}`;
  });
}
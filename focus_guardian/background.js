const DISTRACTION_SITES = ["youtube.com", "instagram.com", "reddit.com", "netflix.com"];

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "focusReminder") {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: "Focus Guardian",
      message: "Focus session complete! Time for a break 🧘",
      priority: 2
    });

    const today = new Date().toDateString();

    chrome.storage.local.get(["sessionCount", "lastSessionDate"], (data) => {
      let count = data.sessionCount || 0;
      const lastDate = data.lastSessionDate;

      if (lastDate !== today) {
        count = 0;
      }

      const newCount = count + 1;
      chrome.storage.local.set({
        sessionCount: newCount,
        lastSessionDate: today
      });
    });

    // ✅ Clean up everything
    chrome.alarms.clear("focusReminder"); // ← this ensures no repeat
    chrome.storage.local.remove(["focusStart", "focusDuration", "focusEndTime"]);
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    for (let site of DISTRACTION_SITES) {
      if (tab.url.includes(site)) {
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icons/icon48.png",
          title: "Focus Guardian",
          message: `You're on ${site}. Time to refocus! 💪`,
          priority: 2
        });
        break;
      }
    }
  }
});

let focusEndTime = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "startFocus") {
    const duration = message.duration;
    focusEndTime = Date.now() + duration * 60000;

    chrome.alarms.create("focusReminder", { periodInMinutes: duration });
    chrome.storage.local.set({ focusStart: Date.now(), focusDuration: duration, focusEndTime });

    sendResponse({ status: "started" });
  }

  if (message.type === "stopFocus") {
    chrome.alarms.clear("focusReminder");
    focusEndTime = null;
    chrome.storage.local.remove(["focusStart", "focusDuration", "focusEndTime"]);
    sendResponse({ status: "stopped" });
  }

  if (message.type === "getCountdown") {
    const remaining = focusEndTime ? focusEndTime - Date.now() : 0;
    sendResponse({ remaining });
  }
});
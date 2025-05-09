// Instead of ES module import, we'll use these functions directly from utils.js
// import { fetchUserGroups, startCollection, stopCollection, exportData } from "./utils.js"

// DOM Elements
const authButton = document.getElementById("auth-button")
const statusText = document.getElementById("status-text")
const mainContent = document.getElementById("main-content")
const groupsList = document.getElementById("groups-list")
const groupSearch = document.getElementById("group-search")
const selectAllBtn = document.getElementById("select-all")
const deselectAllBtn = document.getElementById("deselect-all")
const postsPerGroup = document.getElementById("posts-per-group")
const includeComments = document.getElementById("include-comments")
const useMockData = document.getElementById("use-mock-data")
const startCollectionBtn = document.getElementById("start-collection")
const exportDataBtn = document.getElementById("export-data")
const stopCollectionBtn = document.getElementById("stop-collection")
const collectionStatus = document.getElementById("collection-status")
const progressFill = document.getElementById("progress-fill")
const progressText = document.getElementById("progress-text")
const currentAction = document.getElementById("current-action")

// State
let isLoggedIn = false
let isCollecting = false
let groups = []
let collectedData = []

// Initialize
document.addEventListener("DOMContentLoaded", init)

async function init() {
  console.log("Popup initialized");
  
  // Check login status
  chrome.storage.local.get(["fbAuthToken", "fbUserID"], (result) => {
    console.log("Checking login status:", result.fbAuthToken ? "Token found" : "No token", 
                result.fbUserID ? "User ID found" : "No user ID");
    
    if (result.fbAuthToken && result.fbUserID) {
      console.log("User is logged in, updating UI");
      updateLoginStatus(true)
      loadGroups()
    } else {
      console.log("User is not logged in");
      updateLoginStatus(false)
    }
  })

  // Check if collection is in progress
  chrome.storage.local.get(["isCollecting", "collectionProgress"], (result) => {
    if (result.isCollecting) {
      isCollecting = true
      updateCollectionUI(result.collectionProgress || 0)
    }
  })

  // Check if data is available for export
  chrome.storage.local.get(["collectedData"], (result) => {
    if (result.collectedData && result.collectedData.length > 0) {
      collectedData = result.collectedData
      exportDataBtn.disabled = false
    }
  })

  // Set up event listeners
  setupEventListeners()
}

function setupEventListeners() {
  // Auth button
  authButton.addEventListener("click", handleAuth)

  // Group search
  groupSearch.addEventListener("input", filterGroups)

  // Select/Deselect all
  selectAllBtn.addEventListener("click", () => toggleAllGroups(true))
  deselectAllBtn.addEventListener("click", () => toggleAllGroups(false))

  // Posts per group validation
  postsPerGroup.addEventListener("change", () => {
    const value = Number.parseInt(postsPerGroup.value)
    if (isNaN(value) || value < 1) postsPerGroup.value = 1
    if (value > 1000) postsPerGroup.value = 1000
  })

  // Start collection
  startCollectionBtn.addEventListener("click", handleStartCollection)

  // Stop collection
  stopCollectionBtn.addEventListener("click", handleStopCollection)

  // Export data
  exportDataBtn.addEventListener("click", handleExportData)

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener(handleMessages)
}

function handleAuth() {
  if (isLoggedIn) {
    console.log("Logging out");
    // Log out
    chrome.storage.local.remove(["fbAuthToken", "fbUserID"], () => {
      console.log("Logged out, auth data removed");
      updateLoginStatus(false)
    })
  } else {
    console.log("Starting login process");
    // Open Facebook login page
    chrome.tabs.create({ url: "https://www.facebook.com/", active: true }, (tab) => {
      console.log("Facebook tab created, waiting for page to load");
      
      // Wait for the page to load before injecting the auth script
      setTimeout(() => {
        console.log("Injecting auth script");
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["auth.js"],
        }, (results) => {
          if (chrome.runtime.lastError) {
            console.error("Error injecting auth script:", chrome.runtime.lastError);
          } else {
            console.log("Auth script injected successfully");
          }
        });
      }, 3000); // Wait 3 seconds for the page to load
    })
  }
}

function updateLoginStatus(loggedIn) {
  isLoggedIn = loggedIn
  statusText.textContent = loggedIn ? "Logged in" : "Not logged in"
  authButton.textContent = loggedIn ? "Logout" : "Login with Facebook"
  mainContent.classList.toggle("hidden", !loggedIn)
}

async function loadGroups() {
  try {
    groups = await fetchUserGroups()
    renderGroups(groups)
  } catch (error) {
    groupsList.innerHTML = `<div class="error">Error loading groups: ${error.message}</div>`
    console.error("Error loading groups:", error)
  }
}

function renderGroups(groupsToRender) {
  if (groupsToRender.length === 0) {
    groupsList.innerHTML = '<div class="loading">No groups found</div>'
    return
  }

  groupsList.innerHTML = groupsToRender
    .map(
      (group) => `
    <div class="group-item">
      <input type="checkbox" id="group-${group.id}" data-group-id="${group.id}" data-group-name="${group.name}">
      <label for="group-${group.id}">${group.name}</label>
    </div>
  `,
    )
    .join("")
}

function filterGroups() {
  const searchTerm = groupSearch.value.toLowerCase()
  const filteredGroups = groups.filter((group) => group.name.toLowerCase().includes(searchTerm))
  renderGroups(filteredGroups)
}

function toggleAllGroups(select) {
  const checkboxes = groupsList.querySelectorAll('input[type="checkbox"]')
  checkboxes.forEach((checkbox) => {
    checkbox.checked = select
  })
}

function getSelectedGroups() {
  const checkboxes = groupsList.querySelectorAll('input[type="checkbox"]:checked')
  return Array.from(checkboxes).map((checkbox) => ({
    id: checkbox.dataset.groupId,
    name: checkbox.dataset.groupName,
  }))
}

function handleStartCollection() {
  const selectedGroups = getSelectedGroups()

  if (selectedGroups.length === 0) {
    alert("Please select at least one group")
    return
  }

  const settings = {
    postsPerGroup: Number.parseInt(postsPerGroup.value),
    includeComments: includeComments.checked,
    useMockData: useMockData.checked,
  }

  // Start collection
  startCollection(selectedGroups, settings)

  // Update UI
  isCollecting = true
  updateCollectionUI(0)
}

function handleStopCollection() {
  stopCollection()
  isCollecting = false
  collectionStatus.classList.add("hidden")
  startCollectionBtn.classList.remove("hidden")
  stopCollectionBtn.classList.add("hidden")
}

function updateCollectionUI(progress) {
  collectionStatus.classList.remove("hidden")
  startCollectionBtn.classList.add("hidden")
  stopCollectionBtn.classList.remove("hidden")

  progressFill.style.width = `${progress}%`
  progressText.textContent = `${progress}%`
}

function handleExportData() {
  exportData(collectedData)
}

function handleMessages(message, sender, sendResponse) {
  console.log("Received message:", message.type, message);
  
  if (message.type === "collectionProgress") {
    updateCollectionUI(message.progress)
    currentAction.textContent = message.currentAction || "Processing..."
  } else if (message.type === "collectionComplete") {
    isCollecting = false
    collectionStatus.classList.add("hidden")
    startCollectionBtn.classList.remove("hidden")
    stopCollectionBtn.classList.add("hidden")
    collectedData = message.data
    exportDataBtn.disabled = false
    alert("Data collection complete!")
  } else if (message.type === "collectionError") {
    isCollecting = false
    collectionStatus.classList.add("hidden")
    startCollectionBtn.classList.remove("hidden")
    stopCollectionBtn.classList.add("hidden")
    alert(`Error: ${message.error}`)
  } else if (message.type === "authUpdate") {
    console.log("Auth update received:", message.isLoggedIn ? "Logged in" : "Not logged in");
    updateLoginStatus(message.isLoggedIn)
    if (message.isLoggedIn) {
      console.log("Loading groups after login");
      loadGroups()
    }
    // Send response to confirm receipt
    if (sendResponse) {
      sendResponse({ received: true });
    }
  }
  
  // Return true to indicate we might respond asynchronously
  return true;
}

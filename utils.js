// Import necessary libraries
// Use the global Papa object instead of ES module import
// import Papa from "papaparse"

// Fetch user's Facebook groups
async function fetchUserGroups() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(["fbAuthToken", "fbUserID"], async (result) => {
      if (!result.fbAuthToken || !result.fbUserID) {
        reject(new Error("Not logged in"))
        return
      }

      try {
        // First try to get groups from storage
        chrome.storage.local.get(["fbGroups"], (data) => {
          if (data.fbGroups && data.fbGroups.length > 0) {
            resolve(data.fbGroups)
            // Still refresh in background
            refreshGroups(result.fbAuthToken, result.fbUserID)
          } else {
            // If no cached groups, fetch them
            chrome.tabs.create({ url: "https://www.facebook.com/groups/feed/", active: false }, (tab) => {
              chrome.scripting.executeScript(
                {
                  target: { tabId: tab.id },
                  function: extractGroups,
                  args: [],
                },
                (results) => {
                  if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message))
                    return
                  }

                  const groups = results[0].result
                  chrome.storage.local.set({ fbGroups: groups })
                  chrome.tabs.remove(tab.id)
                  resolve(groups)
                },
              )
            })
          }
        })
      } catch (error) {
        reject(error)
      }
    })
  })
}

// Function to extract groups from Facebook groups page
function extractGroups() {
  // This function runs in the context of the Facebook page
  return new Promise((resolve) => {
    // Wait for the groups to load
    const checkForGroups = setInterval(() => {
      // Look for group links in the sidebar
      const groupElements = document.querySelectorAll('a[href*="/groups/"]')
      const groups = []

      groupElements.forEach((el) => {
        const href = el.getAttribute("href")
        // Extract group ID from href
        const match = href.match(/\/groups\/([^/?]+)/)
        if (match && match[1] && !href.includes("discover") && !href.includes("feed")) {
          const id = match[1]
          const name = el.textContent.trim()

          // Avoid duplicates
          if (name && id && !groups.some((g) => g.id === id)) {
            groups.push({ id, name })
          }
        }
      })

      if (groups.length > 0) {
        clearInterval(checkForGroups)
        resolve(groups)
      }
    }, 500)

    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(checkForGroups)
      resolve([])
    }, 10000)
  })
}

// Refresh groups in the background
async function refreshGroups(token, userId) {
  chrome.tabs.create({ url: "https://www.facebook.com/groups/feed/", active: false }, (tab) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        function: extractGroups,
        args: [],
      },
      (results) => {
        if (results && results[0] && results[0].result) {
          const groups = results[0].result
          chrome.storage.local.set({ fbGroups: groups })
        }
        chrome.tabs.remove(tab.id)
      },
    )
  })
}

// Start data collection
function startCollection(selectedGroups, settings) {
  chrome.runtime.sendMessage({
    type: "startCollection",
    groups: selectedGroups,
    settings: settings,
  })
}

// Stop data collection
function stopCollection() {
  chrome.runtime.sendMessage({ type: "stopCollection" })
}

// Export collected data to CSV
function exportData(data) {
  if (!data || data.length === 0) {
    alert("No data to export")
    return
  }

  // Use PapaParse to convert to CSV
  const csv = Papa.unparse(data)

  // Create a blob and download
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")

  chrome.downloads.download({
    url: url,
    filename: `facebook-group-data-${timestamp}.csv`,
    saveAs: true,
  })
}

// Generate random delay between min and max milliseconds
function randomDelay(min, max) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min
  return new Promise((resolve) => setTimeout(resolve, delay))
}

// Mock data generator for testing
function generateMockData(groups, postsPerGroup) {
  const mockData = []
  const authors = ["John Doe", "Jane Smith", "Robert Johnson", "Emily Davis", "Michael Wilson"]
  const commenters = ["Alice Brown", "David Miller", "Sarah Taylor", "James Anderson", "Lisa Thomas"]

  groups.forEach((group) => {
    for (let i = 0; i < postsPerGroup; i++) {
      const postDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      const postId = Math.random().toString(36).substring(2, 15)
      const author = authors[Math.floor(Math.random() * authors.length)]
      const content = `This is a mock post #${i + 1} in group ${group.name}. It contains some sample text for testing purposes.`

      // Generate 0-5 comments
      const commentCount = Math.floor(Math.random() * 6)
      const comments = []

      for (let j = 0; j < commentCount; j++) {
        const commenter = commenters[Math.floor(Math.random() * commenters.length)]
        const commentText = `This is a mock comment by ${commenter}. Comment #${j + 1} on post #${i + 1}.`
        comments.push({ user: commenter, text: commentText })
      }

      mockData.push({
        groupName: group.name,
        groupId: group.id,
        postUrl: `https://www.facebook.com/groups/${group.id}/posts/${postId}`,
        author: author,
        date: postDate.toISOString(),
        content: content,
        comments: comments,
      })
    }
  })

  return mockData
}

// Instead of ES module import, we'll define these functions directly
// import { randomDelay, generateMockData } from "./utils.js"

// Helper functions from utils.js
function randomDelay(min, max) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min
  return new Promise((resolve) => setTimeout(resolve, delay))
}

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

// State
let isCollecting = false
let collectionQueue = []
let currentGroupIndex = 0
let collectedData = []
let collectionSettings = {}
let activeTabId = null

// Initialize
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ isCollecting: false, collectionProgress: 0, collectedData: [] })
})

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "startCollection") {
    startCollection(message.groups, message.settings)
    sendResponse({ success: true })
  } else if (message.type === "stopCollection") {
    stopCollection()
    sendResponse({ success: true })
  }
  return true // Keep the message channel open for async responses
})

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "groupDataExtracted") {
    processExtractedData(message.data)
    sendResponse({ success: true })
  } else if (message.type === "extractionError") {
    handleExtractionError(message.error, message.groupId)
    sendResponse({ success: true })
  }
  return true
})

// Start collection process
async function startCollection(groups, settings) {
  if (isCollecting) return

  isCollecting = true
  collectionQueue = [...groups]
  currentGroupIndex = 0
  collectedData = []
  collectionSettings = settings

  chrome.storage.local.set({
    isCollecting: true,
    collectionProgress: 0,
    collectionQueue,
    collectionSettings,
  })

  // If using mock data, generate it and finish
  if (settings.useMockData) {
    const mockData = generateMockData(groups, settings.postsPerGroup)
    finishCollection(mockData)
    return
  }

  // Start processing the queue
  processNextGroup()
}

// Stop collection process
function stopCollection() {
  isCollecting = false

  // Close active tab if exists
  if (activeTabId) {
    chrome.tabs.remove(activeTabId)
    activeTabId = null
  }

  chrome.storage.local.set({
    isCollecting: false,
    collectionProgress: 0,
  })

  // Notify popup
  chrome.runtime.sendMessage({
    type: "collectionComplete",
    data: collectedData,
  })
}

// Process the next group in the queue
async function processNextGroup() {
  if (!isCollecting || currentGroupIndex >= collectionQueue.length) {
    finishCollection(collectedData)
    return
  }

  const group = collectionQueue[currentGroupIndex]
  const progress = Math.floor((currentGroupIndex / collectionQueue.length) * 100)

  // Update progress
  chrome.storage.local.set({ collectionProgress: progress })
  chrome.runtime.sendMessage({
    type: "collectionProgress",
    progress,
    currentAction: `Processing group: ${group.name}`,
  })

  // Apply rate limiting - max 2 groups per 10 minutes
  if (currentGroupIndex > 0 && currentGroupIndex % 2 === 0) {
    await randomDelay(5 * 60 * 1000, 10 * 60 * 1000) // 5-10 minute delay
  } else {
    await randomDelay(2000, 15000) // 2-15 second delay
  }

  // Open the group page in a new tab
  try {
    chrome.tabs.create({ url: `https://www.facebook.com/groups/${group.id}`, active: false }, async (tab) => {
      activeTabId = tab.id

      // Wait for page to load
      await new Promise((resolve) => setTimeout(resolve, 5000))

      // Inject content script to extract data
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: extractGroupData,
        args: [group, collectionSettings.postsPerGroup, collectionSettings.includeComments],
      })
    })
  } catch (error) {
    console.error("Error opening group page:", error)
    handleExtractionError(error.message, group.id)
  }
}

// Extract data from a Facebook group
function extractGroupData(group, postsPerGroup, includeComments) {
  // This function runs in the context of the Facebook page
  console.log(`Extracting data from group: ${group.name}, posts: ${postsPerGroup}`)

  // Create a MutationObserver to detect when new posts are loaded
  const observer = new MutationObserver((mutations) => {
    // Check if new posts were added
    for (const mutation of mutations) {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        checkPostsLoaded()
      }
    }
  })

  // Start observing the feed container
  const feedContainer = document.querySelector('[role="feed"]')
  if (feedContainer) {
    observer.observe(feedContainer, { childList: true, subtree: true })
  }

  // Track extracted posts
  const extractedPosts = []
  let scrollAttempts = 0
  const maxScrollAttempts = 50 // Prevent infinite scrolling

  // Function to check if enough posts are loaded
  function checkPostsLoaded() {
    const posts = document.querySelectorAll('[role="article"]')

    if (posts.length >= postsPerGroup || scrollAttempts >= maxScrollAttempts) {
      observer.disconnect()
      extractPostData(posts)
    } else {
      scrollDown()
    }
  }

  // Function to scroll down to load more posts
  async function scrollDown() {
    scrollAttempts++
    window.scrollTo(0, document.body.scrollHeight)

    // Random delay between scrolls to mimic human behavior
    const delay = Math.floor(Math.random() * (3000 - 1000 + 1)) + 1000
    setTimeout(checkPostsLoaded, delay)
  }

  // Function to extract data from posts
  function extractPostData(posts) {
    const postsToProcess = Array.from(posts).slice(0, postsPerGroup)

    postsToProcess.forEach((post, index) => {
      try {
        // Extract post URL
        const postLinkElement = post.querySelector('a[href*="/permalink/"], a[href*="/posts/"]')
        const postUrl = postLinkElement ? postLinkElement.href : ""

        // Extract post ID from URL
        const postId = postUrl.match(/\/(?:permalink|posts)\/(\d+)/)
          ? postUrl.match(/\/(?:permalink|posts)\/(\d+)/)[1]
          : ""

        // Extract author
        const authorElement = post.querySelector('h3 a, h4 a, [role="link"][tabindex="0"]')
        const author = authorElement ? authorElement.textContent.trim() : "Unknown"

        // Extract timestamp
        const timestampElement = post.querySelector('a[href*="/permalink/"] span, a[href*="/posts/"] span')
        const timestamp = timestampElement ? timestampElement.textContent.trim() : ""

        // Extract content
        const contentElement = post.querySelector('[data-ad-preview="message"]')
        const content = contentElement ? contentElement.textContent.trim() : ""

        // Extract comments if needed
        const comments = []
        if (includeComments) {
          const commentElements = post.querySelectorAll('[role="article"][aria-label*="Comment"]')
          commentElements.forEach((comment) => {
            const commenterElement = comment.querySelector('a[role="link"]')
            const commenter = commenterElement ? commenterElement.textContent.trim() : "Unknown"

            const commentTextElement = comment.querySelector('div[dir="auto"]')
            const commentText = commentTextElement ? commentTextElement.textContent.trim() : ""

            if (commenter && commentText) {
              comments.push({
                user: commenter,
                text: commentText,
              })
            }
          })
        }

        // Add to extracted posts
        if (author !== "Unknown" && (content || postUrl)) {
          extractedPosts.push({
            groupName: group.name,
            groupId: group.id,
            postUrl: postUrl,
            postId: postId,
            author: author,
            date: timestamp,
            content: content,
            comments: comments,
          })
        }
      } catch (error) {
        console.error(`Error extracting post ${index}:`, error)
      }
    })

    // Send data back to background script
    chrome.runtime.sendMessage({
      type: "groupDataExtracted",
      data: {
        group: group,
        posts: extractedPosts,
      },
    })
  }

  // Start the extraction process
  checkPostsLoaded()
}

// Process extracted data from a group
function processExtractedData(data) {
  // Add extracted posts to collected data
  if (data.posts && data.posts.length > 0) {
    collectedData = [...collectedData, ...data.posts]
  }

  // Move to the next group
  currentGroupIndex++

  // Close the current tab
  if (activeTabId) {
    chrome.tabs.remove(activeTabId)
    activeTabId = null
  }

  // Process the next group after a delay
  setTimeout(processNextGroup, 2000)
}

// Handle extraction errors
function handleExtractionError(error, groupId) {
  console.error(`Error extracting data from group ${groupId}:`, error)

  // Move to the next group
  currentGroupIndex++

  // Close the current tab
  if (activeTabId) {
    chrome.tabs.remove(activeTabId)
    activeTabId = null
  }

  // Process the next group after a delay
  setTimeout(processNextGroup, 2000)
}

// Finish the collection process
function finishCollection(data) {
  isCollecting = false

  // Store the collected data
  chrome.storage.local.set({
    isCollecting: false,
    collectionProgress: 100,
    collectedData: data,
  })

  // Notify popup
  chrome.runtime.sendMessage({
    type: "collectionComplete",
    data: data,
  })
}

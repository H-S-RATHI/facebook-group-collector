// This script runs on all Facebook pages to handle various tasks

// Declare extractGroupData (assuming it's defined elsewhere or will be)
let extractGroupData

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "extractGroupData") {
    extractGroupData(message.group, message.postsPerGroup, message.includeComments)
    sendResponse({ success: true })
  }
  return true
})

// Handle GDPR consent dialogs
function handleConsentDialogs() {
  // Look for common consent dialog buttons and click them
  const consentButtons = document.querySelectorAll(
    'button[data-testid="cookie-policy-manage-dialog-accept-button"], button[data-cookiebanner="accept_button"]',
  )
  if (consentButtons.length > 0) {
    consentButtons[0].click()
  }
}

// Handle Facebook CAPTCHA
function handleCaptcha() {
  const captchaElements = document.querySelectorAll('input[name="captcha_response"], div[data-captcha-class="geetest"]')
  if (captchaElements.length > 0) {
    // Notify background script about CAPTCHA
    chrome.runtime.sendMessage({
      type: "captchaDetected",
      url: window.location.href,
    })
  }
}
// Initialize
;(() => {
  // Handle consent dialogs and CAPTCHAs when page loads
  window.addEventListener("load", () => {
    handleConsentDialogs()
    handleCaptcha()
  })

  // Also check periodically
  setInterval(() => {
    handleConsentDialogs()
    handleCaptcha()
  }, 5000)
})()

// This script runs on the Facebook page to extract auth information

;(() => {
    // Check if user is logged in
    const isLoggedIn = document.cookie.includes("c_user=")
  
    if (isLoggedIn) {
      // Extract user ID from cookie
      const userIdMatch = document.cookie.match(/c_user=(\d+)/)
      const userId = userIdMatch ? userIdMatch[1] : null
  
      // Extract auth token from localStorage or DTSGInitialData
      let authToken = null
  
      // Try to get from DTSGInitialData
      // Find all scripts and check their content
      const scripts = document.querySelectorAll('script');
      for (const script of scripts) {
        if (script.textContent && script.textContent.includes('DTSGInitialData')) {
          const dtsgMatch = script.textContent.match(/"token":"([^"]+)"/);
          if (dtsgMatch) {
            authToken = dtsgMatch[1];
            break;
          }
        }
      }
  
      // If not found, try localStorage
      if (!authToken) {
        try {
          const localStorageData = Object.keys(localStorage).find((key) => key.startsWith("DTSGInitData"))
          if (localStorageData) {
            const dtsgData = JSON.parse(localStorage.getItem(localStorageData))
            authToken = dtsgData.token
          }
        } catch (e) {
          console.error("Error extracting auth token from localStorage:", e)
        }
      }
      
      // If still not found, try to find it in the page content
      if (!authToken) {
        try {
          // Look for the token in the page source
          const pageSource = document.documentElement.outerHTML;
          const tokenMatch = pageSource.match(/\{"token":"([^"]+)","async_get_token/);
          if (tokenMatch && tokenMatch[1]) {
            authToken = tokenMatch[1];
          }
        } catch (e) {
          console.error("Error extracting auth token from page source:", e)
        }
      }
      
      // Try one more method - look for the fb_dtsg input field
      if (!authToken) {
        try {
          const dtsgInput = document.querySelector('input[name="fb_dtsg"]');
          if (dtsgInput) {
            authToken = dtsgInput.value;
          }
        } catch (e) {
          console.error("Error extracting auth token from input field:", e)
        }
      }
  
      // Store auth info
      if (userId && authToken) {
        console.log("Found auth info - User ID:", userId, "Auth Token:", authToken.substring(0, 5) + "...");
        
        // Ensure chrome is available
        if (typeof chrome !== "undefined" && chrome.storage) {
          chrome.storage.local.set(
            {
              fbAuthToken: authToken,
              fbUserID: userId,
            },
            () => {
              console.log("Auth info saved to storage");
              
              // Notify popup about successful login
              chrome.runtime.sendMessage({
                type: "authUpdate",
                isLoggedIn: true,
              }, (response) => {
                if (chrome.runtime.lastError) {
                  console.error("Error sending auth update:", chrome.runtime.lastError);
                } else {
                  console.log("Auth update sent successfully", response);
                }
              });
  
              // Show a visual confirmation
              const confirmDiv = document.createElement('div');
              confirmDiv.style.position = 'fixed';
              confirmDiv.style.top = '0';
              confirmDiv.style.left = '0';
              confirmDiv.style.width = '100%';
              confirmDiv.style.padding = '10px';
              confirmDiv.style.backgroundColor = 'green';
              confirmDiv.style.color = 'white';
              confirmDiv.style.textAlign = 'center';
              confirmDiv.style.zIndex = '9999';
              confirmDiv.textContent = 'Login successful! This tab will close in a moment.';
              document.body.appendChild(confirmDiv);
              
              // Close this tab after a delay
              setTimeout(() => {
                window.close()
              }, 2000)
            },
          )
        } else {
          console.error("Chrome storage API not available.")
        }
      } else {
        console.error("Missing auth info - User ID:", userId ? "Found" : "Missing", "Auth Token:", authToken ? "Found" : "Missing");
      }
    } else {
      // User is not logged in, update status
      if (typeof chrome !== "undefined" && chrome.storage) {
        chrome.storage.local.remove(["fbAuthToken", "fbUserID"], () => {
          chrome.runtime.sendMessage({
            type: "authUpdate",
            isLoggedIn: false,
          })
        })
      } else {
        console.error("Chrome storage API not available.")
      }
    }
  })()
  
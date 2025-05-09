# Testing the Facebook Navigator Extension

Follow these steps to test the extension:

## Loading the Extension

1. Open Chrome browser
2. Go to `chrome://extensions/`
3. Enable "Developer mode" by toggling the switch in the top right corner
4. Click "Load unpacked" and select the `facebook-group-collector` directory
5. The extension should now appear in your extensions list

## Testing the Extension

1. Click on the extension icon in your browser toolbar
2. You should see a popup with a "Go to Facebook" button
3. Click the button
4. A new tab should open with Facebook.com

## Troubleshooting

If the extension doesn't work as expected:

1. Check the browser console for any error messages:
   - Right-click on the extension popup
   - Select "Inspect" or "Inspect Element"
   - Look for errors in the Console tab

2. Verify that all files are in the correct location:
   - manifest.json
   - popup.html
   - popup.js

3. Try reloading the extension:
   - Go to `chrome://extensions/`
   - Find the Facebook Navigator extension
   - Click the refresh icon

4. If you make any changes to the code, you'll need to reload the extension for the changes to take effect.

## Next Steps

Once the basic extension is working, you can enhance it by:

1. Adding icons to make it look more professional
2. Adding more features like direct navigation to specific Facebook pages
3. Implementing login detection
4. Adding data collection features
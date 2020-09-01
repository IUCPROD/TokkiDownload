# TokkiDownload

Only for Windows

How to make it work:

Chrome:
1. Download and extract the newest release. (Here https://github.com/IUCPROD/TokkiDownload/releases)
2. Run the INSTALL.bat file in the folder. (double-click it)
3. Go to chrome://extensions/ in your browser and activate developer mode (top right)
4. Drag&drop tokkidownload_extension_chrome.zip into your browser
5. In the description text of the addon you will find ID:, copy that ID (it looks something like this ckbocbdeeeakglmhhoehjncmpaiinglo)
6. Go to the tokkidownload_application_chrome folder and open manifest.json with any editor application like notepad or windows editor
7. Under "allowed_origins" you will find "chrome-extension://eafopkeeefacjkabhkeadjnbeibkobee/", replace the part between the /// with your id you copied earlier and save the file
8. Go back to your browser and click the Remove button in the tokkidownload addon box. Then you can redo step 4 and you are ready to use it

(All this shit is only necessary because chrome doesn't allow youtube downloaders in their addon store)

Firefox:
1. Download and extract the newest release. (Here https://github.com/IUCPROD/TokkiDownload/releases)
2. Run the INSTALL.bat file in the folder. (double-click it)
3. Go to https://addons.mozilla.org/de/firefox/addon/tokkidownload and add the add-on to your browser.

**!!!If you move the folder at some point after running INSTALL.bat, you will have to run FIX.bat.!!!**

How to use it:
1. Choose a folder you want to download things into and copy its full path (it should look something like C:\Users\user\Desktop\downloadfolder)
2. On the page you want to download a video (for example youtube or vlive) click the addon Button (bunny ears on the top right of the browser)
3. Paste the path into the "Save to: __ " field 
4. Choose your desired settings
5. Click "Download" Button to download only the current tabs video. "Download list" will download all videos you've previously added to the list before, "Add to list" will add the video to the list.

Tested on:

Windows 10 1903

Chrome 85
(Should work on all the chromium browsers like edge, brave, vivaldi, etc)

Firefox 80

If you have any questions ask me on https://kpop.re/

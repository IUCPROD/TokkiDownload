{
  /**
   * Used to make different content appear/disappear
   * Examples:
   * hideShow("default-content", "hide"); //hides main content
   * @param {*} content 
   * @param {*} action 
   */
  function hideShow(content, action){
    if(action=="hide"){
      document.getElementById(content).style.display = "none";
    }
    else if(content == "temporary-content"){
      document.getElementById(content).style.display = "block";
    }
    else{
      document.getElementById(content).style.display = "flex";
    }
  }
  /**
   * Returns message dict with chosen options that will get sent to background script and native application
   * @param {*} url 
   */
  function makeMessage(url){
    var message = {
      "outpath": document.getElementById("path").value,
      "withoutsound": document.getElementById("withoutsound").checked,
      "onlysound": document.getElementById("onlysound").checked,
      "quality": document.getElementById("qualitybox").value,
      "playlist":document.getElementById("playlist").checked,
      "subtitles":document.getElementById("subtitles").checked,
      "url": url,
      "downloadaction": downloadAction,
      "msg": "task"
    };
    return message;
  }

  /**
   * @listens to sendMessage event from the background script
   * Possibilities:
   * message is error: sends error to error function and removes unsuccessful url from saved list.
   * message is progress report: updates progress bar.
   * message is finish notification: hides progress bar screen and sends to already downloaded screen
   */
  function onMessage(msg){
    errorMsg = msg[1];
    if(msg[0] == "error"){
      onError(msg[1]);
      urlList.pop();
      chrome.storage.sync.set({'address': urlList});
    }
    else if (msg[0] == "progress"){
      if(msg[1]=="emptylist"){       
        document.getElementById("emptylist").style.display = "block";
        document.getElementById("continue").style.display = "block";
        urlList.pop();
        chrome.storage.sync.set({'address': urlList});
      }
      else{
        document.getElementById("progress").innerHTML = msg[1] + "%";
        document.getElementById("myBar").style.width = msg[1] + "%";
      }
    }
    else{
      console.log(msg);
      
      hideShow("temporary-content", "hide");
      urlGetter();
    }
  }

  /**
   * Shows error message.
   * @param error 
   */
  function onError(error) {
    if(errLoc == ""){
      errLoc = "Background"
    }
    hideShow("default-content", "hide");
    hideShow("temporary-content", "hide");
    document.getElementById("errortext").textContent = "Oh My Mistake!~~ " + "happened in: " + errLoc + " ErrorMsg: " + error.message;
    hideShow("error-content", "show");
  }

  /**
   * Takes the url from the current tab and creates a message for the native application
   * with makeMessage(). Then the message is sent to the background script to get passed along.
   * @param  tabs 
   */
  function sender(){
    if(chrome.extension.lastError){
      errLoc = "sender";
      onError(chrome.extension.lastError);
    }
    else{
      if(msgType =="task"){
        var msg = makeMessage(currentUrl);
        chrome.runtime.sendMessage(msg);
      }
      else if(msgType == "reconnect"){
        var msg = {
          "msg": "reconnect"
        }
        chrome.runtime.sendMessage(msg);
      }
      msgType = "";
    }
  }

  /**
   * Gets the current tab to get the url.
   */
  function setStoredPath(){
    if (chrome.extension.lastError){
      errLoc = "setStoredPath";
      onError(chrome.extension.lastError);
    }
    else{
      if(urlList.indexOf(currentUrl)>=0){
        sender();
      }
      else{
        urlList.push(currentUrl);
        chrome.storage.sync.set({'address': urlList}, sender);
      }
    }
  }

  /**
   * Checks if the native application is already busy while content script is loading
   * by checking the busy variable in the background script. Shows content based on result.
   * @param page received 
   */
  function onGot(page){
    if(chrome.extension.lastError){
      errLoc = "onGot";
      onError(chrome.extension.lastError);
    }
    else{
      var isBusy = page.busy;
      if (page.critErr == "restart"){
        document.getElementById("errortext").textContent = "Oh My Mistake!~~ " + "happened in: Native Application";
        hideShow("default-content", "hide");
        hideShow("temporary-content", "hide");
        hideShow("error-content", "show");
      }
      else if(isBusy == 0){
        isBusy = "";
        urlGetter();
      }
      else {
        hideShow("temporary-content", "show");
        hideShow("default-content", "hide");
        isBusy = "";
      }
    }
  }

  /**
   * Looks if there's already a stored path and puts it as the shown path value
   * @param storedInformation 
   */ 
  function onGotStorageAnswer(storedInformation){
    if (chrome.extension.lastError){
      errLoc = "onStorageAnswer";
      onError(chrome.extension.lastError);
    }
    else{
      if (!storedInformation.pathname){
        chrome.runtime.getBackgroundPage(onGot);
      }
      else{
        document.getElementById("path").value = storedInformation.pathname;
        chrome.runtime.getBackgroundPage(onGot); 
      }
    }
  }
  /**
   * Gets current active tab for url gathering
   */
  function urlGetter(){
    chrome.tabs.query({active: true, currentWindow: true},urlGetter2);
  }
  /**
   * Gets already stored urls from storage.sync to check against the current url
   * @param {*} tabs 
   */
  function urlGetter2(tabs){
    currentUrl = tabs[0].url;
    chrome.storage.sync.get(['address'], urlChecker)
  }
  /**
   * Checks if current url is already stored and shows appropriate content
   * @param {*} stor 
   */
  function urlChecker(stor){
    if(stor.address){
      urlList = stor.address
      if(stor.address.indexOf(currentUrl)>=0){
        hideShow("default-content", "hide");
        hideShow("alreadyDownloaded-content", "show");
      }
      else{
        hideShow("default-content", "show");
      }
    }
    else{
      hideShow("default-content", "show");
    }
  }

  //START 
  let downloadAction = 0;
  let msgType = "";
  let errLoc ="";
  let currentUrl = "";
  let urlList = [];
  let errorMsg = "";

  //Adding listener for messages from the background script during open window
  chrome.runtime.onMessage.addListener(onMessage);

  //Adding change even to path bar to make it normal again when a value is given
  document.getElementById("path").addEventListener("change", function(){
    document.getElementById("path").style.borderColor = null;
  }, false);

  //Adding event to the buttons
  document.getElementById("dlbutton").addEventListener("click",function(){
    if (document.getElementById("path").value){
      hideShow("default-content", "hide");
      hideShow("temporary-content", "show");
      downloadAction = "downloadsingle";
      msgType = "task";
      pathName = document.getElementById("path").value;
      chrome.storage.local.set({pathname:document.getElementById("path").value},setStoredPath);
    }
    else{
      //If no path was given the input bar will be colored red
      document.getElementById("path").style.borderColor="red";
    }
  },false );

  document.getElementById("dllistbutton").addEventListener("click",function(){
    if (document.getElementById("path").value){
      hideShow("default-content", "hide");
      hideShow("temporary-content", "show");
      downloadAction = "downloadlist"
      msgType = "task";
      pathName = document.getElementById("path").value;
      chrome.storage.local.set({pathname:document.getElementById("path").value},setStoredPath);
    }
    else{
      //If no path was given the input bar will be colored red
      document.getElementById("path").style.borderColor="red";
    }
  },false );

  document.getElementById("addlistbutton").addEventListener("click",function(){
    hideShow("default-content", "hide");
    hideShow("temporary-content", "show");
    downloadAction = "addtolist"
    msgType = "task";
    pathName = document.getElementById("path").value;
    chrome.storage.local.set({pathname:document.getElementById("path").value},setStoredPath);
  },false );

  document.getElementById("continuebutton").addEventListener("click", function(){
    hideShow("alreadyDownloaded-content", "hide");
    hideShow("default-content", "show");
  })
  document.getElementById("continue").addEventListener("click", function(){
    hideShow("temporary-content", "hide");
    hideShow("default-content", "show");
    document.getElementById("emptylist").style.display = "none";
    document.getElementById("continue").style.display = "none";
  })

  document.getElementById("errorbutton").addEventListener("click", function(){
    msgType = "reconnect";
    sender();
    window.close();
  })

  //Gets local storage information to look if a path has been stored before
  chrome.storage.local.get(null, onGotStorageAnswer);


}

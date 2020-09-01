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
    else if(content == "default-content" || content == "error-content" ){
      document.getElementById(content).style.display = "flex";
    }
    else{
      document.getElementById(content).style.display = "block";
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
      "action": action,
      "msg": "task"
    };
    return message;
  }

  /**
   * @listens to sendMessage event from the background script
   */
  function onMessage(msg){
    switch (msg['action']) {
      case 'progress':
        document.getElementById("progress").textContent = msg['status'] + "%";
        document.getElementById("myBar").style.width = msg['status'] + "%";
        break;
      case "alreadydownloaded":
        hideShow('default-content', 'hide');
        hideShow('temporary-content', 'show');
        hideShow('updating', 'hide');
        hideShow('process', 'hide');
        hideShow('alreadydownloaded', 'show');
        break;
      case "error":
        onError(msg['error']);
        break;
      case "alreadydownloadedpl":
        hideShow('alreadydownloadedpl', 'show');
        hideShow('updating', 'hide');
        hideShow('process', 'hide');
        hideShow('default-content', 'hide');
        hideShow('temporary-content', 'show');
        break;
      case "addedtolist":
        hideShow('alreadyinlist', 'show');
        hideShow('default-content', 'hide');
        hideShow('process', 'hide');
        hideShow('updating', 'hide');
        hideShow('temporary-content', 'show');
        break;
      case "emptylist":
        hideShow('default-content', 'hide');
        hideShow('emptylist', 'show');
        hideShow('process', 'hide');
        hideShow('temporary-content', 'show');
        break;
      case "default":
        hideShow('updating', 'hide');
        hideShow('process', 'hide');
        hideShow('temporary-content', 'hide');
        hideShow('default-content', 'show');
        break;
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
    document.getElementById("errortext").textContent ="ErrorMsg: " + error;
    hideShow("error-content", "show");
  }

  /**
   * Takes the url from the current tab and creates a message for the native application
   * with makeMessage(). Then the message is sent to the background script to get passed along.
   * @param  tabs 
   */
  function sender(){
    if(browser.extension.lastError){
      errLoc = "sender";
      onError(browser.extension.lastError);
    }
    else{
      if(msgType =="task"){
        var msg = makeMessage(currentUrl);
        browser.runtime.sendMessage(msg);
      }
      else if(msgType == "reconnect"){
        var msg = {
          "msg": "reconnect"
        }
        browser.runtime.sendMessage(msg);
      }
      msgType = "";
    }
  }

  /**
   * Checks if the native application is already busy while content script is loading
   * by checking the busy variable in the background script. Shows content based on result.
   * @param page received 
   */
  function onGot(page){
    if(browser.extension.lastError){
      errLoc = "onGot";
      onError(browser.extension.lastError);
    }
    else{
      let isBusy = page.busy;
      if (page.critErr == "restart"){
        document.getElementById("errortext").textContent = "Oh My Mistake!~~ " + "happened in: Native Application";
        hideShow("default-content", "hide");
        hideShow("temporary-content", "hide");
        hideShow("error-content", "show");
      }
      else if(isBusy == 0){
        isBusy = "";
        hideShow("default-content", "hide");
        hideShow("updating", "show");
        hideShow("temporary-content", "show");
        browser.tabs.query({active: true, currentWindow: true}).then(urlGetter, onError);
      }
      else if (isBusy == 1) {
        hideShow("process", "show");
        hideShow("temporary-content", "show");
        hideShow("default-content", "hide");
        isBusy = "";
      }
      else{
        hideShow("default-content", "hide");
        hideShow("updating", "show");
        hideShow("temporary-content", "show");
        isBusy = "";
      }
    }
  }

  /**
   * Looks if there's already a stored path and puts it as the shown path value
   * @param storedInformation 
   */ 
  function onGotStorageAnswer(storedInformation){
    if (browser.extension.lastError){
      errLoc = "onStorageAnswer";
      onError(browser.extension.lastError);
    }
    else{
      if (!storedInformation.pathname){
        browser.runtime.getBackgroundPage().then(onGot, onError);
      }
      else{
        document.getElementById("path").value = storedInformation.pathname;
        browser.runtime.getBackgroundPage().then(onGot, onError); 
      }
    }
  }

  /**
   * @param {*} tabs 
   */
  function urlGetter(tabs){
    currentUrl = tabs[0].url;
    action = "checkurl"
    msgType = "task";
    sender();
    hideShow("updating", "show");

  }

  //START 
  let action = 0;
  let msgType = "";
  let errLoc ="";
  let currentUrl = "";

  //Adding listener for messages from the background script during open window
  browser.runtime.onMessage.addListener(onMessage);

  //Adding change event to path bar to make it normal again when a value is given
  document.getElementById("path").addEventListener("change", function(){
    document.getElementById("path").style.borderColor = null;
  }, false);

  //Adding event to the buttons
  document.getElementById("dlbutton").addEventListener("click",function(){
    if (document.getElementById("path").value){
      hideShow("default-content", "hide");
      hideShow("alreadydownloaded", "hide");
      hideShow("alreadydownloadedpl", "hide");
      hideShow('alreadyinlist', 'hide');
      hideShow("temporary-content", "show");      
      hideShow("process", "show");
      action = "downloadsingle";
      msgType = "task";
      pathName = document.getElementById("path").value;
      browser.storage.local.set({pathname:document.getElementById("path").value}).then(sender,onError);
    }
    else{
      //If no path was given the input bar will be colored red
      document.getElementById("path").style.borderColor="red";
    }
  },false );

  document.getElementById("dllistbutton").addEventListener("click",function(){
    if (document.getElementById("path").value){
      hideShow("default-content", "hide");
      hideShow("alreadydownloaded", "hide");
      hideShow("alreadydownloadedpl", "hide");
      hideShow('emptylist', 'hide');
      hideShow("temporary-content", "show");
      hideShow('alreadyinlist', 'hide');
      hideShow("process", "show");
      action = "downloadlist"
      msgType = "task";
      pathName = document.getElementById("path").value;
      browser.storage.local.set({pathname:document.getElementById("path").value}).then(sender,onError);
    }
    else{
      //If no path was given the input bar will be colored red
      document.getElementById("path").style.borderColor="red";
    }
  },false );

  document.getElementById("addlistbutton").addEventListener("click",function(){
    if (document.getElementById("path").value){
    hideShow("default-content", "hide");
    hideShow("alreadydownloaded", "hide");
    hideShow("alreadydownloadedpl", "hide");
    hideShow('alreadyinlist', 'hide');
    hideShow('emptylist', 'hide');
    hideShow("temporary-content", "show");
    hideShow("process", "show");
    action = "addtolist"
    msgType = "task";
    pathName = document.getElementById("path").value;
    browser.storage.local.set({pathname:document.getElementById("path").value}).then(sender,onError);
    }
    else{
      //If no path was given the input bar will be colored red
      document.getElementById("path").style.borderColor="red";
    }
  },false );

  for (cbutton of document.getElementsByClassName("continue")){
    cbutton.addEventListener("click", function(){
      hideShow("temporary-content", "hide");
      hideShow("default-content", "show");
    })
  }
  
  document.getElementById("errorbutton").addEventListener("click", function(){
    msgType = "reconnect";
    sender();
    window.close();
  })

  //Gets local storage information to look if a path has been stored before
  browser.storage.local.get(null).then(onGotStorageAnswer, onError);
}

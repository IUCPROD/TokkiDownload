/**
 * Sends error to extension popup.
 * @param error 
 */
function onError(error) {
  // busy = 0
  sendError = {'action': 'error', 'error': error}
  browser.runtime.sendMessage(sendError);
}

function connect() {
  port = browser.runtime.connectNative("tkdl");
  port.onMessage.addListener(onNativeMessage);
  port.onDisconnect.addListener(onNativeDisconnect);
}

function onNativeMessage(msg){
  if (browser.extension.lastError){
    onError(browser.extension.lastError);
  }
  else {
    if (msg['action'] == "error"){
      onError(msg['error']);
    }
    else if(msg['action']== 'progress'){
      browser.runtime.sendMessage(msg);
    }
    else {
      busy = 0;   
      browser.runtime.sendMessage(msg);
    }  
  }
}

function onNativeDisconnect(){
  critErr = "restart";
  onError(critErr);
}

function onPopupMessage(msg){
  if(msg["msg"] == "task"){
    if (msg['action']=='checkurl'){
      busy = 2;
    }
    else{
      busy = 1;
    }    
    port.postMessage(msg);
  }
  else if(msg["msg"] == "reconnect"){
    browser.runtime.reload();
  }
}

//START
var busy = 0;
var progress = 150;
var critErr = "";
var port =null;
connect();
port.onDisconnect.addListener(onNativeDisconnect);
port.onMessage.addListener(onNativeMessage);
browser.runtime.onMessage.addListener(onPopupMessage);





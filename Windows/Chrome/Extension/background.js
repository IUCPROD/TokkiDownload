/**
 * Sends error to extension popup.
 * @param error 
 */
function onError(error) {
  sendError = {'action': 'error', 'error': error}
  chrome.runtime.sendMessage(sendError);
}

function connect() {
  port = chrome.runtime.connectNative("tkdl");
  port.onMessage.addListener(onNativeMessage);
  port.onDisconnect.addListener(onNativeDisconnect);
}

function onNativeMessage(msg){
  if (chrome.extension.lastError){
    onError(chrome.extension.lastError);
  }
  else {
    if (msg['action'] == "error"){
      onError(msg['error']);
    }
    else if(msg['action']== 'progress'){
      chrome.runtime.sendMessage(msg);
    }
    else {
      busy = 0;   
      chrome.runtime.sendMessage(msg);
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
    chrome.runtime.reload();
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
chrome.runtime.onMessage.addListener(onPopupMessage);





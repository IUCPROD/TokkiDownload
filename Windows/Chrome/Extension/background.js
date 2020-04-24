/**
 * Sends error to extension popup.
 * @param error 
 */
function onError(error) {
  busy = 0
  var err = ["error",error];
  chrome.runtime.sendMessage(err);
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
    if (msg == "error"){
      onError("youtube-dl error");
    }
    else if(msg == "finished"){
      busy = 0;
      var nb = ["notBusy", ""];      
      chrome.runtime.sendMessage(nb);
    }
    else{
      busy = 0;
      var progressMessage = ["progress", msg]
      chrome.runtime.sendMessage(progressMessage);
    }    
  }
}
function onNativeDisconnect(){
  critErr = "restart";
  onError("restart");
}
function onPopupMessage(msg){
  if(msg["msg"] == "task"){
    busy = 1;    
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





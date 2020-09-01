from __future__ import unicode_literals
import os
import sys
import json
import struct

class MyLogger(object):
    def debug(self, msg):
        pass

    def warning(self, msg):
        with open("err.txt", "a", encoding='utf8') as myfile:
            myfile.write(msg+ "\n")

    def error(self, msg):
        global errorvar
        errorvar = 1
        with open("err.txt", "a", encoding='utf8') as myfile:
            myfile.write(msg+ "\n")
        err = {'action': 'error', 'error': msg}
        send_message(encode_message(err))

class DummyLogger(object):
    def debug(self, msg):
        pass

    def warning(self, msg):
        pass

    def error(self, msg):
        pass

# Send an encoded message to stdout.
def send_message(encoded_message):
    sys.stdout.buffer.write(encoded_message['length'])
    sys.stdout.buffer.write(encoded_message['content'])
    sys.stdout.buffer.flush()

# Read a message from stdin and decode it.
def get_message():
    raw_length = sys.stdin.buffer.read(4)
    if not raw_length:
        sys.exit(0)
    message_length = struct.unpack('=I', raw_length)[0]
    message = sys.stdin.buffer.read(message_length).decode("utf-8")
    return json.loads(message)

# Encode a message for transmission, given its content.
def encode_message(message_content):
    encoded_content = json.dumps(message_content).encode("utf-8")
    encoded_length = struct.pack('=I', len(encoded_content))
    # use struct.pack("10s", bytes), to pack a string of the length of 10 characters
    return {'length': encoded_length, 'content': struct.pack(str(len(encoded_content))+"s",encoded_content)}
    
# Generates youtube-dl options to pass to the downloader
def make_command(msg):
    ydl_opts ={
        "noplaylist": True,
        "outtmpl" : msg["outpath"] + "/" + "%(title)s.%(ext)s",
        "postprocessor": "FFmpegPostProcessor",
        "progress_hooks": [showProgress],
        "ignoreerrors": True,
        'logger': MyLogger(),
        "quiet": True
    }
    if (msg["onlysound"]):
        ydl_opts['format'] = "bestaudio[ext=m4a]/bestaudio"
    elif (msg['withoutsound']):
        if (msg['quality'] != "bestpossible"):
            ydl_opts['format'] = "bestvideo[height<="+ msg['quality'][:-1] +"]"
        else:
            ydl_opts['format'] = "bestvideo[vcodec=vp9.2]/bestvideo[vcodec=vp9][height>=1400]\
            /bestvideo[vcodec=vp9][height>=1000][fps>30]/bestvideo[height>720]/bestvideo[fps>30]/best"
    elif (msg['quality'] != "bestpossible"):
        ydl_opts['format'] = "bestvideo[height<="+ msg['quality'][:-1] +"]+bestaudio/best[height<="+ msg['quality'][:-1] + "]"
    else:
        ydl_opts['format'] = "bestvideo[vcodec=vp9.2]+(bestaudio[acodec=opus]/bestaudio)\
        /bestvideo[vcodec=vp9][height>=1400]+(bestaudio[acodec=opus]/bestaudio)\
        /bestvideo[vcodec=vp9][height>=1000][fps>30]+(bestaudio[acodec=opus]/bestaudio)\
        /bestvideo[height>720]+(bestaudio[ext=m4a]/bestaudio)\
        /bestvideo[fps>30]+(bestaudio[ext=m4a]/bestaudio)\
        /best"
    if (msg['subtitles']):
        ydl_opts['writesubtitles'] = True
        ydl_opts['allsubtitles'] = True
        ydl_opts['subtitleformat'] = "best"
    if (msg['playlist']):
        ydl_opts['noplaylist'] = False
    return ydl_opts

def downloadSingle(msg):
    global urlsToSave
    global errorvar
    urlsToDownload = []
    savePlaylist = False   
    res = splitUrl(msg['url'])
    if (res != False and msg['playlist'] == True):
        savePlaylist = True
        ydl_opts1 ={
            "quiet" : True,
            "no-warnings" : True,
            "ignoreerrors": True,
            'logger': DummyLogger()
        }
        # For some dumbass reason ydl.extract still writes errors into out despite quiet, no-warnings and ignoreerrors
        # which is why the dummy logger exists to not mess up communication lane with the extension
        with youtube_dl.YoutubeDL(ydl_opts1) as ydl:
            result = ydl.extract_info(msg['url'], download=False)

            for entry in result['entries']:
                if (entry != None):
                    urlsToDownload.append('https://www.youtube.com/watch?v='+entry['id'])
    else:
        urlsToDownload.append(msg['url'])
    ydl_opts = make_command(msg)
    urlsToSave = urlsToDownload[:]
    with youtube_dl.YoutubeDL(ydl_opts) as ydl:
        ydl.download(urlsToDownload)
        ydl.cache.remove()
    if(not errorvar):
        for urlinlist in urlsToSave:
            saveUrl(urlinlist, msg, False)
    if (savePlaylist and not errorvar):
        saveUrl(msg['url'], msg, True)

def downloadList():
    global errorvar
    db = TinyDB('downloadlist.json')
    if (len(db)):
        for item in db:
            downloadSingle(item)
            if(errorvar):
                db.truncate()
                return
        db.truncate()
    resp = {'action': 'emptylist'}
    send_message(encode_message(resp))

def addToList(msg):
    db = TinyDB('downloadlist.json')
    dbQuery = Query()
    oldentry = db.get(dbQuery.url == msg['url'])

    if(oldentry == None):
        db.insert({'url': msg['url'], 'outpath': msg['outpath'], 'onlysound': msg['onlysound'], 'subtitles': msg['subtitles'], 'quality': msg['quality'], 'withoutsound': msg['withoutsound'], 'playlist': msg['playlist']})

# Will send progress report to the Extension so it can show a progress bar
def showProgress(status):
    global progress_seq
    global urlsToSave
    global msg
    if (status["status"] == "downloading"):
        progress = int(float(status["_percent_str"][:-1]))
        if (progress not in progress_seq):
            progress_seq.add(progress)
            resp = {'action':'progress', 'status':progress}
            send_message(encode_message(resp))
    elif (status["status"] == "finished"):
        progress_seq.clear()
    elif (status["status"] == "error"):
        send_message(encode_message("error"))

def updateChecker(msg):
    currentDateValue = datetime.datetime.now().strftime("%Y"+"%m"+"%d")
    with open("lastupdate.txt", "r+",encoding='utf8') as myfile:
        oldDateValue = int(myfile.readline())
        if (int(currentDateValue) - oldDateValue >0):
            myfile.seek(0)
            myfile.write(currentDateValue)
            myfile.truncate()
            directory = os.getcwd()
            os.system(directory +"\\Scripts\\pip.exe install -U -q youtube-dl")
    checkUrl(msg['url'])

def splitUrl(url):
    startindex = url.find("&list=")
    if (startindex>0):
        baseUrl= url[:startindex]
        playlistUrl= url[startindex+6:]
        extraParameterIndex = playlistUrl.find("&")
        if (extraParameterIndex>=0):
            finalPlaylistUrl = playlistUrl[:extraParameterIndex]
            return [baseUrl, finalPlaylistUrl]
        else:
            return [baseUrl, playlistUrl]
    else:
        return False

def checkUrl(url):
    # check in db and list if that url is saved already
    res = splitUrl(url)
    downloadlistdb = TinyDB('downloadlist.json')
    downloadlistdbQuery = Query()
    if (len(downloadlistdb)):
        downloadlistoldentry = downloadlistdb.get(downloadlistdbQuery.url == url)
        if (downloadlistoldentry != None):
            resp = {'action': 'addedtolist'}
            send_message(encode_message(resp))
            return
    if (res):

        db = TinyDB('alreadydownloaded.json')
        dbQuery = Query()
        entry = db.get((dbQuery.url == res[1]) & (dbQuery.playlist == True)) 
        if (entry):
            resp = {'action': 'alreadydownloadedpl', 'onlysound': entry['onlysound'], 'subtitles': entry['subtitles'], 'quality': entry['quality'], 'withoutsound': entry['withoutsound'], 'date': entry['date'], 'playlist': entry['playlist']}
            send_message(encode_message(resp))
            return
    else:
        db = TinyDB('alreadydownloaded.json')
        dbQuery = Query()
        entry = db.get(dbQuery.url == url)
        if (entry):
            resp = {'action': 'alreadydownloaded', 'onlysound': entry['onlysound'], 'subtitles': entry['subtitles'], 'quality': entry['quality'], 'withoutsound': entry['withoutsound'], 'date': entry['date'], 'playlist': entry['playlist']}
            send_message(encode_message(resp))
            return
    resp = {'action': 'default'}
    send_message(encode_message(resp))

def saveUrl(url, msg, playlistFlag):
    # check if url is saved already
    res = splitUrl(url)
    realUrl = ""
    if (playlistFlag == True):
        realUrl = res[1]
    else:
        realUrl = url
    db = TinyDB('alreadydownloaded.json')
    dbQuery = Query()
    oldentry = db.get(dbQuery.url == realUrl)
    currentDate = datetime.datetime.now().strftime('%y'+'%m'+'%d')
    if (oldentry == None):
        db.insert({'url': realUrl, 'onlysound': msg['onlysound'], 'subtitles': msg['subtitles'], 'quality': msg['quality'], 'withoutsound': msg['withoutsound'], 'date': currentDate, 'playlist': playlistFlag})
    else:
        db.update({'onlysound': msg['onlysound'], 'subtitles': msg['subtitles'], 'quality': msg['quality'], 'withoutsound': msg['withoutsound'], 'date': currentDate}, dbQuery.url == realUrl)

# START 
sys.path.insert(0, os.getcwd() + "/Lib/site-packages")
import youtube_dl
from tinydb import TinyDB, Query
import datetime
progress_seq = set(())
urlsToSave = []
currentDate = datetime.datetime.now().strftime('%y'+'%m'+'%d')
msg = ""
errorvar = 0
with open("err.txt", "w",encoding='utf8') as myfile:
    myfile.write("")
while True:
    msg = get_message()
    if (msg['action'] == "checkurl"):
        updateChecker(msg)
    elif (msg['action'] == "downloadsingle"):
        downloadSingle(msg)
        if(errorvar == 0):
            resp = {'action': 'alreadydownloaded', 'onlysound': msg['onlysound'], 'subtitles': msg['subtitles'], 'quality': msg['quality'], 'withoutsound': msg['withoutsound'], 'date': currentDate, 'playlist': msg['playlist']}
            
            if(msg['playlist'] == True):
                resp['action'] = 'alreadydownloadedpl'
            send_message(encode_message(resp))
    elif (msg['action'] == 'downloadlist'):
        downloadList()
    elif (msg['action'] == 'addtolist'):
        addToList(msg)
        resp = {'action': 'addedtolist', 'onlysound': msg['onlysound'], 'subtitles': msg['subtitles'], 'quality': msg['quality'], 'withoutsound': msg['withoutsound'], 'date': currentDate, 'playlist': msg['playlist']}
        send_message(encode_message(resp))
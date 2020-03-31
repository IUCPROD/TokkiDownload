from __future__ import unicode_literals
import os
import sys
import json
import struct

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

# Depending on the given downloadaction it will either download a single given url, download 
# the current list in downloads.txt or append the given url to the list
def download_action(msg):
    if (msg["downloadaction"] == "downloadsingle"):
        ydl_opts = make_command(msg)
        with youtube_dl.YoutubeDL(ydl_opts) as ydl:
            ydl.download([msg['url']])                
    elif (msg["downloadaction"] == "downloadlist"):
        with open("downloads.txt") as f:
            urls = f.readlines()
        if (len(urls)>0):
            ydl_opts = make_command(msg)

            with youtube_dl.YoutubeDL(ydl_opts) as ydl:
                ydl.download(urls)
            with open("downloads.txt", "w") as f:
                f.write("")
        else:
            send_message(encode_message("emptylist"))
    else:
        with open("downloads.txt", "a") as myfile:
            myfile.write(msg["url"]+"\n")

# Will send progress report to the Extension so it can show a progress bar
def showProgress(status):
    global progress_seq
    if (status["status"] == "downloading"):
        progress = int(float(status["_percent_str"][:-1]))
        if (progress not in progress_seq):
            progress_seq.add(progress)
            send_message(encode_message(progress))
    elif (status["status"] == "finished"):
        progress_seq.clear()
    elif (status["status"] == "error"):
        send_message(encode_message("error"))

# START 
sys.path.insert(0, os.getcwd() + "/Lib/site-packages")
import youtube_dl
progress_seq = set(())

while True:
    message = get_message()
    download_action(message)
    send_message(encode_message("finished"))

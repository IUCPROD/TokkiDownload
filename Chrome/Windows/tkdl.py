import json
import sys
import struct
import os

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

# Send an encoded message to stdout.
def send_message(encoded_message):
    sys.stdout.buffer.write(encoded_message['length'])
    sys.stdout.buffer.write(encoded_message['content'])
    sys.stdout.buffer.flush()

def startYoutubeDl():
    os.system(makeCommand())

def startListDl():
    os.system(makeCommand())
    with open("downloads.txt", "w") as myfile:
        myfile.write(";")

def appendDownloadToList():
    with open("downloads.txt", "a") as myfile:
        myfile.write("\n"+message["url"]+"\n")

def makeCommand():
    global message
    flagList = list()
    start = os.getcwd() + "\\youtube-dl.exe "
    url = message["url"]
    outpath="-o " + message["outpath"] + "/" + "%(title)s.%(ext)s"
    flagList.append('--no-playlist ')
    if message["onlysound"]:
        flagList.append('-f "bestaudio[ext=m4a]/bestaudio" ')
    elif message["withoutsound"]:
        flagList.append('-f "bestvideo[ext=webm]/best" ')
    elif message["quality"] == "bestpossible":
        flagList.append('-f "best" ')
    elif message["quality"] == "1080p":
        flagList.append('-f "bestvideo[height<=1080]+bestaudio/best[height<=1080]" ')
    elif message["quality"] == "720p":
        flagList.append('-f "bestvideo[height<=720]+bestaudio/best[height<=720]" ')
    elif message["quality"] == "480p":
        flagList.append('-f "bestvideo[height<=480]+bestaudio/best[height<=480]" ')
    if message["subtitles"]:
        flagList.append('--write-sub --sub-format "srt" ')
    if message["playlist"]:
        flagList.remove('--no-playlist ')
        flagList.append('--yes-playlist ')
    if message["downloadaction"] == 1:
        flagList.append('-a "downloads.txt" ')
    cmd= start
    for flag in flagList:
        cmd = cmd + flag
    cmd = cmd + outpath+" "
    if message["downloadaction"] == 1:
        pass
    else:
        cmd= cmd + '"' +url +'"'
    cmd = cmd + " > err.txt"
    return cmd
#Looks for messages from extension
while True:
    message = get_message()
    if message["downloadaction"] == 0:
        startYoutubeDl()
    elif message["downloadaction"] == 1:
        startListDl()
    elif message["downloadaction"] == 2:
        appendDownloadToList()
    send_message(encode_message("pong"))
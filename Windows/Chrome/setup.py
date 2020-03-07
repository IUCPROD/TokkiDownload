import os
directory = os.getcwd()

key = directory + "\\manifest.json"
print("Updating Registry NativeMessagingHosts")
os.system("reg add HKCU\\SOFTWARE\\Google\\Chrome\\NativeMessagingHosts /f")
cmd = "reg add HKCU\\SOFTWARE\\Google\\Chrome\\NativeMessagingHosts\\tkdl /t REG_SZ /f /d "+ key
print("Updating Registry tdkl")
os.system(cmd)
print("Updating Youtube-dl")
os.system(directory + "\\youtube-dl.exe -U")
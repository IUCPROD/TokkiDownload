import os
directory = os.getcwd()

key = directory + "\\manifest.json"
os.system("reg add HKCU\\SOFTWARE\\Google\\Chrome\\NativeMessagingHosts /f")
cmd = "reg add HKCU\\SOFTWARE\\Google\\Chrome\\NativeMessagingHosts\\tkdl /t REG_SZ /f /d "+ key
os.system(cmd)
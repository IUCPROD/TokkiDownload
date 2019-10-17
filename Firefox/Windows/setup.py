import os
directory = os.getcwd()

key = directory + "\\manifest.json"
print(key)
os.system("reg add HKCU\\SOFTWARE\\Mozilla\\NativeMessagingHosts /f")
cmd = "reg add HKCU\\SOFTWARE\\Mozilla\\NativeMessagingHosts\\tkdl /t REG_SZ /f /d "+ key
os.system(cmd)
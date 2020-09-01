import os
directory = os.getcwd()

key = directory + "\\manifest.json"
print("Updating Registry NativeMessagingHosts")
os.system("reg add HKCU\\SOFTWARE\\Mozilla\\NativeMessagingHosts /f")
cmd = "reg add HKCU\\SOFTWARE\\Mozilla\\NativeMessagingHosts\\tkdl /t REG_SZ /f /d "+ key
print("Updating Registry tdkl")
os.system(cmd)

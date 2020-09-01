@echo off

python.exe -u "get-pip.py"
python.exe -u "setup.py"
python.exe -u "updateYTDL.py"
python.exe -u "tinydbsetup.py"


pause
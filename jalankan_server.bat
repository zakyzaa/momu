@echo off
echo ==============================================
echo   MOMU Photobooth - Local Web Server
echo ==============================================
echo Menjalankan local server di port 8080...
echo Buka di browser: http://localhost:8080
start "" "http://localhost:8080"
python -m http.server 8080
pause

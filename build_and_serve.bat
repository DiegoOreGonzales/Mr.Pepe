@echo off
echo ========================================
echo   Mr. Pepe POS - Build y Servidor Web
echo ========================================
echo.

set FLUTTER=C:\flutter\bin\flutter.bat
set GIT=C:\Program Files\Git\bin

echo [1/2] Compilando para produccion...
set PATH=%PATH%;%GIT%
%FLUTTER% build web --release

echo.
echo [2/2] Iniciando servidor en http://localhost:8080 ...
echo Presiona Ctrl+C para detener.
echo.

node -e "const h=require('http'),fs=require('fs'),p=require('path');h.createServer((req,res)=>{let u=req.url.split('?')[0];let f=p.join('build','web',u==='/'?'index.html':u);try{const d=fs.readFileSync(f);const e=f.split('.').pop();const m={'html':'text/html','js':'application/javascript','wasm':'application/wasm','png':'image/png','webp':'image/webp','json':'application/json','css':'text/css','ttf':'font/ttf','otf':'font/otf','ico':'image/x-icon'};res.writeHead(200,{'Content-Type':m[e]||'application/octet-stream'});res.end(d)}catch(err){res.writeHead(404);res.end('404')}}).listen(8080,()=>{console.log('Servidor corriendo en http://localhost:8080');require('child_process').exec('start http://localhost:8080')})"

pause

@echo off
chcp 65001 >nul
cd /d "%~dp0"
set PORT=8765
echo.
echo  ========================================
echo   拉基 OBS 工具 · 本機媒體伺服器
echo   http://127.0.0.1:%PORT%/
echo  ========================================
echo.
echo  1. 保持這個視窗開著
echo  2. 開 入口.html → ⑪ 複製媒體網址
echo  3. 貼到 OBS 瀏覽器來源（應是 http://127.0.0.1:...）
echo  有 YouTube 時一定要用這個，file:// 會 Error 153
echo.
where py >nul 2>nul && (
  py -m http.server %PORT%
  goto :end
)
where python >nul 2>nul && (
  python -m http.server %PORT%
  goto :end
)
where python3 >nul 2>nul && (
  python3 -m http.server %PORT%
  goto :end
)
where node >nul 2>nul && (
  node -e "const http=require('http'),fs=require('fs'),path=require('path'),url=require('url');const root=process.cwd();const port=process.env.PORT||8765;const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.svg':'image/svg+xml','.mp4':'video/mp4','.webm':'video/webm','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.txt':'text/plain; charset=utf-8'};http.createServer((req,res)=>{try{let p=decodeURIComponent(url.parse(req.url).pathname||'/');if(p==='/')p='/入口.html';const fp=path.normalize(path.join(root,p.replace(/^\//,'')));if(!fp.startsWith(root)){res.writeHead(403);return res.end('forbidden');}fs.readFile(fp,(e,buf)=>{if(e){res.writeHead(404);return res.end('not found');}res.writeHead(200,{'Content-Type':mime[path.extname(fp).toLowerCase()]||'application/octet-stream','Cache-Control':'no-store'});res.end(buf);});}catch(err){res.writeHead(500);res.end(String(err));}}).listen(port,()=>console.log('http://127.0.0.1:'+port+'/'));"
  goto :end
)
echo [錯誤] 找不到 Python 或 Node。
echo 請安裝其一後再雙擊本檔：
echo   - Python: https://www.python.org/downloads/ （勾 Add to PATH）
echo   - 或 Node.js: https://nodejs.org/
echo.
pause
:end

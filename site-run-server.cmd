@echo off
setlocal
set /a num=%random% + 4000
if "%1"=="--" (
    call bundle exec jekyll serve --port %num% --host 0.0.0.0
) else (
    start cmd /c bundle exec jekyll serve --port %num% --host 0.0.0.0
    ping 127.0.0.1 -n 9 > nul
    start http://127.0.0.1:%num%
)
endlocal

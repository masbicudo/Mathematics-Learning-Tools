@rem ----[ This code block detects if the script is being running with admin PRIVILEGES If it isn't it pauses and then quits]-------
@echo OFF
FOR /F "tokens=1* USEBACKQ delims=:" %%F IN (`chcp`) DO (
SET old_cp=%%G
)
@chcp 65001>nul
NET SESSION >nul 2>&1
IF %ERRORLEVEL% EQU 0 (
    ECHO Administrator PRIVILEGES Detected! 
) ELSE (
   ECHO.[31m
   echo.     ████████ ████████  ████████   ███████  ████████  
   echo.     ██       ██     ██ ██     ██ ██     ██ ██     ██ 
   echo.     ██████   ████████  ████████  ██     ██ ████████  
   echo.     ██       ██   ██   ██   ██   ██     ██ ██   ██    
   echo.     ██       ██    ██  ██    ██  ██     ██ ██    ██  
   echo.     ████████ ██     ██ ██     ██  ███████  ██     ██ 
   echo.[0m
   echo.
   echo ──────── [91mERROR: ADMINISTRATOR PRIVILEGES REQUIRED[0m ────────
   echo [33mThis script must be run as administrator to work properly!  [0m
   echo ──────────────────────────────────────────────────────────
   echo.
@chcp %old_cp%>nul
   PAUSE
   EXIT /B 1
)

echo.source 'https://rubygems.org'>Gemfile
echo.gem 'github-pages', group: :jekyll_plugins>>Gemfile
call bundle add webrick
call bundle install

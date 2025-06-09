@echo off
REM === CHANGE TO PROJECT DIRECTORY ===
cd /d C:\Users\User\Downloads\my-ryhme-app-main

REM === PROMPT FOR COMMIT MESSAGE ===
set /p commitmsg="Enter commit message: "

REM === GIT COMMIT AND PUSH ===
git add .
git commit -m "%commitmsg%"
git push origin main --force

REM === CLOUD BUILD SUBMIT ===
gcloud builds submit --substitutions=_VITE_FIREBASE_API_KEY=AIzaSyDkrIV0Ji28ULmGHDl6mLTMvRWQsyR4XFg,_VITE_FIREBASE_AUTH_DOMAIN=my-rhyme-app.firebaseapp.com,_VITE_FIREBASE_PROJECT_ID=my-rhyme-app,_VITE_FIREBASE_STORAGE_BUCKET=my-rhyme-app.appspot.com,_VITE_FIREBASE_MESSAGING_SENDER_ID=487322724536,_VITE_FIREBASE_APP_ID=1:487322724536:web:a5eb91460b22e57e2b2c4d
@echo off
REM Check for commit message argument
set "COMMIT_MSG=%~1"
if "%COMMIT_MSG%"=="" set "COMMIT_MSG=Auto commit"

REM Change to project directory
cd /d "C:\Users\User\Downloads\my-ryhme-app-main"

REM Git add, commit, and push
git add .
git commit -m "%COMMIT_MSG%"
git push

REM === CLOUD BUILD SUBMIT ===
gcloud builds submit --substitutions=_VITE_FIREBASE_API_KEY=AIzaSyDkrIV0Ji28ULmGHDl6mLTMvRWQsyR4XFg,_VITE_FIREBASE_AUTH_DOMAIN=my-rhyme-app.firebaseapp.com,_VITE_FIREBASE_PROJECT_ID=my-rhyme-app,_VITE_FIREBASE_STORAGE_BUCKET=my-rhyme-app.appspot.com,_VITE_FIREBASE_MESSAGING_SENDER_ID=487322724536,_VITE_FIREBASE_APP_ID=1:487322724536:web:a5eb91460b22e57e2b2c4d

REM === DEPLOY TO CLOUD RUN ===
gcloud run deploy my-rhyme-app --image=us-central1-docker.pkg.dev/my-rhyme-app/my-rhyme-app-images/my-rhyme-app-py:IMAGE_TAG --region=us-central1 --platform=managed --allow-unauthenticated --set-secrets=ANTHROPIC_API_KEY=apikey:latest
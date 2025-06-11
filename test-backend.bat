@echo off
echo ========================================
echo TESTING BACKEND CONNECTION
echo ========================================
echo.

echo Testing health endpoint...
curl http://localhost:3001/health

echo.
echo.
echo Testing analysis endpoint with sample text...
curl -X POST http://localhost:3001/api/analyze -H "Content-Type: application/json" -d "{\"text\":\"roses are red violets are blue\"}"

echo.
echo.
pause 
echo ========================================
echo TESTING BACKEND CONNECTION
echo ========================================
echo.

echo Testing health endpoint...
curl http://localhost:3001/health

echo.
echo.
echo Testing analysis endpoint with sample text...
curl -X POST http://localhost:3001/api/analyze -H "Content-Type: application/json" -d "{\"text\":\"roses are red violets are blue\"}"

echo.
echo.
pause 
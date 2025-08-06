@echo off
set NODE_OPTIONS=--max-old-space-size=4096
set UV_THREADPOOL_SIZE=16
set NODE_ENV=production

echo 🚀 Starting optimized build with 4096MB memory...
echo ⚡ Using 16 threads...

npm run build:super-fast

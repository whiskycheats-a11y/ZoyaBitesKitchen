#!/bin/bash
cd /home/runner/workspace/server && node index.js &
cd /home/runner/workspace && npx vite --host 0.0.0.0 --port 5000

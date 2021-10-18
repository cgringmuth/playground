#!/bin/bash

# check https://github.com/processing/p5.js/wiki/Local-server for more details

if command -v http-server &> /dev/null; then
    http-server --log-ip -c-1
else
    echo "http-server is not install. Fallback to python http server, which is quite slow."
    echo "Install http-server: sudo npm install -g http-server"
    python3 -m http.server
fi

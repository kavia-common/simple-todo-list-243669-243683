#!/bin/bash
cd /home/kavia/workspace/code-generation/simple-todo-list-243669-243683/frontend_react_ui
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi


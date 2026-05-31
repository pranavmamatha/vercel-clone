#!/bin/bash

export GIT_REPOSITORY_URL="$GIT_REPOSITORY_URL"

rm -rf /home/app/output
git clone "$GIT_REPOSITORY_URL" /home/app/output

node script.js

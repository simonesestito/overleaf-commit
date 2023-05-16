#!/bin/bash
set -e
set -x

# TODO: Environment variables to change!
export OVERLEAF_READ_SHARE_URL='https://www.overleaf.com/read/xdjkjrjcqyym'
export PROJECT_FOLDER='/home/simone/overleaf-commit/bachelor-thesis'
export ZIP_PROJECT='Bachelor Thesis.zip' # Must be the same Overleaf project name

# Download project and clone to GitHub

cd "$(dirname "$0")"

# Pull
(
    cd "$PROJECT_FOLDER"
    git checkout main
    git pull
)

# Download from Overleaf
node .
unzip -o "$ZIP_PROJECT" -d "$PROJECT_FOLDER"

# Push to GitHub
(
    cd "$PROJECT_FOLDER"
    git add .
    git commit -a
    git push
)

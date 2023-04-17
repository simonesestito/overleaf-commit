#!/bin/bash
set -e
set -x

# Download project and clone to GitHub

PROJECT_FOLDER='/home/simone/overleaf-commit/bachelor-thesis'
ZIP_PROJECT='Bachelor Thesis.zip'

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

(
    cd "$PROJECT_FOLDER"
    git add .
    git commit -a
    git push
)

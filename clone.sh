#!/bin/bash
set -e

# TODO: Environment variables to change!
export OVERLEAF_READ_SHARE_URL='https://www.overleaf.com/read/xdjkjrjcqyym'
export PROJECT_FOLDER='/home/simone/overleaf-commit/bachelor-thesis'
export GIT_REPO_URL='git@github.com:simonesestito/bachelor-thesis.git'
export ZIP_PROJECT='Bachelor Thesis.zip' # Must be the same Overleaf project name

# Download project and clone to GitHub

cd "$(dirname "$0")"

# Clone if doesn't exist yet
if [ ! -d "$PROJECT_FOLDER/.git/" ]; then
    git clone "$GIT_REPO_URL" "$PROJECT_FOLDER"
fi

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

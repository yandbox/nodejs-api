#!/bin/sh

fetch_assets() {
  url=https://nodejs.org/dist/latest/docs/api/assets
  dir=docs/assets
  mkdir -p $dir
  cd $dir
  curl --remote-name-all \
      $url/style.css \
      $url/sh.css \
      $url/sh_main.js \
      $url/sh_javascript.min.js \
      http://zeptojs.com/zepto.min.js
}

update() {
  git add .
  git commit -m $1
  git push
}

force_amend() {
  git add .
  git commit --amend --no-edit
  git push -f
}

case "$1" in
  "-a")
    fetch_assets
    ;;
  "-u")
    msg=$2
    if [ -z "$msg" ]; then
        msg="update"
    fi
    update $msg
    ;;
  "-f")
    force_amend
    ;;
  *)
    echo "You have failed to specify what to do correctly."
    exit 1
    ;;
esac

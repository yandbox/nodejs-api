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
}

fetch_assets

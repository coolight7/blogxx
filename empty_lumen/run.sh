#!/bin/bash
script_dir=$(pwd)

echo $script_dir

npm run docs:build

if [ $? -ne 0 ]; then
    exit -1
fi

rm -rf build/

mkdir build

mv .vitepress/dist/* build/

cd $script_dir
chmod -R 0755 ./*

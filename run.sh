#!/bin/bash
script_dir=$(pwd)

echo $script_dir

sudo node ./buildAllPage.js

cd $script_dir
chmod -R 0755 ./*
#!/bin/bash
script_dir=$(pwd)

echo $script_dir

sudo node ./buildAllPage.js

cd $script_dir
chmod -R 0755 ./*
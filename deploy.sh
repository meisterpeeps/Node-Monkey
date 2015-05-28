#! /bin/bash
pm2 stop ../production/server/app.js
mkdir temp
mkdir temp/node_modules
mkdir temp/bower_modules
mv ../production/node_modules/* temp/node_modules
mv ../production/client/bower_components/* temp/bower_modules
cd ../
rm -r production
mkdir production
cd production
curl -L -o master.zip https://github.com/cliffmoney/jabber/archive/master.zip
unzip master.zip
mv jabber-master/* .
rm -R jabber-master
rm master.zip
mv ../drone/temp/node_modules .
mv ../drone/temp/bower_modules client/bower_components
npm install
bower install
grunt build 
pm2 start server/app.js

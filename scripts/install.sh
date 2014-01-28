#!/bin/sh
npm install dataflo.ws -g
chmod -R a+w /usr/lib/node_modules/dataflo.ws
cd ../opxi2-nodejs
npm install .
sudo npm link
cd ../opxi2flowy
npm install .
#npm link

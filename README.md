Opxi2 Flowbased Messaging Platform
==================================

Integration of Opxi2 Node.js Messaging core with Flow based development

Part of [dataflo.ws framework](https://github.com/apla/dataflo.ws)


Installation
============

`npm install dataflo.ws -g`

`cd ../opxi2-nodejs`

`npm install .`

`sudo npm link`

`cd ../opxi2flowy`

`npm install .`

`#sudo npm link`

Read Log Files
==============
sed -r "s/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[m|K]//g" FILE
sed -n -e 120p FILE

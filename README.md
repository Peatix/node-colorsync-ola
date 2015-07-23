# Install

## Install node.js

Choose a way you may like

* via nodejs.org https://nodejs.org/download/
* brew install nodejs

## clone this repository to your machine

`git clone https://github.com/Peatix/small-projects.git`

## install related modules

```
$ cd small-projects/akira/funiki-sync
$ npm install .
```

# Take info from reception screen

open source code view of running reception screen, and find out the lines like below

```
 var csc = new ColorSyncClient({
    server: 'ws://colorsync.peatix.com/5816/reception?uid=5'
    , token: 'eUSgNOcQKAlPZWqFDxcVQQJy8ubVCEI5'
    , onjoin: function (res) {
      update_checkin_progress();
    }
```

# Connect iOS app to funiki glasses via OSC

open iOS funiki app, go to setting > MIDI/OSC, and enable OSC control
remember IP Address and Port number e.g. 10.0.1.4 and 2061

# run app

run app with the server address and token which get by the step above, and glasses' IP and port.
```
$ node ./app.js ws://colorsync.peatix.com/12345/reception/uid=12345 abcdefghogehogehoge 10.0.1.4 2061
```
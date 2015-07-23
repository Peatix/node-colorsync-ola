# Install

## Install node.js

Choose a way you may like

* via nodejs.org https://nodejs.org/download/
* brew install nodejs

## clone this repository to your machine

`git clone https://github.com/Peatix/small-projects.git`


# Take info from reception screen

## Install OLA

  TBD

open source code view of running reception screen, and find out the lines like below

```
 var csc = new ColorSyncClient({
    server: 'ws://colorsync.peatix.com/5816/reception?uid=5'
    , token: 'eUSgNOcQKAlPZWqFDxcVQQJy8ubVCEI5'
    , onjoin: function (res) {
      update_checkin_progress();
    }
```

run app with the server address and token which get by the step above, and DMX Universe and addresses
```
$ node ./index.js ws://colorsync.peatix.com/12345/reception/uid=12345 abcdefghogehogehoge <dmxuniverse> <dmxaddress> [<dmxaddress>...]
```
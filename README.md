# Requirement

* node.js
* OLA ( Open Lighting Architecture )

## Install example for OS X Yosemite and ENTTEC Open DMX USB

install homebrew then
```
brew install node
brew install libftdi
brew install libftdi0
git clone https://github.com/OpenLightingProject/ola.git
cd ola
autoreconf -i
./configure
make
make check
sudo make install
cd ~/.ola
# disable opendmx and usbserial
olad -f
```

then, open `http://localhost:9090/` and set up devices to universe
NOTE: don't stay in DMX Console tab. it also sending dmx signals continuously as long as it's been opened.

# clone this repository to your machine

`git clone https://github.com/Peatix/node-colorsync-ola`

# Run

## Take reception info

open a source code view of running reception screen, and find out the lines like below

```
 var csc = new ColorSyncClient({
    server: 'ws://colorsync.peatix.com/5816/reception?uid=5'
    , token: 'eUSgNOcQKAlPZWqFDxcVQQJy8ubVCEI5'
    , onjoin: function (res) {
      update_checkin_progress();
    }
```

## Run from terminal

run app with the server address and token which get by the step above, and DMX Universe and addresses
```
$ node ./index.js ws://colorsync.peatix.com/12345/reception/uid=12345 abcdefghogehogehoge <dmxuniverse> <dmxaddress> [<dmxaddress>...]
```
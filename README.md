# Rquired packages
- commander, install with `npm install --save commander`

# To install on your system, so that the command name in the 'bin' section of the package.json can be used anywhere
sudo npm install -g

## set up a soft link to your local files so that the system always uses your latest changes
sudo npm link

# Assumptions
The directory ~/bin/dlog exists
The script ~/bin/grabLatest.sh exists
SSH is configured to know where the dev board is located so that grabLatest.sh can work

## Contents of grabLatest.sh
```
#!/usr/bin/env bash

# get the name of latest dlog
dlog=$(ssh board "ls -t /data/log | head -1")

# copy it over
scp board:/data/log/${dlog} ~/logs

# convert
dlogparser ~/logs/${dlog} ~/logs

# make a copy for easy access
cp -f ~/logs/${dlog}.csv ~/bin/dlog/latest.csv
echo "Latest DLog file: ${dlog}"
```

## Configure SSH
Create a ssh public/private key pair

### in your ~/.ssh/config file have the following:
Host devBoard
   HostName <board ip>
   User root
   IdentityFile ~/.ssh/id_rsa


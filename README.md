# teaparty
signal server for p2p connections in msvr. currently running as a heroku app instance

Talk to @michaelpalumbo before cloning this repo, thanks

See app.js in the [p2p branch of /msvr](https://github.com/worldmaking/msvr/tree/p2p), run it using node:

```shell
node app.js
```

...and it will connect to the teaparty server and retrieve ip addresses and usernames for all other remote running-instances of app.js. 

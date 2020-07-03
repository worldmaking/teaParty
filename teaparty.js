const WebSocket = require('ws');
const app = require('express')()
const http = require('http').createServer(app);;

const Discord = require('discord.js');
const client = new Discord.Client();
const {config, token} = require('./config.json');
const { argv } = require('yargs');

// let channel
// client.once('ready', () => {
//   console.log('Ready!');
//   // channel = client.channels.find('name', 'teaparty')
//   // channel.send('the teaparty has started')
//   if(!argv.l){
//   client.channels.cache.get(`698580923960131658`).send(`the teaparty has started`)
//   }
// });

// client.login(token);

// 698580923960131658

// client.on('message', message => {
//     // console.log(message.content);
//     if (message.content === '!ping') {
//         // send back "Pong." to the channel the message was sent in

//     }

// });


// // Create an event listener for new guild members
// client.on('guildMemberAdd', member => {
//     // Send the message to a designated channel on a server:
//     const channel = member.guild.channels.cache.find(ch => ch.name === 'welcome');
//     // Do nothing if the channel wasn't found on this server
//     if (!channel) return;
//     // Send the message, mentioning the member
//     channel.send(`Welcome to the server, ${member}! We're a loose collective of artists who do internet-based performances.`);
//     channel.send('Most of our events are open for participation. type ```\!list``` at any time to check the schedule, and click on a link to get involved with that particular event. Like So:');
//     channel.send('!list')
    
//   });

  




let listenPort = (process.env.PORT || 8090)
const wss = new WebSocket.Server({ 'server': http, clientTracking: true });
http.listen(listenPort, function(){
  // console.log('listening on ' + listenPort);
})

//TODO: once we have multiple hosts running, need a way to acquire their addresses and run status
let guestlist = {
  pals: {},
  headcount: 0,
  host: {
   name: 'herokuHost',
   ip: 'mischmasch-host.herokuapp.com'
  }

}

let lookup = {}
// let id = 0;

// custom keepAlive function to detect and handle broken connections

function noop() {}

function heartbeat() {
  this.isAlive = true;
}

const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) {
      // console.log(ws)
      return ws.terminate();
    }
 
    ws.isAlive = false;
    ws.ping(noop);
  });
}, 3000);

//



wss.on('connection', function connection(ws, req) {
  let id = req.headers['sec-websocket-key'];
  // console.log(id)
  ws.isAlive = true;
  ws.on('pong', heartbeat);
  
  ws.on('message', function incoming(message) {
    msg = JSON.parse(message)
    switch (msg.cmd){

      
      case 'newClient':

          // prevent duplicate entries from client if it re-connects
          Object.keys(lookup).forEach(function(key){
            if(lookup[key] === msg.data.username){
              delete lookup[key]
            }
          })

        lookup[id] = msg.data.username
        lookup[msg.data.username] = id
        guestlist.pals[msg.data.username] = msg.data
        // use this to keep count # of headcount on network
        // tempCounter = 0
        // Object.keys(lookup).forEach(function(key){
        //   tempCounter++
        // })
        guestlist.headcount = Object.keys(guestlist.pals).length
        // guestlist.headcount = tempCounter / 2 // lookup always contains 2 entries per peer
        // // console.log('number of clients', clients.headcount)
        // if (guestlist.host === null){
        //   guestlist.host = msg.data.username
        // } else {
        //   //?
        // }


        network = JSON.stringify({
          cmd: 'guestlist',
          data: guestlist,
          date: Date.now() 
        })
        broadcast(network)

        console.log('\nclient update: ', guestlist, '\n\n')

        // if(!argv.l){
        // client.channels.cache.get(`698580923960131658`).send('updated guestlist: ' + Object.keys(guestlist.pals))
        // }

        break;

    
      
      default:
        // console.log(lookup[id] + ' sent unhandled message ' + msg)
        ws.send('server received message but did not understand: ' +  msg)
      break;

      

      }
  });

  ws.on('close', function(code, reason) {

    clearInterval(interval);
    // // console.log('ws id', id)
    let d = lookup[id]
    delete guestlist.pals[d]
    // console.log('escorted ' + d + ' from teaparty')

    // let msg = JSON.stringify({
    //   cmd: 'serverMsg',
    //   data: d,
    //   date: Date.now() 
    // })
    // broadcast(msg)
    // console.log('updated guestlist', guestlist)
    let attendance = Object.keys(guestlist.pals).length
    guestlist.headcount = attendance
    // remove client info from list of active guestlist
    // delete guestlist[id]
    //guestlist.headcount = connections - 1
    // if(!argv.l){

    
    // client.channels.cache.get(`698580923960131658`).send('updated guestlist: ' + Object.keys(guestlist.pals))
    // }
    if(guestlist.headcount === 0){
      // guestlist.host = null
      console.log('\n\nthe party is over\n\n')
      // ? msg the deltaWS host (mischmasch-host.herokuapp.com) and tell to store delta history, sceneFile, and then process.exit()?
      return
    } 
    //   else if (guestlist.headcount === 1 || guestlist.host === d){
    //   // if only one client remains or client that just disconnected was host, automatically assign a new host
    //   for (var prop in guestlist.pals) {
    //     // object[prop]
    //     // console.log(prop + ' is now the teaparty host')
    //     // for now, randomly select next host:
    //     guestlist.host = prop
    //     break;
    //   }
    // } else {
    // } 

    let clientUpdate = JSON.stringify({
      cmd: 'guestlist',
      data: guestlist,
      date: Date.now() 
    })
    broadcast(clientUpdate)
    console.log('guestlist update', guestlist)

  })
});

// ping the pals/host -- solves a bug where heroku apps will crash if no response after nn seconds
// so ping all th pals/host!
setInterval(() => {
  wss.clients.forEach((client) => {
    client.send(JSON.stringify({
      cmd: 'ping',
      data: guestlist,
      date: Date.now() 
    }))
  });
}, 3000);


  function broadcast(msg){
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  }

function updateNetwork(msg){
  
  network = JSON.stringify({
    cmd: 'network',
    data: msg,
    date: Date.now() 
  })
  broadcast(network)
}
// use this to reset the signal server from a client. 
function hardReset(){
  
}




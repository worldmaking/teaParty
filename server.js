const WebSocket = require('ws');
const app = require('express')()
const http = require('http').createServer(app);;

let listenPort = (process.env.PORT || 8090)
const wss = new WebSocket.Server({ 'server': http, clientTracking: true });
http.listen(listenPort, function(){
  console.log('listening on ' + listenPort);
})

let clients = {}
clients['peers'] = {}
let lookup = {}
let peers = [];
let id = 0;
let connections = 0




wss.on('connection', function connection(ws, req, client) {
  id++
  console.log('new connection established ')
  
  ws.on('message', function incoming(message) {
    msg = JSON.parse(message)
    console.log(msg)
     // rethinkDB log:
    // log(msg)
    switch (msg.cmd){

      
      case 'newClient':
        console.log(msg)

          // prevent duplicate entries from client if it re-connects
          Object.keys(lookup).forEach(function(key){
            if(lookup[key] === msg.data.username){
              delete lookup[key]
            }
          })

        lookup[id] = msg.data.username
        lookup[msg.data.username] = id
        clients[msg.data.username] = msg.data
        let newPeer = msg.data
        // use this to keep count # of peers on network
        tempCounter = 0
        Object.keys(lookup).forEach(function(key){
          tempCounter++
        })
        clients.peers = tempCounter / 2 // lookup always contains 2 entries per peer
        
        if (clients.peers = 1){
          clients['host'] = msg.data.username
        } else {
          //?
        }
        addPeer = JSON.stringify({
          cmd: 'addPeer',
          data: newPeer,
          date: Date.now() 
        })
        broadcast(addPeer)

        network = JSON.stringify({
          cmd: 'network',
          data: clients,
          date: Date.now() 
        })
        broadcast(network)

        // msg = JSON.stringify({
        //   cmd: 'serverMsg',
        //   data: msg.data.username + ' has connected',
        //   date: Date.now() 
        // })
        // broadcast(msg)

        console.log('data', newPeer)
      break;

    
      
      default:
        console.log(lookup[id] + ' sent unhandled message ' + msg)
        ws.send('server received message but did not understand: ' +  msg)
      break;

      

      }
  });

  ws.on('close', function(code, reason) {
      let d = lookup[id] + ' has disconnected'
      let msg = JSON.stringify({
        cmd: 'serverMsg',
        data: d,
        date: Date.now() 
      })
      broadcast(msg)
      console.log(d)
      // send update to graphs
      addPeer = JSON.stringify({
        cmd: 'removePeer',
        data: lookup[id],
        date: Date.now() 
      })
      broadcast(addPeer)

      // remove client info from list of active clients
      delete clients[id]
      //clients.peers = connections - 1

      let clientUpdate = JSON.stringify({
        cmd: 'network',
        data: clients,
        date: Date.now() 
      })
      broadcast(clientUpdate)
    
  })
});

// ping the clients -- solves a bug where heroku broker.js will crash if no response after nn seconds
// so ping all th clients!
setInterval(() => {
  wss.clients.forEach((client) => {
    client.send(JSON.stringify({
      cmd: 'guestlist',
      data: clients,
      date: Date.now() 
    }))
  });
}, 1000);


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

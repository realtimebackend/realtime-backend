require('dotenv').config();
const http = require('http');
const app = require('./app');
const server = http.createServer(app);
const { Server } = require('socket.io');

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  }
});

const socketHandler = require('./sockets/socketHandler');
const nocoService = require('./services/nocoService');
const detectNew = require('./utils/compareData');




socketHandler(io);
app.locals.io = io;

let oldData = [];

console.log('nocoService keys/type:', typeof nocoService, Object.keys(nocoService || {}));



async function pollNocoDB() {
  try {
    const latest = await nocoService.getRecords();
    console.log("Latest rows:", latest.length);

    const newRows = detectNew(oldData, latest);
    console.log("Detected New Rows:", newRows.length);
    console.log("Old Data length:", oldData.length);

    if (newRows.length > 0) {
      console.log("Emitting new-data:", newRows);
      io.emit('new-data', newRows);
    }

    oldData = latest;
  } catch (err) {
    console.error('Poll error', err.message);
  }
}



const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || '5000', 10);

// start polling after server starts
server.listen(process.env.PORT || 5000, () => {
  console.log('Server listening on port', process.env.PORT || 5000);
  pollNocoDB();
  setInterval(pollNocoDB, POLL_INTERVAL_MS);
});

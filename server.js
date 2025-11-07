const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let firstBuzz = null;
let firstTime = null;

// Handle clients connecting
io.on("connection", (socket) => {
    firstTime = null;
    firstBuzz = null;

    console.log("New client:", socket.id);
    io.emit("reload");

    socket.on("register", (teamName) => {
        socket.data.team = teamName;
        console.log("Team joined:", teamName);
        io.emit("teamList", Array.from(io.sockets.sockets.values()).map(s => s.data.team));
    });

    socket.on("buzz", () => {
        if (!firstBuzz) {
            firstTime = Date.now();
            firstBuzz = socket.data.team || "Unknown";
            console.log("Winner:", firstBuzz);
            io.emit("winner", firstBuzz, undefined);
        } else {
            var runnerTime = Date.now();
            var runnerBuzz = socket.data.team || "Unknown";
            const diffMs = runnerTime - firstTime;
            const timeDiff = diffMs < 1000 ? `${diffMs} ms` : `${(diffMs / 1000).toFixed(1)} s`;
            io.emit("runner", runnerBuzz, timeDiff);
        }
    });

    socket.on("reset", () => {
        firstBuzz = null;
        firstTime = null;
        io.emit("reset");
    });

    socket.on("disconnect", () => {
        console.log("Client left:", socket.id);
        io.emit("teamList", Array.from(io.sockets.sockets.values()).map(s => s.data.team));
    });
});

server.listen(8080, "0.0.0.0", () => {
    console.log("Server running on http://0.0.0.0:8080");
});

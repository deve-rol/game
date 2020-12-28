const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

server.listen(3000);

app.get('/', (request, response) => {
    response.sendFile(__dirname + '/src/client/index.html');
});

let players = [];
const connections = [];

const colors = ['#ff0', '#f00', '#0f0', '#00f', '#f0f'];

io.sockets.on('connection', socket => {
    console.log("connection");
    connections.push(socket);

    socket.on('disconnect', () => {
        players = players.filter(player => player.id !== socket.id);

        io.sockets.emit('players_update', players);
        connections.splice(connections.indexOf(socket), 1);
        console.log("disconnect");
    });

    socket.on('play', name => {
        console.log(name + ' joined');

        const color = colors[parseInt(Math.random() * colors.length)];
        players.push({
            name,
            color,
            id: socket.id,
            x: 100,
            y: 300,
            w: 60,
            h: 110,
            speed: 0,
            speedАccelStatic: 3.5,
            speedАccel: 3.5,
            maxSpeed: 20,
            xTo: 'left',
            isJump: false,
            speedY: 0,
            speedYMax: 30,
            gravity: 0.9,
            bottomPos: 410
        });

        io.sockets.emit('players_update', players)
    });

    socket.on('player_move', data => {
        const player = players.find(player => player.id === socket.id);
        if (data === 'right') {
            if (player.xTo === 'left' && player.speed > 0) {
                player.speed -= player.speedАccel;
                return
            }
            if (player.maxSpeed > player.speed) {
                player.speed += player.speedАccel;
            }
            player.xTo = 'right';
        } else if (data === 'left') {
            if (player.xTo === 'right' && player.speed > 0) {
                player.speed -= player.speedАccel;
                return
            }
            if (player.maxSpeed > player.speed) {
                player.speed += player.speedАccel;
            }
            player.xTo = 'left';
        }
        if (data === 'jump') {
            player.speedY = -20
        }

        const diff = player.speedАccel / player.maxSpeed;
        player.speedАccel = player.speedАccelStatic - player.speed * diff
    });

    socket.on('draw_end', () => {
        players.forEach(player => {
            player.speed -= .5;
            if (player.speed < 0) {
                player.speed = 0;
            }
            if (player.xTo === 'left') {
                player.x -= player.speed;
            } else if (player.xTo === 'right') {
                player.x += player.speed;
            }

            player.speedY += player.speedY <= player.speedYMax ? player.gravity : 0;

            if (player.y + player.speedY < player.bottomPos) {
                player.y += player.speedY;
            } else {
                player.y = player.bottomPos
            }
            // if (player.jumpCount > 0) {
            //     player.jumpSpeed = (player.jumpSpeedStatic * player.jumpCount) / 20;
            //     player.y -= player.jumpSpeed;
            //     player.jumpCount--;
            // }
        });

        io.sockets.emit('players_update', players)
    })
});

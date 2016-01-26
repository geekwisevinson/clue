var express = require('express');
var fs = require('fs');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
__dirname = path.resolve(path.dirname());

server.listen(5000);

function shuffle(o){
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}

function restart_game() {
    suspects = "MISS SCARLET,PROFESSOR PLUM,MRS. PEACOCK,REVEREND GREEN,COLONEL MUSTARD,MRS. WHITE";
    witnesses = suspects + '';
    suspects = suspects.split(',');
    witnesses = witnesses.split(',');
    weapons = "CANDLE STICK,DAGGER,LEAD PIPE,REVOLVER,ROPE,WRENCH";
    weapons = weapons.split(',');
    rooms = "KITCHEN,BALL ROOM,DINING ROOM,LIBRARY,LOUNGE,HALL";
    rooms = rooms.split(',');
    shuffle(suspects);
    shuffle(weapons);
    shuffle(rooms);
    shuffle(suspects);
    shuffle(weapons);
    shuffle(rooms);
    players_array = [];
    playersnum = 0;
    players = {};
    player_turn = 0;

    answers = [suspects.splice(0, 1).toString(), weapons.splice(0, 1).toString(), rooms.splice(0, 1).toString()];

//console.log(answers);
//console.log(suspects);

    app.get("/", function (req, res) {
        res.sendFile(__dirname + "/index.html");
    });


    io.sockets.on('connection', function (socket) {
        console.log('connected');

        socket.on('login', function (data) {
            players[data] = {"socket": socket};
            players[data].cards = [];
            io.sockets.emit('success', Object.keys(players));
        });
        socket.on('start', function () {
            playersnum = Object.keys(players).length;
            players_array = Object.keys(players);
            player_turn = 0;
            pass_out();
            io.sockets.emit('come_get_it')
        });
        socket.on('my_cards', function (data) {
            socket.emit('here_cards', players[data].cards);
            turn_keeper();
        });
        socket.on('guess', function (data) {

            if (answers[0] == data[1] && answers[1] == data[2] && answers[2] == data[3]) {
                socket.emit('you_win', 'you win ' + data[1] + ' with the ' + data[2] + ' in the ' + data[3]);
                io.sockets.emit('win','');
            }
            for (var i = 0; i < players[data[0]].cards.length; i++) {
                players[data[0]].cards[i] = players[data[0]].cards[i].toString();
            }
            console.log(players[data[0]].cards);
            for (var i = 0; i < data.length; i++) {
                console.log(data[i]);
                if (players[data[0]].cards.indexOf(data[i]) > -1) {
                    socket.emit('receive_card', data[i]);
                }
            }
            player_turn += 1;
            turn_keeper();

        })

        socket.on('restart',function(data){
            restart_game()
        })

    });

    function pass_out() {
        for (key in players) {
            players[key].cards.push(suspects.splice(0, 1));
            players[key].cards.push(weapons.splice(0, 1));
            players[key].cards.push(rooms.splice(0, 1));
        }
        if (Object.keys(players).length <= suspects.length) {
            pass_out();
        } else {
            remaining(suspects.length);
        }
    }

    function remaining(n) {
        var i = n;
        for (var i = 0; i < n; i++) {
            for (key in players) {
                players[key].cards.push(suspects[i]);
                players[key].cards.push(weapons[i]);
                players[key].cards.push(rooms[i]);
            }
        }
    }

    function turn_keeper() {
        if (player_turn > players_array.length - 1) {
            player_turn = 0;
        }
        io.sockets.emit('turn_keeper', players_array[player_turn])
    }
}restart_game();

// out
const NEW_GAME = 'NEW_GAME';
const JOIN_GAME = 'JOIN_GAME';
const START_GAME = 'START_GAME';
const PICK_TOKEN = 'PICK_TOKEN';

// in
const GAME_NOT_FOUND = 'GAME_NOT_FOUND';
const USER_DETAILS = 'USER_DETAILS';
const GAME_JOIN = 'GAME_JOIN';
const PLAYER_JOIN = 'PLAYER_JOIN';
const PLAYER_QUIT = 'PLAYER_QUIT';
const GAME_UPDATE = 'GAME_UPDATE';
const TOKEN_SPAWN = 'TOKEN_SPAWN';
const PICKING_NOW = 'PICKING_NOW';
const UPDATE_PLAYERS = 'UPDATE_PLAYERS';
const TOKEN_PICKED = 'TOKEN_PICKED';
const NEXT = 'NEXT';
const POCKET_ADD = 'POCKET_ADD';
const POCKET_REMOVE = 'POCKET_REMOVE';


var socket;

//

function initSocket(reconnect = false) {
    window.WebSocket = window.WebSocket || window.MozWebSocket;

    var socketUrl = 'localhost:5000'; // TODO
    var connection = new WebSocket(`ws://${socketUrl}`);

    connection.onopen = function () {
        app.page = 'main-menu';
    };

    connection.onerror = function (error) {
        if(!reconnect) reconnectSocket();
        return null;
    };

    connection.onmessage = function (message) {
        console.log('> ' + message.data);
        var mes = message.data.includes(',') ? message.data.split(',') : [message.data];
        
        switch (mes[0]) {
            case USER_DETAILS:
                var username = mes[1];
                var uuid = mes[2];
                var token = mes[3];
                app.self.name = username;
                app.self.uuid = uuid;
                app.self.token = token;
                window.setCookie('self.name', username, 60*24*100);
                window.setCookie('self.uuid', uuid, 60*4);
                window.setCookie('self.token', token, 60*4);
                break;

            case GAME_NOT_FOUND:
                alert('Game Not Found!');
                break;

            case GAME_JOIN:
                app.game.token = mes[1];
                app.game.state = mes[2].toLowerCase();
                app.game.maxPlayers = mes[3];
                app.game.leader = mes[4];
                app.game.state = mes[5];
                app.game.round = mes[6];
                app.game.players = [];
                for (var i = 7; i < mes.length; i++) {
                    var player = mes[i].split(':');
                    app.game.players.push({
                        name: player[0],
                        uuid: player[1]
                    });
                }
                syncGamestatePage();
                break;

            case PLAYER_JOIN:
                app.game.players.push({
                    name: mes[1],
                    uuid: mes[2],
                    rank: 0,
                    vp: 0
                });
                break;

            case PLAYER_QUIT:
                for (var i = 0; i < app.game.players.length; i++) {
                    if (app.game.players[i].uuid == mes[1])
                        app.game.players.splice(i, 1);
                }
                break;

            case GAME_UPDATE:
                for (var i = 1; i < mes.length; i++) {
                    var data = mes[i].split(':');
                    switch (data[0]) {
                        case 'leader':
                            app.game.leader = data[1];
                            break;
                        case 'state':
                            app.game.state = data[1];
                            syncGamestatePage();
                            app.game.donePicking.splice(0, app.game.donePicking.length);
                            app.game.crafter.splice(0, app.game.crafter.length);
                            break;
                        case 'round':
                            app.game.round = data[1];
                            break;
                    }
                }
                break;

            case TOKEN_SPAWN:
                for (var i = 1; i < mes.length; i++) {
                    var data = mes[i].split(':');
                    var rand = new Math.seedrandom(`${app.game.token}${app.game.round}${i}`);
                    Vue.set(app.game.spawner, data[0], {
                        type: data[1],
                        score: data[2],
                        posX: rand() * 94,
                        posY: rand() * 75,
                        posRel: true
                    });
                }
                break;

            case PICKING_NOW:
                app.game.pickingNow = mes[1];
                if (mes[2]) app.game.donePicking.push(mes[2]);
                break;

            case UPDATE_PLAYERS:
                var newArray = [];
                for (var i = 1; i < mes.length; i++) {
                    var data = mes[i].split(':');
                    for (var p of app.game.players) {
                        if (p.uuid == data[0]) {
                            p.rank = data[1];
                            p.vp = data[2];
                            newArray.push(p);
                        }
                    }
                }
                app.game.players = [...newArray];
                break;

            case TOKEN_PICKED:
                // TODO mes[2] is the uuid from the player that picked it. play a nice animation thx.
                Vue.set(app.game.spawner, mes[1], undefined);
                break;

            case NEXT:
                // TODO
                console.log(`Next Phase In ${mes[1]}`);
                break;

            case POCKET_ADD:
                app.game.pocket.push({
                    index: app.game.pocket.length,
                    type: mes[1],
                    score: mes[2],
                    velX: 0,
                    velY: 0,
                    posX: 20,
                    posY: 20
                });
                break;
        }
    };

    return connection;
}

function syncGamestatePage() {
    switch (app.game.state) {
        case 'lobby': app.page = `game-lobby`; break;
        case 'done': app.page = `game-done`; break;
        default: app.page = `game-running`; break;
    }
}

function reconnectSocket() {
    app.page = 'recon';
    socket = initSocket(true);
    if (socket == undefined || socket == null) {
        app.page = 'recon';
    }
}

function socketSend(command, ...param) {
    socket.send([command, ...param]);
}
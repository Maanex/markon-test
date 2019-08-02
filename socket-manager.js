
// out
const NEW_GAME = 'NEW_GAME';
const JOIN_GAME = 'JOIN_GAME';
const START_GAME = 'START_GAME';
const PICK_TOKEN = 'PICK_TOKEN';
const USE_CRAFTER = 'USE_CRAFTER';
const PURCHASE_UPGRADE = 'PURCHASE_UPGRADE';
const PLANNING_READY = 'PLANNING_READY';
const CHANGE_DECK = 'CHANGE_DECK';
const SET_FIGHT_TARGET = 'SET_FIGHT_TARGET';
const TRASH_CARD = 'TRASH_CARD';
const ENCHANT_CARD = 'ENCHANT_CARD';

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
const CARD_ADD = 'CARD_ADD';
const UPGRADES = 'UPGRADES';
const CARD_UPDATE = 'CARD_UPDATE';
const FIGHT_UPDATE = 'FIGHT_UPDATE';
const FIGHT_TURN = 'FIGHT_TURN';
const FIGHT_INIT = 'FIGHT_INIT';
const FIGHT_DONE = 'FIGHT_DONE';


var socket;

//

function initSocket(reconnect = false) {
    window.WebSocket = window.WebSocket || window.MozWebSocket;

    //var socketUrl = '192.168.20.228:5000'; // TODO
    var socketUrl = 'red-goose-34350.herokuapp.com'; // TODO
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
                            gstateChange();
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
                        name: data[2],
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
                    score: parseInt(mes[2]),
                    name: mes[2],
                    velX: 0,
                    velY: 0,
                    posX: document.body.clientWidth / 3,
                    posY: Math.floor(Math.random() * document.body.clientHeight)
                });
                break;

            case POCKET_REMOVE:
                var rem = mes.slice(1).sort((a, b) => b - a);
                for (var re of rem) {
                    var c = parseInt(re);
                    app.game.pocket.splice(c, 1);
                    if (app.game.deck.includes(c))
                        app.game.deck.splice(app.game.deck.indexOf(c), 1);
                    app.game.crafter.splice(0);
                }
                for (var i = 0; i < app.game.pocket.length; i++)
                    app.game.pocket[i].index = i;
                break;

            case CARD_ADD:
                var card = {
                    index: app.game.hand.length,
                    name: mes[1],
                    type: mes[2],
                    img: mes[3],
                    attack: parseInt(mes[4]),
                    hp: parseInt(mes[5]),
                    maxhp: parseInt(mes[6]),
                    enchslots: parseInt(mes[7]),
                    enchantments: [ ],
                    posX: 0,
                    posY: 0,
                    velX: 0,
                    velY: 0
                }
                for (var en of mes.slice(8))
                    card.enchantments.push(en);
                app.game.hand.push(card);
                break;

            case UPGRADES:
                app.game.upgradepoints = parseInt(mes[1]);
                app.game.upgrades.crafter = parseInt(mes[2]);
                app.game.upgrades.picks = parseInt(mes[3]);
                app.game.upgrades.deck = parseInt(mes[4]);
                break;

            case FIGHT_INIT:
                app.game.fight.opponent = mes[1];
                var ownCards = 0;
                for (var str of mes.slice(2)) {
                    var det = str.split(':');
                    var card = str ? {
                        name: det[0],
                        type: det[1],
                        img: det[2],
                        attack: det[3],
                        hp: det[4],
                        maxhp: det[5],
                        enchslots: det[6],
                        enchantments: [ ]
                    } : false;
                    if (card) 
                        for (var en of det.slice(7))
                            card.enchantments.push(en);

                    if (ownCards < app.game.upgrades.deck) {
                        if (card) {
                            card.index = app.game.fight.ownDeck.length;
                            app.game.fight.ownDeck.push(card);
                        }
                        ownCards++;
                    } else if (card) {
                        card.index = app.game.fight.opponentDeck.length;
                        app.game.fight.opponentDeck.push(card);
                    }
                }
                break;

            case FIGHT_TURN:
                app.game.fight.ownTurn = parseInt(mes[1]);
                app.game.fight.opponentTurn = parseInt(mes[2]);

                if (app.game.fight.ownTurn >= 0) {
                    var bounds = document.getElementById('own-row').childNodes[app.game.fight.ownTurn].getBoundingClientRect();
                    app.arrow.from.x = bounds.left + (bounds.right - bounds.left) / 2;
                    app.arrow.from.y = bounds.top;
                    app.arrow.toCursor = true;
                    app.arrow.visible = true;
                }
                break;

            case FIGHT_DONE:
                app.arrow.visible = false;
                break;
                
            case FIGHT_UPDATE:
                var attacker = parseInt(mes[1].substring(1));
                var attackerSide = mes[1].startsWith('s') ? 'ownDeck' : 'opponentDeck';
                var attackerCard = app.game.fight[attackerSide][victim];

                var victim = parseInt(mes[2].substring(1));
                var victimSide = mes[2].startsWith('s') ? 'ownDeck' : 'opponentDeck';
                var victimCard = app.game.fight[victimSide][victim];

                var dmgDealt = parseInt(mes[4]) - victimCard.hp;

                if (attacker >= 0) {
                    var attackerDomel = document.getElementById(mes[1].startsWith('s') ? 'own-row' : 'opponent-row').childNodes[attacker];
                    var victimDomel = document.getElementById(mes[2].startsWith('s') ? 'own-row' : 'opponent-row').childNodes[victim];
    
                    var orgY = attackerDomel.getBoundingClientRect().top + 'px';
                    var orgX = (attackerDomel.getBoundingClientRect().left - 20) + 'px';
    
                    attackerDomel.style.top = orgY;
                    attackerDomel.style.left = orgX;
                    attackerDomel.style.position = 'absolute';

                    app.arrow.visible = false;

                    setTimeout(() => {
                        attackerDomel.style.top = victimDomel.getBoundingClientRect()[mes[2].startsWith('s') ? 'top' : 'bottom'] + 'px';
                        attackerDomel.style.left = (victimDomel.getBoundingClientRect().left - 20) + 'px';
                    }, 100);

                    setTimeout(() => {
                        victimCard.attack = parseInt(mes[3]);
                        victimCard.hp = parseInt(mes[4]);
                        victimCard.maxhp = parseInt(mes[5]);
                        victimCard.enchantments = mes[6] ? mes[6].split(':') : [];
    
                        attackerDomel.style.top = orgY;
                        attackerDomel.style.left = orgX;
                    }, 400);
    
                    setTimeout(() => {
                        attackerDomel.style.position = 'relative';
                        attackerDomel.style.top = '';
                        attackerDomel.style.left = '';
                        attackerDomel.style.margin = '';
                        app.arrow.visible = true;
                    }, 800);
                } else {
                    setTimeout(() => {
                        victimCard.attack = parseInt(mes[3]);
                        victimCard.hp = parseInt(mes[4]);
                        victimCard.maxhp = parseInt(mes[5]);
                        victimCard.enchantments = mes[6] ? mes[6].split(':') : [];
                    }, 400);
                }

                break;
        
            case CARD_UPDATE:
                var index = parseInt(mes[1]);
                var card = app.game.hand[index];
                card.attack = parseInt(mes[2]);
                card.hp = parseInt(mes[3]);
                card.maxhp = parseInt(mes[4]);
                card.enchantments = mes[5] ? mes[5].split(':') : [];
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
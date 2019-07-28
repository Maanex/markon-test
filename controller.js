

Vue.component('page', {
    props: [ 'name', 'active', 'game', 'self' ],
    template: '#t-page'
});

Vue.component('panel', {
    props: [ 'name', 'state', 'game', 'self' ],
    template: '#t-panel'
});

Vue.component('badge', {
    props: [ 'obj', 'index', 'draggable', 'pickable', 'self', 'game' ],
    template: '#t-badge',
    methods: {
        pick: function(e) {
            if (this.pickable && this.self.uuid == this.game.pickingNow) {
                socket.send(`PICK_TOKEN,${this.index}`);
            }
        }
    }
});

Vue.component('card', {
    props: [ 'obj', 'index', 'self', 'game' ],
    template: '#t-card'
});

var app;
app = new Vue({
    el: '#app',
    data: {
        page: 'init',
        self: {
            name: '',
            uuid: '',
            token: ''
        },
        menu: {
            joingame: ''
        },
        game: {
            token: '',
            state: '',
            maxPlayers: 0,
            leader: '',
            round: 0,
            players: [ ],
            pocket: [ ],
            spawner: [ ],
            pickingNow: '',
            donePicking: [ ],
            crafter: [ ],
            upgradepoints: 0,
            upgrades: {
                crafter: 1,
                picks: 1,
                deck: 1
            },
            hand: [ ],
            deck: [ ]
        },


        // const
        panelArrangements: {
            picking: {
                marks: 'reduced',
                deck: 'none',
                picking: 'full',
                fighting: 'none',
            },
            planning: {
                marks: 'full',
                deck: 'full',
                picking: 'none',
                fighting: 'none',
            },
            fighting: {
                marks: 'none',
                deck: 'none',
                picking: 'none',
                fighting: 'full',
            }
        },

        language: 'en',
        texts: {
            en: {
                connecting1: 'Connecting to gameserver...',
                connecting2: 'This might take a few seconds.',
                recon1: 'Woopsie Doopsie!',
                recon2: 'Connection lost - reconnecting...',
                gamedone1: 'Game\'s done!',
                gamedone2: 'Hope you had fun!',
                yourname: 'Your Name:',
                newgame: 'New Game',
                joingame: 'Join Game',
                inlobby: 'In Game Lobby.',
                players: 'Players:',
                start: 'Start',
                craft: 'Craft',
                upgrade1: 'Click the buttons below to upgrade',
                upgrade2: 'You got %s upgrade points left!',
                upgrade_picks: 'Draw %s marks',
                upgrade_crafter: 'Crafter size %s',
                upgrade_deck: 'Deck size %s',
                upgrade_heal: 'Heal all units',
            }
        }
    },
    computed: {
        isSelfLeader: function() {
            return this.self.uuid == this.game.leader;
        },
        lang: function() {
            return this.texts[this.language];
        }
    },
    methods: {
        newGame: function() {
            if (!this.self.name) return;
            var out = [NEW_GAME, this.self.name];
            if (this.self.token) out.push(this.self.token);
            socketSend(out);
        },
        joinGame: function() {
            if (!this.self.name) return;
            var game = this.menu.joingame;
            if (!game) return;
            if (game.includes('game=')) game = game.split('game=')[1];
            var out = [JOIN_GAME, game, this.self.name];
            if (this.self.token) out.push(this.self.token);
            socketSend(out);
        },
        startGame: function() {
            socketSend(START_GAME);
        }
    }
});

app.self.name = window.getCookie('self.name') || `Player${Math.floor(Math.random() * 9000 + 1000)}`;
app.self.uuid = window.getCookie('self.uuid') || '';
app.self.token = window.getCookie('self.token') || '';

//


const MARK_SIZE = 64;
const CARD_WIDTH = 150;
const CARD_HEIGHT = 255;

var markDragElement = -1;
var markDragXoffset = 0;
var markDragYoffset = 0;
var markDragMouseX = 0;
var markDragMouseY = 0;

var cardDragElement = -1;
var cardDragXoffset = 0;
var cardDragYoffset = 0;
var cardDragMouseX = 0;
var cardDragMouseY = 0;

function dragMark(index, e) {
    markDragElement = index;
    var mark = app.game.pocket[index];
    markDragXoffset = mark.posX - e.clientX;
    markDragYoffset = mark.posY - e.clientY;
    if (app.game.crafter.indexOf(mark.index) != -1) {
        Vue.set(app.game.crafter, app.game.crafter.indexOf(mark.index), undefined);
    }
}

function dragCard(index, e) {
    cardDragElement = index;
    var card = app.game.hand[index];
    cardDragXoffset = card.posX - e.clientX;
    cardDragYoffset = card.posY - e.clientY;
}

document.body.addEventListener('mousemove', e => {
    markDragMouseX = 0;
    markDragMouseY = 0;
    cardDragMouseX = 0;
    cardDragMouseY = 0;
    if (markDragElement >= 0) {
        markDragMouseX = e.pageX;
        markDragMouseY = e.pageY;
    }
    if (cardDragElement >= 0) {
        cardDragMouseX = e.pageX;
        cardDragMouseY = e.pageY;
    }
});

document.body.addEventListener('mouseup', e => {
    if (markDragElement >= 0) {
        markDragElement = -1;
        markDragXoffset = 0;
        markDragYoffset = 0;
    }
    if (cardDragElement >= 0) {
        cardDragElement = -1;
        cardDragXoffset = 0;
        cardDragYoffset = 0;
    }
});

setInterval(() => {
    updateMarks();
    updateCards();
}, 20);

function updateMarks() {
    var c = -1;
    var width = document.getElementById('marks-container').scrollWidth;
    var height = document.getElementById('marks-container').scrollHeight;

    for (var o of app.game.pocket) {
        if (markDragElement == ++c && (markDragMouseX != 0 || markDragMouseY != 0)) {
            o.velX = markDragMouseX + markDragXoffset - o.posX;
            o.velY = markDragMouseY + markDragYoffset - o.posY;
        }
        o.velX = o.velX * .7;
        o.velY = o.velY * .7;
        o.posX += o.velX;
        o.posY += o.velY;

        var targetX;
        var targetY;
        var targetEl;
        if (app.game.state == 'planning') {
            targetX = -1;
            targetY = -1;
            targetEl = undefined;

            var ydiff = height;
            var cwidth = document.getElementById('marks-crafter').scrollWidth;
            for (var el of document.getElementsByClassName('mark-slot')) {
                var top = el.getBoundingClientRect().top;
                var bot = el.getBoundingClientRect().bottom;
                var mid = top + (bot - top) / 2;
                
                if (app.game.crafter[el.getAttribute('id')] >= 0) {
                    if (app.game.crafter[el.getAttribute('id')] === o.index) {
                        targetEl = el;
                        targetX = width + cwidth / 2 - MARK_SIZE/2;
                        targetY = mid - MARK_SIZE/2;
                        break;
                    } else continue; // occupied
                }

                var distToBorder = Math.abs(width - (o.posX + MARK_SIZE/2));
                var distVert = Math.abs(width + cwidth / 2 - (o.posX + MARK_SIZE/2));
                var distHor = Math.abs(mid - (o.posY + MARK_SIZE/2));
                if (distToBorder < Math.sqrt(distVert*distVert+distHor*distHor)) continue;

                var diff = Math.abs(mid - (o.posY+MARK_SIZE/2));
                if (diff < ydiff) {
                    ydiff = diff;
                    targetEl = el;
                    targetX = width + cwidth / 2 - MARK_SIZE/2;
                    targetY = mid - MARK_SIZE/2;
                }
            }
        }
        if (targetEl && markDragElement != c) {
            Vue.set(app.game.crafter, targetEl.getAttribute('id'), o.index);
        }

        if (o.posX < 0) {
            if (markDragElement == c) o.posX = -Math.pow(Math.log(-o.posX), 2);
            else o.posX *= -1;
            o.velX *= -.3;
        } else if (targetX > 0) {
            o.velX = -(o.posX - targetX) / 2;
        } else if (o.posX > width - MARK_SIZE) {
            o.velX = -(o.posX - width + MARK_SIZE) / 2;
        }
        if (o.posY < 0) {
            o.posY = 0;
            o.velY *= -.3;
        } else if (o.posY > height - MARK_SIZE) {
            o.posY += height - MARK_SIZE - o.posY;
            o.velY *= -.3;
        } else if (targetY > 0) {
            o.velY = -(o.posY - targetY) / 2;
        }
    }
}

function updateCards() {
    var c = -1;
    var width = document.getElementById('cards-container').scrollWidth;
    var height = document.getElementById('cards-container').scrollHeight;

    for (var o of app.game.hand) {
        if (cardDragElement == ++c && (cardDragMouseX != 0 || cardDragMouseY != 0)) {
            o.velX = cardDragMouseX + cardDragXoffset - o.posX;
            o.velY = cardDragMouseY + cardDragYoffset - o.posY;
        }
        o.velX = o.velX * .7;
        o.velY = o.velY * .7;
        o.posX += o.velX;
        o.posY += o.velY;

        var targetX = -1;
        var targetY = -1;
        var targetEl = undefined;
        if (app.game.state == 'planning') {
            var dist = 99999;
            for (var el of document.getElementsByClassName('card-slot')) {
                if (app.game.deck[el.getAttribute('id')] >= 0 && app.game.deck[el.getAttribute('id')] !== o.index) continue; // occupied

                var top = el.getBoundingClientRect().top;
                var bot = el.getBoundingClientRect().bottom;
                var left = el.getBoundingClientRect().left;
                var right = el.getBoundingClientRect().right;
                var hmid = left + (right - left) / 2;
                var vmid = top + (bot - top) / 2;

                var vdist = Math.abs(hmid - (o.posX + CARD_WIDTH / 2));
                var hdist = Math.abs(vmid - (o.posY + CARD_HEIGHT / 2));
                var totdist = Math.sqrt(vdist*vdist + hdist*hdist);

                if (totdist < dist) {
                    targetEl = el;
                    targetX = hmid - CARD_WIDTH/2;
                    targetY = vmid - CARD_HEIGHT/2;
                    dist = totdist;
                }
            }
        }
        if (targetEl && cardDragElement != c) {
            Vue.set(app.game.deck, targetEl.getAttribute('id'), o.index);
        }
        
        if (o.posX < 0) {
            o.posX = 0;
            o.velX *= -.3;
        } else if (o.posX > width - CARD_WIDTH) {
            o.posX += width - CARD_WIDTH - o.posX;
            o.velX *= -.3;
        } else if (targetX >= 0) {
            o.velX = -(o.posX - targetX) / 2;
        }
        if (o.posY < 0) {
            o.posY = 0;
            o.velY *= -.3;
        } else if (o.posY > height - CARD_HEIGHT) {
            o.posY -= height - CARD_HEIGHT - o.posY;
            o.velY *= -.3;
        } else if (targetY >= 0) {
            o.velY = -(o.posY - targetY) / 2;
        }
    }
}


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
    props: [ 'obj', 'index', 'self', 'game', 'infight', 'fraction' ],
    template: '#t-card',
    computed: {
        cardsTurn: function() {
            return (this.fraction == 'own' && this.game.fight.ownTurn === this.index)
                || (this.fraction == 'opponent' && this.game.fight.opponentTurn === this.index);
        },
        dead: function() {
            return this.obj.hp == 0;
        },
        enchslot1img: function() {
            if (this.obj.enchslots <= 0) return 'locked';
            if (this.obj.enchantments[0]) return 'used';
            return 'open';
        },
        enchslot2img: function() {
            if (this.obj.enchslots <= 1) return 'locked';
            if (this.obj.enchantments[1]) return 'used';
            return 'open';
        },
        enchslot1: function() {
            return this.obj.enchantments[0] || '';
        },
        enchslot2: function() {
            return this.obj.enchantments[1] || '';
        },
        enchslot1title: function() {
            if (this.obj.enchantments[0] && app.lang.enchants[this.obj.enchantments[0]])
                return app.lang.enchants[this.obj.enchantments[0]].name;
            return '';
        },
        enchslot2title: function() {
            if (this.obj.enchantments[1] && app.lang.enchants[this.obj.enchantments[1]])
                return app.lang.enchants[this.obj.enchantments[1]].name;
            return '';
        },
        enchslot1desc: function() {
            if (this.obj.enchantments[0] && app.lang.enchants[this.obj.enchantments[0]])
                return app.lang.enchants[this.obj.enchantments[0]].description;
            return '';
        },
        enchslot2desc: function() {
            if (this.obj.enchantments[1] && app.lang.enchants[this.obj.enchantments[1]])
                return app.lang.enchants[this.obj.enchantments[1]].description;
            return '';
        }
    }
});

Vue.component('widget-arrow', {
    props: [ 'data', 'width', 'minlength' ],
    template: '#t-widget-arrow',
    computed: {
        distX: function() {
            return this.data.from.x - this.data.to.x;
        },
        distY: function() {
            return this.data.from.y - this.data.to.y;
        },
        posX: function() {
            return this.data.from.x - this.width / 2;
        },
        posY: function() {
            return this.data.from.y;
        },
        length: function() {
            return Math.max(this.minlength, Math.sqrt(this.distX*this.distX+this.distY*this.distY));
        },
        rot: function() {
            return Math.atan2(this.distY, this.distX) + Math.PI / 2;
        }
    }
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
            deck: [ ],
            fight: {
                opponent: '',
                ownDeck: [ ],
                opponentDeck: [ ],
                ownTurn: -1,
                opponentTurn: -1
            }
        },
        arrow: {
            visible: false,
            toCursor: false,
            from: { x: 0, y: 0 },
            to: { x: 0, y: 0 }
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
                ready: 'Ready',
                enchants: {
                    crit1: {
                        name: 'Crit I',
                        description: 'Every 4th attack will deal double damage'
                    },
                    crit2: {
                        name: 'Crit II',
                        description: 'Every 3rd attack will deal double damage'
                    },
                    crit3: {
                        name: 'Crit III',
                        description: 'Every 2nd attack will deal double damage'
                    },
                    doge1: {
                        name: 'Doge I',
                        description: 'Doge every 4th attack and don\'t recieve any damage'
                    },
                    doge2: {
                        name: 'Doge II',
                        description: 'Doge every 3rd attack and don\'t recieve any damage'
                    },
                    doge3: {
                        name: 'Doge III',
                        description: 'Doge every 2nd attack and don\'t recieve any damage'
                    },
                    lifesteal: {
                        name: 'Lifesteal',
                        description: 'On attack, unit regenerates 40% of the dealt damage as own health'
                    },
                    thorns: {
                        name: 'Thorns',
                        description: 'When getting attacked, the attacker will recieve 10% of the dealt damage as own damage with a minimum of 1'
                    },
                }
            }
        }
    },
    computed: {
        isSelfLeader: function() {
            return this.self.uuid == this.game.leader;
        },
        lang: function() {
            return this.texts[this.language];
        },
        opponentName: function() {
            for (var p of this.game.players)
                if (p.uuid === this.game.fight.opponent) return p.name;
            return '';
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

var draggingEnchantment = false;
var draggingEnchantmentOver = undefined;

function dragMark(index, e) {
    markDragElement = index;
    var mark = app.game.pocket[index];
    markDragXoffset = mark.posX - e.clientX;
    markDragYoffset = mark.posY - e.clientY;
    if (app.game.crafter.indexOf(mark.index) != -1) {
        Vue.set(app.game.crafter, app.game.crafter.indexOf(mark.index), undefined);
    }
    draggingEnchantment = (mark.type == 'enchantment');
    draggingEnchantmentOver = undefined;
}

function dragCard(index, e) {
    cardDragElement = index;
    var card = app.game.hand[index];
    cardDragXoffset = card.posX - e.clientX;
    cardDragYoffset = card.posY - e.clientY;
    if (app.game.deck.indexOf(card.index) != -1) {
        socketSend([
            CHANGE_DECK,
            app.game.deck.indexOf(card.index)
        ]);
        Vue.set(app.game.deck, app.game.deck.indexOf(card.index), undefined);
    }
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

    if (app.arrow.visible && app.arrow.toCursor) {
        app.arrow.to.x = e.pageX;
        app.arrow.to.y = e.pageY;
    }

    if (draggingEnchantment) {
        draggingEnchantmentOver = undefined;
        var children = document.getElementById('cards-container').childNodes;
        for (var i = 0; i < children.length; i++) {
            if (!children[i] || !app.game.hand[i]) continue;
            var bounds = children[i].getBoundingClientRect();
            if (e.pageX > bounds.left
             && e.pageX < bounds.right
             && e.pageY > bounds.top
             && e.pageY < bounds.bottom) {
                Vue.set(app.game.hand[i], 'enchadd', true);
                draggingEnchantmentOver = app.game.hand[i];
            } else Vue.set(app.game.hand[i], 'enchadd', false);
        }
    }
});

document.body.addEventListener('mouseup', e => {
    if (markDragElement >= 0) {
        if (draggingEnchantment && draggingEnchantmentOver) {
            applyEnchantment(markDragElement, draggingEnchantmentOver.index);
            var children = document.getElementById('cards-container').childNodes;
            for (var i = 0; i < children.length; i++) {
                if (!children[i] || !app.game.hand[i]) continue;
                Vue.set(app.game.hand[i], 'enchadd', false);
            }
        }

        markDragElement = -1;
        markDragXoffset = 0;
        markDragYoffset = 0;
        draggingEnchantment = false;
    }
    if (cardDragElement >= 0) {
        var targetEl = undefined;
        var dist = CARD_WIDTH;
        var card = app.game.hand[cardDragElement];

        var width = document.getElementById('cards-container').clientWidth;
        if (card.posX > width) {
            trashCard(cardDragElement);
        } else {
            for (var el of document.getElementsByClassName('card-slot')) {
                var top = el.getBoundingClientRect().top;
                var bot = el.getBoundingClientRect().bottom;
                var left = el.getBoundingClientRect().left;
                var right = el.getBoundingClientRect().right;
                var hmid = left + (right - left) / 2;
                var vmid = top + (bot - top) / 2;
    
                var vdist = Math.abs(hmid - (card.posX + CARD_WIDTH / 2));
                var hdist = Math.abs(vmid - (card.posY + CARD_HEIGHT / 2));
                var totdist = Math.sqrt(vdist*vdist + hdist*hdist);
    
                if (totdist < dist) {
                    targetEl = el;
                    dist = totdist;
                }
            }
            if (targetEl) {
                Vue.set(app.game.deck, targetEl.getAttribute('id'), cardDragElement);
                socketSend([
                    CHANGE_DECK,
                    targetEl.getAttribute('id'),
                    cardDragElement
                ]);
            }
        }
        
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

        var isEnchantment = o.type === 'enchantment';

        var targetX;
        var targetY;
        var targetEl;
        if (app.game.state == 'planning') {
            targetX = -1;
            targetY = -1;
            targetEl = undefined;

            if (!isEnchantment) {
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
        }
        if (targetEl && markDragElement != c) {
            Vue.set(app.game.crafter, targetEl.getAttribute('id'), o.index);
        }

        if (o.posX < 0) {
            if (isEnchantment) {
                if (markDragElement != c)
                    o.velX = -o.posX / 2;
            } else {
                if (markDragElement == c) o.posX = -Math.pow(Math.log(-o.posX), 2);
                else o.posX *= -1;
                o.velX *= -.3;
            }
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
    var width = document.getElementById('cards-container').clientWidth;
    var height = document.getElementById('cards-container').clientHeight;

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

                if (app.game.deck[el.getAttribute('id')] === o.index) {
                    targetEl = el;
                    targetX = hmid - CARD_WIDTH/2;
                    targetY = vmid - CARD_HEIGHT/2;
                    break;
                }

                if (totdist < dist) {
                    targetEl = el;
                    targetX = hmid - CARD_WIDTH/2;
                    targetY = vmid - CARD_HEIGHT/2;
                    dist = totdist;
                }
            }
        }
        if (targetEl && cardDragElement != c && app.game.deck[targetEl.getAttribute('id')] !== o.index) {
            Vue.set(app.game.deck, targetEl.getAttribute('id'), o.index);
            socketSend([
                CHANGE_DECK,
                targetEl.getAttribute('id'),
                o.index
            ]);
        }
        
        if (o.posX < 0) {
            o.posX = 0;
            o.velX *= -.3;
        } /* else if (o.posX > width - CARD_WIDTH) {
            o.posX += width - CARD_WIDTH - o.posX;
            o.velX *= -.3;
        } */ else if (targetX >= 0) {
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


Vue.component('page', {
    props: [ 'name', 'active', 'game' ],
    template: '#t-page'
});

Vue.component('panel', {
    props: [ 'name', 'state', 'game' ],
    template: '#t-panel'
});

Vue.component('badge', {
    props: [ 'obj', 'index', 'draggable' ],
    template: '#t-badge'
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
            pocket: [
                {
                    type: 'fire',
                    score: 3,
                    posX: 0,
                    posY: 0
                },
                {
                    type: 'water',
                    score: 7,
                    posX: 0,
                    posY: 0
                }
            ],
            spawner: [ ],
            pickingNow: ''
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
        }
    },
    computed: {
        isSelfLeader: function() {
            return this.self.uuid == this.game.leader;
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


var markDragElement = -1;
var markDragXoffset = 0;
var markDragYoffset = 0;

function dragMark(index, e) {
    markDragElement = index;
    var mark = app.game.pocket[index];
    markDragXoffset = mark.posX - e.clientX;
    markDragYoffset = mark.posY - e.clientY;
}

document.body.addEventListener('mousemove', e => {
    if (markDragElement < 0) return;
    var mark = app.game.pocket[markDragElement];
    mark.posX = e.pageX + markDragXoffset;
    mark.posY = e.pageY + markDragYoffset;
    var width = document.getElementById('marks-container').scrollWidth;
    var height = document.getElementById('marks-container').scrollHeight;
    if (mark.posX < 0) mark.posX = 0;
    if (mark.posX > width - 64) mark.posX = width - 64;
    if (mark.posY < 0) mark.posY = 0;
    if (mark.posY > height - 64) mark.posY = height - 64;
});

document.body.addEventListener('mouseup', e => {
    if (markDragElement < 0) return;
    markDragElement = -1;
    markDragXoffset = 0;
    markDragYoffset = 0;
});
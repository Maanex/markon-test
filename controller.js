

Vue.component('page', {
    props: [ 'name', 'active', 'game' ],
    template: '#t-page'
});

Vue.component('panel', {
    props: [ 'name', 'state', 'game' ],
    template: '#t-panel'
});

Vue.component('badge', {
    props: [ 'type', 'score', 'draggable', 'obj' ],
    template: '#t-badge',
    methods: {
        mousedown(e) {
            var rect = e.target.parentNode.getBoundingClientRect();
            this.$obj.dragXoffset = this.$obj.posX - e.clientX;
            this.$obj.dragYoffset = this.$obj.posY - e.clientY;
        },
        mouseup(e) {
            this.$obj.dragXoffset = 0;
            this.$obj.dragYoffset = 0;
        },
        mousemove(e) {
            if (!this.$obj.dragXoffset) return;
            this.$obj.posX = e.pageX + this.$obj.dragXoffset;
            this.$obj.posY = e.pageY + this.$obj.dragYoffset;
        }
    },
    computed: {
        px: function() { return this.$obj.posX; },
        py: function() { return this.$obj.posY; }
    }
});

Vue.prototype.$obj = {
    dragXoffset: 0,
    dragYoffset: 0,
    posX: 0,
    posY: 0
}

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
            players: [ ],
            temp: {
                dragXoffset: 0,
                dragYoffset: 0,
                posX: 0,
                posY: 0
            }
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
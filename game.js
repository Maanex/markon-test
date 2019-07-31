socket = initSocket();




function useCrafter() {
    socketSend([
        USE_CRAFTER,
        ...app.game.crafter
    ]);
}

function planningReady() {
    socketSend(PLANNING_READY);
    document.getElementById('planning-ready').disabled = true;
}

function gstateChange(state) {
    setTimeout(() => document.getElementById('planning-ready').disabled = false, 1000);
    Vue.set(app.game.fight, 'opponent', '');
    Vue.set(app.game.fight, 'ownDeck', []);
    Vue.set(app.game.fight, 'opponentDeck', []);
    Vue.set(app.game.fight, 'ownTurn', -1);
    Vue.set(app.game.fight, 'opponentTurn', -1);
}

function selectCard(index, fraction) {
    if (fraction !== 'opponent') return;
    socketSend([
        SET_FIGHT_TARGET,
        index
    ]);
    app.arrow.toCursor = false;
    var bounds = document.getElementById('opponent-row').childNodes[index].getBoundingClientRect();
    app.arrow.to.x = bounds.left + (bounds.right - bounds.left) / 2;
    app.arrow.to.y = bounds.bottom;
}

function trashCard(index) {
    app.game.hand.splice(index, 1);
    for (var i = 0; i < app.game.hand.length; i++)
        app.game.hand[i].index = i;
    socketSend([
        TRASH_CARD,
        index
    ]);
}

function applyEnchantment(enchindex, cardindex) {
    if (app.game.hand[cardindex].enchslots == 0
    || (app.game.hand[cardindex].enchslots == 1 && app.game.hand[cardindex].enchantments[0])
    || (app.game.hand[cardindex].enchslots == 2 && app.game.hand[cardindex].enchantments[0] && app.game.hand[cardindex].enchantments[1]))
        return; // all slots occupied

    socketSend([
        ENCHANT_CARD,
        enchindex,
        cardindex
    ]);
}
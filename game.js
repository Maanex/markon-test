socket = initSocket();


var enchants = {
    test: {
        name: 'Test',
        icon: '',
        description: '',
        rarity: 3
    }
}


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
    document.getElementById('planning-ready').disabled = false;

}
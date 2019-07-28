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
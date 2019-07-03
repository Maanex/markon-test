

window.getCookie = function(name) {
    var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    if (match) return match[2];
}

window.setCookie = function(name, value, minutes) {
    var d = new Date;
    d.setTime(d.getTime() + 60000 * minutes);
    document.cookie = name + '=' + value + ';path=/;expires=' + d.toGMTString();
}

function randomHex(length=16){
    var letters = "0123456789ABCDEF"; 
    var str = ''; 
    for (var i = 0; i < length; i++) 
        str += letters[(Math.floor(Math.random() * 16))];
    return str;
}

module.exports = {
    'randomHex': randomHex
};

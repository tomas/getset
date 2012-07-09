var config = require('./..').load(__dirname + '/config.ini');

console.log(config.get('foo'));
console.log(config.get('section'));

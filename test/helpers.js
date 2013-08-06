var fs = require('fs');

exports.copy = function(src, dst, callback) {
  var is = fs.createReadStream(src);
  var os = fs.createWriteStream(dst);
  is.on('end', callback);
  is.pipe(os);
};

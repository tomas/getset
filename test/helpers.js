var fs = require('fs'),
    join = require('path').join;

var fixtures_path = join(__dirname, 'fixtures');

exports.copy = function(src, dst, callback) {
  var is = fs.createReadStream(src);
  var os = fs.createWriteStream(dst);
  is.on('end', callback);
  is.pipe(os);
};

exports.fixtures = {
  valid:  join(fixtures_path, 'valid.ini'),
  empty:  join(fixtures_path, 'empty.ini'),
  invalid: join(fixtures_path, 'invalid.ini'),
  missing_file: join(fixtures_path, 'missing.ini')
}
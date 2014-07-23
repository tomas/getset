var empty = { values: {} };


exports.present = function(file, cb) {
  if (!cb) return true;
  cb(null, true)
}

exports.writable = function(file, cb) {
  cb(true)
}

exports.read = function(path, cb) {
  cb(null, empty)
}

exports.readSync = function(path) {
  return empty;
}

exports.save = function(data, cb) {
  cb();
}


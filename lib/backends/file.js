var fs     = require('fs'),
    parser = require('./utils/parser');

var write_timeout = 300,
    debugging = !!process.env.DEBUG;

var debug  = debugging ? console.log : function() { };

exports.present = function(file, cb) {
  if (!cb) return fs.existsSync(file);
  fs.exists(file, cb);
}

exports.writable = function(file, cb) {
  if (!cb) return;

  var done = function(err) {
    if (returned) return;
    returned = true;
    if (delete_after) fs.unlink(file);
    cb(err ? false : true);
  }

  var delete_after = !this.present(),
      returned = false,
      stream = fs.createWriteStream(file, { flags: 'a' });

  stream.on('error', done);
  setTimeout(done, write_timeout);
  stream.destroy();
}

exports.read = function(file, cb) {
  if (!cb) return this.readSync(file, cb);

  debug('Reading async:' + file)
  fs.readFile(file, function(err, data) {
    if (err) return cb(err);
    cb(null, parser.decode(data.toString()));
  });
}

exports.readSync = function(file) {
  debug('Reading sync: ' + file)
  try {
    var data = fs.readFileSync(file);
    return parser.decode(data.toString());
  } catch (e) {
    return { values: {}, meta: { comments: {} }};
  }
}

exports.save = function(file, obj, cb) {

  var self = this,
      opts = { header: obj.meta.header, comments: obj.meta.comments },
      str  = parser.encode(obj.values, opts);

  if (str.indexOf('Object]') != -1)
    return cb && cb(new Error('Error merging values.'));

  fs.readFile(file, function(err, data) {
    // if (err) return cb && cb(err); // may not exist

    if (data && data.toString().trim() === str.trim()) { // no changes
      return cb && cb();
    }

    debug('Writing changes to ' + file)
    fs.writeFile(file, str, function(err) {
      cb && cb(err);
    });

  })
}

exports.watch = function(config, cb) {
  if (config.watcher) return cb && cb(new Error('Watch already set.'));

  debug('Watching: ' + config.path);

  var opts = { persistent: false },
      error;

  var changed_cb = function(event, filename) {
    if (!config.watcher || event != 'change')
      return;

    // we pass a callback to use the async version of load
    config.reload(function(err){
      if (!err) config.emit('changed');
    });

  }

  try {
    config.watcher = fs.watch(config.path, opts, changed_cb);
  } catch(e) {
    error = e;
  }

  cb && cb(error);
  return config;

}

exports.unwatch = function(config, cb) {
  if (!config.watcher)
    return cb && cb(new Error('Not watching!'));

  config.watcher.close();
  config.watcher = null;
}

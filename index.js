/***********************************************/
/* Getset - Configuration handler for Node.js
/* Written by Tomás Pollak <tomas@forkhq.com>
/* (c) 2012 Fork Ltd.
/* MIT Licensed
/***********************************************/

var fs = require('fs'),
    path_resolve = require('path').resolve,
    parser  = require('./lib/parser'),
    helpers = require('./helpers'),
    util    = require('util'),
    Emitter = require('events').EventEmitter;

var Getset = function(){
  this._file     = null;
  this._values   = {};
  this._comments = {};
};

util.inherits(Getset, Emitter);

/**
 * Loads given config file, assings its values and sets it as the [_file}.
 * @param {String} file Location of file.
 * @param {Function} [callback="(null)"] Callback for asynchronous load.
 * @return {Object} Getset object.
 */
Getset.prototype.load = function(file, callback){

  if (!file || file == "") throw(new Error("Invalid file path."));
  if (this._file) throw(new Error("Already loaded: " + this._file));

  var self = this;
  if (!callback) return this.loadSync(file);

  this.read(file, function(err, result){
    if (err) return callback(err);

    if (result.header) self._header = result.header;
    self._comments = result.comments;
    self.loaded(file);
    callback(null, self.merge(result.values));
  });

  return this;
}

/**
 * Unloads values and sets file to null, so a new one can be loaded.
 * @return {Object} Getset object.
 */
Getset.prototype.unload = function(){
  this._values = {};
  this._comments = {};
  this._file = null;
  this._modified = false;
  return this;
};


/**
 * Reload config file, merging new values with existing ones.
 * @param {Function} [callback="(null)"] Callback for asynchronous load.
 * @return {Object} Getset object.
 */
Getset.prototype.reload = function(callback){
  var file = this._file;
  this._file = null; // so it doesn't throw
  return this.load(file, callback);
};

/**
 * Sets up watch for config file, calling self.reload() if changes are detected.
 * @param {Function} callback Callback.
 * @return {Object} Getset object.
 */
Getset.prototype.watch = function(callback){
  if (this._watching) return callback(new Error("Watch already set."));

  var self = this, error;
  this._watching = true;

  try {

    fs.watch(this._file, function(event, filename) {
      if (event == 'change') self.reload(function(err){
        if (!err) self.emit('changed');
        // we pass a callback to use the async version of load
      });
    });

  } catch(e) {
    error = e;
  }

  callback && callback(error);
  return this;
}

/**
 * Removes watch for config file, if already set.
 * @return {null}
 */
Getset.prototype.unwatch = function(callback){
  if (!this._watching) return;
  fs.unwatchFile(this._file);
  this._watching = false;
}

/**
 * Reads given config file without settings any values.
 * @param {String} file Location of file.
 * @param {Function} [callback="(null)"] Callback for asynchronous load.
 * @return {Object} Values read from file (if called without callback).
 */
Getset.prototype.read = function(file, callback){
  if (!callback) return this.readSync(file);

  fs.readFile(file, function(err, data){
    if (err) return callback(err);
    callback(null, parser.decode(data.toString()));
  });
}

/**
 * Assigns object to set of values.
 * @param {Object} opts Key-value hash containing config values.
 * @return {Object} Getset instance.
 */

// Getset.prototype.include = function(opts){
//   return this.merge(opts);
// }

/**
 * Checks if config file exists or not.
 * @param {Function} callback Callback for asyncronous response.
 * @return {Boolean} True/false depending if file exists or not.
 */
Getset.prototype.present = function(callback){
  if (!callback) return fs.existsSync(this._file);
  fs.exists(this._file, callback);
}

/**
 * Async function to check if file is writable or not.
 * @param {Function} callback Callback
 * @return {null}
 */
Getset.prototype.writable = function(callback){
  if (!callback) return;

  var done = function(err){
    if (returned) return;
    returned = true;
    callback(err ? false : true);
  }

  var returned = false;
  var stream = fs.createWriteStream(this._file, { flags: 'a' });
  stream.on('error', done);
  setTimeout(done, 100);
  stream.destroy();
}

/**
 * Returns value stored at [key], optionally with [subkey]
 * @param {String} key Key where to get value from.
 * @param {String} subkey If you want to get a specific item.
 * @return {Any} Whatever was found at that path.
 */
Getset.prototype.get = function(key, subkey){
  if (subkey && typeof this._values[key] != 'undefined')
    return helpers.guess_type(this._values[key][subkey]);
  else
    return helpers.guess_type(this._values[key]);
}

/**
 * Sets value at [key] if [key] exists or [force] is true.
 * @param {String} key Key where to set value.
 * @param {String} val Value to be set
 * @param {Bool} force Forces key to be set even if it does not exist.
 * @return {String/Undefined} Depending if the value was set or not.
 */
Getset.prototype.set = function(key, val, force){
  if (typeof val == 'undefined' ||
    (!force && this._file && typeof this._values[key] == 'undefined')) return;

  var opts = {};
  opts[key] = val;
  return this.merge(opts, true);
}

/**
 * Sets value at [key] and saves document if it was successful.
 * @param {String} key Key where to set value.
 * @param {String} val Value to be set
 * @return {String/Undefined} Depending if the value was set or not.
 */
Getset.prototype.update = function(key, val, callback){
  if (this.set(key, val))
    return this.save(callback);
  else
    return callback ? callback(new Error('Unable to set value for key: ' + key)) : false;
}

/**
 * Saves config file with current set of values.
 * @param {Function} callback Callback to check if fs.writeFile was successful.
 * @return {null}
 */
Getset.prototype.save = function(callback){
  if (!this._file) return callback && callback(new Error("No file set."));

  var self = this,
      opts = {header: this._header, comments: this._comments},
      str  = parser.encode(this._values, opts)

  if (str.indexOf('[object Object]') != -1)
    return callback && callback(new Error('Error merging values.'));

  fs.readFile(this._file, function(err, data){
    // if (err) return callback && callback(err);

    if (data && data.toString().trim() === str.trim()) { // no changes
      self._modified = false;
      return callback && callback();
    }

    fs.writeFile(self._file, str, function(err){
      self._modified = false;
      callback && callback(err);
    });

  })

  return this;
}

/**
 * Merges [opts] into values, only replacing if [replace] is true
 * @param {Object} opts Key-value hash containing config values.
 * @return {Object} Config instance.
 */
Getset.prototype.merge = function(opts, replace){
  return this.merge_data('values', opts, replace);
}

Getset.prototype.merge_data = function(what, opts, replace){
  var key = '_' + what;
  this[key] = helpers.mixin(this[key], opts, replace);
  this._modified = true;
  return this;
}

/**
 * Reads [other_file], sets unexisting key-vals and saves current file.
 * @param {String} other_file Location of the file to sync with.
 * @param {Function} callback Callback to check if fs.writeFile was successful.
 * @return {null}
 */
Getset.prototype.sync = function(other_file, replace, callback){
  if (!this._file) throw(new Error("No file set."));
  
  var replace_values = false;

  if (typeof replace == 'function')
    callback = replace;
  else
    replace_values = replace;

  var self = this;
  this.read(other_file, function(err, result){
    if (err) return callback(err);

    if (Object.keys(result.values).length == 0)
      return callback(new Error("No values found."))

    // merge header, if present
    if (result.header) self.merge_data('header', result.header, true);

    // merge comments, replacing old ones with new ones
    self.merge_data('comments', result.comments, true);

    // add new key/vals to values
    self.merge_data('values', result.values, replace_values);

    // remove unexisting keys in new file
    self._values = helpers.intersect(self._values, result.values);

    self.save(callback);
  });
}

/**
 * Assigns [file] as base config file for persistence.
 * @param {String} file Location of file.
 * @return {null} Getset object.
 */
Getset.prototype.loaded = function(file){
  // if (this._file) return;
  this._file = path_resolve(file);
  this._modified = false;
}

/**
 * Reads and assigns values synchronously from file.
 * @param {String} file Location of file to read from.
 * @return {Object} Getset instance.
 */
Getset.prototype.loadSync = function(file){
  var result = this.readSync(file);
  if (result.header) this._header = result.header;
  this._comments = result.comments;
  this.merge(result.values, true);
  this.loaded(file);
  return this;
};

/**
 * Reads synchronously from file, without assigning values.
 * @param {String} file Location of file to read from.
 * @return {Object} Set of key-values read from file.
 */
Getset.prototype.readSync = function(file){
  try {
    var data = fs.readFileSync(file);
    return parser.decode(data.toString());
  } catch (e) {
    return {values: {}, comments: {}};
  }
}

module.exports = new Getset();

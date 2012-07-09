/***********************************************/
/* Getset - Configuration handler for Node.js
/* Written by Tomás Pollak <tomas@forkhq.com>
/* (c) 2012 Fork Ltd.
/* MIT Licensed
/***********************************************/

var fs = require('fs'),
    path_resolve = require('path').resolve,
    ini = require('ini'),
    helpers = require('./helpers'),
    util = require('util'),
    Emitter = require('events').EventEmitter;

var Getset = function(){
  this._loaded = false;
  // this._file   = null;
  this._values = {};
};

util.inherits(Getset, Emitter);

/**
 * Loads given config file, assings its values and sets it as the [_file}.
 * @param {String} file Location of file.
 * @param {Function} [callback="(null)"] Callback for asynchronous load.
 * @return {Object} Getset object.
 */
Getset.prototype.load = function(file, replace, callback){

  var self = this;
  if (typeof replace == 'function'){
  	callback = replace;
  	replace = null;
  }

  if (!callback) return this.loadSync(file, replace);

  this.read(file, function(err, values){
    if (err) return callback(err);

	  self.loaded(file);
    callback(null, self.merge(values, replace));
  })

  return this;
}

/**
 * Reload config file, merging new values with existing ones.
 * @param {Function} [callback="(null)"] Callback for asynchronous load.
 * @return {Object} Getset object.
 */
Getset.prototype.reload = function(callback){
	return this.load(this._file, true, callback);
};

/**
 * Sets up watch for config file, calling self.reload() if changes are detected.
 * @param {Function} callback Callback.
 * @return {Object} Getset object.
 */
Getset.prototype.watch = function(callback){
	if(this._watching) return callback(new Error("Watch already set."));

	var self = this, error;
	this._watching = true;

	try{

		fs.watch(this._file, function(event, filename) {
			if(event == 'change') self.reload(function(err){
				if(!err) self.emit('changed');
				// we pass a callback to use the async version of load
			});
		});

	} catch(e){
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
	if(!this._watching) return;
	fs.unwatchFile(this._file);
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
    callback(null, ini.decode(data.toString()));
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
Getset.prototype.persisted = function(callback){
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
  var stream = fs.createWriteStream(this._file);
  stream.on('error', done);
  setTimeout(done, 10);
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
    (!force && typeof this._values[key] == 'undefined')) return;

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
		this.save(callback);
}

/**
 * Saves config file with current set of values.
 * @param {Function} callback Callback to check if fs.writeFile was successful.
 * @return {null}
 */
Getset.prototype.save = function(callback){
  if (!this._file) return callback && callback(new Error("No file set."));

  var self = this;
  fs.writeFile(this._file, ini.encode(this._values), function(err){
  	self._modified = false;
  	callback && callback(err);
  });
}


/**
 * Merges [opts] into values, only replacing if [replace] is true
 * @param {Object} opts Key-value hash containing config values.
 * @return {Object} Config instance.
 */
Getset.prototype.merge = function(opts, replace){
  this._values = helpers.mixin(this._values, opts, replace);
  this._modified = true;
  return this;
}

/**
 * Reads [other_file], sets unexisting key-vals and saves current file.
 * @param {String} other_file Location of the file to sync with.
 * @param {Function} callback Callback to check if fs.writeFile was successful.
 * @return {null}
 */
Getset.prototype.sync = function(other_file, callback){
  if(!this._loaded) return callback(new Error("Cannot sync, not loaded yet."));

  var self = this;
  this.load(other_file, function(err){
    if (!err) self.save(callback);
  })
}

/**
 * Assigns [file] as base config file for persistence.
 * @param {String} file Location of file.
 * @return {null} Getset object.
 */
Getset.prototype.loaded = function(file){
  if (this._file) return;
  this._file = path_resolve(file);
  this._loaded = true;
  this._modified = false;
}

/**
 * Reads and assigns values synchronously from file.
 * @param {String} file Location of file to read from.
 * @return {Object} Getset instance.
 */
Getset.prototype.loadSync = function(file, replace){
  this.merge(this.readSync(file), replace);
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
    return ini.decode(data.toString());
  } catch (e) {
    return {};
  }
}

module.exports = new Getset();

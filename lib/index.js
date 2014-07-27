var fs        = require('fs'),
    resolve   = require('path').resolve,
    dirname   = require('path').dirname,
    helpers   = require('./helpers'),
    inherits  = require('util').inherits,
    Emitter   = require('events').EventEmitter;

var configs   = {},
    debugging = !!process.env.DEBUG;

var types = {
  file: require('./backends/file'),
  mem:  require('./backends/memory')
}

/// helpers

var debug = debugging ? console.log : function() { } ;

function determine_type(path) {
  if (path && fs.existsSync(dirname(path)))
    return 'file';
  else
    return 'mem';
}

/// the main act

var Config = function(opts) {
  this.path      = opts.path && resolve(opts.path);
  this.type      = opts.type || determine_type(this.path);

  if (!types[this.type])
    throw new Error('Invalid type: ' + this.type);

  this.locked    = opts.locked || false; // whether to allow new keys to be set or not
  this.strict    = opts.strict || false; // enforce types to match
  this.readonly  = opts.readonly || false;
  this.unload(); // set everything to blank
}

inherits(Config, Emitter);

Config.prototype.unload = function() {
  this._values = {};
  this._meta = {};
  this._modified = false;
  return this;
}

Config.prototype.load = function(cb) {
  if (!cb) return this.loadSync();

  var self = this;
  types[this.type].read(this.path, function(err, result) {
    if (err) return cb(err);

    self.loaded(result);
    cb(null, self);
  });

  return this;
}

Config.prototype.reload = function(cb) {
  return this.load(cb);
}

Config.prototype.loadSync = function(file) {
  var result = types[this.type].readSync(this.path);
  this.loaded(result);
  return this;
};

Config.prototype.loaded = function(result) {
  debug('Loaded:', result)
  if (result.meta) this.merge_data('meta', result.meta, true);
  this.merge(result.values, true); // do replace values
  this._modified = false;
  return this;
}

Config.prototype.present = function(cb) {
  return types[this.type].present(this.path, cb);
}

Config.prototype.writable = function(cb) {
  if (this.readonly)
    return cb ? cb(false) : false;

  return types[this.type].writable(this.path, cb);
}

Config.prototype.merge = function(obj, replace) {
  return this.merge_data('values', obj, replace);
}

Config.prototype.merge_data = function(what, obj, replace) {
  debug('Setting ' + what + ' with replace ' + replace, obj);

  var key     = '_' + what,
      res  = helpers.mixin(this[key], helpers.unflatten(obj), replace);

  this[key] = res;
  this._modified = true;
  return this;
}

Config.prototype.all = function() {
  return this._values;
}

// example, with: { foo: 123, bar: { quux: 456, obj: { bool: true } } }

// get('foo')             # => 123
// get('bar')             # => { quux: 123, obj: { bool: true } }
// get('bar', 'quux')     # => 456
// get('bar.quux')        # => 456
// get('bar.obj', 'bool') # => true

Config.prototype.get = function(key, subkey) {
  var res, self = this;

  if (typeof key !== 'string')
    return; // undefined

  // if either key or subkey has a dot, recurse.
  if ((key + (subkey || '')).indexOf('.') !== -1) {
    var full_key = subkey ? key + '.' + subkey : key;

    res = full_key.split('.').reduce(function(prev, k) {
      return prev[k];
    }, this._values);

  } else if (typeof this._values[key] != 'undefined') {
    res = subkey ? this._values[key][subkey] : this._values[key];
  }

  return helpers.guess_type(res);
}

Config.prototype.set = function(key, val) {
  if (this.readonly || typeof val === 'undefined')
    return false;

  if (typeof key == 'object' && val !== null) {
    var obj = key;
  } else {
    var obj = {};
    obj[key] = val;
  }

  // if locked mode is enabled, ensure all keys are present
  if (this.locked && !helpers.all_keys_exist(this._values, obj)) {
    debug('New keys must match existing keys in strict mode. Stopping here.')
    return false;
  }

  // if strict mode is enabled, ensure all types match
  if (this.strict && !helpers.existing_types_match(this._values, obj)) {
    debug('Types must match. Stopping here.')
    return false;
  }

  return this.merge(obj, true);
}

Config.prototype.update = function(key, val, cb) {
  if (this.set(key, val))
    return this.save(cb);
  else
    return cb ? cb(new Error('Unable to set value for key: ' + key)) : false;
}

Config.prototype.save = function(cb) {
  if (!this._modified) return cb && cb(); // false or empty callback

  var self   = this,
      obj    = { values : this._values };

  if (this._meta) obj.meta = this._meta;
  // debug('Saving: ', obj);

  types[this.type].save(this.path, obj, function(err) {
    self._modified = false;
    cb && cb(err);
  });

  return this;
}

Config.prototype.sync = function(other_file, replace, cb) {
  debug('Syncing contents with ' + other_file);

  var replace_values = false;

  if (typeof replace == 'function')
    cb = replace;
  else
    replace_values = replace; // could be true, false or 'nonempty'

  var self = this;
  types[this.type].read(other_file, function(err, result) {
    if (err) return cb && cb(err);

    if (Object.keys(result.values).length == 0)
      return cb && cb(new Error('No values found.'))

    // merge result meta, replacing old ones with new ones
    self.merge_data('meta', result.meta, true);

    // add new key/vals to values
    self.merge_data('values', result.values, replace_values);

    // remove unexisting keys in new file
    self._values = helpers.intersect(self._values, result.values);

    self.save(cb);
  });
}

Config.prototype.watch = function(cb) {
  return types[this.type].watch(this, cb);
}

Config.prototype.unwatch = function(cb) {
  return types[this.type].unwatch(this, cb);
}

/// exports

exports.load = function(opts, cb) {
  var opts = opts || {};

  if (typeof opts == 'string') {
    var opts = { path: opts };
  }

  var path = opts.path;

  if (!path && opts.type != 'mem')
      throw new Error('Invalid path.');

/*
  if (configs[path]) {
    var obj = configs[path];
    return cb ? cb(null, obj) : obj;
  }
*/

  var config = new Config(opts);
  configs[path] = config;

  return config.load(cb);
}

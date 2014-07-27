var is_number = function(str){
  return (str*1).toString() === str;
}

exports.guess_type = function(obj){

  if (typeof obj == 'string'){

    var str = obj.trim();

    if (str.trim() == '')
      return '';
    else if (str == 'null')
      return null;
    else if (str.match(/^(true|y(es)?)$/))
      return true;
    else if (str.match(/^(false|n(o)?)$/))
      return false;
    else if (is_number(str))
      return str*1;
    else
      return str;

  } else if (Array.isArray(obj)) {

    var values = [], last_index = -1;
    for (var i in obj){
      last_index++;

      if (is_number(i) && i*1 == last_index)
        values.push(exports.guess_type(obj[i]));
      else // something didn't match
        return obj;
    }

    return values;

  } else {

    return obj;

  }

}

exports.mixin = function(target, source, replace) {

  if (!source || typeof source != 'object')
    return target;

  function are_objects(key) {
    if (is_empty(source[key]) || is_empty(target[key]))
      return false;

    return source[key].constructor === Object && target[key].constructor === Object;
  }

  function is_empty(prop) {
    return typeof prop == 'undefined' || prop === null || (typeof prop == 'string' && prop.trim() == '');
  }

  Object.keys(source).forEach(function(key) {

    // if (source[key] !== null) {
      // if both keys are objects, recurse
      if (are_objects(key)) {
        target[key] = exports.mixin(target[key] || {}, source[key], replace);

      // if on replacing mode, or if target key does not exist or is empty, set it.
      } else if (replace === true || is_empty(target[key])) {
        target[key] = source[key];

      // ok, target key exists. so only replace if new value is not empty.
      // the point is to avoid replacing an existing key with a blank value.
      // other values should be replaced.
      } else if (replace == 'nonempty' && !is_empty(source[key])) {
        target[key] = source[key];
      }
    // }
  });

  return target;
}

exports.intersect = function(target, source) {
  Object.keys(target).forEach(function(key) {
    if (typeof source[key] === 'undefined')
      delete target[key];
  });

  return target;
}

// returns false if one of the values in obj_b is different from its value in obj_a
// unexisting keys in obj_a are skipped (e.g. are considered valid)
exports.existing_types_match = function(obj_a, obj_b) {

  var res = true;

  Object.keys(obj_b).forEach(function(key) {
    if (typeof obj_a[key] != 'undefined' && (typeof obj_a[key] !== typeof obj_b[key]))
      res = false;
  })

  return res;
}


exports.all_keys_exist = function(obj_a, obj_b) {

  var result = true,
      keys_a = Object.keys(exports.flatten(obj_a)),
      keys_b = Object.keys(exports.flatten(obj_b));

  /*
  if (keys_a.length !== keys_b.length) {
    return false;
  }
  */

  keys_b.forEach(function(x) { 
    if (keys_a.indexOf(x) === -1) {
      result = false; 
    }
  })

  return result;
}

exports.flatten = function(object, into, prefix) {
  into = into || {};

  for (var key in object) {
    var prefix_key = prefix ? prefix + '.' + key : key;
    var prop = object[key];

    if (prop && typeof prop === 'object')
      exports.flatten(prop, into, prefix_key)
    else
      into[prefix_key] = prop;
  }

  return into;
}

exports.unflatten = function (obj) {

  return Object.keys(obj).reduce(function(previous, current) {
    var target = previous,
        keys   = current.split('.');

    for (var i = 0; i < keys.length-1; i++) {

      if (!target.hasOwnProperty(keys[i])) {
        // target[keys[i]] = is_number(keys[i+1]) ? [] : {};
        // only mark as array if first element is a zero
        target[keys[i]] = keys[i+1].toString() == '0' ? [] : {};
      }

      target = target[keys[i]];
    }

    var k = keys[keys.length-1];
    target[k] = obj[current];
    return previous;

  }, {});

};

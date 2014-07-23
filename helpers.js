var is_number = function(str){
  return (str*1).toString() === str;
}

exports.guess_type = function(obj){

  if (typeof obj == 'string'){

    var str = obj.trim();

    if (str.trim() == '')
      return;
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

exports.mixin = function(target, source, replace){

  if (!source || typeof source != 'object')
    return target;

  Object.keys(source).forEach(function(key) {
    if (typeof source[key] == 'object' && typeof source[key].length == 'undefined')
      target[key] = exports.mixin(target[key] || {}, source[key], replace);
    else if (replace === true || typeof target[key] == 'undefined')
      target[key] = source[key];
    else if (replace == 'nonempty' && source[key] != '')
      target[key] = source[key];
  });

  return target;
}

exports.intersect = function(target, source){

  Object.keys(target).forEach(function(key) {
    if (typeof source[key] === 'undefined')
      delete target[key];
  });

  return target;
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

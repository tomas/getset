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

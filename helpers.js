exports.guess_type = function(obj){
  if(typeof obj != 'string') return obj;

  var str = obj.trim();

  if (str.trim() == '')
    return;
  else if (str == 'null')
    return null;
  else if (str.match(/^(true|y(es)?)$/))
    return true;
  else if (str.match(/^(false|n(o)?)$/))
    return false;
  else if ((str*1).toString() === str)
    return str*1;

  return str;
}

exports.mixin = function(target, source, replace){

  Object.keys(source).forEach(function(key) {

    if (typeof source[key] == 'object')
      target[key] = exports.mixin(target[key] || {}, source[key], replace);
    else if(replace || typeof target[key] == 'undefined')
      target[key] = source[key];

  });

  return target;
}

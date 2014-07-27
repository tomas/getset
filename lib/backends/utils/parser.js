// original code by @isaacs
// "Isaac Z. Schlueter <i@izs.me> (http://blog.izs.me/)",
// taken from ini node.js module

exports.parse = exports.decode = decode
exports.stringify = exports.encode = encode

exports.safe = safe
exports.unsafe = unsafe

function encode (obj, opts, section) {
  var children = []
    , out = ""

  if(typeof opts == 'string'){
    section = opts;
    opts = null;
  }

  if (opts.header)
    out += opts.header;

  var add_comment = function(k, comms){
    if (!comms || !comms[k]) return;

    if (!opts.child && out == "") // header
      out += comms[k];
    else
      out += "\n" + comms[k];
  }
  
  var prepare = function(val) {
    if (Array.isArray(val))
      return val.join(', ');
    else if (val == null)
      return '';
    else
      return safe(val)
  }

  Object.keys(obj).forEach(function (k, _, __) {
    var val = obj[k]
    if (val && typeof val === "object" && !Array.isArray(val)) {
      children.push(k)
    } else if (typeof val !== 'undefined') {
      add_comment(k, opts.comments);
      out += safe(k) + " = " + prepare(val) + "\n"
    }
  })

  if (section && out.length) {
    out = "[" + safe(section) + "]" + "\n" + out
  }

  children.forEach(function (k, _, __) {
    var subopts = {child: true};
    subopts.comments = opts.comments && opts.comments[k];
    var child = encode(obj[k], subopts, (section ? section + "." : "") + k)
    if (out.length && child.length) {
      out += "\n"
    }
    out += child
  })

  return out
}

function decode (str) {
  var out = {}
    , comments = {}
    , p = out
    , section = null
    , state = "START"
           // section     |key = value
    , re = /^\[([^\]]*)\]$|^([^=<]+)(=(.*))?$/i
    , lines = str.split(/[\r\n]+/g)
    , section = null
    , header  = null
    , last_comment = '';

  var is_comment = function(line){
    var semi = line.indexOf(';'),
        hash = line.indexOf('#');
    return ((semi !== -1 && line.substr(0, semi) == '') ||
            (hash !== -1 && line.substr(0, hash) == ''));
  }
  
  var parse_value = function(key, str) {
    var val = unsafe(str || "");
    if (val.trim().indexOf(',') !== -1)
      return val.split(/,\s?/).map(function(e) { return e.trim() });
    else if (key.match(/_list$/))
      return [val];
    else
      return val;
  }

  lines.forEach(function (line, _, __) {
    //line = line
    if (is_comment(line)) {
      return last_comment += line.trim() + "\n";      
    }

    var match = line.match(re)
    if (!match) return

    if (match[1] !== undefined) {
      section = unsafe(match[1])
      
      if (last_comment != '' && Object.keys(comments).length == 0) {
        header = last_comment;        
      }
      last_comment = '';

      comments[section] = comments[section] || {};
      p = out[section] = out[section] || {}
      return
    }

    var key   = unsafe(match[2]), 
        value = match[3] ? parse_value(key, match[4]) : true;

    p[key] = value
    if(last_comment == '') return;

    if(section)
      comments[section][key] = last_comment;
    else
      comments[key] = last_comment;

    last_comment = "";
  })

  // {a:{y:1},"a.b":{x:2}} --> {a:{y:1,b:{x:2}}}
  // use a filter to return the keys that have to be deleted.
  Object.keys(out).filter(function (k, _, __) {
    if (!out[k] || typeof out[k] !== "object") return false
    // see if the parent section is also an object.
    // if so, add it to that, and mark this one for deletion
    var parts = k.split(".")
      , p = out
      , l = parts.pop()
    parts.forEach(function (part, _, __) {
      if (!p[part] || typeof p[part] !== "object") p[part] = {}
      p = p[part]
    })
    if (p === out) return false
    p[l] = out[k]
    return true
  }).forEach(function (del, _, __) {
    delete out[del]
  })

  // check if header is present
  var first_comment = comments[Object.keys(comments)[0]];
  if (!header && typeof first_comment == 'string' && first_comment.match(/\n([;#]{2,})\n/)) {
    var split_comment = first_comment.split(/\n([;#]{2,})\n/);
    comments[Object.keys(comments)[0]] = split_comment.splice(2)[0];
    header = split_comment.join('\n') + '\n';
  } 

  // remove empty hashes of comments
  // for(var key in comments){
  //  if(typeof comments[key] == 'object' && Object.keys(comments[key]).length == 0)
  //    delete comments[key];
  // }

  var data = {values: out, meta: { comments: comments } };
  if (header) data.meta.header = header;

  return data;
}

function safe (val) {
  return ( typeof val !== "string"
         || val.match(/[\r\n]/)
         || val.match(/^\[/)
         || (val.length > 1
             && val.charAt(0) === "\""
             && val.slice(-1) === "\"")
         || val !== val.trim() ) ? JSON.stringify(val) : val
}

function unsafe (val) {
  val = (val || "").trim()
  if (val.charAt(0) === "\"" && val.slice(-1) === "\"") {
    try { val = JSON.parse(val) } catch (_) {}
  }
  return val
}

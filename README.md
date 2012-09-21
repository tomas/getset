Getset
======

An easier way of handling config options for client-side apps. Specially when
it comes to changing settings and upgrading.

Usage
-----

``` js
var config = require('getset').load('/path/to/config/file');

config.set('foo', 'bar');
config.get('foo'); // 'bar'

config.save(function(err){
  if (!err) console.log('Saved successfully!')
})
```

Bells & whistles
----------------

``` js
var config = require('getset');

config.load('/file/that/will/be/read/asynchronously', function(err){

  if (!err) config.update('foo', 'bar'); // will set() and save()

  config.on('changed', function(){
    console.log('Hold on, someone just changed something!')
  })

  config.watch();
})
```

Features
--------

 - Singleton. Require from anywhere and you'll get the same object.
 - Uses a single, readable .ini file for persistence.
 - Restricts setting key/values to what's already in there.
 - Can sync with updated/new config files without overwriting existing values.
 - Can watch the config file for changes and reload + notify if it happens.
 - Has no dependencies.

Credits
-------

Written by Tomás Pollak.

Copyright
---------

(c) 2012 Fork Ltd. MIT licensed.

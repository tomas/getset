var should = require('should'),
    sinon  = require('sinon'),
    getset = require('./../'),
    fs     = require('fs');

var basedir = __dirname + '/fixtures',
    valid   = basedir + '/valid.ini',
    tmpfile = '/tmp/valid.ini',
    arrays  = basedir + '/arrays.ini';

var data = fs.readFileSync(valid);

var new_tmpfile = function(){
  fs.writeFileSync(tmpfile, data);
  // fs.existsSync(tmpfile).should.be.true;
  return tmpfile;
}

var setget = function(key, val, cb){
  getset.unload();
  getset.load(new_tmpfile());

  getset.set(key, val, true);
  getset.get(key).should.eql(val);

  getset.save(function(err){
    // console.log(fs.readFileSync(tmpfile).toString());
    getset.unload();
    getset.load(tmpfile);
    cb(getset);
  });
}

describe('types', function(){

  it('should save & load true as boolean', function(done){

    setget('is_this_awesome', true, function(gs){
      var val = gs.get('is_this_awesome');
      val.should.be.a('boolean');
      val.should.eql(true);
      done();
    })

  })

  it('should save & load false as boolean', function(done){

    setget('does_this_suck', false, function(gs){
      var val = gs.get('does_this_suck');
      val.should.be.a('boolean');
      val.should.eql(false);
      done();
    })

  })

  it('should save & load number as number', function(done){

    setget('the answer to everything', 42, function(gs){
      var val = gs.get('the answer to everything');
      val.should.be.a('number');
      val.should.eql(42);
      done();
    })

  })

  it('should store objects correctly', function(done){

    setget('music', {rock: 1, jazz: 2}, function(gs){
      gs.get('music', 'rock').should.eql(1);
      gs.get('music', 'jazz').should.eql(2);
      done();
    })

  })

  it('should store nested objects correctly', function(done){

    var ubuntu_releases = {
        '2011.10': 'oneiric ocelot',
        '2012.04': 'precise pangolin'
    }

    var data = {
      debian: {
        ubuntu: ubuntu_releases
      }
    }

    setget('distros', data, function(gs){
      gs.get('distros', 'debian').ubuntu.should.eql(ubuntu_releases);
      done();
    })

  })

  it('should save & load arrays correctly', function(done){

    setget('numbers', [1,2,3], function(gs){
      gs.get('numbers').should.eql([1,2,3]);
      done();
    })

  })

  it('should return native values for elements in array', function(done){

    setget('elements', ['foo', true, 100], function(gs){
      var el = gs.get('elements');
      el.should.eql(['foo', true, 100]);
      done();
    })

  })

  it('should verify array indexes', function(done){

    setget('test', {0: 'asdasd', 1: 'test', 3: '12312'}, function(gs){
      should.equal(gs.get('test').length, null); // not array
      gs.get('test').should.eql({0: 'asdasd', 1: 'test', 3: '12312'});
      done();
    })

  })

  it('should not confuse arrays with hashes', function(done){

    setget('music', {0: 'asdasd', foo: 'bar'}, function(gs){
      gs.get('music').should.eql({0: 'asdasd', foo: 'bar'});
      done();
    })

  })

});

var should = require('should'),
    sinon  = require('sinon'),
    getset = require('./../'),
    valid  = require('./helpers').fixtures.valid;


describe('getting', function(){

  var config;
  var obj = {
    keys: {
      development: { storage: 'bar' },
      production: { storage: 'foo' }
    }
  }

  before(function() {
    config = getset.load('memory');
    config.set('foo', 'bar')
    config.set('app', obj);
  })

  after(function(){
    config.unload();
  })

  it('return undefinde when key is an object', function() {
    should.not.exist(config.get({app: 'keys'}))
  })

  it('return false for a null key', function() {
    should.not.exist(config.get(null))
  })

  it('return false for an undefined key', function() {
    should.not.exist(config.get(undefined))
  })

  it('return false for an integer key', function() {
    should.not.exist(config.get(2))
  })

  it('returns full objects', function() {
    var res = config.get('app');
    res.should.be.an.object;
    res.keys.should.have.keys(['development', 'production']);
  })

  it('accepts subkeys', function() {
    var res = config.get('app', 'keys');
    res.should.have.keys(['development', 'production']);
  })

  it('accepts flat keys', function() {
    var res = config.get('app.keys.development');
    res.should.be.an.object;
    res.should.have.keys(['storage']);
  })

  it('accept flat keys for just a segment', function() {
    config.get('app.keys').should.have.keys(['development', 'production']);
  })

  it ('accepts flat keys as subkey too', function() {
    config.get('app', 'keys.production.storage').should.equal('foo');
  })

});

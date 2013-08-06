var should   = require('should'),
    sinon    = require('sinon'),
    join     = require('path').join,
    getset   = require('./../'),
    fixtures = join(__dirname, 'fixtures'),
    helpers  = require('./helpers'),
    os       = require('os'),
    fs       = require('fs');

var valid_ini = join(fixtures, 'valid.ini'),
    temp_ini  = join(os.tmpDir(), 'temp.ini');

describe('watch', function() {

  before(function(done) {
    helpers.copy(valid_ini, temp_ini, function(err){
      should.not.exist(err);
      getset.unload();
      done();
    });
  })

  after(function(done) {
    fs.unlink(temp_ini, done);
  })

  describe('when no file is loaded', function() {

    it('throws an error', function() {

      (function(){
        getset.watch();
      }).should.throw('No file set!');

    })

  })

  describe('when a file is loaded', function() {

    before(function(done) {
      getset.load(temp_ini, done);
    })

    it('callsback with no errors', function(done) {

      getset.watch(function(err){
        should.not.exist(err);
        done();
      })

    })

    describe('and the file is modified', function() {

      after(function(){
        getset.unload();
      })

      it('emits an event', function(done) {

        var called = false;

        getset.on('changed', function() {
          called = true;
        })

        getset.watch(function(err){
          fs.appendFileSync(temp_ini, 'added = yes');
        })

        setTimeout(function() {
          called.should.be.true;
          done();
        }, 100)

      })

    })

  })

});

describe('unwatch', function() {

  before(function(done) {
    helpers.copy(valid_ini, temp_ini, function(err){
      should.not.exist(err);
      getset.unload();
      done();
    });
  })

  after(function(done) {
    fs.unlink(temp_ini, done);
  })

  describe('when no file is loaded', function() {

    it('callsback an error', function(done) {

      getset.unwatch(function(err){
        should.exist(err);
        err.message.should.equal('Not watching.');
        done();
      })

    })

  })

  describe('with file loaded, but not watching', function() {

    before(function(done){
      getset.load(temp_ini, function(err) {
        should.not.exist(getset._watcher);
        done()
      });
    })

    after(function(){
      getset.unload();
    })

    it('callsback an error', function(done) {

      getset.unwatch(function(err){
        should.exist(err);
        err.message.should.equal('Not watching.');
        done();
      })

    })

  })

  describe('when watching', function() {

    before(function(done){
      getset.load(temp_ini).watch(function(){
        should.exist(getset._watcher);
        done();
      });
    })

    it('does not emit any other events', function(done) {

      var called = false;

      getset.on('changed', function() {
        called = true;
      })

      getset.unwatch();
      fs.appendFileSync(temp_ini, 'added = yes');

      setTimeout(function() {
        called.should.be.false;
        done();
      }, 100)

    })


  })

})

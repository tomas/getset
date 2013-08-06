var should   = require('should'),
    sinon    = require('sinon'),
    join     = require('path').join,
    getset   = require('./../'),
    fixtures = join(__dirname, 'fixtures'),
    helpers  = require('./helpers'),
    os       = require('os'),
    fs       = require('fs');

var valid_ini = join(fixtures, 'valid.ini'),
    temp_ini  = os.tmpDir() + '/temp.ini';

describe('watch', function() {

  var watcher;
  before(function() {
    getset.unload();
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
      helpers.copy(valid_ini, temp_ini, function(err){
        should.not.exist(err);
        getset.load(temp_ini, done);
      });
    })

    it('callsback with no errors', function(done) {

      getset.watch(function(err){
        should.not.exist(err);
        done();
      })

    })

    describe('and the file is modified', function() {

      it('emits an event', function(done) {

        getset.on('changed', function() {
          done();
        })

        getset.watch(function(err){
          fs.appendFileSync(temp_ini, 'added = yes');
        })

      })

    })

  })

})

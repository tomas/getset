var should = require('should'),
    sinon  = require('sinon'),
    getset = require('./../'),
    fs     = require('fs'),
    join   = require('path').join;

var basedir = join(__dirname, 'fixtures'),
    valid   = join(basedir, 'valid.ini'),
    empty   = join(basedir, 'empty.ini'),
    invalid = join(basedir, 'invalid.ini'),
    missing_file = join(basedir, 'missing.ini'),
    missing_dir = '/not/found',
    call, file;

describe('loading', function(){

  describe('when no callback is passed', function(){

    before(function(){
      call = function(file){
        return getset.load(file);
      }
    })

    it('should read file synchronously', function(){
      var readSync = sinon.spy(fs, 'readFileSync');
      call(valid);
      readSync.withArgs(valid).callCount.should.equal(1);
      readSync.restore();
    })

    it('should return instance of config', function(){
      // should have the functions we know of
      var obj = call(valid)
      obj.get.should.exist;
      obj.set.should.exist;
      obj.update.should.exist;
    })

    describe('and file is null', function(){

      it('should raise error', function(){
        var err = false;
        try { call() } catch(e) { err = e }
        err.should.not.be.false;
      })

    })

    describe('and file does NOT exist', function(){

      it('should not raise an error', function(){
        var err = false;
        try { call(missing_file) } catch(e) { err = e }
        err.should.be.false;
      })

    })

    describe('and file exists', function(){

      describe('and file is empty', function(){

        it('should keep an empty set of values', function(){
          fs.existsSync(empty).should.be.true;
          var obj = call(empty);
          Object.keys(obj._values).should.be.empty;
        })

      })

      describe('and file is not a valid INI', function(){

        it('should keep empty set of values', function(){
          var obj = call(invalid);
          Object.keys(obj._values).should.be.empty;
        })

      })

      describe('and file is a valid INI', function(){

        it('should load values in memory', function(){
          var obj = call(valid);
          obj.path.should.eql(valid);
          Object.keys(obj._values).should.eql(['foo', 'bar', 'boo', 'section-one.hello', 'other_section.this']);
          // obj.get('section-one').should.eql({'hello': 'world'});
        })

      })

    })

  })

  ///////////////////////////////////////////////////////
  // async
  ///////////////////////////////////////////////////////

  describe('when callback is passed', function(){

    before(function(){
      call = function(file, cb){
        cb = cb || function(){ }
        getset.load(file, cb);
      }
    })

    it('should read file asynchronously', function(done){
      var readFile = sinon.spy(fs, 'readFile');

      call(valid, function() {
        readFile.callCount.should.equal(1); 
        readFile.restore();
        done();
      });
    })

    describe('and file is null', function(){

      it('should raise error', function(){
        var err = false;
        try { call(null) } catch(e) { err = e }
        err.should.not.be.false;
      })

    })

    describe('and file does NOT exist', function(){

      it('should callback with error', function(done){
        var err = false;

        call(missing_file, function(e){
          err = e;
          err.should.not.be.false;
          done();
        })
      })

    })

    describe('and file exists', function() {

      describe('and file is empty', function() {

        it('should keep an empty set of values', function(done){
          call(empty, function(err, config) {
            config.path.should.eql(empty);
            Object.keys(config._values).should.be.empty;
            done();
          });
        })

      })

      describe('and file is not a valid INI', function(){

        it('should keep empty set of values', function(done){
          call(invalid, function(err, config) {
            config.path.should.eql(invalid);
            Object.keys(config._values).should.be.empty;
            done();
          });
        })

      })

      describe('and file is a valid INI', function(){

        it('should load values in memory', function(done){
          call(valid, function(err, config) {
            config.path.should.eql(valid);
            Object.keys(config._values).should.eql(['foo', 'bar', 'boo', 'section-one.hello', 'other_section.this']);
            config.get('section-one').should.eql({'hello': 'world'});
            done();
          });
        })

      })

    })

  })

})

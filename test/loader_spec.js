var should = require('should'),
    sinon  = require('sinon'),
    getset = require('./../'),
    fs = require('fs');

var basedir = __dirname + '/fixtures',
    valid = basedir + '/valid.ini',
    empty = basedir + '/empty.ini',
    invalid = basedir + '/invalid.ini',
    missing_file = basedir + '/missing.ini',
    missing_dir = '/not/found',
    call, file;

describe('loading', function(){

  afterEach(function(){
    getset.unload();
  })

  describe('when no callback is passed', function(){

    before(function(){
      call = function(file){
        return getset.load(file);
      }
    })

    it('should raise error when called twice', function(){
      var err = false;
      getset.unload();
      getset.load(valid);
      try { getset.load(valid) } catch(e) { err = e };
      err.should.not.be.false;
    })

    it('should read file synchronously', function(){
      var loadSync = sinon.spy(getset, "loadSync");
      call(valid);
      loadSync.withArgs(valid).calledOnce.should.be.true;
      loadSync.restore();
    })

    it('should return instance of config', function(){
      // should have the functions we know of
      call(valid).loadSync.should.exist;
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
          call(empty);
          Object.keys(getset._values).should.be.empty;
        })

      })

      describe('and file is not a valid INI', function(){

        it('should keep empty set of values', function(){
          call(invalid);
          Object.keys(getset._values).should.be.empty;
        })

      })

      describe('and file is a valid INI', function(){

        it('should load values in memory', function(){
          call(valid);
          getset._file.should.eql(valid);
          Object.keys(getset._values).should.eql(['foo', 'bar', 'boo', 'section-one', 'other_section']);
          getset.get('section-one').should.eql({'hello': 'world'});
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
        // console.log("File: " + file + ", callback: " + cb);
        getset.load(file, cb || function(){ /* hello */ });
      }
    })

    it('should raise error when called twice', function(done){

      var err = false;
      call(valid, function(){
        try { call(valid) } catch(e) { err = e }
        err.should.not.be.false;
        done();
      });
    })

    it('should read file asynchronously', function(done){
      var loadSync = sinon.spy(getset, "loadSync");

      call(valid, function(){
        loadSync.called.should.be.false;
        loadSync.restore();
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

    describe('and file exists', function(){

      describe('and file is empty', function(){

        it('should keep an empty set of values', function(done){
          call(empty, function(err, config){
            config._file.should.eql(empty);
            Object.keys(config._values).should.be.empty;
            done();
          });
        })

      })

      describe('and file is not a valid INI', function(){

        it('should keep empty set of values', function(done){
          call(invalid, function(err, config){
            getset._file.should.eql(invalid);
            Object.keys(getset._values).should.be.empty;
            done();
          });
        })

      })

      describe('and file is a valid INI', function(){

        it('should load values in memory', function(done){
          call(valid, function(err, config){
            getset._file.should.eql(valid);
            Object.keys(getset._values).should.eql(['foo', 'bar', 'boo', 'section-one', 'other_section']);
            getset.get('section-one').should.eql({'hello': 'world'});
            done();
          });
        })

      })

    })

  })

})

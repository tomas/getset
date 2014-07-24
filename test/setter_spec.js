var should = require('should'),
    sinon  = require('sinon'),
    getset = require('./../'),
    join   = require('path').join;

var basedir = join(__dirname, 'fixtures'),
    valid   = join(basedir, 'valid.ini');

describe('setting', function(){

  var config;

  afterEach(function(){
    config.unload();
  })

  describe('when no file is loaded', function() {

    config = getset.load('memory');

    describe('and key exists', function(){

      it('should set value', function(){
        config.set('foo', 'kaboom');
        config.get('foo').should.eql('kaboom');
      })

    })

    describe('and key does not exist', function(){

      it('should set value', function(){
        config.set('aaa', 'whats up');
        config.get('aaa').should.eql('whats up');
      })

    })

  })

  describe('when file is loaded', function(){

    describe('and strict mode is true', function() {

      beforeEach(function(){
        config = getset.load({ path: valid, strict: true });
        config.path.should.eql(valid);
      })

      describe('and key exists', function(){

        it('should set value', function(){
          config.set('foo', 'qweqwe');
          config.get('foo').should.eql('qweqwe');
        })

      })

      describe('and key does not exist', function(){

        it('should NOT set value', function(){
          config.set('something', 'too');
          should.equal(config.get('something'), null);
        })

      })

    })

    describe('and strict mode is false', function() {

      beforeEach(function(){
        config = getset.load({ path: valid, strict: false });
        config.path.should.eql(valid);
      })

      describe('and key exists', function(){

        it('should set value', function(){
          config.set('foo', 'testtest');
          config.get('foo').should.eql('testtest');
        })

      })

      describe('and key does not exist', function(){

        it('should set value', function(){
          config.set('something', 'too');
          should.equal(config.get('something'), 'too');
        })

      })

    })

  })

  describe('types', function() {

    beforeEach(function(){
      config = getset.load({ path: valid, strict: false });
    })

    describe('when overriding an object', function() {

      it('is overriden completely', function() {
        config.set('foo', [1,2,3])
        config.set('foo', ['test'])
        config.get('foo').should.be.an.array;
        config.get('foo').length.should.equal(1);
        config.get('foo')[0].should.equal('test');
      })

    })

  })

});

var should = require('should'),
    sinon  = require('sinon'),
    getset = require('./../'),
    valid  = require('./helpers').fixtures.valid;


describe('setting', function(){

  var config;

  afterEach(function(){
    config.unload();
  })

  describe('and strict mode is true', function() {

    beforeEach(function(){
      config = getset.load({ path: valid, strict: true });
      config.path.should.eql(valid);
    })

    describe('and key doesnt exist', function() {

      it('doesnt set undefined values', function() {
        var res = config.set('foox', undefined);
        res.should.be.false;
        should.not.exist(config.get('foox'))
      })

      it('sets null values', function() {
        var res = config.set('foox', null);
        res.should.not.be.false;
        should.not.exist(config.get('foox'))
      })

      it('sets value', function(){
        config.set('foox', 'qweqwe');
        config.get('foox').should.eql('qweqwe');
      })

    })

    describe('and key exists', function() {

      beforeEach(function() {
        config.set('foo', 'hola');
        config.get('foo').should.eql('hola');
      })

      it('doesnt set undefined values', function() {
        var res = config.set('foo', undefined);
        res.should.be.false;
      })

      it('does not set null value', function() {
        var res = config.set('foo', null);
        res.should.be.false;
        config.get('foo').should.eql('hola');
      })

      describe('and type matches', function() {

        it('sets value', function(){
          config.set('foo', 'qweqwe');
          config.get('foo').should.eql('qweqwe');
        })

      })

      describe('and type doesnt match', function() {

        it('does not set value', function(){
          var res = config.set('foo', [1,2,3]);
          res.should.be.false;
          config.get('foo').should.eql('hola');
        })

      })

    })

  })

  describe('and strict mode is false', function() {

    beforeEach(function(){
      config = getset.load({ path: valid, strict: false });
      config.path.should.eql(valid);
    })

    describe('and key doesnt exist', function() {

      it('doesnt set undefined values', function() {
        var res = config.set('foox', undefined);
        res.should.be.false;
        should.not.exist(config.get('foox'))
      })

      it('sets null values', function() {
        var res = config.set('foox', null);
        res.should.not.be.false;
        should.not.exist(config.get('foox'))
      })

      it('sets value', function(){
        config.set('foo', 'qweqwe');
        config.get('foo').should.eql('qweqwe');
      })

    })

    describe('and key exists', function() {

      beforeEach(function() {
        config.set('foo', 'hola');
        config.get('foo').should.eql('hola');
      })

      it('doesnt set undefined values', function() {
        var res = config.set('foo', undefined);
        res.should.be.false;
        config.get('foo').should.eql('hola');
      })

      it('sets null values', function() {
        var res = config.set('foo', null);
        res.should.not.be.false;
        should.not.exist(config.get('foo'))
      })

      describe('and type matches', function() {

        it('sets value', function(){
          config.set('foo', 'qweqwe');
          config.get('foo').should.eql('qweqwe');
        })

      })

      describe('and type doesnt match', function() {

        it('sets value anyway', function(){
          config.set('foo', [1,2,3]);
          config.get('foo').should.be.an.array;
          config.get('foo').length.should.equal(3);
          config.get('foo')[0].should.equal(1);
        })

      })

    })

  })

  describe('and locked mode is true', function() {

    beforeEach(function(){
      config = getset.load({ path: valid, locked: true });
      config.path.should.eql(valid);
    })

    describe('and key exists', function() {

      it('sets value', function(){
        config.set('foo', 'qweqwe');
        config.get('foo').should.eql('qweqwe');
      })

    })

    describe('and key does not exist', function(){

      it('should NOT set value', function(){
        config.set('something', 'too');
        should.not.exist(config.get('something'));
      })

    })

  })

  describe('and locked mode is false', function() {

    beforeEach(function(){
      config = getset.load({ path: valid, locked: false });
      config.path.should.eql(valid);
    })

    describe('and key exists', function(){

      it('should set value', function(){
        config.set('foo', 'testtest');
        config.get('foo').should.eql('testtest');
      })

    })

    describe('and key does not exist', function(){

      it('sets value anway', function(){
        config.set('something', 123);
        should.equal(config.get('something'), 123);
      })

    })

  })

});

var should = require('should'),
    sinon  = require('sinon'),
    getset = require('./../'),
    valid  = require('./helpers').fixtures.valid;


describe('setting', function(){

  var config;

  afterEach(function(){
    config.unload();
  })

  describe('key', function() {

    beforeEach(function(){
      config = getset.load({ path: valid });
      config.path.should.eql(valid);
    })

    describe('when simple string', function() {

      describe('and undefined value', function() {

        it('throws', function() {
          (function() {
            config.set('foo', undefined);
          }).should.throw();
        })

      })

      describe('and null value', function() {

        it('sets value', function() {
          var res = config.set('foo', 123);
          // should.equal(res, null);
          config.get('foo').should.equal(123);
          config.set('foo', null);
          should.equal(null, config.get('foo'))
        })

      })

      describe('and integer value', function() {

        it('sets value', function() {
          var res = config.set('foo', 1234);
          // res.should.equal(123);
          config.get('foo').should.equal(1234);
        })

      })

      describe('and string value', function() {

        it('sets value', function() {
          var res = config.set('foo', 'hola');
          config.get('foo').should.equal('hola');
        })

      })

      describe('and object value', function() {

        it('sets value', function() {
          var res = config.set('foo', { bar: 'baz' });
          var val = config.get('foo');
          val.should.be.an.Object;
          val.should.have.keys('bar');
          val.bar.should.equal('baz');
        })

      })

    })

    describe('when string with dots', function() {

      describe('and undefined value', function() {

        it('throws', function() {
          (function() {
            config.set('foo.bar', undefined);
          }).should.throw();
        })

      })

      describe('and null value', function() {

        it('sets value', function() {
          var res = config.set('foo.bar', null);
          var val = config.get('foo');
          val.should.be.an.Object;
          val.should.have.keys('bar');
          should.equal(null, val.bar);
        })

      })

      describe('and integer value', function() {

        it('sets value', function() {
          var res = config.set('foo.bar', 123);
          var val = config.get('foo');
          val.should.be.an.Object;
          val.should.have.keys('bar');
          val.bar.should.equal(123);
        })

      })

      describe('and string value', function() {

        it('sets value', function() {
          var res = config.set('foo.bar', 'hola');
          var val = config.get('foo');
          val.should.be.an.Object;
          val.should.have.keys('bar');
          val.bar.should.equal('hola');
        })

      })

      describe('and object value', function() {

        it('sets value', function() {
          var res = config.set('foo.bar', { quux: 12345 });
          var val = config.get('foo');
          val.should.be.an.Object;
          val.should.have.keys('bar');

          val.bar.should.be.an.Object;
          val.bar.should.have.keys('quux');
          val.bar.quux.should.equal(12345)
        })

      })


    })

    describe('when object', function() {

      describe('and undefined value', function() {

        it('set value', function() {
          var res = config.set({ foo: 'bar' }, undefined);
          var val = config.get('foo');
          val.should.equal('bar');
        })

      })

      describe('and null value', function() {

        it('throws', function() {
          (function() {
            res = config.set({ foo: 'bar' }, null);
          }).should.throw();
        })

      })

      describe('and integer value', function() {

        it('throws', function() {
          (function() {
            res = config.set({ foo: 'bar' }, 123);
          }).should.throw();
        })

      })

      describe('and string value', function() {

        it('throws', function() {
          (function() {
            res = config.set({ foo: 'bar' }, 'asd');
          }).should.throw();
        })

      })

      describe('and object value', function() {

        it('throws', function() {
          (function() {
            res = config.set({ foo: 'bar' }, { something: 'else' });
          }).should.throw();
        })

      })

    })


  })

  describe('and strict mode is true', function() {

    beforeEach(function(){
      config = getset.load({ path: valid, strict: true });
      config.path.should.eql(valid);
    })

    describe('and key doesnt exist', function() {

      it('doesnt set undefined values', function() {
        (function() {
          config.set('foox', undefined);
        }).should.throw();

        // should.equal(res, undefined);
        // should.not.exist(config.get('foox'))
      })

      it('sets null values', function() {
        var res = config.set('foox', null);
        res.should.not.be.false;
        should.equal(null, config.get('foox'))
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
        (function() {
          config.set('foo', undefined);
        }).should.throw();
      })

      it('does not set null value', function() {
        var res = config.set('foo', null);
        should.equal(res, undefined);
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
          should.equal(res, undefined);
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
        (function() {
          config.set('foox', undefined);
        }).should.throw();
      })

      it('sets null values', function() {
        var res = config.set('foox', null);
        res.should.not.be.false;
        should.equal(null, config.get('foox'))
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
        (function() {
          config.set('foo', undefined);
        }).should.throw();
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
        should.equal(undefined, config.get('something'))
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

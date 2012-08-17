var should = require('should'),
    sinon  = require('sinon'),
    getset = require('./../');

var basedir = __dirname + '/fixtures',
    valid = basedir + '/valid.ini';

describe('setting', function(){
	
	afterEach(function(){
		getset.unload();
	})

	describe('when no file is loaded', function(){
		
		describe('and key exists', function(){
			
			it('should set value', function(){
				getset.set('foo', 'kaboom');
				getset.get('foo').should.eql('kaboom');
			})
			
		})
		
		describe('and key does not exist', function(){

			it('should set value', function(){
				getset.set('aaa', 'whats up');
				getset.get('aaa').should.eql('whats up');
			})

		})
				
	})

	describe('when file is loaded', function(){
		
		beforeEach(function(){
			getset.load(valid);
			getset._file.should.eql(valid);
		})
		
		describe('and key exists', function(){
			
			it('should set value', function(){
				getset.set('foo', 'testtest');
				getset.get('foo').should.eql('testtest');
			})
			
		})
		
		describe('and key does not exist', function(){

			it('should NOT set value', function(){
				getset.set('something', 'too');
				should.equal(getset.get('something'), null);
			})

			it('should set value if forced', function(){
				getset.set('something', 'too', true);
				getset.get('something').should.eql('too');
			})

		})

	})

});
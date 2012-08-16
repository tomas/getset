var should = require('should'),
    sinon  = require('sinon'),
    getset = require('./../'),
    fs = require('fs'),
    call, file;

// utility function
var createFile = function(content){
	fs.writeFileSync(file, content);
}

describe('loading', function(){
	
	describe('when no callback is passed', function(){
		
		before(function(){
			call = function(file){
				return getset.load(file);
			}
		})
		
		it('should read file synchronously', function(){

			var loadSync = sinon.spy(getset, "loadSync");
			call('/some/file');
			loadSync.withArgs('/some/file').calledOnce.should.be.true;
			loadSync.restore();

		})
		
		it('should return instance of config', function(){
			// should have the functions we know of
			call('/some/file').loadSync.should.exist;
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
				try { call('nonexisting_file') } catch(e) { err = e }
				err.should.be.false;

			})
			
		})

		describe('and file exists', function(){

			file = '/tmp/test.ini';

			describe('and file is empty', function(){
				
				before(function(){
					createFile('')
					fs.existsSync(file).should.be.true;
				})

				it('should keep an empty set of values', function(){
					call(file);
					Object.keys(getset._values).should.be.empty;
				})

			})

			describe('and file is not a valid INI', function(){

				before(function(){
					createFile('<html>\n<head>\n<title>\n</head>\n<body>\n<img />\n</body>\n</html>');
				})

				it('should keep empty set of values', function(){
					call(file);
					Object.keys(getset._values).should.be.empty;
				})

			})

			describe('and file is a valid INI', function(){
				
				before(function(){
					createFile("foo = bar\nbar = baz\n[section]\n\n;comment\njoe = the plumber\n\n")
				})

				it('should load values in memory', function(){
					call(file);
					Object.keys(getset._values).length.should.eql(3);
				})				

			})

		})

	})
	
	///////////////////////////////////////////////////////
	// async
	///////////////////////////////////////////////////////
	
	describe('when callback is passed', function(){
		
		file = '/some/file';
		
		before(function(){
			call = function(file, cb){
				// console.log("File: " + file + ", callback: " + cb);
				getset.load(file, cb || function(){ /* hello */ });
			}
		})
		
		it('should read file asynchronously', function(done){

			var loadSync = sinon.spy(getset, "loadSync");
			call(file, done);
			loadSync.called.should.be.false;
			loadSync.restore();

		})

		describe('and file is null', function(){
			
			it('should raise error', function(done){
				var err = false;
				try { call(null, done) } catch(e) { err = e }
				err.should.not.be.false;
			})
			
		})

		describe('and file does NOT exist', function(){

			it('should not raise an error', function(done){

				var err = false;
				try { call(file, done) } catch(e) { err = e; }
				err.should.be.false;

			})

		})
		
		describe('and file exists', function(){
			
			file = '/tmp/test.ini';

			describe('and file is empty', function(){
				
				before(function(){
					createFile('')
					fs.existsSync(file).should.be.true;
				})

				it('should keep an empty set of values', function(done){
					call(file, done);
					Object.keys(getset._values).should.be.empty;
				})

			})

			describe('and file is not a valid INI', function(){

				before(function(){
					createFile('<html>\n<head>\n<title>\n</head>\n<body>\n<img />\n</body>\n</html>');
				})

				it('should keep empty set of values', function(done){
					call(file, done);
					Object.keys(getset._values).should.be.empty;
				})

			})

			describe('and file is a valid INI', function(){
				
				before(function(){
					createFile("foo = bar\nbar = baz\n[section]\n\n;comment\njoe = the plumber\n\n")
				})

				it('should load values in memory', function(done){
					call(file, done);
					Object.keys(getset._values).length.should.eql(3);
				})				

			})
			
		})
		
	})
	
})
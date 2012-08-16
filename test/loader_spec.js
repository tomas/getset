var should = require('should'),
    sinon  = require('sinon'),
    getset = require('./../'),
    fs = require('fs'),
    call, file;

// utility function
var createFile = function(content, filename){
	filename = filename || file;
	fs.writeFileSync(filename, content);
}

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

		before(function(){
			call = function(file, cb){
				// console.log("File: " + file + ", callback: " + cb);
				getset.load(file, cb || function(){ /* hello */ });
			}
		})

		it('should read file asynchronously', function(done){

			var loadSync = sinon.spy(getset, "loadSync");

			call('/some/file', function(){
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

				call('/some/file', function(e){
					err = e;
					err.should.not.be.false;
					done();
				})

			})

		})

		describe('and file exists', function(){

			file = '/tmp/test.ini';

			describe('and file is empty', function(){

				before(function(){
					createFile('', file + 1)
					fs.existsSync(file + 1).should.be.true;
				})

				it('should keep an empty set of values', function(done){
					call(file + 1, function(err, config){
						config._file.should.eql(file + 1);
						Object.keys(config._values).should.be.empty;
						done();
					});
				})

			})

			describe('and file is not a valid INI', function(){

				before(function(){
					createFile('<html>\n<head>\n<title>\n</head>\n<body>\n<img />\n</body>\n</html>', file + 2);
				})

				it('should keep empty set of values', function(done){
					call(file + 2, function(err, config){
						getset._file.should.eql(file + 2);
						Object.keys(getset._values).should.be.empty;
						done();
					});
				})

			})

			describe('and file is a valid INI', function(){

				before(function(){
					createFile("foo = bar\nbar = baz\n[section]\n\n;comment\njoe = the plumber\n\n", file + 3)
				})

				it('should load values in memory', function(done){
					call(file + 3, function(err, config){
						getset._file.should.eql(file + 3);
						Object.keys(getset._values).should.eql(['foo', 'bar', 'section']);
						Object.keys(getset._values['section']).should.eql(['joe']);
						done();
					});
				})

			})

		})

	})

})

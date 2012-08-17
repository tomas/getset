var should = require('should'),
    sinon  = require('sinon'),
    getset = require('./../'),
    fs = require('fs');

var basedir = __dirname + '/fixtures',
    valid = basedir + '/valid.ini',
    empty = basedir + '/empty.ini',
    invalid = basedir + '/invalid.ini',
    missing_file = basedir + '/missing.ini',
    commented = basedir + '/commented.ini',
    modified = basedir + '/modified.ini',
    modified_with_comments = basedir + '/modified_with_comments.ini',
    call, file, previous_values, previous_comments;

var valid_content = fs.readFileSync(valid);
var commented_content = fs.readFileSync(commented);

describe('syncing', function(){

	afterEach(function(){
		getset.unload();

  	// once we're done, reset file contents back to normal
	  fs.writeFile(valid, valid_content);
	  fs.writeFile(commented, commented_content);
	})
	
	// once we're done, reset file contents back to normal
	after(function(){
	  // fs.writeFile(valid, valid_content);
	  // fs.writeFile(commented, commented_content);
	})
	
	describe('when no file is loaded', function(){
	  
	  it('should throw exception', function(){
	    should.equal(getset._file, null);
	    should.throws(getset.sync, "No file set")    
	  })
	  
	})
	
	describe('when file is loaded', function(){
	  
	  beforeEach(function(){
	    getset.load(valid);
      previous_values = getset._values; 
      previous_comments = getset._comments;
	  })
	  
	  describe('and sync is called with a nonexisting file', function(){
	    
	    it('should callback with an error', function(done){
	      var err = false;
	      getset.sync(missing_file, function(e){
	        err = e;
	        err.should.not.be.false;
	        done();
	      })
	    })

	    it('should not call save', function(done){
        var save = sinon.spy(getset, "save");
	      getset.sync(invalid, function(e){
          save.callCount.should.eql(0);
          save.restore();
	        done();
	      })
	    })

	  })

	  describe('and sync is called with an invalid file', function(){

	    it('should callback with an error', function(done){
	      getset.sync(invalid, function(e){
	        e.message.should.eql("No values found.");
	        done();
	      })
	    })

	    it('should not change values or comments', function(done){
        getset.sync(invalid, function(err){
          getset._values.should.eql(previous_values);
          getset._comments.should.eql(previous_comments);
          done();
        })
	    })

	    it('should not call save', function(done){
        var save = sinon.spy(getset, "save");
	      getset.sync(invalid, function(e){
          save.callCount.should.eql(0);
          save.restore();
	        done();
	      })
	    })

	  })
	  
	  describe('and new file is valid', function(){

	    it('should not throw', function(){
	      getset._file.should.eql(valid);
	      var err = false;
	      // try { getset.sync(valid) } catch(e) { err = e }
        err.should.be.false;
	    })

	    it('should not callback with error', function(done){
	      getset.sync(modified, function(e){
	        should.equal(e, null)
	        done();
	      })
	    })

	    it('should call save()', function(done){
        var save = sinon.spy(getset, "save");
	      getset.sync(modified, function(e){
          save.callCount.should.eql(1);
          save.restore();
	        done();
	      })
	    })

	    it('should add new keys to original', function(done){
	      getset._values.should.eql(previous_values);
	      getset.sync(modified, function(err){
  	      Object.keys(getset._values).should.eql([ 'foo', 'bar', 'section-one', 'renamed_section', 'new_section' ]);
  	      done();
	      });
	    })

	    it('should not update values for existing keys', function(done){

	      getset.get('bar').should.eql(2);
	      getset.sync(modified, function(err){
  	      getset.get('bar').should.eql(2);
  	      done();
	      });

	    })

	    it('should remove keys that were removed', function(done){

	      getset.get('foo').should.eql('test');
	      getset.sync(commented, function(err){
	        should.equal(getset.get('foo'), null);
  	      done();
	      });

	    })

	    it('should add new comments to original', function(done){

        should.equal(getset._comments['bar'], null);
//	      Object.keys(getset._comments).length.should.eql(0);

	      getset.sync(commented, function(err){
          getset._comments['bar'].should.eql('; bar is very important for you\n');
  	      // Object.keys(getset._comments).length.should.eql(2);
  	      done();
	      });

	    })
	    
	    it('should update existing comments in original, if modified', function(done){

        getset.unload().load(commented);
	      var bar_comment = getset._comments['bar'];
	
	      getset.sync(modified_with_comments, function(err){
          getset._comments['bar'].should.not.eql(bar_comment);
          // getset._comments['bar'].should.eql('; bar is very, but VERY important for you\n');
          getset.unload();
  	      done();
	      });

	    })

	    it('should not remove comments from original, if not found', function(done){

        getset.unload().load(commented);
	      Object.keys(getset._comments).length.should.eql(3);

	      getset.sync(valid, function(err){
  	      Object.keys(getset._comments).length.should.eql(3);
  	      done();
	      });

	    })

    })
	  
	})

});
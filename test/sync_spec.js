var should = require('should'),
    sinon  = require('sinon'),
    getset = require('./../'),
    fs     = require('fs'),
    join   = require('path').join;

var basedir   = join(__dirname, 'fixtures'),
    valid     = join(basedir, 'valid.ini'),
    empty     = join(basedir, 'empty.ini'),
    invalid   = join(basedir, 'invalid.ini'),
    missing_file = join(basedir, 'missing.ini'),
    commented = join(basedir, 'commented.ini'),
    modified  = join(basedir, 'modified.ini'),
    modified_with_comments = join(basedir, 'modified_with_comments.ini'),
    call, file, previous_values, previous_meta;

var valid_content = fs.readFileSync(valid);
var commented_content = fs.readFileSync(commented);

describe('syncing', function(){

  var config;

  afterEach(function(){
    config.unload();

    // once we're done, reset file contents back to normal
    fs.writeFileSync(valid, valid_content);
    fs.writeFileSync(commented, commented_content);
  })

  // once we're done, reset file contents back to normal
  after(function(){
    // fs.writeFile(valid, valid_content);
    // fs.writeFile(commented, commented_content);
  })

  describe('when file is loaded', function(){

    beforeEach(function(){
      config = getset.load(valid);
      previous_values = config._values;
      previous_meta = config._meta;
    })

    describe('and sync is called with a nonexisting file', function(){

      it('should callback with an error', function(done){
        var err = false;
        config.sync(missing_file, function(e){
          err = e;
          err.should.not.be.false;
          done();
        })
      })

      it('should not call save', function(done){
        var save = sinon.spy(config, "save");
        config.sync(invalid, function(e){
          save.callCount.should.eql(0);
          save.restore();
          done();
        })
      })

    })

    describe('and sync is called with an invalid file', function(){

      it('should callback with an error', function(done){
        config.sync(invalid, function(e){
          e.message.should.eql('No values found.');
          done();
        })
      })

      it('should not change values or comments', function(done){
        config.sync(invalid, function(err) {
          config._values.should.eql(previous_values);
          config._meta.should.eql(previous_meta);
          done();
        })
      })

      it('should not call save', function(done){
        var save = sinon.spy(config, "save");
        config.sync(invalid, function(e){
          save.callCount.should.eql(0);
          save.restore();
          done();
        })
      })

    })

    describe('and new file is valid', function(){

      it('should not throw', function(){
        config.path.should.eql(valid);
        var err = false;
        // try { getset.sync(valid) } catch(e) { err = e }
        err.should.be.false;
      })

      it('should not callback with error', function(done){
        config.sync(modified, function(e){
          should.equal(e, null)
          done();
        })
      })

      it('should call save()', function(done){
        var save = sinon.spy(config, "save");
        config.sync(modified, function(e){
          save.callCount.should.eql(1);
          save.restore();
          done();
        })
      })

      it('should add new comments to original', function(done){

        Object.keys(config._meta.comments).length.should.eql(2);

        config.sync(commented, function(err) {
          config._meta.comments.bar.should.eql('; bar is very important for you\n');
          Object.keys(config._meta.comments).length.should.eql(3);
          done();
        });

      })

      it('should update existing comments in original, if modified', function(done){

        config = getset.load(commented);
        var bar_comment = config._meta.comments.bar;

        config.sync(modified_with_comments, function(err){
          config._meta.comments.bar.should.not.eql(bar_comment);
          config._meta.comments.bar.should.eql('; bar is very, but VERY important for you\n');
          done();
        });

      })

      it('should not remove comments from original, if not found', function(done){

        config = getset.load(commented);
        Object.keys(config._meta).length.should.eql(1);

        config.sync(valid, function(err){
          Object.keys(config._meta).length.should.eql(1);
          done();
        });

      })

      describe('in non replacing mode', function(){

        it('should add new keys to original', function(done){
          config._values.should.eql(previous_values);
          config.sync(modified, function(err){
            Object.keys(config._values).should.eql([ 'foo', 'bar', 'boo', 'section-one', 'renamed_section', 'new_section' ]);
            done();
          });
        })

        it('should not update values for existing keys', function(done){

          config.get('bar').should.eql(2);
          config.get('boo').should.eql('wazzup');
          config.sync(modified, function(err){
            config.get('bar').should.eql(2);
            config.get('boo').should.eql('wazzup');
            done();
          });

        })

        it('should remove keys that were removed', function(done){

          config.get('foo').should.eql('test');
          config.sync(commented, function(err){
            should.equal(config.get('foo'), null);
            done();
          });

        })

      })

      describe('in "nonempty" replacing mode', function(){

        it('should add new keys to original', function(done){
          config._values.should.eql(previous_values);
          config.sync(modified, 'nonempty', function(err){
            Object.keys(config._values).should.eql([ 'foo', 'bar', 'boo', 'section-one', 'renamed_section', 'new_section' ]);
            done();
          });
        })

        it('should update values for existing keys, if new one is not empty', function(done){

          config.get('bar').should.eql(2);
          config.get('boo').should.eql('wazzup');
          config.sync(modified, 'nonempty', function(err){
            config.get('bar').should.eql(223);
            config.get('boo').should.eql('wazzup');
            done();
          });

        })

        it('should remove keys that were removed', function(done){

          config.get('foo').should.eql('test');
          config.sync(commented, 'nonempty', function(err){
            should.equal(config.get('foo'), null);
            done();
          });

        })

      })

      describe('in replacing mode', function(){

        it('should add new keys to original', function(done){
          config._values.should.eql(previous_values);
          config.sync(modified, true, function(err){
            Object.keys(config._values).should.eql([ 'foo', 'bar', 'boo', 'section-one', 'renamed_section', 'new_section' ]);
            done();
          });
        })

        it('should update values for existing keys', function(done){

          config.get('bar').should.eql(2);
          config.get('boo').should.eql('wazzup');
          config.sync(modified, true, function(err){
            config.get('bar').should.eql(223);
            config._values['boo'].should.eql('');
            done();
          });

        })

        it('should remove keys that were removed', function(done){

          config.get('foo').should.eql('test');
          config.sync(commented, true, function(err){
            should.equal(config.get('foo'), null);
            done();
          });

        })

      })

    })

  })

});

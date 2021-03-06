var nt     = require('..')
  , vows   = require('vows')
  , assert = require('assert')
  , path   = require('path')
  , fs     = require('fs')
  , url    = require('url')
  , nock   = require('nock')
  ;


var file1 = path.join(__dirname, 'torrents', 'ubuntu.torrent')
  , file2 = path.join(__dirname,'torrents', 'click.jpg.torrent')
  , file3 = path.join(__dirname, 'torrents', 'virtualbox.torrent')
  , remotefile3 = 'http://www.mininova.org/get/2886852'
  , file4 = path.join(__dirname, 'torrents', 'chipcheezum.torrent')
  ;


// mock request to remote file
var parsedUrl = url.parse(remotefile3);
nock('http://' + parsedUrl.host)
  .get(parsedUrl.pathname)
  .replyWithFile(200, file3);


vows.describe('Read')
  .addBatch({
    'Read raw bencoded torrent data': {
      topic: function() {
        nt.readRaw(fs.readFileSync(file1), this.callback);
      },

      'Info hash matches': function(result) {
        assert.isObject(result.metadata);
        assert.equal(result.infoHash(),
          'a38d02c287893842a32825aa866e00828a318f07');
      },
      'Announce URL is correct': function(result) {
        assert.isObject(result.metadata);
        assert.include(result.metadata, 'announce');
        assert.equal(result.metadata.announce, 'udp://tracker.publicbt.com:80');
      },
      'Single file mode': function(result) {
        assert.isObject(result.metadata);
        assert.include(result.metadata, 'info');
        assert.include(result.metadata.info, 'name');
        assert.equal(result.metadata.info.name,
                     'ubuntu-11.04-desktop-i386.iso');
        assert.isUndefined(result.metadata.info.files);
        assert.include(result.metadata.info, 'length');
        assert.equal(result.metadata.info.length, 718583808);
      },
      '512 KB piece length': function(result) {
        assert.isObject(result.metadata);
        assert.include(result.metadata, 'info');
        assert.include(result.metadata.info, 'piece length');
        assert.equal(result.metadata.info['piece length'], 524288);
      }
    },


    // this torrent was created with mktorrent
    'Read a local file': {
      'made by mktorrent': {
        topic: function() {
          nt.read(file2, this.callback);
        },

        'Info hash matches': function(result) {
          assert.isObject(result.metadata);
          assert.equal(result.infoHash(),
              '2fff646b166f37f4fd131778123b25a01639e0b3');
        },
        'Announce URL is correct': function(result) {
          assert.isObject(result.metadata);
          assert.include(result.metadata, 'announce');
          assert.equal(result.metadata.announce, 'http://hello.2u');
        },
        'Single file mode': function(result) {
          assert.isObject(result.metadata);
          assert.include(result.metadata, 'info');
          assert.include(result.metadata.info, 'name');
          assert.equal(result.metadata.info.name, 'click.jpg');
          assert.isUndefined(result.metadata.info.files);
          assert.include(result.metadata.info, 'length');
          assert.equal(result.metadata.info.length, 87582);
        },
        '256 KB piece length': function(result) {
          assert.isObject(result.metadata);
          assert.include(result.metadata, 'info');
          assert.include(result.metadata.info, 'piece length');
          assert.equal(result.metadata.info['piece length'], 262144);
        },
        'Private torrent': function(result) {
          assert.isObject(result.metadata);
          assert.include(result.metadata, 'info');
          assert.include(result.metadata.info, 'private');
          assert.equal(result.metadata.info.private, 1);
        }
      },

      'that holds a big video file': {
        topic: function() {
          nt.read(file4, this.callback);
        },

        'Info hash matches': function(result) {
          assert.isObject(result.metadata);
          assert.equal(result.infoHash(),
              'a51cbb0e3b4d6430ca0d1da70c1c7b0bb94304f4');
        }
      }
    },

    'Read a stream': {
      'that holds a big video file': {
        topic: function() {
          nt.read(fs.createReadStream(file4), this.callback);
        },

        'Info hash matches': function(result) {
          assert.isObject(result.metadata);
          assert.equal(result.infoHash(),
              'a51cbb0e3b4d6430ca0d1da70c1c7b0bb94304f4');
        }
      }
    },


    'Download a torrent and read it': {
      topic: function() {
        nt.read(remotefile3, this.callback);
      },

      'Info hash matches': function(result) {
        assert.isObject(result.metadata);
        assert.equal(result.infoHash(),
            '6a7eb42ab3b9781eba2d9ff3545d9758f27ec239');
      },
      'Announce URL is correct': function(result) {
        assert.isObject(result.metadata);
        assert.include(result.metadata, 'announce');
        assert.equal(result.metadata.announce, 'http://tracker.mininova.org/announce');
      },
      'Multi file mode': function(result) {
        assert.isObject(result.metadata);
        assert.include(result.metadata, 'info');
        assert.include(result.metadata.info, 'name');
        assert.equal(result.metadata.info.name,
                     'VirtualBox - CentOS 4.8 i386 Desktop Virtual Disk Image' +
                     ' - [VirtualBoxImages.com]');
        assert.include(result.metadata.info, 'files');
        assert.deepEqual(result.metadata.info.files, [
          {
            length: 291,
            path: [ 'Distributed by Mininova.txt' ]
          },
          {
            length: 917356457,
            path: [ 'VirtualBox_-_CentOS-4.8-Desktop-i386_VDI-[VirtualBoxImages.com].rar' ]
          }
        ]);
      },
      '1 MB piece length': function(result) {
        assert.isObject(result.metadata);
        assert.include(result.metadata, 'info');
        assert.include(result.metadata.info, 'piece length');
        assert.equal(result.metadata.info['piece length'], 1048576);
      }
    }
  })
  .export(module);

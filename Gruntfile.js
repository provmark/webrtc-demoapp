module.exports = function(grunt) {
  var envTarget = grunt.option('envtarget') || 'prod';
  grunt.initConfig({
    config: {
      local: {
        options: {
          variables: {
            csjs: 'http://192.168.99.100:3000/static/callstats.js',
            appid: '766154323',
            appsecret: 'JusbctbKCw3l:HZP+y1NrNEeesjXB4WvEh504t6kFlR8dAYPfnYjgvh0='
          }
        }
      },
      prod: {
        options: {
          variables: {
            csjs: 'https://api.callstats.io/static/callstats.min.js',
            appid: '425973066',
            appsecret: 'MBKqPIW6bPZM:Veq6vZD4xgTo7xLPqVaaaPFCBz6e9rlnF0r2FDIzzQU='
          }
        }
      }
    },
    replace: {
      indexjs: {
        options: {
          patterns: [
            {
              match: 'APPID',
              replacement: '<%= grunt.config.get("appid") %>'
            },
            {
              match: 'APPSECRET',
              replacement: '<%= grunt.config.get("appsecret") %>'
            }
          ]
        },
        src: 'app/index.js',
        dest: 'build/index.js'
      },
      indexhtml: {
        options: {
          patterns: [
            {
              match: 'CSJS',
              replacement: '<%= grunt.config.get("csjs") %>'
            }
          ]
        },
        src: 'app/index.html',
        dest: 'build/index.html'
      },
      indexcss: {
        options: {
          patterns: []
        },
        src: 'app/index.css',
        dest: 'build/index.css'
      }
    },
    eslint: {
      options: {
        configFile: '.eslintrc',
      },
      target: ['library/*.js', 'app/*.js']
    },
    browserify: {
      standalone: {
        src: ['library/main.js'],
        dest: 'build/csio-webrtc-app.js'
      },
      options: {
        transform: [['babelify', {'presets': ['es2015']}]],
        browserifyOptions: {
          standalone: 'CsioWebrtcApp'
        }
      }
    },
    uglify: {
      options: {
        banner: '/*! Grunt Uglify <%= grunt.template.today("yyyy-mm-dd") %> */ '
      },
      build: {
        files: {
          'build/csio-webrtc-app.min.js': ['build/csio-webrtc-app.js']
        }
      }
    },
    watch: {
      files: ['<%= eslint.target %>'],
      tasks: ['eslint']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-config');
  grunt.loadNpmTasks('grunt-replace');

  grunt.registerTask('linter', ['eslint']);
  grunt.registerTask('build',
    ['config:'+envTarget,
      'replace',
      'browserify',
      'uglify']);
};

module.exports = function(grunt) {
  grunt.initConfig({
    eslint: {
      options: {
        configFile: '.eslintrc',
      },
      target: ['library/*.js', 'app/*.js']
    },
    browserify: {
      standalone: {
        src: ['library/main.js'],
        dest: 'app/library.js'
      },
      options: {
        require: [],
        browserifyOptions: {
          standalone: 'Library'
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

  grunt.registerTask('linter', ['eslint']);
  grunt.registerTask('build', ['browserify']);
};

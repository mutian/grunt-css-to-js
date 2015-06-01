/*
 * CSS to JS for Grunt
 * git://github.com/mutian/grunt-css-to-js.git
 *
 * Copyright (c) 2015 Mutian Wang
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js',
        '<%= nodeunit.tests %>'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    // Before generating any new files, remove any previously-created files.
    clean: {
      tests: ['tmp']
    },

    // Configuration to be run (and then tested).
    css_to_js: {
      options: {
        baseUrl: 'http://cdn.domain.com/abc/',
        baseDir: 'test/fixtures/',
        regFn: 'namespace.jcssReg'
      },
      images: {
        files: {
          'tmp/imgTest.js': ['test/fixtures/css/imgTest.css']
        }
      },
      imports: {
        files: {
          'tmp/pages/imports.js': ['test/fixtures/css/pages/imports.css']
        }
      },
      notexist: {
        files: {
          'tmp/notexist.js': ['test/fixtures/css/notexist.css']
        }
      },
      directory: {
        files: [{
          cwd: 'test/fixtures/css/module',
          src: ['**/*.css'],
          dest: 'tmp/module'
        }]
      }
    },

    // Unit tests.
    nodeunit: {
      tests: ['test/*_test.js']
    }

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test', ['clean', 'css_to_js', 'nodeunit']);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

};

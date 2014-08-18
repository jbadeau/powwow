module.exports = function(grunt) {

	require('load-grunt-tasks')(grunt);

	grunt.initConfig({

		'bower-install-simple' : {
			options : {
				color : true,
				directory : 'bower_components'
			},
			dev : {
				options : {
					production : false
				}
			},
			prod : {
				options : {
					production : true
				}
			}
		},

		'jshint' : {
			files : [ 'src/**/*.js', 'test/**/*.js' ]
		},

		intern : {
			dev : {
				options : {
					runType : 'runner',
					config : 'test/intern',
					reporters : [ 'console', 'lcov' ],
					suites : [ 'unit/all' ]
				}
			},
			prod : {
				options : {
					runType : 'runner',
					config : 'test/intern',
					reporters : [ 'console', 'lcov' ],
					suites : [ 'unit/all' ]
				}
			}
		}

	});

	grunt.registerTask('default', [ 'init', 'test', 'build' ]);
	grunt.registerTask('init', [ 'bower-install-simple' ]);
	grunt.registerTask('test', [ 'intern:dev' ]);
	grunt.registerTask('build', [ 'jshint' ]);

};
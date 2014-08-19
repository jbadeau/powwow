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

		'karma' : {
			dev : {
				configFile : 'test/karma.config.js'
			},
			prod : {
				configFile : 'test/karma.config.ci.js'
			}
		}

	});

	grunt.loadNpmTasks('intern')

	grunt.registerTask('default', [ 'init', 'test', 'build' ]);
	grunt.registerTask('init', [ 'bower-install-simple' ]);
	grunt.registerTask('test', [ 'karma:dev' ]);
	grunt.registerTask('build', [ 'jshint' ]);

};
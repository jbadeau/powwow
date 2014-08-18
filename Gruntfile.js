module.exports = function(grunt) {

	require('load-grunt-tasks')(grunt);

	grunt.initConfig({
		'remove' : {
			options : {
				trace : true
			},
			fileList : [ 'src/main/webapp/theme/css/theme.css', 'src/main/webapp/theme/css/theme-responsive.css', 'src/main/webapp/theme/js/theme.js', 'src/main/webapp/main.min.j' ],
			dirList : [ 'src/main/webapp/lib' ]
		},

		'bower-install-simple' : {
			options : {
				color : true,
				directory : 'src/main/webapp/lib'
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
			files : [ 'Gruntfile.js', 'src/main/javascript/*.js',
			          'src/test/javascript/*.js' ]
		},

		'less' : {
			dev : {
				files : {
					'src/main/webapp/theme/css/theme.css' : 'src/main/webapp/theme/less/theme.less',
					'src/main/webapp/theme/css/theme-responsive.css' : 'src/main/webapp/theme/less/theme-responsive.less'
				}
			},
			prod : {
				options : {
					compress : true,
					yuicompress : true,
					optimization : 2
				},
				files : {
					'src/main/webapp/theme/css/theme.css' : 'src/main/webapp/theme/css/theme.less',
					'src/main/webapp/theme/css/theme-responsive.css' : 'src/main/theme/theme/css/theme-responsive.less'
				}
			}
		},

		concat: {
			options: {
				separator: ';',
			},
			prod: {
				src: [
				      'src/main/webapp/lib/bootstrap/js/bootstrap-affix.js',
				      'src/main/webapp/lib/bootstrap/js/bootstrap-alert.js',
				      'src/main/webapp/lib/bootstrap/js/bootstrap-button.js',
				      'src/main/webapp/lib/bootstrap/js/bootstrap-carousel.js',
				      'src/main/webapp/lib/bootstrap/js/bootstrap-collapse.js',
				      'src/main/webapp/lib/bootstrap/js/bootstrap-dropdown.js',
				      'src/main/webapp/lib/bootstrap/js/bootstrap-modal.js',
				      'src/main/webapp/lib/bootstrap/js/bootstrap-tooltip.js',
				      'src/main/webapp/lib/bootstrap/js/bootstrap-popover.js',
				      'src/main/webapp/lib/bootstrap/js/bootstrap-scrollspy.js',
				      'src/main/webapp/lib/bootstrap/js/bootstrap-tab.js',
				      'src/main/webapp/lib/bootstrap/js/bootstrap-transition.js',
				      'src/main/webapp/lib/bootstrap/js/bootstrap-typeahead.js',
				      ],
				      dest: 'src/main/webapp/theme/js/theme.js',
			}
		},

		'requirejs' : {
			main : {
				options : {
					baseUrl: 'src/main/javascript/application',
					paths : {
						'respond' : '../../webapp/lib/respond/dest/respond.src',
						'jquery' : '../../webapp/lib/jquery/jquery',
						'theme' : '../../webapp/theme/js/theme',
						'angular' : '../../webapp/lib/angular/angular',
						'angular-mocks' : '../../webapp/lib/angular-mocks/angular-mocks',
						'angular-ui-router' : '../../webapp/lib/angular-ui-router/release/angular-ui-router',
						'angular-ui-bootstrap': '../../webapp/lib/angular-bootstrap/ui-bootstrap-tpls.min',
						'restangular' : '../../webapp/lib/restangular/dist/restangular',
						'lodash' : '../../webapp/lib/lodash/dist/lodash.underscore',
						'breeze' : '../../webapp/lib/breezejs/build/breeze.debug',
						'breeze.angular' : '../../webapp/lib/breezejs.labs/breeze.angular',
						// plugins
						'text' : '../../webapp/lib/requirejs-text/text',
						'json' : '../../webapp/lib/requirejs-plugins/src/json',
						'base' : '../../webapp/lib/requirejs-angular-loader/src/base',
						'template' : '../../webapp/lib/requirejs-angular-loader/src/template',
						'controller' : '../../webapp/lib/requirejs-angular-loader/src/controller',
						'service' : '../../webapp/lib/requirejs-angular-loader/src/service',
						'module' : '../../webapp/lib/requirejs-angular-loader/src/module',
						'config' : '../../webapp/lib/requirejs-angular-loader/src/config',
						'runs' : '../../webapp/lib/requirejs-angular-loader/src/runs',
						'directive' : '../../webapp/lib/requirejs-angular-loader/src/directive',
						'filter' : '../../webapp/lib/requirejs-angular-loader/src/filter'
					},
					logLevel: 2, //WARNING
					out: 'src/main/webapp/main.min.js',
					// optimize: 'none',
					optimize: 'none',
					uglify2: {
						compress: {
							evaluate: true,
							drop_debugger: true,
							dead_code: true
						}
					},
					// generateSourceMaps: true, //<-uncomment this line to enable source mapping
					preserveLicenseComments: false,
					mainConfigFile: 'src/main/webapp/main.js',
					name: '../../webapp/main'
				}
			}
		},

		karma: {
            unit: {
                configFile: 'src/test/config/karma.config.js'
            }
        }
	});

	grunt.registerTask('init', [ 'remove', 'bower-install-simple' ]);

	grunt.registerTask('test', [ 'karma' ]);

	grunt.registerTask('build', [ 'jshint', 'less', 'concat', 'requirejs:main' ]);

	grunt.registerTask('default', [ 'init', 'test', 'build' ]);

};
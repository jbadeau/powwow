var tests = [];
for (var file in window.__karma__.files) {
    if (/Spec\.js$/.test(file)) {
    	tests.push(file.replace(/^\/base\//, 'http://localhost:9876/base/'))
    }
}

requirejs.config({
	urlArgs: "bust=" + (new Date()).getTime(),

	client: {
  	  requireJsShowNoTimestampsError: true
  	},

	baseUrl : 'http://localhost:9876/base/src',

	paths : {
		'sprintf' : '../bower_components/sprintf/src/sprintf',
	},

	packages : [
        { name: 'dejavu', location: '../bower_components/dejavu/dist/amd/strict', main: 'main' },
        { name: 'mout', location: '../bower_components/mout/src', main: 'index' },
        { name: 'when', location: '../bower_components/when', main: 'when' },
        { name: 'msgs', location: '../bower_components/msgs', main: 'msgs' }
    ],

    // ask Require.js to load these files (all our tests)
    deps: tests,

    // start test run, once Require.js is done
    callback: window.__karma__.start
});

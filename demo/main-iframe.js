requirejs.config({

	baseUrl: '.',

	packages : [
		{ name: 'powwow', location: '../src', main: 'powwow' }
	]

});

require([ 'app-iframe' ], success, fail);

function success() {
	console.log('the application successfully loaded');
}

function fail(e) {
	console.error('the application failed to load', e);
}
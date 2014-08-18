define([ 'intern!bdd', 'intern/chai!expect' ], function(bdd, expect) {
	with (bdd) {

		describe('powwow', function() {

			before(function() {
				request = new Request();
			});

			beforeEach(function() {
				request.reset();
			});

			after(function() {
			});

			it('should have a version', function() {
				expect(result.url).to.equal(url);
			});

		});
	}
});
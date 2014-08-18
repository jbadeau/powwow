(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([ 'powwow' ], factory);
	}
	else {
		root.powwowSpec = factory(root.powwow);
	}
}(this, function(powwow) {

	describe("powwow", function() {

		it("should contain a version property", function() {
			expect(powwow.VERSION).toBe("0.1.0");
		});

	});

}));
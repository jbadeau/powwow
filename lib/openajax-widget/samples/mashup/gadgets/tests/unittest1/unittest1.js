/*

        Copyright 2006-2008 OpenAjax Alliance

        Licensed under the Apache License, Version 2.0 (the "License"); 
        you may not use this file except in compliance with the License. 
        You may obtain a copy of the License at
        
                http://www.apache.org/licenses/LICENSE-2.0

        Unless required by applicable law or agreed to in writing, software 
        distributed under the License is distributed on an "AS IS" BASIS, 
        WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. 
        See the License for the specific language governing permissions and 
        limitations under the License.
*/

var unittest1 = function() {};

unittest1.prototype.assertTrue = function( expr, hint )
{
    if ( ! eval( expr ) ) {
        this._assertFailure( "assert('" + expr + "') failed", hint );
    }
}

unittest1.prototype.assertEqual = function( expected, actual, hint )
{
    this._assertEqual( expected, actual, hint );
}

unittest1.prototype._assertFailure = function( msg, hint )
{
    if ( hint ) {
        msg += " with hint: \n\t\t" + hint + "\n";
    }
    throw new Error( msg );
}

unittest1.prototype._assertEqual = function( expected, actual, hint )
{
	if((expected === undefined)&&(actual === undefined)){ 
		return true;
	}
	if((expected === actual)||(expected == actual)){ 
		return true;
	}
	if(	this._isArray(expected) && this._isArray(actual) ) {
        if( this._arrayEq(expected, actual) ){
    		return true;
        }
	} else if( ((typeof expected == "object")&&((typeof actual == "object")))&&
		(this._objPropEq(expected, actual)) ){
		return true;
	}
	this._assertFailure("assertEqual() failed:\n\texpected\n\t\t"+expected+"\n\tbut got\n\t\t"+actual+"\n\n", hint);
}

unittest1.prototype._arrayEq = function(expected, actual){
	if(expected.length != actual.length){ return false; }
	for(var x=0; x<expected.length; x++){
		if(!this._assertEqual(expected[x], actual[x])){ return false; }
	}
	return true;
}

unittest1.prototype._objPropEq = function(expected, actual){
	// Degenerate case: if they are both null, then their "properties" are equal.
	if(expected === null && actual === null){
		return true;
	}
	// If only one is null, they aren't equal.
	if(expected === null || actual === null){
		return false;
	}
	if(expected instanceof Date){
		return actual instanceof Date && expected.getTime()==actual.getTime();
	}
	var x;
	// Make sure ALL THE SAME properties are in both objects!
	for(x in actual){ // Lets check "actual" here, expected is checked below.
		if(expected[x] === undefined){
			return false;
		}
	};

	for(x in expected){
		if(!this._assertEqual(expected[x], actual[x])){
			return false;
		}
	}
	return true;
}

unittest1.prototype._isArray = function(it){
	return (it && it instanceof Array || typeof it == "array");
}

unittest1.prototype.runTests = function()
{
    var errors = [];
    
    for ( var i = 0; i < unittest1.tests.length; i++ ) {
        try {
            this[ unittest1.tests[i] ].call( this );
        } catch ( e ) {
            errors.push([ unittest1.tests[i], e.message ]);
        }
    }

    var msg;
    if ( errors.length > 0 ) {
        msg = "<h3>Tests failed</h3>";
        msg += "<ul>";
        for ( var j = 0; j < errors.length; j++ ) {
            msg += "<li>" + errors[j][0] + ": " + errors[j][1] + "</li>";
        }
        msg += "</ul>";
    } else {
        msg = "<h3>Tests succeeded</h3>";
    }
    document.getElementById( "unittest1_content" ).innerHTML = msg;
}

unittest1.tests = [
    'test1',
    'test2'
];

////////////////////////////////////////////////////////////////////////////////

// test 1: <javascript src=...>
unittest1.prototype.test1 = function()
{
    this.assertTrue( typeof before1 !== 'undefined' && before1, "before1" );
    this.assertTrue( typeof after1 !== 'undefined' && after1, "after1" );
    this.assertTrue( typeof atend1 !== 'undefined' && atend1, "atend1" );
}

////////////////////////////////////////////////////////////////////////////////

// test 2: javascript eval order
unittest1.prototype.test2 = function()
{
    this.assertEqual( ["req", "before", "content", "after", "atEnd(src)", "atEnd(inline)"], test2 );
}

test2.push( "req" );

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

PropertyDefaultTester = function() {};
    
PropertyDefaultTester.prototype.assert = function( test, expr )
{
    if ( test === false ) {
        throw new Error( "Assertion failed: " + expr ); 
    }
};

PropertyDefaultTester.prototype.runTests = function()
{
    var bool1 = this.OpenAjax.getPropertyValue("bool1");
    this.assert( typeof bool1 == "boolean" && bool1 == true, "bool1" );
    var bool2 = this.OpenAjax.getPropertyValue("bool2");
    this.assert( typeof bool2 == "boolean" && bool2 == false, "bool2" );
    var bool3 = this.OpenAjax.getPropertyValue("bool3");
    this.assert( typeof bool3 == "boolean" && bool3 == true, "bool3" );
    var bool4 = this.OpenAjax.getPropertyValue("bool4");
    this.assert( typeof bool4 == "boolean" && bool4 == false, "bool4" );
    
    var num1 = this.OpenAjax.getPropertyValue("num1");
    this.assert( typeof num1 == "number" && num1 == 22, "num1" );
    var num2 = this.OpenAjax.getPropertyValue("num2");
    this.assert( typeof num2 == "number" && num2 == -11, "num2" );
    var num3 = this.OpenAjax.getPropertyValue("num3");
    this.assert( typeof num3 == "number" && num3 == 0, "num3" );
    var num4 = this.OpenAjax.getPropertyValue("num4");
    this.assert( typeof num4 == "number" && num4 == 0, "num4" );
    
    var str1 = this.OpenAjax.getPropertyValue("str1");
    this.assert( typeof str1 == "string" && str1 == "This is a string", "str1" );
    var str2 = this.OpenAjax.getPropertyValue("str2");
    this.assert( typeof str2 == "string" && str2 == "{ \"foo\": \"bar\", \"baz\": \"boo\" }", "str2" );
    var str3 = this.OpenAjax.getPropertyValue("str3");
    this.assert( typeof str3 == "string" && str3 == "{ \"foo\": \"bar\", \"baz\": \"boo\" }", "str3" );
    var str4 = this.OpenAjax.getPropertyValue("str4");
    this.assert( typeof str4 == "string" && str4 == "", "str4" );
    
    var obj1 = this.OpenAjax.getPropertyValue("obj1");
    this.assert( typeof obj1 == "object" && obj1.foo == "bar" &&
            obj1.baz == "boo", "obj1" );
    var obj2 = this.OpenAjax.getPropertyValue("obj2");
    this.assert( typeof obj2 == "object" && obj2 == null, "obj2" );
    
    var array1 = this.OpenAjax.getPropertyValue("array1");
    this.assert( array1 instanceof Array && array1[2] == "three", "array1" );
    var array2 = this.OpenAjax.getPropertyValue("array2");
    this.assert( array2 instanceof Array && array2[2] == "six", "array2" );
    var array3 = this.OpenAjax.getPropertyValue("array3");
    this.assert( array3 == null, "array3" );
    
    var date1 = this.OpenAjax.getPropertyValue("date1");
    this.assert( date1 instanceof Date && date1.getMonth() == 0, "date1" );
    var date2 = this.OpenAjax.getPropertyValue("date2");
    this.assert( date2 instanceof Date && date2.getDate() == 17, "date2" );
//      var date3 = this.OpenAjax.getPropertyValue("date3");
//      this.assert( date3 instanceof Date, "date3" );
    var date4 = this.OpenAjax.getPropertyValue("date4");
    this.assert( date4 instanceof Date, "date4" );
    
    var regexp1 = this.OpenAjax.getPropertyValue("regexp1");
    this.assert( regexp1 instanceof RegExp, "regexp1" );
    var regexp2 = this.OpenAjax.getPropertyValue("regexp2");
    this.assert( regexp2 instanceof RegExp, "regexp2" );
    var regexp3 = this.OpenAjax.getPropertyValue("regexp3");
    this.assert( regexp3 instanceof RegExp, "regexp3" );

    var any1 = this.OpenAjax.getPropertyValue("any1");
    this.assert( typeof any1 == "string" && any1 == "Hello world", "any1" );
    var any2 = this.OpenAjax.getPropertyValue("any2");
    this.assert( typeof any2 == "object" && any2.baz == "boo", "any2" );
    var any3 = this.OpenAjax.getPropertyValue("any3");
    this.assert( any3 == null, "any3" );
    var any4 = this.OpenAjax.getPropertyValue("any4");
    this.assert( any4 == null, "any4" );
    
    var multiple1 = this.OpenAjax.getPropertyValue("multiple1");
    this.assert( multiple1 == 7, "multiple1" );
    var multiple2 = this.OpenAjax.getPropertyValue("multiple2");
    this.assert( multiple2 == "7", "multiple2" );
    var multiple3 = this.OpenAjax.getPropertyValue("multiple3");
    this.assert( multiple3 == null, "multiple3" );
    var multiple4 = this.OpenAjax.getPropertyValue("multiple4");
    this.assert( multiple4 == null, "multiple4" );
};

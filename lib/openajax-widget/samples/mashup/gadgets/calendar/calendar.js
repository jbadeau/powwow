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
Calendar = function() {};

Calendar.prototype = 
{
    onLoad: function( event )
    {
        var id = this.OpenAjax.getId();
        
        dojo.require("dijit._Calendar");
        dojo.require("dojo.date.locale");
        dojo.require("dojo.parser"); // scan page for widgets
        
        var _this = this;
        dojo.addOnLoad( function() {
            dojo.parser.parse(dojo.byId(id + "_calendar").parentNode);

            _this._calendar = dijit.byId( id + "_calendar" );
            var initDate = _this.OpenAjax.getPropertyValue("date");
            if (initDate) {
                _this.onDateChange( { newValue: initDate } );
            }
            // since _Calendar initializes itself to today's current date before
            // this init is run, don't add the onChange handler until now otherwise
            // the initial property value will be overwritten before we get here
            _this._calendar.onChange = dojo.hitch(_this, _this.onControlChange);

            // now that the Calendar widget has been parsed, resize the widget size
            // to accommodate the final Calendar size
            var coords = dojo.coords( dojo.byId(id + "_calendar") );
            _this.OpenAjax.adjustDimensions({ width: coords.w, height: coords.h });
        });
    },

    // have to wrap onControlChange and onDateChange with flags to prevent an
    // infinite loop (setting the property will cause onDateChange to be called
    // which will change the _calendar's value which will cause JS's change event
    // to fire which will cause onControlChange to get called which will set the
    // property value which will cause onDateChange to get called, etc)

    onControlChange: function() {
        if (!this._propertySetValue) {
            this.OpenAjax.setPropertyValue( 'date', this._calendar.value );
        }
    },

    onChangeDate: function( event ) {
        if ( event.self ) {
            return;
        }

        var date = event.newValue;
        this._propertySetValue = true;
        // have to null out the remembered value to force _calendar to
        // accept the value we pass in setValue, otherwise it doesn't like
        // to change
        this._calendar.value = null;

        // Only set the calendar value if there is a value to set it to.  It
        // doesn't handle null dates very well.  By default make it show
        // today's date.
        if (!date || date.length < 1) {
            date = new Date();
        }
        this._calendar.setValue(date);
        this._propertySetValue = false;
    }
};

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
dojo.provide("nomad.widget.Date");

dojo.require("dojo.date.locale");
dojo.require("dijit._Calendar");
dojo.require("dijit.form.DateTextBox");

dojo.declare(
        "nomad.widget.Date",
        [dijit.form.DateTextBox],
{
        // summary
        //     Extending a dijit.form.DateTextBox to allow for showing a calendar
        //     without having to use a popup (causes sizing issues in an iframe),
        //     especially on IE

        postCreate: function() {
          this.inherited(arguments);

          var tempNode = document.createElement('div');
          tempNode.className = 'nomadErrorMsg';
          this.errorMsg = this.domNode.parentNode.insertBefore(tempNode, this.domNode.nextSibling);
          tempNode = document.createElement('div');
          tempNode = this.domNode.parentNode.insertBefore(tempNode, this.errorMsg.nextSibling);
          this.calendar = new dijit._Calendar({}, tempNode);

          // override _onFocus to keep the default dojo calendar from popping
          // up
          this._onFocus = function(event) {};

          // Only set the calendar value if there is a value to set it to.  It
          // doesn't handle null dates very well.  By default it will show
          // today's date.
          if (this.value) {
            this.calendar.setValue(this.value);
          }
          this.calendar.onChange = dojo.hitch(this, this.onCalendarChange);
          this.onChange = dojo.hitch(this, this.onTextboxChange);
          this.displayMessage = dojo.hitch(this, this.onTextboxInvalid);
        },

        // if this widget is created programmatically instead of using markup,
        // then startup won't be called by default
        startup: function() {
          this.domNode.style.width = this.calendar.domNode.scrollWidth;
        },

        getValue: function() {
          var value = this.inherited(arguments);
          if (typeof value === 'undefined') {
            // If dojo's DateTextBox can't parse the current date value, it
            // will return 'undefined'.  Unfortunately it will do that when
            // the current value is just an empty string.  Since empty strings
            // are ok with us, we'll allow those back.
            if (this.value == "") {
              value = this.value;
            }
          }
          return value;
        },

        setAttribute: function(attr, value) {
          this.inherited(arguments);
          if (attr == 'disabled') {
            // XXX need to use an overlay with opacity set on it to 'disable'
            // the calendar.  Or do something else to keep users from messing
            // with it.
          }
//          this.calendar.setDisabled(disableInput);
        },

        setTextboxValue: function(value) {
          this.setValue(value);
        },

        setCalendarValue: function(value) {
          // Only set the calendar value if there is a value to set it to.  It
          // doesn't handle null dates very well.  By default make it show
          // today's date.
          if (!value) {
            value = new Date();
          }
          this.calendar.setValue(value);
        },

        onCalendarChange: function(/* Date */date) {
          if (!this._settingCalendar) {
            this._settingTextbox = true;
            this.setTextboxValue(date);
            this._settingTextbox = false;
          }
        },

        onTextboxChange: function(/* String */value) {
          if (this.isValid() && !this._settingTextbox) {
            this._settingCalendar = true;
            this.setCalendarValue(value);
            this._settingCalendar = false;
          }
        },

        onTextboxInvalid: function(/* String */value) {
          this.errorMsg.innerHTML = value;
        }
});

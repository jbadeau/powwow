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
dojo.provide("nomad.widget.MultiSelect");

dojo.require("dijit.form.MultiSelect");
dojo.require("dijit.form.TextBox");
//dojo.require("dijit.form.ComboBox");

dojo.declare(
        "nomad.widget.MultiSelect",
        [dijit.form.MultiSelect],
{
    // summary
    //     Extending a dijit.form.MultiSelect to allow for pulling options
    //     out of a store and to allow for user adding to the options list

    templateString: "<table class='nomadMultiSelect' cellpadding='0' cellspacing='0'><tbody><tr><td><input dojoType='dijit.form.TextBox' dojoAttachPoint='textfield'></input></td></tr><tr><td><select multiple='true' dojoAttachPoint='containerNode,focusNode' dojoAttachEvent='onchange: _onChange'></select></td></tr></tbody></table>",

    // by default only allow the items already defined in the list
    unconstrained: false,

    widgetsInTemplate: true,

    // store: Object
    //     Reference to data provider object used by this MultiSelect
    store: null,

    // _optionsArray: Object
    //     List of options and their values, only really of use with an
    //     unconstrained select
    _optionsArray: null,

    gotError: function(error, request) {
      console.log("The request to the multi select data store failed, error: "+error);
    },

    _addOption: function(label, value) {
      var option = document.createElement('option');
      option.innerHTML = label;
      option.setAttribute('value', value);
      option = this.containerNode.appendChild(option);
      if (this.unconstrained) {
        this._optionsArray[label] = option;
      }
      return option;
    },

    gotItem: function(item, request) {
      this._addOption(item.label, item.value);
    },

    postCreate: function() {
      if (!this.unconstrained) {
        this.textfield.domNode.style.display = 'none';
      } else {
        dojo.connect(this.textfield.domNode, "onkeypress", dojo.hitch(this, this._onKeyPress));
        this._optionsArray = {};
      }

      if (this.store) {
        this.store.fetch({
          onItem: dojo.hitch(this, this.gotItem),
          onError: dojo.hitch(this, this.gotItem)
        });
      }
      this.inherited(arguments);
    },

    startup: function() {
      if (this.unconstrained) {
        var textBox = dojo.marginBox(this.textfield.domNode);
        var selectBox = dojo.marginBox(this.containerNode);
        if (textBox.w > selectBox.w) {
          selectBox.w = textBox.w;
          dojo.marginBox(this.containerNode, selectBox);
        } else {
          textBox.w = selectBox.w;
          dojo.marginBox(this.textfield, textBox);
        }
      }
    },

    // If the user hits the 'enter' key, add the item in the textfield to the
    // list of options.  The label and value will be identical, the value that
    // is currently in the textfield.  Select that item after it is added to
    // the list and then clear the textfield so that it is ready for any more
    // input.
    _onKeyPress: function(/*Event*/ event) {
      //except for pasting case - ctrl + v(118)
      if(event.altKey || (event.ctrlKey && event.charCode != 118)){
        return;
      }
      if (event.keyCode == dojo.keys.ENTER) {
        var currText = this.textfield.getValue();
        var option = this._optionsArray[currText];
        if (typeof option === 'undefined') {
          option = this._addOption(currText, currText);
        }
        if (option) {
          if (dojo.isIE) {
            option.setAttribute('selected', true);
          } else {
            option.selected = true;
          }
          this.textfield.setValue('');
        }
      }
    },

    setTextboxValue: function(value) {
      this.textfield.setValue(value);
    },

    getValue: function() {
      var selectedOpts = [];
      if (!(this.containerNode.selectedIndex < 0)) {
        var options = this.containerNode.options;
        for (var i = this.containerNode.selectedIndex; i < options.length; i++) {
          var option = options[i];
          if (option.selected) {
            selectedOpts.push(option.value);
          }
        }
      }
      return selectedOpts;
    },

    setValue: function(value) {
      // make sure we are passed an array
      if (!(typeof value == 'object')) {
          return;
      }
      var options = this.containerNode.options;
      if (!options) {
          return;
      }

      // Value could be an Array of values or it could be an associative array
      // of values (what dojo.fromString produces when converting a json-ified
      // array back from a string).  If the latter, just build a JS array to
      // keep the code consistent.
      var valueArray = value;
      var isArray = value instanceof Array;
      if (!isArray) {
          valueArray = [];
          var tempValue = null;
          for( tempValue in value ) {
              valueArray.push(value[tempValue]);
          }
      }

      var optLen = options.length;
      var valLen = valueArray.length;

      // Look for all options with their value property in the list of values
      // to select.  If the option value isn't on the list, make sure that it
      // is deselected.  Have to check through all of the options because it is
      // possible that more than one option has the same value.
      var foundVals = {};
      for (var i = 0; i < optLen; i++) {
        var option = options[i];
        if (dojo.isIE) {
          option.setAttribute('selected', false);
        } else {
          option.selected = false;
        }
        for (var j = 0; j < valLen; j++) {
          if (option.value == valueArray[j]) {
            if (dojo.isIE) {
              option.setAttribute('selected', true);
            } else {
              option.selected = true;
            }
            foundVals[option.value] = true;
          }
        }
      }

      if (this.unconstrained) {
        for (var k = 0; k < valLen; k++) {
          var tempVal = valueArray[k];
          if (typeof foundVals[tempVal] === 'undefined') {
            var option = this._addOption(tempVal, tempVal);
            if (dojo.isIE) {
              option.setAttribute('selected', true);
            } else {
              option.selected = true;
            }
          }
        }
      }
    }

});

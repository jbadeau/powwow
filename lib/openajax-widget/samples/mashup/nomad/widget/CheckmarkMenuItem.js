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
dojo.provide("nomad.widget.CheckmarkMenuItem");

dojo.require("dijit.Menu");

dojo.declare(
        "nomad.widget.CheckmarkMenuItem",
        [ dijit.MenuItem ],
{
        // summary
        //      Extending dijit.MenuItem to allow a concept of a 'currently
        //      selected' menu item from a group of menu items.  Similar to
        //      a radio button.

        // Bringing in the template string from Menu.js because I need to know
        // what the value of @initChecked is.  @initChecked will only be honored during
        // initialization, after that the attribute is ignored.  The last
        // menu item with @initChecked set will be the one that is actually
        // checked.
        templateString:
                 '<tr class="dijitReset nomadCheckboxMenuItem"'
                +'dojoAttachEvent="onmouseenter:_onHover,onmouseleave:_onUnhover,ondijitclick:_onClick" initChecked="${initChecked}">'
                +'<td class="dijitReset"><div class="dijitMenuItemIcon ${iconClass}" dojoAttachPoint="iconNode" ></div></td>'
                +'<td tabIndex="-1" class="dijitReset dijitMenuItemLabel" dojoAttachPoint="containerNode" waiRole="menuitem"></td>'
                +'<td class="dijitReset" dojoAttachPoint="arrowCell">'
                        +'<div class="dijitMenuExpand" dojoAttachPoint="expand" style="display:none">'
                        +'<span class="dijitInline dijitArrowNode dijitMenuExpandInner">+</span>'
                        +'</div>'
                +'</td>'
                +'</tr>',

        _menus: {},

        _checked: null,

        initChecked: null,

        // some checkmark menu items want the checkmark to only indicate the
        // last item selected and still want every click of that menu item
        // to run its click handler
        handleEveryClick: false,

        startup: function() {
          var menuId = this.getParent().id;
          // have to remember parent id since the menu item may be disconnected
          // from the parent before destroy() is called, esp on IE
          this._parentId = menuId;
          if (!this._menus[menuId]) {
            this._menus[menuId] = new Array();
          }
          this._menus[menuId].push(this);
          var checked = this.initChecked;
          if (checked && typeof checked == "boolean") {
            // if @initChecked is 'true' accept it, otherwise ignore all
            // other values
            this.setChecked(true);
          } else {
            this.setChecked(false);
          }
          this.inherited(arguments);
        },

        destroy: function() {
          var menuId = this._parentId;
          var menuItemArray = this._menus[menuId];
          var arrayLength = menuItemArray ? menuItemArray.length : 0;
          for (var i = 0; i < arrayLength; i++) {
            if (menuItemArray[i] == this) {
              menuItemArray.splice(i, 1);
              if (!menuItemArray.length) {
                this._menus[menuId] = null;
              }
              break;
            }
          }
          this._parentId = null;
          this.inherited(arguments);
        },

        setChecked: function(/* boolean */enableCheck) {
          // return whether this call changed the checked state of the menuitem

          // if we are changing the state of the menu item to unchecked, just
          // remove the icon, otherwise we'll loop through all of the menu items
          // and remove their checks before we enable the check for the menu
          // item that we are enabling
          if (enableCheck == this._checked) {
            return false;
          }
          if (enableCheck == false) {
            dojo.removeClass(this.iconNode, "nomadCheckedMenuItemIcon");
          } else {
            var menuId = this._parentId;
            var menuItemArray = this._menus[menuId];
            var arrayLength = menuItemArray ? menuItemArray.length : 0;
            for (var i = 0; i < arrayLength; i++) {
              if (menuItemArray[i] != this) {
                menuItemArray[i].setChecked(false);
              }
            }
            dojo.addClass(this.iconNode, "nomadCheckedMenuItemIcon");
          }
          this._checked = enableCheck;
          return true;
        },

        _onClick: function() {
          // If this menu item isn't already checked, check it.  If the item
          // was already checked, don't call superclass otherwise onClick
          // handler will get called when it doesn't need to be.  Keep in mind
          // that setChecked needs to be called everytime here, so put it first.
          if (this.setChecked(true) || this.handleEveryClick) {
            this.inherited(arguments);
          }
        }

});

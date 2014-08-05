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
dojo.provide("nomad.widget.PaletteMenu");

dojo.require("dijit.Menu");
dojo.require("dijit.TitlePane");
//dojo.require("dijit.form.CheckBox");
dojo.require("dijit.form.Button");
dojo.require("dijit.Tooltip");

dojo.declare(
        "nomad.widget.PaletteMenu",
        [ dijit.Menu ],
{
        // summary
        //      Extending a dijit.Menu to allow for scroll buttons when the menu
        //      extends beyond the client area of the browser

        templateString:
          '<table id="${id}" cellspacing="0" cellpadding="0" class="dijitMenu"><tbody><tr><td><button class="paletteScrollButton" dojoAttachPoint="scrollUpButton" dojoAttachEvent="onmousedown: scrollUp"><span class="dijitInline nomadToolbarIcon nomadIconScrollUp"></span></button></td></tr>' +
          '<tr><td>' +
          '<div id="${id}_searchOptions" dojoType="nomad.widget.NorgiePaletteItem"' +
               'class="paletteNorgie" title="Advanced Search Options" paletteId="${id}">' +
          '</div>' +
          '</td></tr>' +
          '<tr><td><div dojoAttachPoint="menuViewport">' +
            '<table class="dijit nomadInnerMenu dijitReset dijitMenuTable" dojoAttachPoint="menu" waiRole="menu" dojoAttachEvent="onkeypress:_onKeyPress" width="100%">' +
                '<tbody class="dijitReset" dojoAttachPoint="containerNode"></tbody>'+
            '</table>' +
          '</div></td></tr>' +
          '<tr><td><button class="paletteScrollButton" dojoAttachPoint="scrollDownButton" dojoAttachEvent="onmousedown: scrollDown"><span class="dijitInline nomadToolbarIcon nomadIconScrollDown"></span></button></td></tr></tbody></table>',

        widgetsInTemplate: true,

        startup: function() {
          var menuViewportStyle = this.menuViewport.style;
          menuViewportStyle.overflow = 'hidden';
          // Need to set these relative positions to make IE happy with the
          // overflow hidden style.  But setting menuViewport relative upsets
          // Safari.  Ack!
          if (dojo.isIE) {
            menuViewportStyle.position = 'relative';
          }
          menuViewportStyle.height = '100%';
          this.menuViewport.parentNode.style.position = 'relative';

          this.inherited(arguments);
          dojo.connect(window, 'onresize', dojo.hitch(this, 'resizePalette', false));
        },

        destroy: function() {
          if (this._tooltip) {
            this._tooltip.destroy();
          }
          this.inherited(arguments);
        },

        _sizeInitialized: false,

        _getMenuItems: function() {
          // this assumes that all menu items in this menu are
          // nomad.widget.PaletteItem's
          return dojo.query(".dijitMenuItem", this.domNode);
        },

        _tooltip: null,

        setTooltip: function(tooltip) {
          if (this._tooltip) {
            this._tooltip.destroy();
          }
          this._tooltip = tooltip;
        },

        resizePalette: function(opening) {
          // if we've already resized the palette to fit the browser
          // we'd better reset the height style before we calculate again
          if (!this._open && !opening) {
            // If we got a resize and the palette isn't open, then it came from
            // the browser resizing.  Make sure we recalc the next time
            // we open the palette.
            this._sizeInitialized = false;

            // gotta make sure that the buttons are visible when the calculation
            this.scrollUpButton.style.display = 'block';
            this.scrollDownButton.style.display = 'block';
            return;
          }

          var menuViewportStyle = this.menuViewport.style;
          if (menuViewportStyle.height != '100%') {
            menuViewportStyle.height = '100%';
          }

          // figure out if we need to show the scroll buttons and if so,
          // resize the menu viewport so that everything fits
          var menuCoords = dojo.coords(this.domNode, true);
          var viewport = dijit.getViewport();
          if (menuCoords.t + menuCoords.h < viewport.h) {
            // the menu can fit in the viewport area of browser so we don't
            // need to keep the scroll buttons visible
            this.scrollUpButton.style.display = 'none';
            this.scrollDownButton.style.display = 'none';
          } else {
            // Make sure that the buttons are visible, recalc menucoords if
            // they weren't.  Enough to check just one since they appear and
            // disappear in pairs.
            if (this.scrollUpButton.style.display == 'none') {
              this.scrollUpButton.style.display = 'block';
              this.scrollDownButton.style.display = 'block';
              menuCoords = dojo.coords(this.domNode, true);
            }
            var menubox = dojo.marginBox(this.menuViewport, null);
            var controlsHeight = menuCoords.h - menubox.h;
            menubox.h = viewport.h - viewport.t - controlsHeight - menuCoords.y;
            dojo.marginBox(this.menuViewport, menubox);
          }
          this._sizeInitialized = true;
        },

        focusFirstItem: function() {
          if (this.hasChildren()) {
            this._getMenuItems()[0].focus();
          }
        },

        onOpen: function() {
          var browserHeight = dijit.getViewport().h;
          if (!this._sizeInitialized) {
            this.resizePalette(true);
          }
          this.inherited(arguments);
          this._open = true;
        },

        onClose: function() {
          var currFocus = this.focusedChild;
          if (currFocus && !currFocus._blur) {
            this.focusFirstItem();
          }
          this.inherited(arguments);
          if (this._tooltip) {
            this._tooltip.close();
          }
          this._open = false;
        },

        scrollUp: function(event) {
          this.focusPrev();
          dojo.stopEvent(event);
        },

        scrollDown: function(event) {
          this.focusNext();
          dojo.stopEvent(event);
        }

});

dojo.declare(
        "nomad.widget.PaletteItem",
        [ dijit.MenuItem ],
{
        // summary
        //      Extending a dijit.MenuItem to allow for icons that when clicked
        //      will run the palette item, get more info for the palette item,
        //      or bookmark the palette item

        // Make 3 columns
        //   icon, label, and expand arrow (BiDi-dependent) indicating sub-menu
        templateString:
                 '<tr class="dijitReset dijitMenuItem nomadPaletteItem"'
                +'dojoAttachEvent="onmouseenter:_onHover,onmouseleave:_onUnhover,ondijitclick:_onClick">'
                +'<td><table><tbody><tr><td><table><tbody><tr>'
                +'<td class="dijitReset"><div class="dijitMenuItemIcon ${iconClass}" dojoAttachPoint="iconNode" dojoAttachEvent="ondijitclick:_startDND "></div></td>'
                +'<td><div class="dijitMenuItemIcon ${runIconClass}" dojoAttachEvent="ondijitclick:_runGadget"/></td>'
                +'<td tabIndex="-1" class="dijitReset dijitMenuItemLabel" dojoAttachPoint="containerNode" waiRole="menuitem"></td>'
                +'</tr></tbody></table></td>'
                +'</tr></tbody></table></td>'
                +'</tr>',

        // runIconClass: String
        //      class to apply to div in button to make it display an icon
        //      for the action to display a sample of the palette item
        runIconClass: "",

        // bookmarkIconClass: String
        //      class to apply to div in button to make it display an icon
        //      for the action to bookmark the palette item
        bookmarkIconClass: "",

        // infoIconClass: String
        //      class to apply to div in button to make it display an icon
        //      for the action to retrieve more info on the palette item
        infoIconClass: "",

        // itemUrl: String
        //      the url of the widget represented by this palette item
        itemUrl: "",

        _runGadget: function(event) {
          var mywindow = window.open(OpenAjax.widget.baseURI+'standaloneGadget.php?specURL='+this.itemUrl, 'samplewindow', 'width=600,height=500,resizable=yes,scrollbars=yes');
          dojo.stopEvent(event);
          return false;
        },

        _startDND: function(event) {
          mashupMaker.startDND(event, this);
          dojo.stopEvent(event);
          return false;
        },

        focus: function() {
          this.inherited(arguments);
          if (window.ActiveXObject) {
            dojo.addClass(this.domNode, 'dijitMenuItemHoverIE');
          }
          
          dijit.scrollIntoView(this.domNode);
        },
        
        _blur: function() {
          this.inherited(arguments);
          if (window.ActiveXObject) {
            dojo.removeClass(this.domNode, 'dijitMenuItemHoverIE');
          }
        },

        setImage: function(path) {
          this.iconNode.style.backgroundImage = path;
        }

});

dojo.declare(
        "nomad.widget.NorgiePaletteItem",
        [ dijit.TitlePane ],
{
        // summary
        //      Extending a dijit.MenuItem to allow for icons that when clicked
        //      will run the palette item, get more info for the palette item,
        //      or bookmark the palette item

        templateString:
                  '<div class="dijitTitlePane">' +
                    '<div dojoAttachEvent="onclick:toggle,onkeypress: _onTitleKey,onfocus:_handleFocus,onblur:_handleFocus" tabindex="0"' +
                        'waiRole="button" class="dijitTitlePaneTitle" dojoAttachPoint="focusNode">' +
                      '<div dojoAttachPoint="arrowNode" class="dijitInline dijitArrowNode"><span dojoAttachPoint="arrowNodeInner" class="dijitArrowNodeInner"></span></div>' +
                      '<div dojoAttachPoint="titleNode" class="dijitTitlePaneTextNode"></div>' +
                    '</div>' +
                    '<div class="dijitTitlePaneContentOuter" dojoAttachPoint="hideNode">' +
                      '<div class="dijitReset" dojoAttachPoint="wipeNode">' +
                        '<div class="dijitTitlePaneContentInner" dojoAttachPoint="containerNode" waiRole="region" tabindex="-1">' +
                          "<!-- nested divs because wipeIn()/wipeOut() doesn't work right on node w/padding etc.  Put padding on inner div. -->" +
                        '</div>' +
                      '</div>' +
                    '</div>' +
                  '</div>',

        _contentString: "",

        widgetsInTemplate: false,

        postCreate: function() {
          this.inherited(arguments);
          this._contentString =
             '<table><tr>'
//            +'<td><label for="'+this.id+'_widgetName">widget name</label></td>'
//            +'<td><input id="'+this.id+'_widgetName" name="'+this.id+'_widgetName" dojoType="dijit.form.CheckBox"/></td>'
//            +'</tr>'
//            +'<td><label for="'+this.id+'_widgetTags">widget tags</label></td>'
//            +'<td><input id="'+this.id+'_widgetTags" name="'+this.id+'_widgetTags" dojoType="dijit.form.CheckBox"/></td>'
//            +'</tr>'
//            +'<td><label for="'+this.id+'_widgetDescr">widget description</label></td>'
//            +'<td><input id="'+this.id+'_widgetDescr" name="'+this.id+'_widgetDescr" dojoType="dijit.form.CheckBox"/></td>'
//            +'</tr>'
//            +'<td><label for="'+this.id+'_widgetPropDescr">widget property description</label></td>'
//            +'<td><input id="'+this.id+'_widgetPropDescr" name="'+this.id+'_widgetPropDescr" dojoType="dijit.form.CheckBox"/></td>'
//            +'</tr>'
            +'<td><label for="'+this.id+'_repositoryList">Repositories:</label></td></tr>'
            +'<tr><td colspan="2">'
            +'<select id="'+this.id+'_repositoryList" name="'+this.id+'_repositoryList"  size="3" multiple>'
            +'</select>'
            +'</td></tr><td colspan="2">'
            +'<button dojoType="dijit.form.Button" iconClass="nomadToolbarIcon nomadIconRefresh" onclick="searchRepositories">Refresh Search Results</button>'
            +'</td></tr></table>';
          this.setContent(this._contentString);
          if (this.paletteId.length > 0) {
            this._palette = dijit.byId(this.paletteId);
          }
          mashupMaker.getRepositoryList(dojo.hitch(this, this.buildRepositoryList));
        },

        // id of the palette that contains this norgie
        paletteId: "",

        // palette widget that contains this norgie.  Found during
        // initialization using paletteId
        _palette: null,

        toggle: function() {
          this.inherited(arguments);
          if (this._palette) {
            setTimeout(dojo.hitch(this._palette, 'resizePalette', false), this.duration);
          }
        },

        buildRepositoryList: function(list) {
          if (!list || list.length < 1) {
            return;
          }
          var repositorySelect = dojo.query("select", this.domNode)[0];
          while (repositorySelect.length > 0) {
            repositorySelect.remove(0);
          }
          for (var i = 0; i < list.length; i++) {
            var repository = list[i];
            var option = new Option(repository.name, repository.url, false, false);
            if (i == 0) option.selected = true;
            repositorySelect.options[i] = option;
          }
        },

        getSelectedRepositories: function() {
          var list = dojo.byId(this.id+'_repositoryList');
          var selected = new Array();
          for (var i = 0; i < list.options.length; i++) {
            var option = list.options[i];
            if (option.selected) {
              selected.push(option.value);
            }
          }
          return selected;
        }

});

dojo.declare(
        "nomad.widget.PaletteTooltip",
        [ dijit.Tooltip ],
{
        // summary
        //      Extending dijit.Tooltip will allow us to use only one tooltip
        //      to display the abbreviated information on each palette item.
        //      This will work because when the tooltip is opened, we'll gather
        //      the description from the palette item that is enclosing the
        //      target of the tooltip (the information icon displayed on the
        //      currently hovered palette item).

        open: function(target) {
          var paletteItem = dijit.getEnclosingWidget(target);
          this.label = "description for: "+paletteItem.label;
          this.inherited(arguments);
        }
});

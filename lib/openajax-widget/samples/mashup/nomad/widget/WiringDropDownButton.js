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
dojo.provide("nomad.widget.WiringDropDownButton");

//dojo.require("dijit.form.Button");
dojo.require("dijit.Menu");
dojo.require("nomad.widget.CheckmarkMenuItem");

dojo.declare(
        "nomad.widget.WiringDropDownButton",
        [ dijit.form.DropDownButton ],
{
        // summary
        //      Extending a dijit.form.DropDownButton for our propertyeditor
        //      so that the drop down menu is created automatically based on
        //      the state of the corresponding property.

        // IE has a problem with showLabel = false, so need to have code here
        // to show and hide the label node depending on whether the label
        // has text or not.

        templateString:
          '<div class="wiringButton dijit dijitLeft dijitInline"'
         +'  dojoAttachEvent="onmouseenter:_onMouse,onmouseleave:_onMouse,onmousedown:_onMouse,onclick:_onDropDownClick,onkeydown:_onDropDownKeydown,onblur:_onDropDownBlur,onkeypress:_onKey"'
         +'  ><div class="dijitRight">'
         +'  <button class="dijitStretch dijitButtonNode dijitButtonContents" type="${type}"'
         +'    dojoAttachPoint="focusNode,titleNode" waiRole="button" waiState="haspopup-true,labelledby-${id}_label"'
         +'    ><div class="dijitInline ${iconClass}" dojoAttachPoint="iconNode"></div'
         +'    ><span class="dijitButtonText" dojoAttachPoint="containerNode,popupStateNode"'
         +'    id="${id}_label">${label}</span'
         +'    ><span dojoAttachPoint="arrowNode" class="dijitA11yDownArrow">&#9660;</span>'
         +'  </button>'
         +'</div></div>',

        // behave like a normal button...no dropdown menu, no down arrow, etc
        mimicButton: false,

        // this button is for wiring input into the property
        wiringInput: true,

        // The property editor that contains this wiring button.  We can't
        // assume that we can find the property editor through the default
        // property dialog box since the gadget might embed the property editor
        // inside the gadgets content mode="edit" node.
        propertyEditor: null,
        
        // Reference to the parent window's MashupMaker instance
        mm: null,

        setLabel: function(/*String*/ content) {
          // IE has a problem with showLabel = false, so need to have this
          // override to make sure
          if (content && content.length) {
            this.containerNode.style.display = 'inline';
          }
          this.inherited(arguments);
        },

        postCreate: function() {
          this.inherited(arguments);
          var property = this.property;
          if (!property) {
            return;
          }

          var topic = this.property.sharedAs;
//          var defaultTopic = this.property.defaultTopic();
          // setup the icon to appear on the button
//          this._setIcon(topic, defaultTopic, this.property.getSingleBoundGadget());
          this._setIcon( topic, topic, null );
          if (this.mimicButton) {
            this.arrowNode.style.display = 'none';
            dojo.connect(this.domNode, 'onclick', this, 'onClick');
          } else {
            // create the menu to display if the button is clicked
            var menu = this._createMenu(property, topic, defaultTopic);
            this.dropDown = menu;
          }
          dojo.connect(this.domNode, "onmouseenter", this, "onHover");
          dojo.connect(this.domNode, "onmouseleave", this, "onUnhover");
          if (!this.label) {
            this.containerNode.style.display = 'none';
          }
        },

        refresh: function(/* boolean */retainCachedValues) {
          // Can be called by the property editor to make sure that the icon
          // on the button is correct.  Small price to pay to keep from
          // blowing the button away and creating a new one.

          if (!this.wiringInput) {
            // the output button doesn't change its icon and has no dropdown
            // menu to update so just bow out gracefully
            return;
          }
          var topic = "";
          var singleBoundGadget = null;
          if (typeof retainCachedValues === "undefined" || !retainCachedValues) {
            topic = this.property.topic();
            this._newTopic = null;
            this._singleBoundGadget = null;
            singleBoundGadget = this.property.getSingleBoundGadget();
          } else {
            topic = this._newTopic != null ? this._newTopic : this.property.topic();
            singleBoundGadget = this._singleBoundGadget ? this._singleBoundGadget : this.property.getSingleBoundGadget();
          }
//          var defaultTopic = this.property.defaultTopic();
//          this._setIcon(topic, defaultTopic, singleBoundGadget);
          this._setIcon( topic, topic, null );

          // Resync the dropdown menu in case the user made changes and then
          // cancelled them.
          var menuitems = this.dropDown.getChildren();
          var setChecked = false;
          if (menuitems && menuitems.length > 0) {
            for (var index = 0; index < menuitems.length; index++) {
              switch (index) {
                case 0:
                  // multi bound
                  setChecked = (topic == defaultTopic && !singleBoundGadget);
                  break;
                case 1:
                  // unbound
                  setChecked = (!topic || topic == "");
                  break;
                case 2:
                  // single bound
                  setChecked = (topic && !!singleBoundGadget);
              }
              if (setChecked) {
                menuitems[index].setChecked(true);
                break;
              }
            }
          }
        },

        _startWiringProperty: function() {
          this.onUnhover();
          var topic = "";
          if (this.wiringInput) {
            topic = this._newTopic ? this._newTopic : this.property.topic();
          } else {
            topic = this.property.defaultTopic();
          }
          this.propertyEditor.wiringSessionStarting(this, topic);
          var wiringManager = this.mm.getWiringManager();
          var that = this;
          var callback = function( success, subHandle ) {
              if ( !success ) {
                  // XXX handle error
                  alert( "wiring complete subscribe failed" );
                  return;
              }
              that._connectListener = subHandle;
          };
          this.mm.hub.subscribe("nomad-wiring-property-complete", callback, dojo.hitch(this, this.onWiringComplete) );
          wiringManager.wirePropertyToGadget(this.property, this.wiringInput);
        },

        onClick: function() {
          this._startWiringProperty();
        },

        onWiringCancelled: function(/* event */event) {
          this.propertyEditor.wiringSessionCompleting(true);
          var callback = function( success, subHandle ) {};
          this._connectListener.unsubscribe(callback);
          this._connectListener = null;
          var wiringManager = this.mm.getWiringManager();
          wiringManager.stopWiringProperty();
          this.refresh(true);
        },

        onWiringComplete: function(/* event */event) {
          var callback = function( success, subHandle ) {};
          this._connectListener.unsubscribe(callback);
          this._connectListener = null;
          this.propertyEditor.wiringSessionCompleting(false);
          if (this.wiringInput) {
            // if the user requested a change to this property's wiring,
            // remember it until the change is committed
            var wiringManager = this.mm.getWiringManager();
            var changeObj = wiringManager.getWiringChange(this.property, this.wiringInput);
            if (changeObj) {
              this._newTopic = changeObj.newTopic;
              this._singleBoundGadget = changeObj.publishingGadget.getId();
              var controlId = this.id.substring(0, this.id.indexOf('_InputBinding'));
              this.propertyEditor.hideDefaultControl(controlId, this._newTopic, this.property.defaultTopic(), changeObj.publishingGadget);
//              this._setIcon(this._newTopic, this.property.defaultTopic(), changeObj.publishingGadget);
              this._setIcon( this._newTopic, this._newTopic, null );
            }
          }
        },

//        widgetsInTemplate: false,
//
//        property: null,
//
        _newTopic: null,
        _singleBoundGadget: null,
        label: "",
        _setIcon: function(/*string*/ topic, /*string*/ defaultTopic, /*gadget*/singleBindingGadget) {
          var bindingClass = "nomadToolbarIcon nomadIconNoBinding";
          if (this.wiringInput) {
            if (topic && topic.length > 0) {
              if (singleBindingGadget) {
                bindingClass = "nomadToolbarIcon nomadIconSingleBinding";
              } else if (topic == defaultTopic) {
                bindingClass = "nomadToolbarIcon nomadIconMultipleBinding";
              }
            }
          } else {
            // since published topics go to everyone, always set the icon to
            // be multiple binding
            bindingClass = "nomadToolbarIcon nomadIconMultipleBinding";
          }
          this.iconNode.className = bindingClass;
        },
        _createMenu: function(/*GadgetProperty*/ property, /*string*/ topic, /*string*/ defaultTopic) {
//          var menu = new dijit.Menu({id: property.getGadget().getId()+'_'+property.name()+'_wiringMenu'});
          var menu = new dijit.Menu({ id: this.widgetId + '_' + property.name + '_wiringMenu' });
          if (!menu) {
            return null;
          }

          // assign menuitem.initChecked prior to menu.startup()
          var singleBoundGadget = property.getSingleBoundGadget();
          var menuitem = null;
          if (defaultTopic && defaultTopic.length) {
            menuitem = new nomad.widget.CheckmarkMenuItem({
                label: 'Listen for all '+defaultTopic+' topics',
                onClick: dojo.hitch(this, this._wireDefaultTopics)
              });
            menuitem.initChecked = (topic == defaultTopic && !singleBoundGadget);
            menu.addChild(menuitem);
          }
          menuitem = new nomad.widget.CheckmarkMenuItem({
              label: 'Listen for no topics',
              onClick: dojo.hitch(this, this._wireNoTopics)
            });
          menuitem.initChecked = (!topic || topic == "");
          menu.addChild(menuitem);
          menuitem = new nomad.widget.CheckmarkMenuItem({
              label: 'Bind to one widget...',
              handleEveryClick: true,
              onClick: dojo.hitch(this, this._wireOneSourceTopic)
            });
          menuitem.initChecked = (topic && !!singleBoundGadget);
          menu.addChild(menuitem);
          menu.startup();
          return menu;
        },

        _wireDefaultTopics: function(/*event*/ event) {
          var prevTopic = this._newTopic != null ? this._newTopic : this.property.topic();
          this._newTopic = this.property.defaultTopic();
          this._singleBoundGadget = null;
          var controlId = this.id.substring(0, this.id.indexOf('_InputBinding'));
          this.propertyEditor.hideDefaultControl(controlId, this._newTopic, this._newTopic, null);
          this._setIcon(this._newTopic, this._newTopic, null);
          this.mm.getWiringManager().registerWiringChange(this.property, this._newTopic, prevTopic, null, this.wiringInput);
        },
        _wireNoTopics: function(/*event*/ event) {
          var prevTopic = this._newTopic != null ? this._newTopic : this.property.topic();
          this._newTopic = "";
          this._singleBoundGadget = null;
          var controlId = this.id.substring(0, this.id.indexOf('_InputBinding'));
          this.propertyEditor.showDefaultControl(controlId, this.property);
//          this._setIcon(this._newTopic, this.property.defaultTopic(), null);
          this._setIcon( this._newTopic, this._newTopic, null );
          this.mm.getWiringManager().registerWiringChange(this.property, this._newTopic, prevTopic, null, this.wiringInput);
        },
        _wireOneSourceTopic: function(/*event*/ event) {
          this._startWiringProperty();
        },

        destroy: function() {
          if (this.dropDown) {
            this.dropDown.destroyRecursive();
            this.dropDown = null;
          }
          if (this._connectListener) {
            var callback = function( success, subHandle ) {};
            this._connectListener.unsubscribe(callback);
            this._connectListener = null;
          }
          this._singleBoundGadget = null;
          this.inherited(arguments);
        },

        onHover: function(/*event*/ event) {
          var wiringManager = this.mm.getWiringManager();
          var topic = this._newTopic != null ? this._newTopic : this.property.topic();
          var singleBoundGadget = this._singleBoundGadget ? this._singleBoundGadget: this.property.getSingleBoundGadget();
          // don't bother with the highlighting logic if this property neither
          // publishes nor listens to a topic
          if (topic && topic.length) {
            if (singleBoundGadget) {
              var gadgets = new Array();
              gadgets[singleBoundGadget] = this.mm.getWidgetModelFromID(singleBoundGadget);
              wiringManager.highlightGadgets(gadgets, topic, this.wiringInput);
            } else {
              wiringManager.highlightTopic(topic, this.wiringInput, this.property.getGadget());
            }
          }
        },
        onUnhover: function(/*event*/ event) {
          if (!this._connectListener) {
            // don't mess with topic highlighting if wiring is in progress
            var wiringManager = this.mm.getWiringManager();
            wiringManager.unhighlightTopic();
          }
        }

});

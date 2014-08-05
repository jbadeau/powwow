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
dojo.provide("nomad.widget.MashupDialog");

dojo.require("dijit.Dialog");
dojo.require("dijit.form.Button");

dojo.declare(
        "nomad.widget.MashupDialog",
        [ dijit.Dialog ],
{
        // summary
        //      Extending a dijit.Dialog to allow for rolling up and unrolling
        //      the dialog

//        templateString:
//          '<div dojoType="dijit.Dialog" id="${id}" name="${id}"'
//         +'     title="Properties" execute="dijit.byId(\'${id}\').hide();"'
//         +'     refreshOnShow="true">'
        _contentString: "",

        postCreate: function() {
          this.inherited(arguments);
          this._contentString = '<div id="'+this.id+'_Contents" name="'+this.id+'_Contents"></div>'
            +'<span id="'+this.id+'_Rollup" name="'+this.id+'_Rollup"'
            +'     style="height: 50px; display: none;">'
//            +'  <span id="'+this.id+'_RollupText" name="'+this.id+'_RollupText" style="float: left"></span>'
            +'  <span id="'+this.id+'_RollupText" name="'+this.id+'_RollupText"></span>'
            +'  <button id="'+this.id+'_RollupCancel"></button>'
            +'</span>';

          this.setContent(this._contentString);
          var rollupCancel = dojo.byId(this.id+'_RollupCancel');
          new dijit.form.Button({
              label: "Cancel",
              onClick: dojo.hitch(this, "rolldownContent")
            }, rollupCancel);

          dojo.connect(dojo.byId(this.id+"_RollupCancel"), "onclick", dojo.hitch(this, "rolldownContent"));
          this._oldCoords = null;
          mashupMaker.hub.subscribe( "nomad-propertyEditor-resize", this.contentsResized, this );
        },

        widgetsInTemplate: false,

        execute: function() { this.hide(); },

        getTitle: function() {
          return this.titleNode.innerHTML;
        },

        setTitle: function(title) {
          this.titleNode.innerHTML = title;
        },

        rollupContent: function(/* string */topicName, /* boolean */inputTopic) {
          // hide the current property controls
          this._oldCoords = dojo.coords(this.domNode, true);
          this.domNode.style.top = '10px';
          this.domNode.style.width = 'auto';
          this.domNode.style.height = 'auto';

          dojo.byId(this.id+'_Contents').style.display = 'none';

          // set the proper text given the topicName and whether this property
          // is looking to recieve this topic as input or to publish the topic
          var rollupText = inputTopic ? "Receive " : "Send ";
          rollupText += '"'+topicName+'"';
          rollupText += inputTopic ? " from which widget?" : " to which widget?";
          dojo.byId(this.id+'_RollupText').innerHTML = rollupText;

          // display the rollup part of the dialog
          dojo.byId(this.id+'_Rollup').style.display = 'inline';
        },

        rolldownContent: function() {
          if (this._oldCoords) {
            this.domNode.style.top = this._oldCoords.t+'px';
            this.domNode.style.width = this._oldCoords.w+'px';
            this.domNode.style.height = this._oldCoords.h+'px';
            this._oldCoords = null;
          }

          // show the property controls again
          dojo.byId(this.id+'_Contents').style.display = 'block';

          // hide the rollup part of the dialog
          dojo.byId(this.id+'_Rollup').style.display = 'none';

          // notify subscribers that the user pressed the rolldown button
          mashupMaker.hub.publish("nomad-dialog-rolldown", null);
        },

        contentsResized: function(event) {
          var dialogContents = dojo.byId(this.id+'_Contents');
          var gadgetContainer = dojo.query(".gadgetFrame", dialogContents)[0];
          dialogContents.style.height = gadgetContainer.scrollHeight + "px";
          dialogContents.style.width = gadgetContainer.scrollWidth + "px";
          var coords = dojo.coords(this.domNode);
          var dpCompStyle = dojo.style(dojo.query(".dijitDialogPaneContent", this.domNode)[0]);
          var tbCompStyle = dojo.style(dojo.query(".dijitDialogTitleBar", this.domNode)[0]);
          var pxPos = dpCompStyle.paddingLeft.indexOf('px');
          if (pxPos == -1) {
            pxPos = dpCompStyle.paddingLeft.indexOf('em');
          }
          var paddingLeft = parseInt(dpCompStyle.paddingLeft.substring(0, pxPos != -1 ? pxPos : 0));
          var titlebar = dojo.query(".dijitDialogTitleBar", this.domNode)[0];
          pxPos = dpCompStyle.paddingRight.indexOf('px');
          if (pxPos == -1) {
            pxPos = dpCompStyle.paddingRight.indexOf('em');
          }
          var paddingRight = parseInt(dpCompStyle.paddingRight.substring(0, pxPos != -1 ? pxPos : 0));
          coords.w = gadgetContainer.scrollWidth+paddingLeft+paddingRight;
          pxPos = dpCompStyle.paddingTop.indexOf('px');
          if (pxPos == -1) {
            pxPos = dpCompStyle.paddingTop.indexOf('em');
          }
          var tbpxPos = tbCompStyle.paddingTop.indexOf('px');
          if (tbpxPos == -1) {
            tbpxPos = tbCompStyle.paddingLeft.indexOf('em');
          }
          var paddingTop = parseInt(dpCompStyle.paddingTop.substring(0, pxPos != -1 ? pxPos : 0));
          paddingTop += parseInt(tbCompStyle.paddingTop.substring(0, tbpxPos != -1 ? tbpxPos : 0));
          pxPos = dpCompStyle.paddingBottom.indexOf('px');
          if (pxPos == -1) {
            pxPos = dpCompStyle.paddingBottom.indexOf('em');
          }
          tbpxPos = tbCompStyle.paddingBottom.indexOf('px');
          if (tbpxPos == -1) {
            tbpxPos = tbCompStyle.paddingBottom.indexOf('em');
          }
          var paddingBottom = parseInt(dpCompStyle.paddingBottom.substring(0, pxPos != -1 ? pxPos : 0));
          paddingBottom += parseInt(tbCompStyle.paddingBottom.substring(0, tbpxPos != -1 ? tbpxPos : 0));
          coords.h = gadgetContainer.scrollHeight+paddingTop+paddingBottom+titlebar.offsetHeight;

          // can't use this.resize (dijit.dialog.resize) because it takes
          // the changes and then shrinks them for some reason
          this.domNode.style.height = coords.h + "px";
          this.domNode.style.width = coords.w + "px";
        }

});

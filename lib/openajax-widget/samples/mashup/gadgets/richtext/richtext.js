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
dojo.declare("RichText", null,
{
    constructor: function() {
        this.editor = null;
    },
    onLoad: function() {
        var viewDiv = dojo.byId( this.id + "rtf_view" );
        var textcontent = this.OpenAjax.getPropertyValue("textcontent");
        viewDiv.innerHTML = this._htmlentitiesdecode(textcontent);
    },
    onEdit: function(event) {
        dojo.require("dojo.parser");
        dojo.require("dijit.Editor");
        var editDiv = dojo.byId( this.id + "rtf_edit" );
        var textcontent = this.OpenAjax.getPropertyValue("textcontent");
        var textarea = dojo.byId( this.id + "rtf_ta" );
        textarea.innerHTML = this._htmlentitiesdecode(textcontent);
        dojo.addOnLoad( function() {dojo.parser.parse(dojo.byId(this.id+"rtf_edit"));} );
        dojo.connect( dojo.query( "INPUT[type='button']", editDiv )[0], "onclick", this, "onEditSave" );
        dojo.connect( dojo.query( "INPUT[type='button']", editDiv )[1], "onclick", this, "onEditCancel" );
    },
    onEditSave: function() {
        if ( this.editor == null ) {
            this.editor = dijit.byId(this.id+"rtf_ta");
        }
        var rawEditedText = this.editor.getValue(true);
        var editedText = this._htmlentitiesencode(rawEditedText);
        this.OpenAjax.setPropertyValue("textcontent", editedText);
//        this.onLoad();
        this.onEditCancel();
    },
    onEditCancel: function() {
        if ( this.editor == null ) {
            this.editor = dijit.byId(this.id+"rtf_ta");
        }
        this.editor.close();
        this.editor.destroyRecursive();
        this.editor = null;
        this._site.hideEditor();
    },
    _htmlentitiesencode : function(content) {
        if (! content) {
            return('');
        }
        if (typeof content != 'string') {
            content = content + '';
        }
        content = content.replace(/\&/g, '&amp;');
        content = content.replace(/\>/g, '&gt;');
        content = content.replace(/\</g, '&lt;');
        return(content);
    },
    _htmlentitiesdecode : function(content) {
        if (! content) {
            return('');
        }
        content = content.replace(/\&amp;/g, '&');
        content = content.replace(/\&gt;/g, '>');
        content = content.replace(/\&lt;/g, '<');
        content = content.replace(/\&nbsp;/g, ' ');
        return(content);
    }
});

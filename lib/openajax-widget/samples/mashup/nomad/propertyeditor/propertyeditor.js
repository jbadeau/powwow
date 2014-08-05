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
dojo.require("dojo.data.ItemFileWriteStore");
dojo.require("dijit.form.Form");
dojo.require("dijit.form.CheckBox");
dojo.require("dijit.form.TextBox");
dojo.require("dijit.form.Button");
dojo.require("dijit.form.ValidationTextBox");
dojo.require("dijit.form.NumberTextBox");
//dojo.require("dijit.form.DateTextBox");
dojo.require("dijit.form.FilteringSelect");

var scripts = document.getElementsByTagName("script");
var re = /propertyeditor\/propertyeditor\.js$/i;
for ( var i = 0; i < scripts.length; i++ ) {
//        var src = scripts[i].getAttribute("src");
    var src = scripts[i].src;    // XXX should be absolute URL
    if ( src ) {
        var m = src.match( re );
        if ( m ) {
            var nomadRoot = src.substring( 0, m.index );
//console.log( "nomad root = " + nomadRoot );
        }
    }
}

//dojo.registerModulePath("nomad", "../../../nomad");
dojo.registerModulePath("nomad", nomadRoot);
dojo.require("nomad.widget.WiringDropDownButton");
dojo.require("nomad.widget.Date");
dojo.require("nomad.widget.MultiSelect");

dojo.declare("OpenAjax.widget.PropertyEditor", null,
{
    onLoad: function() {
        this._propertyDialog = null;
        
        // The property editor is treated differently than other widgets, in
        // that it will be loaded in the same domain as the mashup.  So we
        // can just get the mashupMaker object from the parent.
        this.mm = window.parent.mashupMaker;

        // have to add tundra to body instead of just a containing div since
        // the popup menus and DateTextBox widgets, etc have pieces that are
        // actually children of the body
        dojo.addClass(dojo.body(), "tundra");
        if (dojo.isIE) {
            dojo.body().scroll = 'no';
        } else {
            dojo.body().style.overflow = 'hidden';
        }
        
        // XXX HACK
        // Set property editor widget instance in MashupMaker
        this.mm.propertyEditor = this;
        
        dojo.addOnLoad( this, function() {
            this.OpenAjax.hub.publish( "nomad-propertyEditor-ready", null );
        });
    },
    windowResized:function() {
        var editorContainer = dojo.byId( this.OpenAjax.getId() + 'propertyEditor_table' );
        this.OpenAjax.adjustDimensions({width: editorContainer.scrollWidth, height: editorContainer.scrollHeight});
        this.OpenAjax.hub.publish("nomad-propertyEditor-resize", null);
    },
    _aggregate: null,
    editGadget:function(widgetModel, landingPadID, aggregate, propertyDialog) {
        console.log('PropertyEditor editGadget');

        if (landingPadID == undefined || landingPadID.length == 0) {
            return;
        }
        var landingPad = dojo.byId(landingPadID);
        if (!landingPad) {
            return;
        }
        this._propertyDialog = propertyDialog;

        // DAG: Add Aggregate as an optional parameter that allows the  user
        // to remove the Default Editor buttons. This allows the default editor
        // to be embedded (aggregated) inside a custom property editor.  If
        // this is the case, we can't assume that this propertyeditor is
        // contained in the PropertyDialog that is used by default.  However,
        // if aggregate is false, we will assume that the property editor
        // lives in the property dialog with id="propertyDialog".
        if (aggregate == null) {aggregate = false;}
        this._aggregate = aggregate;
        
//        var widgetModelProps = widgetModel.getProperties();
        var widgetModelProps = widgetModel.OpenAjax._spec.property;
        
        //if there are no properties, then show an alert
// XXX JHP TODO
//        if( widgetModelProps.length == 0 ){
//            alert( "No properties to edit!" );
//            return;
//        }

        if (!aggregate) {
            var widgetID = widgetModel.OpenAjax.getId();
            // set the title of the property dialog
// XXX JHP TODO need better way to acces "site"
            propertyDialog.setTitle('Properties for '+widgetModel.OpenAjax._site.getTitle());
            this.mm.getWiringManager().buildTopicsLists();
        }

        if (!aggregate && propertyDialog.gadgetID == widgetID) {
            //the property dialog is already populated with the necessary
            //fields so now we just need to fill them in
// XXX JHP TODO the use of "i" here is ugly
            var i = -1;
            for ( var name in widgetModelProps ) {
                i++;
                var control = dijit.byId(widgetID + 'property_' + i );
                var propType = widgetModelProps[ name ].datatype;
                var value = widgetModel.OpenAjax.getPropertyValue( name );

                switch (propType) {
                case 'Boolean':
                    if (value && value.length) {
                        value = value.toLowerCase() == 'true' ? 'checked' : '';
                    } else {
                        value = '';
                    }
                    control.setValue(value);
                    break;
                case 'Date':
                    var dateValue = value;
                    if (dateValue && dateValue.length > 0) {
                        var isISO = (dateValue.indexOf('-') == 4) &&
                            (dateValue.lastIndexOf('-') == 7);
                        if (isISO) {
                            dateValue = dojo.date.stamp.fromISOString(dateValue);
                        } else {
                            dateValue = new Date(dateValue);
                        }
                        control.setValue(dateValue);
                    }
                    break;
                default:
                    control.setValue( value );
                    break;
                }

                // Refresh the wiring input button.  Currently the output
                // button doesn't change visually so ignore it for now.
                var button = dijit.byId(widgetID+'property_'+i+'_InputBinding');
                var topic = widgetModelProps[ name ].sharedAs;
                if (button) {
                    if (topic && topic.length > 0) {
// XXX JHP TODO
//                        this.hideDefaultControl(control.id, topic, widgetModelProps[i].defaultTopic(), widgetModelProps[i].getSingleBoundGadget());
                        this.hideDefaultControl(control.id, topic, widgetModelProps[ name ].sharedAs/*, widgetModelProps[i].getSingleBoundGadget()*/);
                    } else {
                        this.showDefaultControl( control.id, widgetModel, widgetModelProps[ name ] );
                    }
                    button.refresh();
                }

                // XXX might have to handle property readonly here to hide the
                // tablerow that contains the control.  For now we'll assume
                // that it isn't changing.
            }
            return;
        }

        // We need to make sure that the landingPad is clean if we aren't
        // showing properties from the same gadget as last time
        var oldForm = dijit.byId(landingPad.id+'_form');
        if (oldForm) {
            var control = dijit.byId(widgetID+'property_'+i);
            if (control) {
                control.nomadTooltip = null;
            }
            oldForm.destroyRecursive();
        }

        // Remember what the last gadget was that we edited the properties
        // for.  That way if the user wants to edit those properties again
        // right away, there is no need to repopulate the dialog since it
        // still contains everything from the last time.
        if (!aggregate) {
            propertyDialog.gadgetID = widgetID;
        }
        var formContent = document.createElement('form');
        formContent.id = landingPad.id+'_form';
        var tableContent = document.createElement('table');
        tableContent.setAttribute("id", landingPad.id + "_table");
        var tableBody = document.createElement('tbody');
        tableContent.appendChild(tableBody);
        formContent.appendChild(tableContent);
        landingPad.appendChild(formContent);
        var formWidget = new dijit.form.Form({}, formContent);
        var tempElement = null;

// XXX JHP TODO fix use of "i"
        i = -1;
        for ( name in widgetModelProps ) {
            i++;
            var topic = widgetModelProps[ name ].sharedAs;
            var required = widgetModelProps[ name ].required;
            var tableRow = document.createElement('tr');
            var tableCell = document.createElement('td');
            tableCell.setAttribute("align", "right");
            var label = document.createElement('label');
            label.id = widgetID+'label_'+i;

//            var labelValue = widgetModelProps[i].title();    // XXX how should this be handled?
//            var nameAttr = widgetModelProps[i].name();
//            if (!labelValue || !labelValue.length) {
                var labelValue = name;
//            }
            label.name = name;
            label.innerHTML = labelValue+':';
            tableCell.appendChild(label);
            tableRow.appendChild(tableCell);

//            var createButton = widgetModelProps[i].listen();
// XXX JHP for now, don't create buttons
// XXX JHP            var createButton = widgetModelProps[ name ].sharedAs;
var createButton = false;
            tableCell  = document.createElement('td');
            tableRow.appendChild(tableCell);
            if (createButton) {
                var button = document.createElement('button');
                button.id = widgetID+'property_'+i+'_InputBinding';
                button.name = button.id;
                tableCell.appendChild(button);
                // can't use showLabel = false because that will cause an
                // error on IE
                var buttonWidget = new nomad.widget.WiringDropDownButton({
                    widgetId: widgetModel.OpenAjax.getId(),
                    property: widgetModelProps[ name ],
                    propertyEditor: this,
                    mm: this.mm
                }, button);
            }

            /* insert an input that we'll later dojo-ify once we figure out
             * what type of data this property is
             */
            tableCell = document.createElement('td');
            var input = document.createElement('input');
            input.id = widgetID+'property_'+i;
            input.name = name;
            input.type = 'text';
            input.className = 'value';
            tableCell.appendChild(input);
            var boundInput = null;
            if (createButton) {
                // If it is possible that the property could end up bound, we
                // need to create a simple text input to display if that ever
                // becomes the case.  The displayed value for a property that
                // is bound is not the property value but rather the topic
                // that the property is bound to.
                boundInput = document.createElement('input');
                boundInput.id = input.id+'_boundControl';
                boundInput.type = 'text';
                boundInput.className = 'value';
                boundInput.style.display = 'none';
                tableCell.appendChild(boundInput);
            }
            tableRow.appendChild(tableCell);
            tableBody.appendChild(tableRow);
            var propType = widgetModelProps[ name ].datatype;
            var control;

//            createButton = widgetModelProps[i].publish();
            var bindingClass = "nomadToolbarIcon nomadIconNoBinding";
            tableCell  = document.createElement('td');
            tableRow.appendChild(tableCell);
            if (createButton) {
                var button = document.createElement('button');
                button.id = widgetID+'property_'+i+'_OutputBinding';
                button.name = button.id;
                tableCell.appendChild(button);
                // can't use showLabel = false because that will cause an
                // error on IE
                var buttonWidget = new nomad.widget.WiringDropDownButton({
                    property: widgetModelProps[ name ],
                    propertyEditor: this,
                    mimicButton: true,
                    wiringInput: false,
                    mm: this.mm
                }, button);
            }

            var value = widgetModel.OpenAjax.getPropertyValue( name );

            switch (propType) {
            case 'Boolean':
                if (value && value.length) {
                    value = value.toLowerCase() == 'true' ? 'checked' : '';
                } else {
                    value = '';
                }
                control = new dijit.form.CheckBox({ checked: value }, input);
                break;
            case 'Number':
                /* XXX - handle minimum and maximum */
                var isInteger = widgetModelProps[ name ].isInteger;
                if (isInteger == "true") {
                    control = new dijit.form.ValidationTextBox({
                        regExp: "[+-]?\\d+",
                        trim: true,
                        invalidMessage: "value must be an integer"
                    }, input);
                } else {
                    control = new dijit.form.NumberTextBox({
                        trim: true
                    }, input);
                }
                control.setValue( value );
                tempElement = document.createElement('br');
                control.domNode.parentNode.appendChild(tempElement);
                tempElement = document.createElement('span');
                tempElement.className = "nomadErrorMsg";
                control.domNode.parentNode.appendChild(tempElement);
                control.displayMessage = dojo.hitch( tempElement, function(message) {
                    this.innerHTML = message;
                    var propErrorMsg = dojo.byId('propErrorMsg');
                    if ( propErrorMsg ) {
                        if (message.length) {
                            dojo.byId('propErrorMsg').style.display='none';
                        } else {
                            dojo.byId('propErrorMsg').style.display='inline';
                        }
                    }
                });
                break;
            case 'String':
            case '[String]':
                /* XXX - handle min_length and max_length */
                /* XXX - handle unconstrained on enumValues */
// XXX JHP TODO handle 'multiple'
//                var optionArray = widgetModelProps[i].getOptionArray();
//                var multiSelect = widgetModelProps[i].getOptionsValue('multiple');
//                var unconstrained = widgetModelProps[i].getOptionsValue('unconstrained');
var optionArray = null;

                if (optionArray && optionArray.length) {
                    var options = new dojo.data.ItemFileWriteStore({
                        data: {identifier: 'value',
                               items: []}
                    });
                    var numOptions = optionArray.length;
                    for (var j=0; j<numOptions; j++) {
                        var optionLabel = optionArray[j].label;
                        optionLabel = optionLabel ? optionLabel : '';
                        var optionValue = optionArray[j].value;
                        optionValue = optionValue ? optionValue : '';
                        options.newItem({label: optionLabel, value: optionValue});
                    }
                    if (multiSelect == 'true') {
                        control = new nomad.widget.MultiSelect({
                            unconstrained: unconstrained == 'true',
                            store: options
                        }, input);
                        control.startup();
                    } else {
                        // if 'multiple' not defined, then assume 'false'
                        if (unconstrained == 'true') {
                            control = new dijit.form.ComboBox({
                                autoComplete: true,
                                searchAttr: 'label',
                                labelType: 'html',
                                ignoreCase: true,
                                hasDownArrow: true,
                                store: options
                            }, input);
                        } else {
                            control = new dijit.form.FilteringSelect({
                                autoComplete: true,
                                searchAttr: 'label',
                                labelType: 'html',
                                ignoreCase: true,
                                hasDownArrow: true,
                                store: options
                            }, input);
                        }
                    }
                } else {
                    control = new dijit.form.TextBox({}, input);
                }
                control.setValue( value );
                break;
            case 'Date':
                /* XXX - handle minimum and maximum */
                var dateValue = value;
                if (dateValue && dateValue.length > 0) {
                    var isISO = (dateValue.indexOf('-') == 4) &&
                        (dateValue.lastIndexOf('-') == 7);
                    if (isISO) {
                        dateValue = dojo.date.stamp.fromISOString(dateValue);
                    } else {
                        dateValue = new Date(dateValue);
                    }
                }
                control = new nomad.widget.Date({
                    value: dateValue
                }, input);
                // need to call startup directly because custom widgets created
                // programmatically don't call startup automatically
                control.startup();
                // nomad.widget.Date already overrides displayMessage, so make
                // sure that gets called first
                var prevFunction = control.displayMessage;
                control.displayMessage = function(message) {
                    prevFunction(message);
                    var propErrorMsg = dojo.byId('propErrorMsg');
                    if ( propErrorMsg ) {
                        if (message.length) {
                            dojo.byId('propErrorMsg').style.display='none';
                        } else {
                            dojo.byId('propErrorMsg').style.display='inline';
                        }
                    }
                };
                break;
            case 'null':
            case '*':
            case 'RegExp':
            case 'Object':
            case 'Array':
            default:
                // Unhandled types, look if any special treatment is necessary.
                // We will support any variation on
                // datetype="Boolean|Number|Date" by building regular expressions
                // and applying them on a ValidationTextBox.
                // Otherwise we'll default to using a textbox without any type of
                // validation.
                var verifiable = false;
                if ( propType.indexOf('|') != -1 ) {
                    verifiable = true;
                    var types = propType.split('|');
                    var regExp = "";
                    for (var k = 0; k < types.length; k++) {
                        if (!verifiable) {
                            break;
                        }
                        switch (types[k]) {
                            case 'Boolean':
                                regExp += "(true|false)|";
                                break;
                            case 'Number':
                                var isInteger = widgetModelProps[ name ].isInteger;
                                if (isInteger == "true") {
                                    regExp += "([+-]?\\d+)|";
                                } else {
                                    regExp += "([+-]?\\d+(\\.\\d+)?)|";
                                }
                                break;
                            case 'Date':
                                // We won't support all types of date formats
                                // here and note that there is no leap year type
                                // of protection.  Just format checking.  This
                                // will check for yyyy-mm-dd, mm-dd-yyyy and
                                // dd-mm-yyyy.  Make sure that Date is the first
                                // regExp in the string since it uses
                                // backreferences.  Backreferences count the
                                // number of open parentheses in the expression
                                // and aren't scoped so it'll screw up if open
                                // parentheses appear before this regular
                                // expression.
                                regExp = "(\\d{4}([- /.])(0[1-9]|1[012])\\2(0[1-9]|[12][0-9]|3[01]))|((0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])[- /.](19|20)\\d\\d)|((0[1-9]|[12][0-9]|3[01])[- /.](0[1-9]|1[012])[- /.](19|20)\\d\\d)|" + regExp;
                                break;
                            default:
                                verifiable = false;
                                break;
                        }
                    }
                    if (verifiable && regExp.length) {
                        control = new dijit.form.ValidationTextBox({
                            regExp: regExp.slice(0,regExp.length-1),
                            trim: true,
                            invalidMessage: "value must be a "+propType
                        }, input);
                        tempElement = document.createElement('br');
                        control.domNode.parentNode.appendChild(tempElement);
                        tempElement = document.createElement('span');
                        tempElement.className = "nomadErrorMsg";
                        control.domNode.parentNode.appendChild(tempElement);
                        control.displayMessage = dojo.hitch( tempElement, function(message) {
                            this.innerHTML = message;
                            var propErrorMsg = dojo.byId('propErrorMsg');
                            if ( propErrorMsg ) {
                                if (message.length) {
                                    dojo.byId('propErrorMsg').style.display='none';
                                } else {
                                    dojo.byId('propErrorMsg').style.display='inline';
                                }
                            }
                        });
                    }
                }
                if (!verifiable) {
                    control = new dijit.form.TextBox({}, input);
                    control.setValue( value );
                }
                break;
            }

            var boundControl = null;
            if (boundInput) {
                var boundControl = new dijit.form.TextBox({}, boundInput);
                boundControl.setAttribute('disabled', true);
                if (topic && topic.length > 0) {
// XXX JHP TODO
                    this.hideDefaultControl(control.id, topic, widgetModelProps[ name ].sharedAs/*, widgetModelProps[i].getSingleBoundGadget()*/);
                } else {
                    this.showDefaultControl( control.id, widgetModel, widgetModelProps[ name ] );
                }
            }

            control.name = name;
            // Adding propertyvalue attribute so that we have something to
            // key off of with a dojo.query when we want to collect all of the
            // property controls to save their values when the save button
            // is clicked.  Can't just use the id's because sub components of
            // a widget might re-use or use variations on that id internally.
            // And can't append a classname because some widgets like
            // textbox will reset the classname back for some reason.
            control.domNode.setAttribute("propertyvalue", "true");
            if ( widgetModelProps[ name ].description ) {
                var connectArray = [];
                connectArray.push(label.id);
                if (boundControl) {
                    connectArray.push(boundControl.id);
                }
                new dijit.Tooltip({
                    label: widgetModelProps[ name ].description[0]._content_,
                    connectId: connectArray
                });

            }

            // disable the input if the property is bound (listening to a
            // topic) or if the property is readonly
            var disableInput = widgetModelProps[ name ].readonly;
            control.setAttribute('disabled', disableInput == 'true');
            if (boundControl) {
                if (widgetModelProps[ name ].sharedAs && topic && topic.length > 0) {
                    disableInput = true;
                }
            }
            if (widgetModelProps[ name ].hidden == "true") {
                tableRow.style.display = 'none';
            }
        }

        /* add the Save and Cancel buttons */
        // DAG: Only display buttons if widget is not aggregating the
        // default property editor
        if ( ! aggregate ) {
            tableRow = document.createElement('tr');
            tableCell = document.createElement('td');
            tableCell.colSpan = 6;
            tableCell.innerHTML = '<BR/><SPAN id="propErrorMsg">&nbsp;</SPAN>';
            tableRow.appendChild(tableCell);
            tableBody.appendChild(tableRow);
            tableRow = document.createElement('tr');
            tableCell = document.createElement('td');
            tableCell.colSpan = 6;
            tableCell.innerHTML = '<DIV  STYLE="border-top:1px solid black">&nbsp;</DIV>';
            tableRow.appendChild(tableCell);
            tableBody.appendChild(tableRow);
            tableRow = document.createElement('tr');
            tableCell = document.createElement('td');
            tableCell.colSpan = 6;
            tableCell.valign = 'middle';
            var buttonContainer = document.createElement('center');
            var button = document.createElement('button');
            button.id = widgetID+'propertyEditorSaveButton';
            buttonContainer.appendChild(button);
            var button = document.createElement('button');
            button.id = widgetID+'propertyEditorCancelButton';
            buttonContainer.appendChild(button);
            tableCell.appendChild(buttonContainer);
            tableRow.appendChild(tableCell);
            tableBody.appendChild(tableRow);
            
            control = new dijit.form.Button({
                label: 'Save',
                value: 'Save',
                onClick: dojo.hitch(this, this._saveEdit)
            }, dojo.byId(widgetID+'propertyEditorSaveButton'));
            control.gadget = widgetModel;
            control = new dijit.form.Button({
                label: 'Cancel',
                value: 'Cancel',
                onClick: dojo.hitch(this, this._cancelEdit)
            }, dojo.byId(widgetID+'propertyEditorCancelButton'));
            control.gadget = widgetModel;
        }

        //            tableContent.width = "100%";
        //            tableContent.height = "100%";
        //            formContent.style.width = "100%";
        //            formContent.style.height = "100%";
        this._landingPad = landingPad;
        this.windowResized();
    },
    showDefaultControl: function( id, widget, property ) {
        // Hide the control that shows when this property is bound and
        // show the control that represents the property's value.  Update
        // the control with the property's current value.
        if (id == null || id.length < 1) {
            return;
        }
        var control = dijit.byId(id).domNode;
        var boundControl = dojo.byId(id+'_boundControl');
        if (!control || !boundControl) {
            return;
        }
        if (property) {
            dijit.byId(id).setValue( widget.OpenAjax.getPropertyValue( property.name ) );
        }
        if (control.style.display == 'none') {
            if (control.oldDisplay) {
                control.style.display = control.oldDisplay;
            } else {
                control.style.display = 'inline';
            }
        }
        boundControl.style.display = 'none';
    },
    hideDefaultControl: function(id, topic, defaultTopic, publishingGadget) {
        // Show the control that shows when this property is bound and
        // hide the control that represents the property's value.  Update
        // the displayed control with text based on the property's topic.
        if (id == null || id.length < 1) {
            return;
        }
        var control = dijit.byId(id).domNode;
        var boundControl = dojo.byId(id+'_boundControl');
        if (!control || !boundControl) {
            return;
        }

        var pubGadget = publishingGadget;
        if (typeof publishingGadget === "undefined") {
            pubGadget = null;
        } else if ( publishingGadget != null && typeof publishingGadget === "object" ) {
            pubGadget = publishingGadget.gID;
        }
        if (topic && topic.length > 0) {
            if (pubGadget) {
                dijit.byId(boundControl.id).setValue('Topic '+topic+' published by gadget '+pubGadget);
            } else if (topic == defaultTopic) {
                dijit.byId(boundControl.id).setValue('All '+topic+' topics');
            }
        }
        if (control.style.display != 'none') {
            // remember the original displayStyle for the domNode for cases like
            // datatype = 'number' where the control is a table underneath and
            // not a simple input control
            control.oldDisplay = control.style.display;
            control.style.display = 'none';
        }
        boundControl.style.display = 'inline';
    },
    wiringSessionStarting: function(/* widget */sessionButton, topic) {
        // sessionButton is the WiringDropDownButton that the user used to
        // request a wiring session and topic is the current topic for the
        // property associated with the wiring session
        if (!this._aggregate) {
            var propertyDialog = this._propertyDialog;
            propertyDialog.rollupContent(topic, sessionButton.wiringInput);
            var that = this;
            var callback = function( success, subHandle ) {
                if ( !success ) {
                    // XXX handle error
                    alert( "dialog rolldown subscribe failed" );
                    return;
                }
                that._rolldownListener = subHandle;
            };
            this.mm.hub.subscribe("nomad-dialog-rolldown", callback, dojo.hitch(sessionButton, sessionButton.onWiringCancelled) );
        }
    },
    wiringSessionCompleting: function(/* boolean */cancelled) {
        if (!this._aggregate) {
            if (this._rolldownListener) {
                var callback = function( success, subHandle ) {};
                this._rolldownListener.unsubscribe(callback);
                this._rolldownListener = null;
            }
            if (!cancelled) {
                var propertyDialog = this._propertyDialog;
                propertyDialog.rolldownContent();
            }
        }
    },
    _cancelEdit: function(event) {
        if (!this._aggregate) {
            this._propertyDialog.hide();
            if (this._rolldownListener) {
                var callback = function( success, subHandle ) {};
                this._rolldownListener.unsubscribe(callback);
                this._rolldownListener = null;
            }
        }
        var wiringManager = this.mm.getWiringManager();
        wiringManager.cancelWiringChanges();
    },
    _saveEdit : function(event) {
        /* XXX - handle required */
        event = event ? event : window.event;
        var target = event.srcElement ? event.srcElement : event.target;

        var gadget = dijit.getEnclosingWidget(target).gadget;
        if (gadget) {
            var wiringManager = this.mm.getWiringManager();
            wiringManager.commitWiringChanges();

            //get all the values and set the properties of the gadget
            var inputs = dojo.query( '*[propertyvalue="true"]',
                dojo.byId(gadget.OpenAjax.getId()+'propertyEditor') );

            // enable batch mode
// XXX JHP TODO do we still need batch mode?
//            gadget.setBatchMode(true);

            // prevent the user from saving invalid data
            var formValid = true;
            for (var i=0; i<inputs.length; i++) {
                var valueWidget = dijit.byNode(inputs[i]);
                var prop = gadget.OpenAjax._spec.property[ valueWidget.name ];
                if (!prop) {
                    // If not a property then valueWidget doesn't represent
                    // the value of a property so it is probably the
                    // input used to show topic information
                    continue;
                }
                
                // We want to prevent the user from entering and then
                // saving invalid values so only worry about the validity
                // of a widget control if the property is not subscribing to a
                // topic and not readonly.  That is the only scenario where the
                // user could have changed the value in the widget.
// XXX JHP TODO
//                if ((!prop.listen() || prop.topic() == "") && !valueWidget.disabled) {
//                    if (typeof valueWidget.isValid == 'function') {
//                        if (!valueWidget.isValid()) {
//                            formValid = false;
//                            break;
//                        }
//                    }
//                }
            }

            if (!formValid) {
                return;
            }

            for (var i=0; i<inputs.length; i++) {
                var valueWidget = dijit.byNode(inputs[i]);
                var prop = gadget.OpenAjax._spec.property[ valueWidget.name ];
                if (!prop) {
                    // If not a property then valueWidget doesn't represent
                    // the value of a property so it is probably the
                    // input used to show topic information
                    continue;
                }
                
                // Value should be set last so changes will trigger the
                // events on the right topic.  Also only set the value to
                // the value contained in valueWidget if the property is
                // not subscribing to a topic and not readonly.  The logic being
                // that if the property is subscribing to a topic, then its
                // value shouldn't have changed due to property editing.  It
                // should only change when the topic it is listening to fires.
                // A readonly property, of course, should never change.
// XXX JHP TODO                if ((!prop.listen() || prop.topic() == "") && !valueWidget.disabled) {
                if ( !valueWidget.disabled ) {
                    if (typeof valueWidget.checked != 'undefined') {
                        // valueWidget is a CheckBox or a RadioButton or another
                        // type of ToggleButton
                        gadget.OpenAjax.setPropertyValue( valueWidget.name, Boolean(valueWidget.checked).toString() );
                    } else {
                        gadget.OpenAjax.setPropertyValue( valueWidget.name, valueWidget.getValue() );
                    }
                }
            }

            // disable batch mode
//            gadget.setBatchMode(false);

        }

        if (!this._aggregate) {
            this._propertyDialog.hide();
            if (this._rolldownListener) {
                var callback = function( success, subHandle ) {};
                this._rolldownListener.unsubscribe(callback);
                this._rolldownListener = null;
            }
        }
    }

});

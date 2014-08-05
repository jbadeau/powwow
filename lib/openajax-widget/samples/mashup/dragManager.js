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
function DragManager(/* click event*/ event,
                     /*nomad.widget.paletteItem*/ paletteItem,
                     /* drop handler callback function */ dropCallback,
                     /* end drag callback function */ stopDND) {

  if (!this.dndNode) {
    var div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.display = 'none';
    div.style.cursor = 'default';
    Browser.setAlpha(div, 0.6);
    div.style.zIndex = 5000;
    this.dndNode = document.body.appendChild(div);
  }

  this.setDragItem(paletteItem);
  this.stopDND = stopDND;
  this.dropCallback = dropCallback;

  // srcElement is the element that was clicked on (the drag icon from the
  // palette item
  var srcElement = event.target;
  if (!srcElement) {
    alert("can't find the src element for the drag");
  }

  var clone = srcElement.cloneNode(true);
  clone.style.margin = 0;
  this.dndNode.innerHTML = "";
  this.dndNode.appendChild(clone);

  var eventListeners = [];
//  eventListeners[0] = dojo.connect(document, "onmousemove", this.mouseMove);
//  eventListeners[1] = dojo.connect(document, "onclick", this.dropHandler);
//  eventListeners[2] = dojo.connect(document, "onkeypress", this.keyHandler);
  this.eventListeners = eventListeners;

  this.dndNode.style.display = "block";
  this.mouseMove(event, true);
}

DragManager.prototype.mouseMove = function(/* mouse event*/ event, /* boolean */ duringConstruction) {
  // assuming width and height of pointer is 8
  var dragManager;
  if (duringConstruction) {
    dragManager = this;
  } else {
    dragManager = mashupMaker.getDragManager();
  }

  var dragPosition = dragManager.dndNode.style;
  dragPosition.left = event.pageX + 8;
  dragPosition.top = event.pageY + 8;
}

DragManager.prototype.dropHandler = function(/* mouse event*/ event) {
  var dragManager = mashupMaker.getDragManager();
  var paletteItem = dragManager.getDragItem();
  if (dragManager.dropCallback) {
    dragManager.dropCallback(event, paletteItem);
  }
  dragManager.cancelDrag(event);
}

DragManager.prototype.keyHandler = function(/* mouse event*/ event) {
  var key = event.keyCode;
  if (key == dojo.keys.ESCAPE) {
    mashupMaker.getDragManager().cancelDrag(event);
  }
}

DragManager.prototype.cancelDrag = function(/* mouse event*/ event) {
  this.dndNode.style.display = 'none';
  for (var i = this.eventListeners.length; i > 0; i--) {
    dojo.disconnect(this.eventListeners[i-1]);
  }
  this.setDragItem(null);
  if (this.stopDND) {
    this.stopDND();
  }
}

DragManager.prototype.setDragItem = function(/* nomad.widget.paletteItem */ item) {
  this._dragItem = item;
}

DragManager.prototype.getDragItem = function() {
  return this._dragItem;
}

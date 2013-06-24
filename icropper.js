(function(){

    //Some common utility functions
    var util = {
        create: function(tag, attrs){
            var node = document.createElement(tag);
            this.mixin(node, attrs);
        }
        ,connect: function(node, evt, callback){

        }
        ,style: function(node, args){
            if(typeof args == 'string')return node.style[args];
            else this.mixin(node.style, args);
        }
        ,mixin: function(dest, src){
            for(var p in src)dest[p] = src[p];
        }
        ,each: function(arr, callback){
            for(var i = 0; i < arr.length; i++)
                callback(arr[i], i);
        }
        ,indexOf: function(arr, value){
            for(var i = 0; i < arr.length; i++)
                if(value == arr[i])return i;
            return -1;
        }
        ,addCss: function(node, css){
            if(!node)return;
            var cn = node.className || '', arr = cn.split(' '), i = util.indexOf(arr, css);
            if(i < 0)arr.push(css);
            node.className = arr.join(' ');
        }
        ,rmCss: function(node, css){
            if(!node)return;
            var cn = node.className || '', arr = cn.split(' '), i = util.indexOf(arr, css);
            if(i >= 0)arr.splice(i, 1);
            node.className = arr.join(' ');
        }
    };

    function fixEvent(evt){
        evt = evt || event; 
        if(!evt.target)evt.target = evt.srcElement;
        if(!evt.keyCode)evt.keyCode = evt.which || evt.charCode;
        if(!evt.pageX){//only for IE
           evt.pageX = evt.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
           evt.pageY = evt.clientY + document.body.scrollTop + document.documentElement.scrollTop;
        }
        return evt;
    }

    window.ICropper = function (container, options){
        for(var p in options){
            if(options[p])this[p] = options[p];
        }
        this.init(container);
    }

    ICropper.prototype = {
        image: ''
        ,width: ''
        ,height: ''
        ,minWidth: 20
        ,minHeight: 20

        //gap between crop region border and container border
        ,gap: 50

        //the initial crop region width and height
        ,initialSize: 0

        //whether to keep crop region as a square
        ,keepSquare: false

        ,domNode: null
        ,cropNode: null
        ,imageNode: null

        ,init: function(container) {
            this.domNode = container || document.createElement('div');
            util.addCss(this.domNode, 'icropper');
            this.buildRendering();

            this.updateUI();
            util.connect(this.cropNode, 'onmousedown', '_onMouseDown');
            util.connect(document, 'onmouseup', '_onMouseUp');
            util.connect(document, 'onmousemove', '_onMouseMove');
            util.setSelectable(this.domNode, false);
            this.image && this.setImage(this.image);
        }

        ,buildRendering: function() {
            this._archors = {};
            this._blockNodes = {};

            this.cropNode = util.create('div', {className: 'crop-node'});
            this.domNode.appendChild(this.cropNode);

            //Create archors
            var arr = ['lt', 't', 'rt', 'r', 'rb', 'b', 'lb', 'l'];
            for (var i = 0; i < 8; i++) {
                var n = util.create('div', {className: arr[i]});
                this.cropNode.appendChild(n);
                this._archors[arr[i]] = n;
            }

            //Create blocks for showing dark areas
            arr = ['l', 't', 'r', 'b'];
            for (var i = 0; i < 4; i++) {
                var n = document.createElement('div');
                n.className = 'block block-' + arr[i];
                this.domNode.appendChild(n);
            }
        }

        ,setImage: function(url) {
            var img = new Image();
            img.src = url;
            this.image = url;
            if (!this.imageNode) {
                this.imageNode = document.createElement('img');
                this.domNode.appendChild(this.imageNode);
            }
            this.imageNode.src = url;

            //Fit the container size
            if (!this.imageNode.offsetWidth) {
                var self = this;
                this.imageNode.onload = function(){
                    self.setSize(self.imageNode.offsetWidth, self.imageNode.offsetHeight);
                }
            } else {
                this.setSize(this.imageNode.offsetWidth, this.imageNode.offsetHeight);
            }
        }

        ,setSize: function(w, h) {

            this.domNode.style.width = w + 'px';
            this.domNode.style.height = h + 'px';

            var w2, h2;
            if (this.initialSize) {
                var m = Math.min(w, h, this.initialSize);
                w2 = h2 = m - 2 + 'px';
            } else {
                w2 = w - this.gap * 2 - 2 + 'px'
                h2 = h - this.gap * 2 - 2 + 'px'
            }

            var s = this.cropNode.style;
            s.width = w2;
            s.height = h2;

            var l = (w - this.cropNode.offsetWidth) / 2
                ,t = (h - this.cropNode.offsetHeight) / 2;

            if (l < 0) l = 0;
            if (t < 0) t = 0;

            s.left = l + 'px';
            s.top = t + 'px';
     
            this.posArchors();
            this.posBlocks();
            this.onChange(this.getInfo());
        }

        ,updateUI: function() {
            this.posArchors();
            this.posBlocks();
        }

        ,posArchors: function() {
            var a = this._archors,
                w = this.cropNode.offsetWidth,
                h = this.cropNode.offsetHeight;

            a.t.style.left = a.b.style.left = w / 2 - 4 + 'px';
            a.l.style.top = a.r.style.top = h / 2 - 4 + 'px';
        }

        ,posBlocks: function() {
            var p = this.startedPos,
                b = this._blockNodes;
            var l = parseInt(this.cropNode.style.left);
            var t = parseInt(this.cropNode.style.top);
            var w = this.cropNode.offsetWidth;
            var ww = this.domNode.offsetWidth;
            var h = this.cropNode.offsetHeight;
            var hh = this.domNode.offsetHeight;

            b = this._blockNodes;
            b.t.style.height = b.l.style.top = b.r.style.top = t + 'px';

            b.l.style.height = b.r.style.height = h + 'px';
            b.l.style.width = l + 'px';

            b.r.style.width = ww - w - l + 'px';
            b.b.style.height = hh - h - t + 'px';
        }

        ,_onMouseDown: function(e) {
            this.dragging = e.target == this.cropNode ? 'move' : e.target.className;
            var pos = dojo.position(this.cropNode);
            var pos2 = dojo.position(this.domNode);
            //console.debug(pos,e);
            this.startedPos = {
                x: e.pageX,
                y: e.pageY,
                h: pos.h - 2 //2 is border width
                ,
                w: pos.w - 2,
                l: pos.x - pos2.x,
                t: pos.y - pos2.y
            }
            var c = dojo.style(e.target, 'cursor');
            dojo.style(document.body, {
                cursor: c
            });
            dojo.style(this.cropNode, {
                cursor: c
            });

        }

        ,_onMouseUp: function(e) {
            this.dragging = false;
            dojo.style(document.body, {
                cursor: 'default'
            });
            dojo.style(this.cropNode, {
                cursor: 'move'
            });
            this.onDone(this.getInfo());
        }

        ,getInfo: function() {
            return {
                w: this.cropNode.offsetWidth - 2,
                h: this.cropNode.offsetHeight - 2,
                l: parseInt(this.cropNode.style.left || dojo.style(this.cropNode, 'left')),
                t: parseInt(this.cropNode.style.top || dojo.style(this.cropNode, 'top')),
                cw: this.domNode.offsetWidth //container width
                ,
                ch: this.domNode.offsetHeight //container height
            };
        }

        ,_onMouseMove: function(e) {
            if (!this.dragging) return;

            if (this.dragging == 'move') this.doMove(e);
            else this.doResize(e);
            this.updateUI();

            this.onChange(this.getInfo());
        }

        ,doMove: function(e) {
            //console.debug('doing move',e);
            var s = this.cropNode.style,
                p0 = this.startedPos;
            var l = p0.l + e.pageX - p0.x;
            var t = p0.t + e.pageY - p0.y;
            if (l < 0) l = 0;
            if (t < 0) t = 0;
            var maxL = this.domNode.offsetWidth - this.cropNode.offsetWidth;
            var maxT = this.domNode.offsetHeight - this.cropNode.offsetHeight;
            if (l > maxL) l = maxL;
            if (t > maxT) t = maxT;
            s.left = l + 'px';
            s.top = t + 'px'

        }

        ,onChange: function() {
            //Event:
            //    When the cropping size is changed.
        }
        ,onDone: function() {
            //Event:
            //    When mouseup.
        }
        ,doResize: function(e) {
            var m = this.dragging,
                s = this.cropNode.style,
                p0 = this.startedPos;
            //delta x and delta y
            var dx = e.pageX - p0.x,
                dy = e.pageY - p0.y;

            if (this.keepSquare) {
                if (m == 'l') {
                    dy = dx;
                    if (p0.l + dx < 0) dx = dy = -p0.l;
                    if (p0.t + dy < 0) dx = dy = -p0.t;
                    m = 'lt';
                } else if (m == 'r') {
                    dy = dx;
                    m = 'rb';
                } else if (m == 'b') {
                    dx = dy;
                    m = 'rb';
                } else if (m == 'lt') {
                    dx = dy = Math.abs(dx) > Math.abs(dy) ? dx : dy;
                    if (p0.l + dx < 0) dx = dy = -p0.l;
                    if (p0.t + dy < 0) dx = dy = -p0.t;
                } else if (m == 'lb') {
                    dy = -dx;
                    if (p0.l + dx < 0) {
                        dx = -p0.l;
                        dy = p0.l;
                    }
                } else if (m == 'rt' || m == 't') {
                    dx = -dy;
                    m = 'rt';
                    if (p0.t + dy < 0) {
                        dy = -p0.t;
                        dx = -dy;
                    }
                }
            }
            if (/l/.test(m)) {
                dx = Math.min(dx, p0.w - this.minWidth);
                if (p0.l + dx >= 0) {
                    s.left = p0.l + dx + 'px';
                    s.width = p0.w - dx + 'px';
                } else {
                    s.left = 0;
                    s.width = p0.l + p0.w + 'px';
                }
            }
            if (/t/.test(m)) {
                dy = Math.min(dy, p0.h - this.minHeight);
                if (p0.t + dy >= 0) {
                    s.top = p0.t + dy + 'px';
                    s.height = p0.h - dy + 'px';
                } else {
                    s.top = 0;
                    s.height = p0.t + p0.h + 'px';
                }
            }
            if (/r/.test(m)) {
                dx = Math.max(dx, this.minWidth - p0.w);
                if (p0.l + p0.w + dx <= this.domNode.offsetWidth) {
                    s.width = p0.w + dx + 'px';
                } else {
                    s.width = this.domNode.offsetWidth - p0.l - 2 + 'px';
                }
            }
            if (/b/.test(m)) {
                dy = Math.max(dy, this.minHeight - p0.h);
                if (p0.t + p0.h + dy <= this.domNode.offsetHeight) {
                    s.height = p0.h + dy + 'px';
                } else {
                    s.height = this.domNode.offsetHeight - p0.t - 2 + 'px';
                }
            }

            if (this.keepSquare) {
                var min = Math.min(parseInt(s.width), parseInt(s.height));
                s.height = s.width = min + 'px';
            }
        }

    }


})();
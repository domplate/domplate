
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };


var DefaultRep = function() {};

exports.rep = new DefaultRep();

exports.extend = function(obj) {
    var rep = function() {};
    rep.prototype = exports.rep;
    var rep = new rep();
    for (var n in obj) rep[n] = obj[n];
    return rep;
}

DefaultRep.prototype.toString = function()
{
    return "[default-rep]";
}

/*
DefaultRep.prototype._appender = function(object, row, rep)
{
    var ret = rep.tag.append({
        node: object
    }, row);
    
    return ret;                
};
*/

DefaultRep.prototype.setCollection = function(collection)
{
    this.collection = collection;
};

DefaultRep.prototype.getRepTagForNode = function(node) {
    return this.getRepForNode(node).tag;
}

DefaultRep.prototype.getRepForNode = function(node)
{
    if(!this.collection) {
        throw "No collection set for rep: " + this.toString();
    }
    
    return this.collection.getForNode(node);
};



DefaultRep.prototype.util = new function() {
    
    var self = this;
    
    this.isLeftClick = function(event)
    {
        return event.button == 0 && self.noKeyModifiers(event);
    };
    
    this.noKeyModifiers = function(event)
    {
        return !event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey;
    };
    
    this.getAncestorByClass = function(node, className)
    {
        for (var parent = node; parent; parent = parent.parentNode)
        {
            if (self.hasClass(parent, className))
                return parent;
        }
    
        return null;
    };
    
    this.getElementByClass = function(node, className)  // className, className, ...
    {
        var args = cloneArray(arguments); args.splice(0, 1);
        for (var child = node.firstChild; child; child = child.nextSibling)
        {
            var args1 = cloneArray(args); args1.unshift(child);
            if (self.hasClass.apply(null, args1))
                return child;
            else
            {
                var found = self.getElementByClass.apply(null, args1);
                if (found)
                    return found;
            }
        }
    
        return null;
    };
    
    this.setClass = function(node, name)
    {
        if (node && !self.hasClass(node, name))
            node.className += " " + name;
    };
    
    this.hasClass = function(node, name) // className, className, ...
    {
        if (!node || node.nodeType != 1)
            return false;
        else
        {
            for (var i=1; i<arguments.length; ++i)
            {
                var name = arguments[i];
                var re = new RegExp("(^|\\s)"+name+"($|\\s)");
                if (!re.exec(node.getAttribute("class")))
                    return false;
            }
    
            return true;
        }
    };
    
    this.removeClass = function(node, name)
    {
        if (node && node.className)
        {
            var index = node.className.indexOf(name);
            if (index >= 0)
            {
                var size = name.length;
                node.className = node.className.substr(0,index-1) + node.className.substr(index+size);
            }
        }
    };
}();
    



function cloneArray(array, fn)
{
   var newArray = [];

   if (fn)
       for (var i = 0; i < array.length; ++i)
           newArray.push(fn(array[i]));
   else
       for (var i = 0; i < array.length; ++i)
           newArray.push(array[i]);

   return newArray;
}


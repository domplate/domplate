

var RT = require("./rt");

var DomplateDebug = exports.DomplateDebug = require("./debug").DomplateDebug;

var Renderer = exports.Renderer = require("./renderer").Renderer;
Renderer.DomplateDebug = DomplateDebug;


function Domplate (exports) {

exports.util = require("./util");

exports.EVAL = {
    compileMarkup: function (code, context) {
        return context.compiled(context);
    },
    compileDOM: function (code, context) {
        return context.compiled(context);
    }
};

/**
 * Original source by Joe Hewitt (http://joehewitt.com/).
 * @see http://code.google.com/p/fbug/source/browse/branches/firebug1.4/content/firebug/domplate.js
 */

/**
 * Modifications by Christoph Dorn <christoph@christophdorn.com>:
 * 
 * Sep  7, 2008: Added DomplateDebug logging
 * Sep 10, 2008: Added support for multiple function arguments
 * Sep 16, 2008: Removed calls to FBTrace as DomplateDebug does that now
 *               Removed requirement for FBL
 *               Removed use of top. scope
 *               Started work on IF support
 * 
 * 
 */

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

exports.tags = {};
exports.tags._domplate_ = exports;


var DomplateTag = exports.DomplateTag = function DomplateTag(tagName)
{
    this.tagName = tagName;
}

function DomplateEmbed()
{
}

function DomplateLoop()
{
}

function DomplateIf()
{
}

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *



function copyArray(oldArray)
{
    var ary = [];
    if (oldArray)
        for (var i = 0; i < oldArray.length; ++i)
            ary.push(oldArray[i]);
   return ary;
}

function copyObject(l, r)
{
    var m = {};
    extend(m, l);
    extend(m, r);
    return m;
}

function extend(l, r)
{
    for (var n in r)
        l[n] = r[n];
}


var womb = null;

var domplate = exports.domplate = function()
{
    var lastSubject;
    for (var i = 0; i < arguments.length; ++i)
        lastSubject = lastSubject ? copyObject(lastSubject, arguments[i]) : arguments[i];

    for (var name in lastSubject)
    {
        var val = lastSubject[name];
        if (isTag(val))
            val.tag.subject = lastSubject;
    }

    return lastSubject;
};


domplate.context = function(context, fn)
{
    var lastContext = domplate.lastContext;
    domplate.topContext = context;
    fn.apply(context);
    domplate.topContext = lastContext;
};

exports.tags.TAG = function()
//domplate.TAG = function()
{
    var embed = new DomplateEmbed();
    return embed.merge(arguments);
};

exports.tags.FOR = domplate.FOR = function()
{
    var loop = new DomplateLoop();
    return loop.merge(arguments);
};

exports.tags.IF = domplate.IF = function()
{
    var loop = new DomplateIf();
    return loop.merge(arguments);
};

DomplateTag.prototype =
{
    merge: function(args, oldTag)
    {
        if (oldTag)
            this.tagName = oldTag.tagName;

        this.context = oldTag ? oldTag.context : null;
        this.subject = oldTag ? oldTag.subject : null;
        this.attrs = oldTag ? copyObject(oldTag.attrs) : {};
        this.classes = oldTag ? copyObject(oldTag.classes) : {};
        this.props = oldTag ? copyObject(oldTag.props) : null;
        this.listeners = oldTag ? copyArray(oldTag.listeners) : null;
        this.children = oldTag ? copyArray(oldTag.children) : [];
        this.vars = oldTag ? copyArray(oldTag.vars) : [];

        var attrs = args.length ? args[0] : null;
        var hasAttrs = typeof(attrs) == "object" && !isTag(attrs);

        this.resources = {};
        this.children = [];

        if (domplate.topContext)
            this.context = domplate.topContext;

        if (args.length)
            parseChildren(args, hasAttrs ? 1 : 0, this.vars, this.children);

        if (hasAttrs)
            this.parseAttrs(attrs);

        return creator(this, DomplateTag);
    },

    parseAttrs: function(args)
    {
        DomplateDebug.startGroup('DomplateTag.parseAttrs',arguments);

        for (var name in args)
        {
            DomplateDebug.logVar('name',name);
            DomplateDebug.logVar('args[name]',args[name]);

            var val = parseValue(args[name]);
            readPartNames(val, this.vars);

            if (name.indexOf("on") == 0)
            {
                var eventName = name.substr(2);
                if (!this.listeners)
                    this.listeners = [];
                this.listeners.push(eventName, val);
            }
            else if (name[0] == "_")
            {
                var propName = name.substr(1);
                if (!this.props)
                    this.props = {};
                this.props[propName] = val;
            }
            else if (name[0] == "$")
            {
                var className = name.substr(1);
                if (!this.classes)
                    this.classes = {};
                this.classes[className] = val;
            }
            else
            {
                if (name == "class" && this.attrs.hasOwnProperty(name) )
                    this.attrs[name] += " " + val;
                else
                    this.attrs[name] = val;
            }
        }

        DomplateDebug.endGroup();
    },

    compile: function()
    {
        DomplateDebug.startGroup(['DomplateTag.compile',this.tagName]);

        if (this.renderMarkup) {
    
            DomplateDebug.log('ALREADY COMPILED');

            DomplateDebug.endGroup();
            return;
        }

        if(this.subject._resources) {
            this.resources = this.subject._resources();     
        }

        this.compileMarkup();
        this.compileDOM();

        DomplateDebug.endGroup();
    },

    compileMarkup: function()
    {
        DomplateDebug.startGroup('DomplateTag.compileMarkup');

        this.markupArgs = [];
        var topBlock = [], topOuts = [], blocks = [], info = {args: this.markupArgs, argIndex: 0};
         
        this.generateMarkup(topBlock, topOuts, blocks, info);
        this.addCode(topBlock, topOuts, blocks);

        var fnBlock = ['(function (__code__, __context__, __in__, __out__'];
        for (var i = 0; i < info.argIndex; ++i)
            fnBlock.push(', s', i);
        fnBlock.push(') {');

        fnBlock.push('  DomplateDebug.startGroup([\' .. Run Markup .. \',\''+this.tagName+'\'],arguments);');
        fnBlock.push('  DomplateDebug.logJs(\'js\',\'__SELF__JS__\');');

        if (this.subject)
            fnBlock.push('  with (this) {');
        if (this.context) 
            fnBlock.push('  with (__context__) {');
        fnBlock.push('  with (__in__) {');

        fnBlock.push.apply(fnBlock, blocks);

        if (this.subject)
            fnBlock.push('  }');
        if (this.context)
            fnBlock.push('  }');

        fnBlock.push('DomplateDebug.endGroup();');

        fnBlock.push('}})');

        var self = this;

        var js = fnBlock.join("");

        DomplateDebug.logVar('js',js);

        // Inject the compiled JS so we can view it later in the console when the code runs     
        js = js.replace('__SELF__JS__',js.replace(/\'/g,'\\\''));

//system.print(js,'JS');

        this.renderMarkup = exports.EVAL.compileMarkup(js, RT.makeMarkupRuntime({
            DomplateDebug: DomplateDebug,
            self: self,
            compiled: this.subject.tag__markup
        }));

        DomplateDebug.endGroup();
    },

    getVarNames: function(args)
    {
        if (this.vars)
            args.push.apply(args, this.vars);

        for (var i = 0; i < this.children.length; ++i)
        {
            var child = this.children[i];
            if (isTag(child))
                child.tag.getVarNames(args);
            else if (child instanceof Parts)
            {
                for (var i = 0; i < child.parts.length; ++i)
                {
                    if (child.parts[i] instanceof Variables)
                    {
                        var name = child.parts[i].names[0];
                        var names = name.split(".");
                        args.push(names[0]);
                    }
                }
            }
        }
    },

    generateMarkup: function(topBlock, topOuts, blocks, info)
    {
        topBlock.push(',"<', this.tagName, '"');

        for (var name in this.attrs)
        {
            if (name != "class")
            {
                var val = this.attrs[name];
                topBlock.push(', " ', name, '=\\""');
                addParts(val, ',', topBlock, info, true);
                topBlock.push(', "\\""');
            }
        }

        if (this.listeners)
        {
            for (var i = 0; i < this.listeners.length; i += 2)
                readPartNames(this.listeners[i+1], topOuts);
        }

        if (this.props)
        {
            for (var name in this.props)
                readPartNames(this.props[name], topOuts);
        }

        if ( this.attrs.hasOwnProperty("class") || this.classes)
        {
            topBlock.push(', " class=\\""');
            if (this.attrs.hasOwnProperty("class"))
                addParts(this.attrs["class"], ',', topBlock, info, true);
              topBlock.push(', " "');
            for (var name in this.classes)
            {
                topBlock.push(', (');
                addParts(this.classes[name], '', topBlock, info);
                topBlock.push(' ? "', name, '" + " " : "")');
            }
            topBlock.push(', "\\""');
        }
        if(this.tagName=="br") {
            topBlock.push(',"/>"');
        } else {
            topBlock.push(',">"');
            this.generateChildMarkup(topBlock, topOuts, blocks, info);
    
            topBlock.push(',"</', this.tagName, '>"');
        }
    },

    generateChildMarkup: function(topBlock, topOuts, blocks, info)
    {
        for (var i = 0; i < this.children.length; ++i)
        {
            var child = this.children[i];
            if (isTag(child))
                child.tag.generateMarkup(topBlock, topOuts, blocks, info);
            else
                addParts(child, ',', topBlock, info, true);
        }
    },

    addCode: function(topBlock, topOuts, blocks)
    {
        if (topBlock.length)
            blocks.push('    __code__.push(""', topBlock.join(""), ');');
        if (topOuts.length)
            blocks.push('__out__.push(', topOuts.join(","), ');');
        topBlock.splice(0, topBlock.length);
        topOuts.splice(0, topOuts.length);
    },

    addLocals: function(blocks)
    {
        var varNames = [];
        this.getVarNames(varNames);

        var map = {};
        for (var i = 0; i < varNames.length; ++i)
        {
            var name = varNames[i];
            if ( map.hasOwnProperty(name) )
                continue;

            map[name] = 1;
            var names = name.split(".");
            blocks.push('var ', names[0] + ' = ' + '__in__.' + names[0] + ';');
        }
    },

    compileDOM: function()
    {
        DomplateDebug.startGroup('DomplateTag.compileDOM');
      
        var path = [];
        var blocks = [];
        this.domArgs = [];
        path.embedIndex = 0;
        path.loopIndex = 0;
        path.ifIndex = 0;
        path.staticIndex = 0;
        path.renderIndex = 0;
        var nodeCount = this.generateDOM(path, blocks, this.domArgs);

        var fnBlock = ['(function (root, context, o'];
        for (var i = 0; i < path.staticIndex; ++i)
            fnBlock.push(', ', 's'+i);
        for (var i = 0; i < path.renderIndex; ++i)
            fnBlock.push(', ', 'd'+i);
        fnBlock.push(') {');

        fnBlock.push('  DomplateDebug.startGroup([\' .. Run DOM .. \',\''+this.tagName+'\'],arguments);');

        fnBlock.push('  DomplateDebug.logJs(\'js\',\'__SELF__JS__\');');

        
        for (var i = 0; i < path.loopIndex; ++i)
            fnBlock.push('  var l', i, ' = 0;');
        for (var i = 0; i < path.ifIndex; ++i)
            fnBlock.push('  var if_', i, ' = 0;');
        for (var i = 0; i < path.embedIndex; ++i)
            fnBlock.push('  var e', i, ' = 0;');

        if (this.subject) {
            fnBlock.push('  with (this) {');
        }
        if (this.context) {
            fnBlock.push('    with (context) {');
            fnBlock.push('      DomplateDebug.logVar(\'context\',context);');
        }

        fnBlock.push(blocks.join(""));

        if (this.context)
            fnBlock.push('    }');
        if (this.subject)
            fnBlock.push('  }');

        fnBlock.push('  DomplateDebug.endGroup();');

        fnBlock.push('  return ', nodeCount, ';');
        fnBlock.push('})');

        var self = this;
        
        var js = fnBlock.join("");
        
        DomplateDebug.logVar('js',js);
        
        // Inject the compiled JS so we can view it later in the console when the code runs     
        js = js.replace('__SELF__JS__',js.replace(/\'/g,'\\\''));

        this.renderDOM = exports.EVAL.compileDOM(js, RT.makeDOMRuntime({
            DomplateDebug: DomplateDebug,
            compiled: this.subject.tag__dom
        }));

        DomplateDebug.endGroup();
    },

    generateDOM: function(path, blocks, args)
    {
        DomplateDebug.startGroup(['DomplateTag.generateDOM',this.tagName],arguments);

        if (this.listeners || this.props)
            this.generateNodePath(path, blocks);

        if (this.listeners)
        {
            for (var i = 0; i < this.listeners.length; i += 2)
            {
                var val = this.listeners[i+1];
                var arg = generateArg(val, path, args);
                blocks.push('node.addEventListener("', this.listeners[i], '", __bind__(this, ', arg, '), false);');
            }
        }

        if (this.props)
        {
            for (var name in this.props)
            {
                var val = this.props[name];
                var arg = generateArg(val, path, args);
                blocks.push('node.', name, ' = ', arg, ';');
            }
        }

        this.generateChildDOM(path, blocks, args);
        DomplateDebug.endGroup();        
        return 1;
    },

    generateNodePath: function(path, blocks)
    {
        DomplateDebug.startGroup('DomplateTag.generateNodePath',arguments);

        blocks.push("        node = __path__(root, o");
        for (var i = 0; i < path.length; ++i)
            blocks.push(",", path[i]);
        blocks.push(");");
        
        DomplateDebug.endGroup();
    },

    generateChildDOM: function(path, blocks, args)
    {
        path.push(0);
        for (var i = 0; i < this.children.length; ++i)
        {
            var child = this.children[i];
            if (isTag(child))
                path[path.length-1] += '+' + child.tag.generateDOM(path, blocks, args);
            else
                path[path.length-1] += '+1';
        }
        path.pop();
    }
};

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

DomplateEmbed.prototype = copyObject(DomplateTag.prototype,
{
    merge: function(args, oldTag)
    {
        DomplateDebug.startGroup('DomplateEmbed.merge',arguments);

        this.value = oldTag ? oldTag.value : parseValue(args[0]);
        this.attrs = oldTag ? oldTag.attrs : {};
        this.vars = oldTag ? copyArray(oldTag.vars) : [];

        var attrs = args[1];
        for (var name in attrs)
        {
            var val = parseValue(attrs[name]);
            this.attrs[name] = val;
            readPartNames(val, this.vars);
        }

        var retval = creator(this, DomplateEmbed);
        
        DomplateDebug.endGroup();

        return retval;        
    },

    // Used for locales only
    getVarNames: function(names)
    {
        if (this.value instanceof Parts)
            names.push(this.value.parts[0].name);

        if (this.vars)
            names.push.apply(names, this.vars);
    },

    generateMarkup: function(topBlock, topOuts, blocks, info)
    {
        DomplateDebug.startGroup('DomplateEmbed.generateMarkup',arguments);

        this.addCode(topBlock, topOuts, blocks);

        blocks.push('__link__(');
        addParts(this.value, '', blocks, info);
        blocks.push(', __code__, __out__, {');

        var lastName = null;
        for (var name in this.attrs)
        {
            if (lastName)
                blocks.push(',');
            lastName = name;

            var val = this.attrs[name];
            blocks.push('"', name, '":');
            addParts(val, '', blocks, info);
        }

        blocks.push('});');
        //this.generateChildMarkup(topBlock, topOuts, blocks, info);

        DomplateDebug.endGroup();
    },

    generateDOM: function(path, blocks, args)
    {
        DomplateDebug.startGroup('DomplateEmbed.generateDOM',arguments);

        var embedName = 'e'+path.embedIndex++;

        this.generateNodePath(path, blocks);

        var valueName = 'd' + path.renderIndex++;
        var argsName = 'd' + path.renderIndex++;
        
        blocks.push('        ',embedName + ' = __link__(node, ', valueName, ', ', argsName, ');');
        
        DomplateDebug.endGroup();

        return embedName;
    }
});

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

DomplateLoop.prototype = copyObject(DomplateTag.prototype,
{
    merge: function(args, oldTag)
    {
        DomplateDebug.startGroup('DomplateLoop.merge',arguments);

        this.varName = oldTag ? oldTag.varName : args[0];
        this.iter = oldTag ? oldTag.iter : parseValue(args[1]);
        this.vars = [];

        this.children = oldTag ? copyArray(oldTag.children) : [];

        var offset = Math.min(args.length, 2);
        parseChildren(args, offset, this.vars, this.children);

        var retval = creator(this, DomplateLoop);

        DomplateDebug.endGroup();
        
        return retval;
    },

    // Used for locales only
    getVarNames: function(names)
    {
        if (this.iter instanceof Parts)
            names.push(this.iter.parts[0].name);

        DomplateTag.prototype.getVarNames.apply(this, [names]);
    },

    generateMarkup: function(topBlock, topOuts, blocks, info)
    {
        DomplateDebug.startGroup('DomplateLoop.generateMarkup',arguments);

        this.addCode(topBlock, topOuts, blocks);

        DomplateDebug.logVar('this.iter',this.iter);

        // We are in a FOR loop and our this.iter property contains
        // either a simple function name as a string or a Parts object
        // with only ONE Variables object. There is only one variables object
        // as the FOR argument can contain only ONE valid function callback
        // with optional arguments or just one variable. Allowed arguments are
        // func or $var or $var.sub or $var|func or $var1,$var2|func or $var|func1|func2 or $var1,$var2|func1|func2
        var iterName;
        if (this.iter instanceof Parts)
        {
            // We have a function with optional aruments or just one variable
            var part = this.iter.parts[0];
            
            // Join our function arguments or variables
            // If the user has supplied multiple variables without a function
            // this will create an invalid result and we should probably add an
            // error message here or just take the first variable
            iterName = part.names.join(',');

            // Nest our functions
            if (part.format)
            {
                DomplateDebug.logVar('part.format',part.format);
        
                for (var i = 0; i < part.format.length; ++i)
                    iterName = part.format[i] + "(" + iterName + ")";
            }
        } else {
            // We have just a simple function name without any arguments
            iterName = this.iter;
        }
        
        DomplateDebug.logVar('iterName',iterName);

        blocks.push('    __loop__.apply(this, [', iterName, ', __out__, function(', this.varName, ', __out__) {');
        this.generateChildMarkup(topBlock, topOuts, blocks, info);
        this.addCode(topBlock, topOuts, blocks);
        blocks.push('    }]);');

        DomplateDebug.endGroup();
    },

    generateDOM: function(path, blocks, args)
    {
        DomplateDebug.startGroup('DomplateLoop.generateDOM',arguments);

        var iterName = 'd'+path.renderIndex++;
        var counterName = 'i'+path.loopIndex;
        var loopName = 'l'+path.loopIndex++;

        if (!path.length)
            path.push(-1, 0);

        var preIndex = path.renderIndex;
        path.renderIndex = 0;

        var nodeCount = 0;

        var subBlocks = [];
        var basePath = path[path.length-1];
        for (var i = 0; i < this.children.length; ++i)
        {
            path[path.length-1] = basePath+'+'+loopName+'+'+nodeCount;

            var child = this.children[i];
            if (isTag(child))
                nodeCount += '+' + child.tag.generateDOM(path, subBlocks, args);
            else
                nodeCount += '+1';
        }

        path[path.length-1] = basePath+'+'+loopName;

        blocks.push('      ',loopName,' = __loop__.apply(this, [', iterName, ', function(', counterName,',',loopName);
        for (var i = 0; i < path.renderIndex; ++i)
            blocks.push(',d'+i);
        blocks.push(') {');
        
        blocks.push('       DomplateDebug.logVar(\'  .. '+counterName+' (counterName)\','+counterName+');');
        blocks.push('       DomplateDebug.logVar(\'  .. '+loopName+' (loopName)\','+loopName+');');
        
        blocks.push(subBlocks.join(""));
        blocks.push('        return ', nodeCount, ';');
        blocks.push('      }]);');

        path.renderIndex = preIndex;

        DomplateDebug.endGroup();

        return loopName;
    }
});

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

DomplateIf.prototype = copyObject(DomplateTag.prototype,
{
    merge: function(args, oldTag)
    {
        DomplateDebug.startGroup('DomplateIf.merge',arguments);

        // This is the first argument to IF() which needs to evaluate to TRUE or FALSE
        // It can be a plain variable or a variable with formatters chained to it
        this.booleanVar = oldTag ? oldTag.booleanVar : parseValue(args[0]);
        this.vars = [];

        this.children = oldTag ? copyArray(oldTag.children) : [];

        var offset = Math.min(args.length, 1);
        parseChildren(args, offset, this.vars, this.children);

        var retval = creator(this, DomplateIf);

        DomplateDebug.endGroup();
        
        return retval;
    },

    // Used for locales only
    getVarNames: function(names)
    {
        if (this.booleanVar instanceof Parts)
            names.push(this.booleanVar.parts[0].name);

        DomplateTag.prototype.getVarNames.apply(this, [names]);
    },

    generateMarkup: function(topBlock, topOuts, blocks, info)
    {
        DomplateDebug.startGroup('DomplateIf.generateMarkup',arguments);

        this.addCode(topBlock, topOuts, blocks);

        DomplateDebug.logVar('this.booleanVar',this.booleanVar);


        // Generate the expression to be used for the if(expr) { ... }
        var expr;
        if (this.booleanVar instanceof Parts)
        {
            // We have a function with optional aruments or just one variable
            var part = this.booleanVar.parts[0];
            
            // Join our function arguments or variables
            // If the user has supplied multiple variables without a function
            // this will create an invalid result and we should probably add an
            // error message here or just take the first variable
            expr = part.names.join(',');

            // Nest our functions
            if (part.format)
            {
                DomplateDebug.logVar('part.format',part.format);
        
                for (var i = 0; i < part.format.length; ++i)
                    expr = part.format[i] + "(" + expr + ")";
            }
        } else {
            // We have just a simple function name without any arguments
            expr = this.booleanVar;
        }
        
        DomplateDebug.logVar('expr',expr);

        blocks.push('__if__.apply(this, [', expr, ', __out__, function(__out__) {');
        this.generateChildMarkup(topBlock, topOuts, blocks, info);
        this.addCode(topBlock, topOuts, blocks);
        blocks.push('}]);');

        DomplateDebug.endGroup();
    },

    generateDOM: function(path, blocks, args)
    {
        DomplateDebug.startGroup('DomplateIf.generateDOM',arguments);

        var controlName = 'd'+path.renderIndex++;
        var ifName = 'if_'+path.ifIndex++;

        if (!path.length)
            path.push(-1, 0);

        var preIndex = path.renderIndex;
        path.renderIndex = 0;

        var nodeCount = 0;

        var subBlocks = [];
//        var basePath = path[path.length-1];

        for (var i = 0; i < this.children.length; ++i)
        {
//            path[path.length-1] = basePath+'+'+ifName+'+'+nodeCount;

            var child = this.children[i];
            if (isTag(child))
                nodeCount += '+' + child.tag.generateDOM(path, subBlocks, args);
            else
                nodeCount += '+1';
        }

//        path[path.length-1] = basePath+'+'+ifName;

        blocks.push('      ',ifName,' = __if__.apply(this, [', controlName, ', function(',ifName);
        for (var i = 0; i < path.renderIndex; ++i)
            blocks.push(',d'+i);
        blocks.push(') {');
        
        blocks.push('       DomplateDebug.logVar(\'  .. d0\',d0);');
        blocks.push('       DomplateDebug.logVar(\'  .. '+ifName+' (ifName)\','+ifName+');');
        
        blocks.push(subBlocks.join(""));
//        blocks.push('        return ', nodeCount, ';');
        blocks.push('      }]);');

        path.renderIndex = preIndex;

        DomplateDebug.endGroup();

        return controlName;
    }
});

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

function Variables(names,format)
{
    this.names = names;
    this.format = format;
}

function Parts(parts)
{
    this.parts = parts;
}

// ************************************************************************************************

function parseParts(str)
{
    DomplateDebug.startGroup('parseParts',arguments);
    
    var index = 0;
    var parts = [];
    var m;

    // Match $var or $var.sub or $var|func or $var1,$var2|func or $var|func1|func2 or $var1,$var2|func1|func2
    var re = /\$([_A-Za-z][$_A-Za-z0-9.,|]*)/g;
    while (m = re.exec(str))
    {
        DomplateDebug.logVar('m',m);

        var pre = str.substr(index, (re.lastIndex-m[0].length)-index);
        if (pre)
            parts.push(pre);

        var segs = m[1].split("|");
        var vars = segs[0].split(",$");

        // Assemble the variables object and append to buffer
        parts.push(new Variables(vars,segs.splice(1)));
        
        index = re.lastIndex;
    }

    // No matches found at all so we return the whole string
    if (!index) {

        DomplateDebug.logVar('str',str);
        
        DomplateDebug.endGroup();
    
        return str;
    }

    // If we have data after our last matched index we append it here as the final step
    var post = str.substr(index);
    if (post)
        parts.push(post);


    var retval = new Parts(parts);
    
    DomplateDebug.logVar('retval',retval);
    
    DomplateDebug.endGroup();
    
    return retval;
}

function parseValue(val)
{
    return typeof(val) == 'string' ? parseParts(val) : val;
}

function parseChildren(args, offset, vars, children)
{
    DomplateDebug.startGroup('parseChildren',arguments);

    for (var i = offset; i < args.length; ++i)
    {
        var val = parseValue(args[i]);
        children.push(val);
        readPartNames(val, vars);
    }
    DomplateDebug.endGroup();
}

function readPartNames(val, vars)
{
    if (val instanceof Parts)
    {
        for (var i = 0; i < val.parts.length; ++i)
        {
            var part = val.parts[i];
            if (part instanceof Variables)
                vars.push(part.names[0]);
        }
    }
}

function generateArg(val, path, args)
{
    if (val instanceof Parts)
    {
        var vals = [];
        for (var i = 0; i < val.parts.length; ++i)
        {
            var part = val.parts[i];
            if (part instanceof Variables)
            {
                var varName = 'd'+path.renderIndex++;
                if (part.format)
                {
                    for (var j = 0; j < part.format.length; ++j)
                        varName = part.format[j] + '(' + varName + ')';
                }

                vals.push(varName);
            }
            else
                vals.push('"'+part.replace(/"/g, '\\"')+'"');
        }

        return vals.join('+');
    }
    else
    {
        args.push(val);
        return 's' + path.staticIndex++;
    }
}

function addParts(val, delim, block, info, escapeIt)
{
    var vals = [];
    if (val instanceof Parts)
    {
        for (var i = 0; i < val.parts.length; ++i)
        {
            var part = val.parts[i];
            if (part instanceof Variables)
            {
                var partName = part.names.join(",");
                if (part.format)
                {
                    for (var j = 0; j < part.format.length; ++j)
                        partName = part.format[j] + "(" + partName + ")";
                }

                if (escapeIt)
                    vals.push("__escape__(" + partName + ")");
                else
                    vals.push(partName);
            }
            else
                vals.push('"'+ part + '"');
        }
    }
    else if (isTag(val))
    {
        info.args.push(val);
        vals.push('s'+info.argIndex++);
    }
    else
        vals.push('"'+ val + '"');

    var parts = vals.join(delim);
    if (parts)
        block.push(delim, parts);
}

function isTag(obj)
{
    return (typeof(obj) == "function" || obj instanceof Function) && !!obj.tag;
}

function creator(tag, cons)
{
    var fn = new Function(
        "var tag = arguments.callee.tag;" +
        "var cons = arguments.callee.cons;" +
        "var newTag = new cons();" +
        "return newTag.merge(arguments, tag);");

    fn.tag = tag;
    fn.cons = cons;
    extend(fn, Renderer);

    return fn;
}

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *


// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *


// ************************************************************************************************

// ************************************************************************************************


function defineTags()
{
        
    for (var i = 0; i < arguments.length; ++i)
    {
        var tagName = arguments[i];
        var fn = new Function("var newTag = new this._domplate_.DomplateTag('"+tagName+"'); return newTag.merge(arguments);");

        var fnName = tagName.toUpperCase();
        exports.tags[fnName] = fn;
    }
}

defineTags(
    "a", "button", "br", "canvas", "col", "colgroup", "div", "fieldset", "form", "h1", "h2", "h3", "hr",
     "img", "input", "label", "legend", "li", "ol", "optgroup", "option", "p", "pre", "select",
    "span", "strong", "table", "tbody", "td", "textarea", "tfoot", "th", "thead", "tr", "tt", "ul"
);

    }


exports.domplate = {};

Domplate(exports.domplate);


exports.domplate.ensureLoader = function () {
    var PINF = require("pinf-loader-js");
    PINF.document = window.document;
    return PINF;
}

exports.domplate.loadRep = function (url, options, successCallback, errorCallback) {
    if (typeof options === "function") {
        errorCallback = successCallback;
        successCallback = options;
        options = {};
    }
    var PINF = exports.domplate.ensureLoader();
    return PINF.sandbox(url + ".rep", function (sandbox) {
        var rep = sandbox.main(options);
        successCallback(rep);
    }, errorCallback);
}


exports.makeMarkupRuntime = function (context) {

    var self = context.self;

    var exports = {};

    exports.DomplateDebug = context.DomplateDebug;

    exports.__link__ = function (tag, code, outputs, args)
    {
        if (!tag) {
            DomplateDebug.logWarn('tag not defined');
            return;
        }
        if (!tag.tag) {
            DomplateDebug.logVar('tag', tag);
            DomplateDebug.logWarn('tag.tag not defined');
            return;
        }

        tag.tag.compile();

        // merge resources from sub-tags
        if(self.resources && tag.tag.resources && tag.tag.resources!==self.resources) {
            for( var key in tag.tag.resources ) {
                self.resources[key] = tag.tag.resources[key];
            }
        }

        var tagOutputs = [];
        var markupArgs = [code, (tag.tag.context)?tag.tag.context:null, args, tagOutputs];
        markupArgs.push.apply(markupArgs, tag.tag.markupArgs);
        tag.tag.renderMarkup.apply(tag.tag.subject, markupArgs);

        outputs.push(tag);
        outputs.push(tagOutputs);
    }

    exports.__escape__ = function (value)
    {
        function replaceChars(ch)
        {
            switch (ch)
            {
                case "<":
                    return "&lt;";
                case ">":
                    return "&gt;";
                case "&":
                    return "&amp;";
                case "'":
                    return "&#39;";
                case '"':
                    return "&quot;";
            }
            return "?";
        };
        return String(value).replace(/[<>&"']/g, replaceChars);
    }

    exports.__loop__ = function (iter, outputs, fn)
    {
        var iterOuts = [];
        outputs.push(iterOuts);

        if (iter instanceof Array || typeof iter === "array" || Array.isArray(iter))
        {
            iter = new ArrayIterator(iter);
        }

        try
        {
            if (!iter || !iter.next) {
                console.error("Cannot iterate loop", iter, typeof iter, outputs, fn);
                throw new Exception("Cannot iterate loop as iter.next() method is not defined");
            }
            while (1)
            {
                var value = iter.next();
                var itemOuts = [0,0];
                iterOuts.push(itemOuts);
                fn.apply(this, [value, itemOuts]);
            }
        }
        catch (exc)
        {
            if (exc != StopIteration)
                throw exc;
        }
    }

    exports.__if__ = function (booleanVar, outputs, fn)
    {
        // "outputs" is what gets passed to the compiled DOM when it runs.
        // It is used by the dom to make decisions as to how many times to
        // run children for FOR loops etc ...
        // For the IF feature we set a 1 or 0 depending on whether
        // the sub template ran or not. If it did not run then no HTML
        // markup was generated and accordingly the DOM elements should and
        // can not be traversed.
    
        var ifControl = [];
        outputs.push(ifControl);


        DomplateDebug.logVar('j  .. booleanVar',booleanVar);

        if(booleanVar) {
        ifControl.push(1);
        fn.apply(this, [ifControl]);
        } else {
        ifControl.push(0);
        }
    }

    return exports;
}

exports.makeDOMRuntime = function (context) {
    
    var exports = {};

    exports.DomplateDebug = context.DomplateDebug;

    exports.__bind__ = function (object, fn)
    {
        return function(event) { return fn.apply(object, [event]); }
    }

    exports.__link__ = function (node, tag, args)
    {
        DomplateDebug.startGroup('__link__',arguments);

        if (!tag) {
            DomplateDebug.logWarn('tag not defined');
            return;
        }
        if (!tag.tag) {
            DomplateDebug.logVar('tag', tag);
            DomplateDebug.logWarn('tag.tag not defined');
            return;
        }
        
        tag.tag.compile();

        var domArgs = [node, (tag.tag.context)?tag.tag.context:null, 0];
        domArgs.push.apply(domArgs, tag.tag.domArgs);
        domArgs.push.apply(domArgs, args);

        var oo =tag.tag.renderDOM.apply(tag.tag.subject, domArgs);
        
        DomplateDebug.endGroup();
        
        return oo;
    }

    exports.__loop__ = function (iter, fn)
    {
        DomplateDebug.startGroup('__loop__',arguments);
        DomplateDebug.logVar('iter',iter);
        DomplateDebug.logVar('fn',fn);

        var nodeCount = 0;
        for (var i = 0; i < iter.length; ++i)
        {
            iter[i][0] = i;
            iter[i][1] = nodeCount;
            nodeCount += fn.apply(this, iter[i]);

            DomplateDebug.logVar(' .. nodeCount',nodeCount);
        }

        DomplateDebug.logVar('iter',iter);

        DomplateDebug.endGroup();
        
        return nodeCount;
    }

    exports.__if__ = function (control, fn)
    {
        DomplateDebug.startGroup('__if__',arguments);

        DomplateDebug.logVar('control', control);
        DomplateDebug.logVar('fn',fn);

        // Check the control structure to see if we should run the IF
        if(control && control[0]) {
        // Lets run it
        // TODO: If in debug mode add info about the IF expression that caused the running
        DomplateDebug.logInfo('Running IF');
        fn.apply(this, [0,control[1]]);
        } else {
        // We need to skip it
        // TODO: If in debug mode add info about the IF expression that caused the skip
        DomplateDebug.logInfo('Skipping IF');
        }

        DomplateDebug.endGroup();
    }

    exports.__path__ = function (parent, offset)
    {
        DomplateDebug.startGroup('__path__',arguments);
        DomplateDebug.logVar('parent',parent);

        var root = parent;

        for (var i = 2; i < arguments.length; ++i)
        {
            var index = arguments[i];

            if (i == 3)
                index += offset;

            if (index == -1) {
                parent = parent.parentNode;
            } else {
                // NOTE: If `DIV(IF(...), FOR(...))` then `parent` is null because of an offset issue with IF(). Cannot figure it out.
                // WORKAROUND: `DIV(DIV(IF(...)), FOR(...))`
                parent = parent.childNodes[index];
            }    
        }

        DomplateDebug.endGroup();

        return parent;
    }

    return exports;
}

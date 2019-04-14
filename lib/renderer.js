
var Renderer = exports.Renderer = 
{
    checkDebug: function()
    {
//        exports.Renderer.DomplateDebug.enabled = this.tag.subject._debug || false;
    },
    
    renderHTML: function(args, outputs, self)
    {
//        this.checkDebug();
        
   //     exports.Renderer.DomplateDebug.startGroup('Renderer.renderHTML',arguments);

        var code = [];
        var markupArgs = [code, (this.tag.context)?this.tag.context:null, args, outputs];
        markupArgs.push.apply(markupArgs, this.tag.markupArgs);
        this.tag.renderMarkup.apply(self ? self : this.tag.subject, markupArgs);

        if(this.tag.resources && this.tag.subject._resourceListener) {
            this.tag.subject._resourceListener.register(this.tag.resources);
        }

//        exports.Renderer.DomplateDebug.endGroup();
        return code.join("");
    },

    insertRows: function(args, before, self)
    {
//        this.checkDebug();

//        exports.Renderer.DomplateDebug.startGroup('Renderer.insertRows',arguments);

        this.tag.compile();

        var outputs = [];
        var html = this.renderHTML(args, outputs, self);

        var doc = before.ownerDocument;
        var table = doc.createElement("table");
        table.innerHTML = html;

        var tbody = table.firstChild;
        var parent = before.localName == "TR" ? before.parentNode : before;
        var after = before.localName == "TR" ? before.nextSibling : null;

        var firstRow = tbody.firstChild, lastRow;
        while (tbody.firstChild)
        {
            lastRow = tbody.firstChild;
            if (after)
                parent.insertBefore(lastRow, after);
            else
                parent.appendChild(lastRow);
        }

        var offset = 0;
        if (before.localName == "TR")
        {
            var node = firstRow.parentNode.firstChild;
            for (; node && node != firstRow; node = node.nextSibling)
                ++offset;
        }

        var domArgs = [firstRow, this.tag.context, offset];
        domArgs.push.apply(domArgs, this.tag.domArgs);
        domArgs.push.apply(domArgs, outputs);

        this.tag.renderDOM.apply(self ? self : this.tag.subject, domArgs);

//        exports.Renderer.DomplateDebug.endGroup();
        return [firstRow, lastRow];
    },

    insertAfter: function(args, before, self)
    {
//        this.checkDebug();

//        exports.Renderer.DomplateDebug.startGroup('Renderer.insertAfter',arguments);

        this.tag.compile();

        var outputs = [];
        var html = this.renderHTML(args, outputs, self);

        var doc = before.ownerDocument;
        var range = doc.createRange();
        range.selectNode(doc.body);
        var frag = range.createContextualFragment(html);

        var root = frag.firstChild;
        if (before.nextSibling)
            before.parentNode.insertBefore(frag, before.nextSibling);
        else
            before.parentNode.appendChild(frag);

        var domArgs = [root, this.tag.context, 0];
        domArgs.push.apply(domArgs, this.tag.domArgs);
        domArgs.push.apply(domArgs, outputs);

        this.tag.renderDOM.apply(self ? self : (this.tag.subject ? this.tag.subject : null),
            domArgs);

//        exports.Renderer.DomplateDebug.endGroup();

        return root;
    },

    replace: function(args, parent, self)
    {
//        this.checkDebug();

//        exports.Renderer.DomplateDebug.startGroup('Renderer.replace',arguments);

        this.tag.compile();

        var outputs = [];
        var html = this.renderHTML(args, outputs, self);

        var root;
        if (parent.nodeType == 1)
        {
            parent.innerHTML = html;
            root = parent.firstChild;
        }
        else
        {
            if (!parent || parent.nodeType != 9)
                parent = document;

            if (!womb || womb.ownerDocument != parent)
                womb = parent.createElement("div");
            womb.innerHTML = html;

            root = womb.firstChild;
            //womb.removeChild(root);
        }

        var domArgs = [root, (this.tag.context)?this.tag.context:null, 0];
        domArgs.push.apply(domArgs, this.tag.domArgs);
        domArgs.push.apply(domArgs, outputs);
        this.tag.renderDOM.apply(self ? self : this.tag.subject, domArgs);

//        exports.Renderer.DomplateDebug.endGroup();

        return root;
    },

    append: function(args, parent, self)
    {
//        this.checkDebug();

//        exports.Renderer.DomplateDebug.startGroup('Renderer.append',arguments);

        this.tag.compile();

        var outputs = [];
        var html = this.renderHTML(args, outputs, self);

//        exports.Renderer.DomplateDebug.logVar('outputs',outputs);

//        exports.Renderer.DomplateDebug.logVar('html',html);
        
        if (!womb || womb.ownerDocument != parent.ownerDocument)
            womb = parent.ownerDocument.createElement("div");

//        exports.Renderer.DomplateDebug.logVar('womb',womb);
        womb.innerHTML = html;

        root = womb.firstChild;
        while (womb.firstChild)
            parent.appendChild(womb.firstChild);

        var domArgs = [root, this.tag.context, 0];
        domArgs.push.apply(domArgs, this.tag.domArgs);
        domArgs.push.apply(domArgs, outputs);

//        exports.Renderer.DomplateDebug.logVar('this.tag.subject',this.tag.subject);
//        exports.Renderer.DomplateDebug.logVar('self',self);
//        exports.Renderer.DomplateDebug.logVar('domArgs',domArgs);
        
        this.tag.renderDOM.apply(self ? self : this.tag.subject, domArgs);

//        exports.Renderer.DomplateDebug.endGroup();

        return root;
    },

    render: function(args, self)
    {
//        this.checkDebug();

//        exports.Renderer.DomplateDebug.startGroup('Renderer.render',arguments);

        this.tag.compile();

        var outputs = [];
        var html = this.renderHTML(args, outputs, self);

//        exports.Renderer.DomplateDebug.endGroup();

        return html;
    }  
};

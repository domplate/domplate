
var DomplateDebug = exports.DomplateDebug = {
  
    enabled: false,
    console: null,

    replaceInstance: function(instance) {
        DomplateDebug = instance;
    },

    setEnabled: function(enabled)
    {
        this.enabled = enabled;
    },

    setConsole: function(console)
    {
        this.console = console;
    },

    log: function(label, value)
    {
        if(!this.enabled) return;
        if(arguments.length==2) {
        this.console.log(label+': ',value);
        } else {
        this.console.log(label);
        }
    },
    logVar: function(label, value)
    {
        if(!this.enabled) return;
        this.console.log(label+': ',[value]);
    },
    logInfo: function(message)
    {
        if(!this.enabled) return;
        this.console.info(message);
    },
    logWarn: function(message)
    {
        if(!this.enabled) return;
        this.console.warn(message);
    },
    logJs: function(label, value)
    {
        if(!this.enabled) return;
        value = value.replace(/;/g,';\n');
        value = value.replace(/{/g,'{\n');
        this.console.info(value);
    },
    reformatArguments: function(args)
    {
        if(!this.enabled) return;
        var returnVar = new Array();
        for (var i = 0; i < args.length; ++i)
        {
            var index = args[i];
            returnVar.push([index]);
        }
        return {'arguments':returnVar}; 
    },
    startGroup: function(label,args)
    {
        if(!this.enabled) return;
        if(this.isArray(label)) {
        label.splice(1,0,' - ');
        this.console.group.apply(this,label);
        }  else {
        this.console.group(label);
        } 
        if(args!=null) {
            this.logVar('ARGUMENTS',DomplateDebug.reformatArguments(args));
        }  
    },
    endGroup: function()
    {
        if(!this.enabled) return;
        this.console.groupEnd();
    },
    isArray: function(obj) {
        if (obj.constructor.toString().indexOf("Array") != -1) {
            return true;
        }
        return false;
    }
}

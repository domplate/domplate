

var CSS = function(id)
{
    this.id = id;
    this.path = require.loader.find(this.id);

    this.getCode = function()
    {
        var code = [];

        code.push("/**");
        code.push(" * id   = " + this.id);
        code.push(" * path = " + this.path);
        code.push(" */");
        code.push("\n");
            
        code.push(system.fs.read(this.path, {'charset': 'utf-8'}));
            
        return code.join("\n");
    }
}


var Collection = function()
{
    var reps = [];
    var css = [];
    
    
    this.loadRep = function(uri)
    {
        reps.push(require(uri));
    }

    this.loadCss = function(id)
    {
        css.push(new CSS(id));
    }
    
    this.getCss = function()
    {
        return css;
    }
    
    this.getForObject = function(object)
    {
        var type = typeof(object);
        
        for( var i=0 ; i<reps.length ; i++ ) {
            try {
                if(reps[i].rep.supportsObject(object, type)) {
                    return reps[i].rep;
                }
            } catch(e) {
                print(e,' ERROR');
            }        
        }
        return null;
    }
}

exports.Collection = function()
{
    return new Collection();
}

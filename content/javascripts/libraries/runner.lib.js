Namespace('db.moz.plugin');

db.moz.plugin.runner = function(dom, doc){
  var win = db.moz.plugin.jQuery.jQuerify(doc);
  
  this.od = {
    win: win,
    dom: dom,
    doc: doc,
    jQuery: win.$
  };
  
  this.lib = {
    basics:  db.moz.plugin.basics,
    console: db.moz.plugin.console,
    require: db.moz.plugin.require,
    preferences: db.moz.plugin.preferences,
    locales: db.moz.plugin.locations,
    modules: db.moz.plugin.modules,
    templates:db.moz.plugin.templates,
    ajax:    db.moz.plugin.ajax
  };
  
  this.modules = {};
  
  this.load_basic_modules = function(modules){    
    var returning = true;
    for(var i = 0,len = modules.length;i<len;i++){
      var module_name = modules[i];
      try{
        if(this.modules[module_name]) 
          throw 'module: already loaded!';
        
        var module_class = this.lib.modules.get(module_name);
        var module = new module_class;
        
        // Bug#2:
        // We encountered a problem in the modul concept where
        // every simple datatyp was copied by the constructor 
        // but objects were only referenced, so that the object 
        // content was avaible in the global scope.
        
        // Solution:
        // cloning all values, to keep every property of the modul
        // in default state
        module = this.lib.basics.clone_all(module); 
        
        module.od  = this.od;
        module.lib = this.lib;
        module.modules = this.modules;
        module.template = function(){
          return this.template.engine.parse.apply(null,arguments);
        }
        module.template.engine = new this.lib.templates(
          'modules/modules.'+module.module_name
        );
        
        module.call = function(name,value,prefix){
          prefix = prefix || 'od_';
          const fname = prefix + name;
          try{
            if(!this[fname]) return false;
            this[fname](value,name);
            return true;
          }catch(e){
            // FIXME: remove alert
            if(this.lib.preferences.get('debug.enable'))
            this.lib.console.error('module.'+this.module_name+'.'+fname
            +': calling failed', e);
          }
          return false;
        }
        
        module.initialize();
        
        this.modules[module_name] = module;
      }catch(e){
        this.lib.console.error('runner.load_basic_module('
            + module_name + ') failed to load',e);

        if(this.lib.preferences.get('debug.enable'))
        throw e;
        returning = false;
      } 
    }
    return returning;
  }
};
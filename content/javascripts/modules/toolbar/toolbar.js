//= basic
//= location

Namespace('db.moz.plugin');

db.moz.plugin.modules.register({
  // module description
  module_name:        'toolbar',
  module_author:      'rds12',
  module_version:     '2010-04-17',
  module_website:     'http://db.wiki.seiringer.eu',
  module_enable:      true,

  initialize: function(){
    const basic = this.modules.basic;
    const location = this.modules.location;

    if(location == undefined) throw 'location not avaible';
    if(!basic.is_logged_in) return;

    // call '<main>_<sub>'
    this.call(location.main + '_' + location.sub);
  },

  od_player_overview: function(){
    this.gui_extending_database_player_search();
  },

  od_alliance_overview: function(){
    this.gui_extending_database_alliance_search();
  },

  od_system_main: function(){
    this.gui_extending_database_system_search();
  },

  od_planet_orbit: function(){
    this.gui_extending_database_orbit_search();
  },

  gui_extending_database_player_search: function(){
    if(this.modules.basic.is_debug_enabled) {
      this.modules.basic.log('modules.toolbar',null,true);
    }

    const prefs = this.lib.preferences;
    if(prefs.get('preferences.player.searchInDatabase') !== true) return;

    var player_id = this.modules.location.options.player_id;
    if(!player_id) return;
    
    var url = prefs.get('preferences.configset.tbExtToolUserUri');
    url = this.modules.fowapi.replace_placeholders(url,player_id);
    
    const $ = this.od.jQuery;
    var header = $('#maincontent table table tr:first td');
    header.append(this.template('searchInDatabase',url));
    header.wrapInner(this.template('relativize'));
  },

  gui_extending_database_alliance_search: function(){
   if(this.modules.basic.is_debug_enabled) {
      this.modules.basic.log('modules.toolbar',null,true);
    }
    const prefs = this.lib.preferences;
    if(prefs.get('preferences.alliance.searchInDatabase') !== true) return;

    var alliance_id = this.modules.location.options.alliance_id;
    if(!alliance_id) return;

    var url = prefs.get('preferences.configset.tbExtToolAllyUri');
    url = this.modules.fowapi.replace_placeholders(url,alliance_id);
    
    const $ = this.od.jQuery;
    var header = $('#maincontent .view');
    header.append(this.template('searchInDatabase',url));
    header.wrapInner(this.template('relativize'));
  },

  gui_extending_database_system_search: function(){
    if(this.modules.basic.is_debug_enabled) {
      this.modules.basic.log('modules.toolbar',null,true);
    }

    const prefs = this.lib.preferences;
    if(prefs.get('preferences.system.searchInDatabase') !== true) return;

    var system_id = this.modules.location.options.system_id;
    if(!system_id) return;

    var url = prefs.get('preferences.configset.tbExtToolSysUri');
    url = this.modules.fowapi.replace_placeholders(url,system_id);

    const $ = this.od.jQuery;
    var header = this.modules.system.get_overview_bar();
    header.append(this.template('searchInDatabaseShort',url));
  },

  gui_extending_database_orbit_search: function(){
    if(this.modules.basic.is_debug_enabled) {
      this.modules.basic.log('modules.toolbar',null,true);
    }

    const prefs = this.lib.preferences;
    if(prefs.get('preferences.orbit.searchInDatabase') !== true) return;

    var planet_id = this.modules.location.options.planet_id;
    if(!planet_id) return;
    
    var url = prefs.get('preferences.configset.tbExtToolPlanUri');
    url = this.modules.fowapi.replace_placeholders(url,planet_id);

    const $ = this.od.jQuery;
    var header = this.modules.orbit.get_overview_bar();
    header.append(this.template('searchInDatabaseShort',url));
  }
});
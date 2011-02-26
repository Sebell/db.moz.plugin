//= basic
//= location

Namespace('db.moz.plugin');

db.moz.plugin.modules.register({
  // module description
  module_name:        'fleet',
  module_author:      'rds12',
  module_version:     '2011-02-17',
  module_website:     'http://db.wiki.seiringer.eu',
  module_enable:      true,
  
  // fleet properties
  initialize: function(){
    const basic = this.modules.basic;
    const location = this.modules.location;
    
    if(location == undefined) throw 'location not avaible';
    if(!basic.is_logged_in) return;
    
    // nothing to do with fleet? -> exit
    if(location.main != 'fleet') return;
    
    this.call(location.sub);
    
    basic.log('module.fleet',null,true);
  },
  
  is_fleet_overview:function(){
    const loc = this.modules.location;
    return loc.main == 'fleet' && loc.sub == 'overview'; 
  },
  
  select_same: function(fleet_id,event){
    if(!this.is_fleet_overview()) return false;
    const $ = this.od.jQuery;
    const self = this;

    this.select_reset();

    element = $('input[type=checkbox][value="'+fleet_id+'"]');
    // retrieving place and time
//    var place = null, time = null, counter = 0;
    place = element.parents('tr:eq(0)').find('td:eq(2)').html();
    time  = element.parents('tr:eq(0)').find('td:eq(4)').html();
    counter = 0;
    
    // now select all checkboxes which have this location
    parent_form = element.parents('form:eq(0)');
    
    parent_form.find('tr:visible').each(function(i,e){
      e = $(e);
      box = e.find('input[type=checkbox]');
      if(!box.length) return true;
      
      if(!(place == e.find('td:eq(2)').html() && time == e.find('td:eq(4)').html())) return true;
      box.attr('checked',true);
      counter++;
      delete e,box;
    });
    delete place,time;
    
    // show send window, if event was set
    if(!event) return;

    // set new input button with the number of selected fleets
    offset = element.offset(); 
    send = $('#dbMozPluginFleetQuickSend').empty().append(self.template('sendWindowInput',counter));
    delete counter;

    // align left from the checkbox and on the same height 
    button = send.css({top: offset.top, left: (offset.left - send.width() - element.width())}).show().find(':button');
    delete element,offset,send;
    
    // Bug#6: 
    // $('form:first').submit();
    // has no effect, im not sure why, but it won't work,
    // therefore we have to inject the onclick event
    button.attr('onclick','document.'+parent_form.attr('name')+'.submit();');
    delete button;
  },
  
  select_reset: function(){
    if(!this.is_fleet_overview()) return false;
    const $ = this.od.jQuery;
    
    $('#dbMozPluginFleetQuickSend').hide();
    
    $('input[type=checkbox]').each(function(i,e){
      $(e).attr('checked',false);
    });
  },

  gui_overview_extending_buttons: function(){
    if(this.lib.preferences.get('preferences.fleet.unselectButton') !== true)
      return;

    const $    = this.od.jQuery;
    const self = this;

    form = $('form[name="AllyFlform"]');
    if(!form.length) return;

    form.find('tr.tablecolor input:submit').each(function(i,e){
      s = $(self.template('unselectButton'));
      s.click(function(){
        self.select_reset();
      });

      $(e).parents('td:eq(0)').prepend(s);
      delete s;
    });
    delete form;
  },

  gui_overview_extending_checkboxes: function(){
    if(this.lib.preferences.get('preferences.fleet.dblClickSendButton') !== true)
      return;
    
    const self = this;
    const $ = this.od.jQuery;
    // create window for the dynamic send button
    $('body').append(this.template('sendWindow'));

    // event select same!
    $('input:checkbox').each(function(){
      $(this).dblclick(function(e){
        self.select_same($(this).val(),e);
      });
    });
  },
  
  
  gui_dispatch_menu_extending_orbit_link: function(){
    if(this.lib.preferences.get('preferences.fleet.orbitLink') !== true)
      return;

    const $ = this.od.jQuery;

    e = $('#maincontent td.messageBox_Middle:first td');
    pid = this.modules.location.options['from_planet'];
    
    if(!pid || !e.length) return;
    
    e.wrapInner(this.template('goToOrbitDiv'));
    $('#dbMozPluginDispatchMenuSelections').append(
      this.template('goToOrbitLink',pid)
    );
    delete e,pid;
  },

  gui_overview_extending_hide_merged_ships: function(){
    if(true !== this.lib.preferences.get('preferences.fleet.hideMergedShips'))
      return;

    const self = this,
        $ = this.od.jQuery;
    
    $('#div3 table tr:eq(1) td').append(self.template('hiddenShips'));

    is_fleet_hidden = false;
    link = $('#dbMozPluginHiddenShips').find('a').click(function(){
        toggle_merged_fleets();
    });

    toggle_merged_fleets = function(){
      number_of_hidings = 0;

      $('#div3 table table table:first tr').each(function(){
        // check if galaxy is set if not, ship belongs to a fleet
        is_merged = !$(this).find('td:eq(2)').text();

        // is ship merged in fleet?
        if(!is_merged) return;
        delete is_merged;
  
        if(is_fleet_hidden) $(this).show();
        else $(this).hide();

        number_of_hidings++;
      });

      is_fleet_hidden = !is_fleet_hidden;

      text = is_fleet_hidden ? 'showHiddenShips' : 'hideMergedShips';
      link.html(self.template(text,number_of_hidings));
      delete number_of_hidings,text;
    }

    toggle_merged_fleets();

  },

  gui_dispatch_menu_extending_focus_direct_input: function(){
    if(true !== this.lib.preferences.get('preferences.fleet.focusDirectInput')) return;
    const $ = this.od.jQuery;

    /* yet another case where a jQuery build in function won't 
     * do what it should do:
     *   $('selector').focus();
     */
    input = $('input[name=direktid]').get(0);
    if(!input) return;

    input.focus();
    delete input;
  },

  od_overview: function(){
    this.gui_overview_extending_checkboxes();
    this.gui_overview_extending_buttons();
    this.gui_overview_extending_hide_merged_ships();
  },

  od_dispatch_menu: function(){
    this.gui_dispatch_menu_extending_focus_direct_input();
    this.gui_dispatch_menu_extending_orbit_link();
  }
});
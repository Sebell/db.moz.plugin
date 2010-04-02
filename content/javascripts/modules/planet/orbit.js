//= basic
//= location

Namespace('db.moz.plugin');

db.moz.plugin.modules.register({
  // module description
  module_name:        'orbit',
  module_author:      'rds12',
  module_version:     '2010-04-02',
  module_website:     'http://db.wiki.seiringer.eu',
  module_enable:      true,
  
  initialize: function(){
    const basic = this.modules.basic;
    const location = this.modules.location;
    
    if(location == undefined) throw 'location not avaible';
    if(!basic.is_logged_in) return;
    
    // nothing to do with planet? -> exit
    if(!(location.main == 'planet' && location.sub == 'orbit')) return;
    
    this.gui_extending_shortcuts();
    this.gui_extending_ships_statistic();
  },

  /**
   * // get all ships:
   *
   * var ships = get_ships();
   * 
   * // get the first ship or no ship:
   * 
   * var ship = get_ships({
   *   range: {start: 0, end: 1}
   * });
   * 
   * // get all unselected ships
   * 
   * var ship = get_ships({
   *   filter: 'unselected'
   * });
   * 
   * // get all selected ships
   * 
   * var ship = get_ships({
   *   filter: 'selected'
   * });
   * 
   * // get all unselected ships, where the index is greter than 3
   * 
   * var ship = get_ships({
   *   filter: 'unselected'
   *   range: {start: 4}
   * });
   * 
   * @return {jQuery} jQuery of td entries
   */
  get_ships: function(options){
    const $ = this.od.jQuery;
    const self = this;
    var ships = $('td[namsn]');

    // no options -> get all ships!
    if(!options) return ships;

    var start = false,
        end = false;

    var range_avaible = (function(){
      var range = options.range;

      // check if range is avaible
      // if not return true
      if(!range) return false;

      start = range.start;
      end   = range.end;

      // if start and end position is invalid
      // return true
      if(!start && !end) return false;

      return true;
    })();

    var is_in_range = function(index){
      // if range is not set, every ship is in range
      if(!range_avaible) return true;

      var a = index >= start, b = index < end;

      // if start and end position is set
      // return ships within range
      if(start > 0 && end > 0){
        // if index is greater than start and
        // index is greater than end
        // return 'exceeded' to indicate that the range
        // was exceeded
        if(a && !b) return 'exceeded';
        return a && b;
      }

      if(start > 0) {
        return a;
      }

      // if end position exceeded return 'exceeded'
      return b ? true : 'exceeded';
    }

    var get_range = function(ships, callback){
      // no range and callback avaible, return ships untouched
      if(!range_avaible && !callback){
        return ships;
      }

      // default callback, collect all ships that matches
      // the range
      callback = callback || function(ship){return true;}

      var number_of_added_ships = 0;
      var exceeded = false;

      var select = function( index, ship ){
        // if range was exceeded, don't collect anymore
        if(exceeded) return false;

        var ship_added = ship_added = callback($(ship));
            in_range = is_in_range(number_of_added_ships);

        // abort immediately if range exceeded
        if(in_range == 'exceeded'){
          exceeded = true;
          return false;
        }

        // ship doesn't fit the callback selector? don't collect it
        if(!ship_added){
          return false;
        }

        // increase the counter of the matched ships
        number_of_added_ships++;

        // not in range? don't collect this ship
        if(!in_range) return false;

        return true;
      }

      // instead of filtering the ships, we add
      // them to another stack to improve performance
      // by ranged selection
      var stack = [];

      ships.each(function(index,ship){
        var selected = select(index,ship);

        if(self.modules.basic.is_debug_enabled){
          // just some optical highlighting
          var background = selected ? 'green' : 'blue';
          $(ship).find('a').css('background-color',background);
        }

        // add ship to the new stack
        if(selected){
          stack.push(ship);
        }

        // abort collection if exceeded!
        if(exceeded){
          return false;
        }
      });

      // convert stack into jQuery
      return $(stack);
    }
    
    var filter = options['filter']; 
    
    // get all selected ships
    if(filter == 'selected'){
      return get_range(ships,function(ship){
        return ship.hasClass('tabletranslight');
      });
    }
    
    // get all unselected ships
    if(filter == 'unselected'){
      return get_range(ships,function(ship){
        return ship.hasClass('opacity1') ||
               ship.hasClass('tabletrans');
      });
    }
    
    // if no valid settings are found, return all ships
    // or return matched ships
    return get_range(ships);
  },

  update_gui_and_stack: function(){
    // FIXME: use native function instead
    const dom = this.od.dom;

    dom.set_action();
  },

  toggle_ship_selection: function(shipid){
    //FIXME: use native function instead
    // 2010-04-01@rds12: improved selection script by using 'clickfast',
    // but we have to use 'set_action' after all selections to
    // update the gui and the ship stack, so that fixme is still active

    const dom = this.od.dom;
    const $ = this.od.jQuery;

    // toggle ship selection
    dom.clickfast(shipid);

    // clicks won't remove ships background
    if($('#'+shipid).is('.tabletrans'))
      $('#'+shipid).attr({'class':'opacity1','bgcolor':''});

    // 2010-04-01@rds12: changed 'td#shipid' to '#shipid'
    // to perform faster ship selection
  },
  
  /**
   * type:
   *   none   - unselect all ships
   *   all    - select all ships
   *   invert - invert selection of all ships
   *   toggle - select all ships or unselect all ships
   *   first  - select only the first ship
   */
  select_ships: function(type,options){
    const self = this;
    const $ = this.od.jQuery;
    var type = type.toLowerCase();

    // unselect all ships
    if(type == 'none'){
      var ships = this.get_ships({filter:'selected'});
      ships.each(function(i,e){
        var shipid = $(e).attr('id');
        self.toggle_ship_selection(shipid);
      });
      self.update_gui_and_stack();
      return;
    }

    // invert all ships
    if(type == 'invert'){
      var ships = this.get_ships();
      ships.each(function(i,e){
        var shipid = $(e).attr('id');
        self.toggle_ship_selection(shipid);
      });
      self.update_gui_and_stack();
      return;
    }

    // un/select all ships
    if(type == 'toggle'){
      var selected = this.is_ship_selected();
      // if something is selected -> unselect it
      selected ? this.select_ships('none') : this.select_ships('all');
      return;
    }

    // get first ship
    var range = undefined;
    if(type == 'first'){
      range = { start: 0, end: 1 }
    }

    var ships = this.get_ships({'range': range});

    // toggle all matched ships
    ships.each(function(i,e){
      var shipid = $(e).attr('id');
      self.toggle_ship_selection(shipid);
    });
    self.update_gui_and_stack();
  },
  
  is_ship_selected: function(){
    var selected = this.get_ships({
      filter:'selected', range: { start: 0, end: 1 }
    }).length;
    return !!selected;
  },
  
  get_statistics: function(){
    const $ = this.od.jQuery;
    
    var ships  = this.get_ships();
    var stats = {
      length: ships.length,
      ships:  ships,
      imgs:{}
    };
    ships.each(function(i,e){
      var img = $(e).find('img:eq(0)').attr('src');
      
      if(!stats.imgs[img]) stats.imgs[img]=0;
      stats.imgs[img]++;
    });
    
    return stats;
  },
  
  cmd_send_planet: function(){
    const dom = this.od.dom;

    var selected = this.is_ship_selected();
    if(!selected) this.select_ships('all');

    dom.sender();
  },

  cmd_camouflage_fleet: function(){
    const dom = this.od.dom;

    var selected = this.is_ship_selected();
    if(!selected) this.select_ships('all');

    dom.tarner();
  },

  cmd_attack_ship: function(){
    // FIXME: check if enemie ship exists
    const dom = this.od.dom;

    var selected = this.is_ship_selected();
    if(!selected) this.select_ships('first');

    dom.schoschip();
  },

  cmd_attack_planet: function(){ 
    const dom = this.od.dom;

    var selected = this.is_ship_selected();
    if(!selected) this.select_ships('first');

    dom.atackplan();
  },
  
  cmd_use_gate: function(){
    // FIXME: check if gate exists
    const dom = this.od.dom;

    var selected = this.is_ship_selected();
    if(!selected) this.select_ships('all');

    dom.jump();
  },
  
  cmd_load_materials: function(){
    // FIXME: select existing transporters
    const dom = this.od.dom;

    var selected = this.is_ship_selected();
    if(!selected) this.select_ships('all');

    dom.loader();
  },
  
  cmd_use_bioweapon: function(){
    // FIXME: select strongest bioweapon
    const dom = this.od.dom;

    dom.biolo();
  },
  
  cmd_use_emp: function(){
    // FIXME: select emp
    const dom = this.od.dom;

    dom.empfire();
  },
  
  cmd_scan_planet: function(){
    // FIXME: select strongest scanner, can you distinguish the power?
    const dom = this.od.dom;

    dom.scanit();
  },
  
  cmd_rename_ship: function(){
    // FIXME: if more than one ship was selected, do nothing!
    const dom = this.od.dom;

    dom.rename(); 
  },
  
  cmd_merge_into_fleet: function(){
    // FIXME: deselect all fleets
    const dom = this.od.dom;

    dom.fleeter();
  },
  
  gui_extending_shortcuts_handler: function(event){
    const self = this;
    var key = String.fromCharCode(event.which).toLowerCase();

    // checking if key is a alphabet-sign
    if(!/\w/.test(key)) return;

    var keys = {
      s: function(){ // ship camouflage
        self.cmd_camouflage_fleet();
      }, 
      w: function(){ // send ship
        self.cmd_send_planet();
      }, 
      e: function(){ // attack ship
        self.cmd_attack_ship();
      },
      q: function(){ // attack planet
        self.cmd_attack_planet();
      },
      t: function(){ // select all or unselect all
        self.select_ships('toggle');
      },
      a: function(){ // invert all ship selections
        self.select_ships('invert');
      },
      r: function(){ // un/load materials
        self.cmd_load_materials();
      },
      d: function(){  // use gate
        self.cmd_use_gate();
      },
      y: function(){ // bioweapon
        self.cmd_use_bioweapon();
      },
      x: function(){ // fire emp
        self.cmd_use_emp();
      },
      c: function(){ // scan planet
        self.cmd_scan_planet();
      },
      v: function(){ // rename ship
        self.cmd_rename_ship();
      },
      f: function(){ // merge into a fleet
        self.cmd_merge_into_fleet();
      }
    }
    var exists = key in keys;

    // doesn't exists -> wrong key
    if(!exists) return;
    keys[key]();
  },
  
  gui_extending_shortcuts: function(){
    if(this.lib.preferences.get('preferences.orbit.shortcuts') !== true)
      return;

    const $ = this.od.jQuery;
    const doc = this.od.doc;
    const self = this;

    if(self.modules.basic.is_debug_enabled){
      //FIXME: remove me
      this.od.dom.get_ships = function(options){
        var ships = self.get_ships(options);
        return ships.length;
      }
    }

    // only if it is our own orbit.
    if(this.modules.location.options['type'] != 'own') return;

    // yeah we have ids for all fleet commands :D
    // what happens if a command and ship id matches?
    $('#200201').prepend('[w] '); // send ship
    $('#200208').prepend('[e] '); // attack ship
    $('#200203').prepend('[r] '); // un/load materials
    $('#200210').prepend('[d] '); // use gate
    $('#200207').prepend('[q] '); // attack planet
    $('#200212').prepend('[v] '); // rename ship
    $('#200217').prepend('[f] '); // merge into a fleet
    $('#200301').prepend('[s] '); // ship camoufalge
    $('#200215').prepend('[y] '); // use bioweapon
    $('#200219').prepend('[x] '); // fire emp
    $('#200202').prepend('[c] '); // scan planet

    $('a[href$=aller(1);]').prepend('[t] ').
    attr('href','javascript:').click(function(){
      // change behavior to a real un/select event
      self.select_ships('toggle');
    }).parent().append($(this.template('selectorInvert'))
    .click(function(){
      // add invert all event 
      self.select_ships('invert');
    }));

    // resize command panel and remove fixed width so that
    // the extended text won't screw up the layout
    $('#200201').parents('table:first').css('width','700px')
    .find('tr:first td').each(function(i,e){
      $(e).removeAttr('width');
    });

    // registering onkey event!
    $(doc).keydown(function(event){
      var active = $(doc.activeElement);
      if(active.is(':input')) return;

      self.gui_extending_shortcuts_handler(event);
    });
  },
  
  gui_extending_ships_statistic: function(){
    if(this.lib.preferences.get('preferences.orbit.shipStatistics') !== true)
      return;

    const $ = this.od.jQuery;
    
    var stats = this.get_statistics();
    if(!stats.length) return;
    
    var win = $('td[namsn]:first').parents('div:first'),
        ele = $(this.template('statisticsWindow')),
        max = stats.length;

    win.parents(':first').prepend(ele);

    for(var key in stats.imgs){
      var count = stats.imgs[key];
      ele.append(this.template('statisticsEntry',key,count,count*100.0/max));
    }
    ele.append(this.template('statisticsLastEntry'));
  }
});
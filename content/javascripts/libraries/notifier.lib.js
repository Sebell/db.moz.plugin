//= basics.js
//= template.js

Namespace('db.moz.plugin');

db.moz.plugin.notifier = function(template_path){
  this.binded_content = window.content;
  var $ = db.moz.plugin.jQuery.new_query(),
      event = new db.moz.plugin.basics.event(),
      template = new db.moz.plugin.templates(template_path);

  this.rebind_notify_window = function(){
    var jQuery = $('body',this.binded_content.document),
        window = jQuery.find('#dbMozPluginNotifyWindow');

    // if notifier window is not avaible, append it!
    // necessary if page location changed
    if(!window.length){
      var name = template.parse('notifierName') || 'Notifier',
          close = template.parse('notifierClose') || 'close',
          div = '<div class="dbMozPluginBox" id="dbMozPluginNotifyWindow">' +
        '<div>' + name + ': <div class="closer"><a href="javascript:">' + close + '</a></div></div>' +
        '<div id="dbMozPluginNotifyEntry"/>' +
      '</div>'
      jQuery.append(div);
      window = jQuery.find('#dbMozPluginNotifyWindow');

      // add close button event
      jQuery.find('#dbMozPluginNotifyWindow .closer').click(function(){
        window.fadeOut('slow');
      });
    }

    var entry = jQuery.find('#dbMozPluginNotifyEntry');

    return {window: window, entry: entry};
  }

  this.notify = function(){
    try{
      var args = Array.prototype.slice.call(arguments),
          notifier = this.rebind_notify_window(),
          message = template.parse(args);

      // set message
      notifier.entry.html(message);
      // show window
      notifier.window.fadeIn('slow');

      // delay fade out
      event.delay(function(){
        notifier.window.fadeOut('slow');
      }, 15 * 1000);
    }catch(e){
      alert(e);
    }
  }
}
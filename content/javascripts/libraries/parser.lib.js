//= ajax.js

Namespace('db.moz.plugin');

db.moz.plugin.parser = {

  getSourceFromPage: function(doc){
    // code copied and modified from odhelper extension 
    // (http://helper.omega-day.com/)
    // from the original function getHtmlFromCache

    // originial: doc = window._content.document;
    // but _content is deprecated
    doc = doc || window.content.document;
    // Part 1 : get the history entry (nsISHEntry) associated with the document
    try {
      // Get the DOMWindow for the requested document.  If the DOMWindow
      // cannot be found, then just use the _content window...
      win = doc.defaultView;
      if (win == window) {
        // originial: win = _content;
        // but _content is deprecated
        win = content;
      }
      ifRequestor = win.QueryInterface(Components.interfaces.nsIInterfaceRequestor);
      webNav = ifRequestor.getInterface(Components.interfaces.nsIWebNavigation);
      delete win,ifRequestor;
    } catch(err) {
      // If nsIWebNavigation cannot be found, just get the one for the whole window...
      webNav = getWebNavigation();
    }
    try {
      PageLoader = webNav.QueryInterface(Components.interfaces.nsIWebPageDescriptor);
      pageCookie = PageLoader.currentDescriptor;
      shEntry = pageCookie.QueryInterface(Components.interfaces.nsISHEntry);
      delete webNav,PageLoader,pageCookie;
    } catch(err) {
      // If no page descriptor is available, just use the URL...
    }
    //// Part 2 : open a nsIChannel to get the HTML of the doc
    url = doc.URL;
    urlCharset = doc.characterSet;
    ios = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
    channel = ios.newChannel( url, urlCharset, null );
    delete doc,url,urlCharset,ios;
    channel.loadFlags |= Components.interfaces.nsIRequest.VALIDATE_NEVER;
    channel.loadFlags |= Components.interfaces.nsIRequest.LOAD_FROM_CACHE;
  //    channel.loadFlags |= Components.interfaces.nsICachingChannel.LOAD_ONLY_FROM_CACHE;
  
    try {
      // Use the cache key to distinguish POST entries in the cache (see nsDocShell.cpp)
      cacheChannel = channel.QueryInterface(Components.interfaces.nsICachingChannel);
      cacheChannel.cacheKey = shEntry.cacheKey;
      delete shEntry,cacheChannel;
    } catch(e) {}
  
    var stream = channel.open();
    delete channel;
    scriptableStream = Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance(Components.interfaces.nsIScriptableInputStream);
    scriptableStream.init( stream );
  
    var s = "";
    try {
      while( scriptableStream.available()>0 ) {
        s += scriptableStream.read(scriptableStream.available());
      }
    } catch(e) {}
    scriptableStream.close();
    stream.close();
    delete cacheChannel,stream;
    return s;
  },

  createIframe: function(url,callback,failure){
    // check url before creating iframe instance
    if(!url || !callback) return false;

    const $ = db.moz.plugin.jQuery.get_chrome();

    var was_site_loaded = function(event){
      const doc = event.originalTarget;
      if(doc.nodeName != "#document") return false;
      if(doc.location.href == "about:blank" || 
         doc.defaultView.frameElement) return false;

      reset_timeout();
      return true;
    }

    var setCallback = function(callback){
      $(iframe).unbind();
      return $(iframe).bind('DOMContentLoaded', function(event){
        if(!was_site_loaded(event)) return false;
        try{
          callback(event);
        }catch(e){
          failed(false);
        }
      });
    }

    var open = function(url){
      try{
        iframe.webNavigation.loadURI(url,Components.interfaces.nsIWebNavigation,null,null,null);
      }catch(e){
        failed(false);
      }
    }

    var destroy = function(){
      event.destroy();
      // remove the frame asynchronously
      setTimeout(function(){
        iframe.parentNode.removeChild(iframe);
      },0);
    }

    var reset_timeout = function(){
      // wait 5 minutes, then destroy 
      event.delay(function(){
        failed(true);
      },5 * 60 * 1000);
    }

    var create = function(){
      const prefs = db.moz.plugin.preferences;
      var iframe = document.createElement('iframe');
      if(true !== prefs.get('debug.enable'))
        iframe.setAttribute("collapsed", "true");

      iframe.setAttribute("type", "content");
      iframe.setAttribute('class','dbMozPluginIframe');
      iframe.setAttribute('created_at',new Date().getTime());
  
      // append it
      $("#main-window").append(iframe);
  
      // set navigation properties
      iframe.webNavigation.allowAuth = true;
      iframe.webNavigation.allowImages = false;
      iframe.webNavigation.allowJavascript = false;
      iframe.webNavigation.allowMetaRedirects = true;
      iframe.webNavigation.allowPlugins = false;
      iframe.webNavigation.allowSubframes = false;
      return iframe;
    }

    var failed = function(timeout){
      try{
        failure(timeout);
      }catch(e){}
      destroy();
    }

    try{
      // create iframe
      event = new db.moz.plugin.basics.event;
      iframe = create();
  
      setCallback(callback);
      open(url);
    }catch(e){
      failed(false);
    }

    return {
      get: function(){
        return iframe;
      },
      open: open,
      setCallback: setCallback,
      destroy: destroy
    }
  },

  ODHelperMethode: function(doc){
    const prefs = db.moz.plugin.preferences,
          self = this,
          inputName = prefs.get('preferences.configset.parserTargetElement'),
          parserUri = prefs.get('preferences.configset.parserTargetUri'),
          notifier = new db.moz.plugin.notifier('lib.parser'),
          $ = db.moz.plugin.jQuery.get_chrome(),
          ajax = db.moz.plugin.ajax;

    // should use external parser?
    if( true !== prefs.get('preferences.configset.parserUseExt') )
      return false;

    status = ajax.check_url(parserUri);

    // something is fishy about the given url
    if(status[0] != 'requestUrlOk'){
      notifier.notify(status);
      return false;
    }
    delete status;

    notifier.notify('parserGetSource');
    source = this.getSourceFromPage(doc);

    notifier.notify('parserInitialize');

    this.copyToClipboard(source,notifier);

    if(source == ''){
      notifier.notify('parserNoSource');
      return true;
    }

    var iframe = this.createIframe(parserUri,function(event){
      notifier.notify('parserLoaded');
      input = $('textarea[name='+inputName+']:first',iframe.get().contentDocument);

      // check if input element is avaible
      if(!input.length){
        notifier.notify('parserTargetNotFound',inputName);
        iframe.destroy();
        return;
      }

      input.val(source);
//      delete s;

      var form = input.parents('form:first');
      delete input;

      if(!form.length){
        notifier.notify('parserTargetFormNotFound',inputName);
        iframe.destroy();
        return;
      }

      iframe.setCallback(function(){
        notifier.notify('parserTargetSubmitted');
        iframe.destroy();
      });

      notifier.notify('parserTargetOnSubmit');
      form.get(0).submit();
    },function(timeout){
      mess = timeout? 'parserTimeout' : 'parserFailure';
      notifier.notify(mess);
      delete mess;
    });

    return true;
  },

  dbMozPluginMethode: function(){
    const ajax = db.moz.plugin.ajax,
          prefs = db.moz.plugin.preferences;

    inputName = prefs.get('preferences.configset.parserTargetElement');
    parserUri = prefs.get('preferences.configset.parserTargetUri');
    postBody = {check: 'yes'};

    postBody[inputName] = this.getSourceFromPage();
    delete inputName;

    new ajax(parserUri, {
      method: 'post',
      timeout: 10 * 1000, // wait 10s
      postBody: postBody,
      onSuccess: function(xhr){
        alert(xhr.responseText);
      },
      onFailure: function(xhr){
        //notify
        alert('retrieveFormEntries: failure');
      }
    });
    delete parserUri,postBody;
  },

  copyToClipboard: function(source, notifier){
    const prefs = db.moz.plugin.preferences;

    if( true !== prefs.get('preferences.configset.parserClipboardCopy') )
      return;

    // bind notifier to the current window
    notifier = notifier || new db.moz.plugin.notifier('lib.parser');

    if(!source){
      notifier.notify('parserNoSource');
    }

    // @see: https://developer.mozilla.org/en/Using_the_Clipboard
    const gClipboardHelper = Components.classes[
      "@mozilla.org/widget/clipboardhelper;1"
    ].getService(Components.interfaces.nsIClipboardHelper);

    gClipboardHelper.copyString(source);
    if(source){
      notifier.notify('parserCopiedToClipboard');
    }
    delete notifier;
  },

  parseSite: function(doc, force){
    doc = doc || window.content.document;

    // check if omega-day, to disallow source page of
    // other sites than omega-day
    if(!force && !db.moz.plugin.browser.check_if_omega_day(doc)){
      return;
    }

    const prefs = db.moz.plugin.preferences,
          self = this;

    already_copied = false;

    //TODO: build api for silent and safer parser
    try{
      already_copied = this.ODHelperMethode(doc);
    }catch(e){}
    //this.dbMozPluginMethode();

    // if a given methode already copied source code to
    // clipboard don't do it anymore
    // we have to do it, because all methods could be disabled
    if(already_copied !== true){
      // get source
      source = this.getSourceFromPage(doc);
      this.copyToClipboard(source);
      delete source;
    }
    delete doc,already_copied;
  },

  is_disabled: function(){
    const prefs = db.moz.plugin.preferences,
          clipboard = true === prefs.get('preferences.configset.parserClipboardCopy'),
          parser = true === prefs.get('preferences.configset.parserUseExt');

    // if clipboard and parser is false, this function is disabled
    return !parser && !clipboard;
  }
}
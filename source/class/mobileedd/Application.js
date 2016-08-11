/* ************************************************************************

   Copyright:

   License:

   Author: Jonathan Wolfe

************************************************************************ */

/*global qx*/

/**
 * This is the main application class of your custom application "MobileEDD"
 *
 * @asset(mobileedd/*)
 */
qx.Class.define("mobileedd.Application",
{
  extend : qx.application.Mobile,
  members :
  {
    /**
     * This method contains the initial application code and gets called
     * during startup of the application
     */
    main : function()
    {
      // Call super class
      this.base(arguments);

      // Don't allow users to go to routing pages
      if (window.location.href.indexOf('#%2F') !== -1) {
        //window.location = window.location.href.replace(/#%2F\S+/gi,'');
        location.hash = '';
      }

      // Enable logging in debug variant
      if (qx.core.Environment.get("qx.debug"))
      {
        // support native logging capabilities, e.g. Firebug for Firefox
        qx.log.appender.Native;

        // support additional cross-browser console.

        // Trigger a "longtap" event on the navigation bar for opening it.
        qx.log.appender.Console;
      }

      /*
      -------------------------------------------------------------------------
        Below is your actual application code...
        Remove or edit the following code to create your application.
      -------------------------------------------------------------------------
      */
      var map = mobileedd.page.Map.getInstance();
      var hazardtext = mobileedd.page.HazardText.getInstance();
      var travelhazards = mobileedd.page.PageTravelHazards.getInstance();
      var travelsample = mobileedd.page.TravelSample.getInstance();

      // Add the pages to the page manager.
      var manager = new qx.ui.mobile.page.Manager(false);
      manager.addDetail([map, hazardtext, travelhazards, travelsample]);

      // Initialize the application routing
      this.getRouting().onGet("/", this._show, map);
      this.getRouting().onGet("/hazardtext", this._show, hazardtext);
      this.getRouting().onGet("/travelhazards", this._show, travelhazards);
      this.getRouting().onGet("/travelsample", this._show, travelsample);
      this.getRouting().init();
    },

    /**
     * Default behaviour when a route matches. Displays the corresponding page on screen.
     * @param data {Map} the animation properties
     */
    _show : function(data) {
      this.show(data.customData);
    }
  }
});

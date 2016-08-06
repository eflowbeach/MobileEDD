/* ************************************************************************

   Copyright:

   License:

   Authors:

************************************************************************ */

/**
 * This is the main application class of your custom application "MobileWx"
 *
 * @asset(mobilewx/*)
 */
qx.Class.define("mobilewx.Application",
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
      var map = mobilewx.page.Map.getInstance();
      var hazardtext = mobilewx.page.HazardText.getInstance();

      // Add the pages to the page manager.
      var manager = new qx.ui.mobile.page.Manager(false);
      manager.addDetail([map, hazardtext]);

      // Initialize the application routing
      this.getRouting().onGet("/", this._show, map);
      this.getRouting().onGet("/hazardtext", this._show, hazardtext);
      this.getRouting().init();

      // setTimeout(function(){

      //   HazardText.show();

      // },5000)
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

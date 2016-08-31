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

      // Detect if page is secure
      mobileedd.config.Config.getInstance().setSecure(document.location.protocol);

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

      // Get my libs
      var req = new qx.bom.request.Script();
      req.open("GET", "resource/mobileedd/libs/mobileeddlibs.js");
      req.send();
      var map = mobileedd.page.Map.getInstance();
      var hazardtext = mobileedd.page.HazardText.getInstance();
      var travelhazards = mobileedd.page.PageTravelHazards.getInstance();
      var travelsample = mobileedd.page.TravelSample.getInstance();
      var hydrograph = mobileedd.page.Hydrograph.getInstance();
      var observation = mobileedd.page.Observation.getInstance();
      var forecast = mobileedd.page.Forecast.getInstance();

      // Add the pages to the page manager.
      var manager = new qx.ui.mobile.page.Manager(false);
      manager.addDetail([map, hazardtext, travelhazards, travelsample, hydrograph, observation, forecast]);

      // Initialize the application routing
      this.getRouting().onGet("/", this._show, map);
      this.getRouting().onGet("/hazardtext", this._show, hazardtext);
      this.getRouting().onGet("/travelhazards", this._show, travelhazards);
      this.getRouting().onGet("/travelsample", this._show, travelsample);
      this.getRouting().onGet("/hydrograph", this._show, hydrograph);
      this.getRouting().onGet("/observation", this._show, observation);
      this.getRouting().onGet("/forecast", this._show, forecast);
      this.getRouting().init();
      var button = new qx.ui.mobile.basic.Image("resource/mobileedd/images/legendOn.png");
      button.setId("hideButton");
      var slide =
      {
        keep : 100,
        timing : "ease-out",
        keyFrames :
        {
          0 : {
            translate : ["0px", "0px"]
          },
          100 : {
            translate : ["300px", "0px"]
          }
        }
      };
      button.addListener("tap", function(e) {
        if (button.getSource() == "resource/mobileedd/images/legendOn.png")
        {
          button.setSource("resource/mobileedd/images/legendOff.png");
          qx.bom.element.Animation.animate(mobileedd.page.Map.getInstance().legendContainer.getContentElement(), slide, 300);
        } else
        {
          button.setSource("resource/mobileedd/images/legendOn.png")
          qx.bom.element.Animation.animateReverse(mobileedd.page.Map.getInstance().legendContainer.getContentElement(), slide, 300);
        }
      }, this);
      this.getRoot().add(button);
    },

    /**
     * Default behaviour when a route matches. Displays the corresponding page on screen.
     * @param data {Map} the animation properties
     */
    _show : function(data)
    {
      try {
        new qx.bom.Selector.query('#hideButton')[0].style.visibility = "hidden";
      }catch (e)
      {
        // not ready yet
      }
      this.show(data.customData);
    }
  }
});

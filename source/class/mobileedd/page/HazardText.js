/* ************************************************************************

   Copyright:

   License:

   Authors:
me.imageurl = "http://www.weather.gov/images/crh/impact/" + f.office + "_" + wtype + "_" + eventid + "_" + f.end + ".png";
************************************************************************ */

/*global qx*/

/**
 */
qx.Class.define("mobileedd.page.HazardText",
{
  extend : qx.ui.mobile.page.NavigationPage,
  type : 'singleton',
  construct : function()
  {
    this.base(arguments);
    this.bus = qx.event.message.Bus.getInstance();
    this.setTitle("Hazard Text");
    this.setShowBackButton(true);
    this.setBackButtonText("Back");
  },
  members :
  {
    // overridden
    _initialize : function()
    {
      this.base(arguments);
      this.label = new qx.ui.mobile.basic.Label("Hazard Text");
      this.getContent().add(this.label);
      this.bus.subscribe("edd.hazard", function(e)
      {
        var text = e.getData();
        this.label.setValue(text.replace(/\n/g, '<br>').replace(/FLASH FLOOD WARNING/g, '<b style="color:red;">FLASH FLOOD WARNING</b>').replace(/TORNADO WARNING/g, '<b style="color:red;"TORNADO WARNING</b>').replace(/SEVERE THUNDERSTORM WARNING/g, '<b style="color:red;">SEVERE THUNDERSTORM WARNING</b>'));
      }, this);
    },

    // overridden
    _back : function() {
      qx.core.Init.getApplication().getRouting().back();
    }
  }
});

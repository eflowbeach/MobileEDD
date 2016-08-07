/* ************************************************************************

   Copyright:

   License:

   Authors:

************************************************************************ */

/**
 */
qx.Class.define("mobilewx.page.HazardText",
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
        this.label.setValue(text.replace(/\n/g, '<br>'));
      }, this)
    },

    // overridden
    _back : function() {
      qx.core.Init.getApplication().getRouting().back();
    }
  }
});

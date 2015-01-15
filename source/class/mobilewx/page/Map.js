/* ************************************************************************

   Copyright:

   License:

   Authors:

************************************************************************ */

/**
 */
qx.Class.define("mobilewx.page.Map",
{
  extend : qx.ui.mobile.page.NavigationPage,
  construct : function()
  {
    this.base(arguments);
    this.setTitle("Map");
  },
  members :
  {
    _mapUri : "http://openlayers.org/en/v3.1.1/build/ol.js",

    // overridden
    _initialize : function()
    {
      this.base(arguments);
      this._loadMapLibrary();

      // Listens on window orientation change and resize, and triggers redraw of map.

      // Needed for triggering OpenLayers to use a bigger area, and draw more tiles.

      //      qx.event.Registration.addListener(window, "orientationchange", this._redrawMap, this);

      //      qx.event.Registration.addListener(window, "resize", this._redrawMap, this);
    },

    /**
     * Calls a redraw on Mapnik Layer. Needed after orientationChange event
     * and drawing markers.
     */

    //    _redrawMap : function () {

    //      if(this._mapnikLayer !== null) {

    //        this._map.updateSize();

    //        this._mapnikLayer.redraw();

    //      }

    //    },

    // overridden
    _createScrollContainer : function()
    {
      // MapContainer
      var layout = new qx.ui.mobile.layout.VBox().set(
      {
        alignX : "center",
        alignY : "middle"
      });
      var mapContainer = new qx.ui.mobile.container.Composite(layout);
      mapContainer.setId("map");
      mapContainer.addCssClass("map");
      return mapContainer;
    },

    /**
     * Loads JavaScript library which is needed for the map.
     */
    _loadMapLibrary : function()
    {
      var req = new qx.bom.request.Script();
      req.onload = function() {
        var map = new ol.Map(
        {
          target : 'map',
          layers : [new ol.layer.Tile( {
            source : new ol.source.MapQuest( {
              layer : 'sat'
            })
          })],
          view : new ol.View(
          {
            center : ol.proj.transform([37.41, 8.82], 'EPSG:4326', 'EPSG:3857'),
            zoom : 4
          })
        });
      }.bind(this);
      req.open("GET", this._mapUri);
      req.send();
    }
  }
});

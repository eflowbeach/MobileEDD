/**
*  NDFD
*
*/

/*global qx*/

/*global ol*/

/*global mobileedd*/
qx.Class.define("mobileedd.Ndfd",
{
  extend : qx.core.Object,
  type : "singleton",
  properties :
  {
    field : {
      init : 'maxt',
      apply : "getValidTimes"
    },
    region : {
      init : 'conus',
      apply : "getValidTimes"
    },
    validTime : {
      init : '',
      apply : "updateLayer"
    },
    visibility :
    {
      init : true,
      apply : "changeVisibility"
    }
  },
  construct : function()
  {
    var me = this;
    me.base(arguments);
    this.c = mobileedd.config.Config.getInstance();
    me.bus = qx.event.message.Bus.getInstance();
    me.mapObject = mobileedd.page.Map.getInstance();
    me.map = me.mapObject.getMap();

    // NDFD Time Request
    me.validTimeRequest = new qx.io.request.Jsonp();
    me.validTimeRequest.setCallbackParam('callback');
    me.validTimeRequest.addListener("success", function(e)
    {
      var validTimes = e.getTarget().getResponse();
      me.setValidTime(validTimes[0][0])
      if (typeof me.ndfd == "undefined") {
        me.addLayers();
      } else {
        me.updateLayer();
      }
    }, this);

    // Query server for valid times
    me.getValidTimes();
  },
  members :
  {
    updateLayer : function(value)
    {
      var me = this;
        if (typeof me.ndfd !== "undefined") {
      var layers = 'ndfd.' + me.getRegion() + '.' + me.getField();
      me.ndfd.getSource().updateParams(
      {
        'LAYERS' : layers,
        'VT' : me.getValidTime()
      });
      me.ndfdPoints.getSource().updateParams(
      {
        'LAYERS' : layers + '.points',
        'VT' : me.getValidTime()
      });
        }
        
        // Update legend
        //http://digital.weather.gov/scripts/wxmap_legendImage.php?dataset=ndfd&element=maxt&region=conus&opacity=1.0&vt=2016-10-02T00:00&width=272&ms=english
        me.mapObject.ndfdLegend.setSource('http://digital.weather.gov/scripts/wxmap_legendImage.php?dataset=ndfd&element=maxt&region=conus&opacity=1.0&vt=2016-10-02T00:00&width=272&ms=english');
        me.mapObject.ndfdLegendLabel.setValue(me.mapObject.setFieldNdfdButton.getValue() + '&nbsp;Forecast<br>Valid: ' + new moment(me.getValidTime()).format('h:mm a ddd M/DD/YYYY'));
    },
    // updateValidTime : function(value)
    // {
    //   var me = this;
    //   me.ndfd.getSource().updateParams( {
    //     'VT' : value
    //   });
    //   me.ndfdPoints.getSource().updateParams( {
    //     'VT' : value
    //   });
    // },
    changeVisibility : function(value) {
      if (typeof this.ndfd !== "undefined")
      {
        this.ndfd.setVisible(value);
        this.ndfdPoints.setVisible(value);
      }
    },
    getValidTimes : function()
    {
      var me = this;
      var url = me.mapObject.getJsonpRoot() + "ndfd/getNDFDTimes.php";
      url += "?region=" + me.getRegion();
      url += "&elmt=" + me.getField();
      me.validTimeRequest.setUrl(url);
      me.validTimeRequest.send();
    },

    /**
    * Add the NDFD layers
    */
    addLayers : function()
    {
      var me = this;
      var layers = 'ndfd.' + me.getRegion() + '.' + me.getField();
      me.ndfd = new ol.layer.Tile(
      {
        name : 'NDFD',
        source : new ol.source.TileWMS(
        {
          url : 'http://digital.weather.gov/wms.php',
          params :
          {
            'LAYERS' : layers,
            'FORMAT' : "image/png",
            'TRANSPARENT' : "TRUE",
            'TRANSITIONEFFECT' : "resize",
            'VERSION' : "1.3.0",
            'VT' : me.getValidTime(),  //"2016-10-02T00:00",
            'EXCEPTIONS' : "INIMAGE",
            'SERVICE' : "WMS",
            'REQUEST' : "GetMap",
            'STYLES' : "",
            'REGION' : "conus",
            'CRS' : "EPSG:3857",
            'WIDTH' : '512',
            'HEIGHT' : '512'
          }
        })
      })
      me.ndfdPoints = new ol.layer.Tile(
      {
        name : 'NDFD Samples',
        source : new ol.source.TileWMS(
        {
          url : 'http://digital.weather.gov/wms.php',
          params :
          {
            'LAYERS' : layers + '.points',
            'FORMAT' : "image/png",
            'TRANSPARENT' : "TRUE",
            'TRANSITIONEFFECT' : "resize",
            'VERSION' : "1.3.0",
            'VT' : me.getValidTime(),
            'EXCEPTIONS' : "INIMAGE",
            'SERVICE' : "WMS",
            'REQUEST' : "GetMap",
            'STYLES' : "",
            'REGION' : "conus",
            'CRS' : "EPSG:3857",
            'WIDTH' : '512',
            'HEIGHT' : '512'
          }
        })
      })
      me.ndfd.setVisible(me.getVisibility());
      me.ndfdPoints.setVisible(me.getVisibility());
      me.map.addLayer(me.ndfd);
      me.map.addLayer(me.ndfdPoints);
    }
  }
});

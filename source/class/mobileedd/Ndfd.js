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
    field :
    {
      init : 'maxt',
      apply : "getValidTimes"
    },
    region :
    {
      init : 'conus',
      apply : "getValidTimes"
    },
    validTime :
    {
      init : '',
      apply : "updateLayer"
    },
    issuedTime : {
      init : ''
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
      me.validTimes = e.getTarget().getResponse();

      // Update Slider
      me.mapObject.ndfdLoopSlider.setMaximum(me.validTimes.length - 1);

      // Set to first value
      me.setIssuedTime(me.validTimes[0][1]);
      me.setValidTime(me.validTimes[0][0]);
      me.validTimes.forEach(function(obj, index) {
        if (obj[0] == me.getValidTime()) {
          me.mapObject.ndfdLoopSlider.setValue(index);
        }
      })
      if (typeof me.ndfd == "undefined")
      {
        me.addLayers();

        // Set the slider - a special case
        me.validTimes.forEach(function(obj, index) {
          if (obj[0] == me.mapObject.getURLParameter('ndfdvt'))
          {
            me.setRegion(me.mapObject.getURLParameter('ndfdregion'));
            me.setField(me.mapObject.getURLParameter('ndfdfield'));
            me.mapObject.ndfdLoopSlider.setValue(index);
          }
        })
      } else
      {
        me.updateLayer();
      }
    }, this);

    // Limit update calls
    me.timeStepTimer = new qx.event.Timer(1000);
    me.timeStepTimer.addListener("interval", function(e)
    {
      me.validTimeRequest.send();
      me.timeStepTimer.stop();
    }, this);

    // Limit wms calls
    me.changeLayerTimer = new qx.event.Timer(1000);
    me.changeLayerTimer.addListener("interval", function(e)
    {
      if (typeof me.ndfd !== "undefined")
      {
        var layers = 'ndfd.' + me.getRegion() + '.' + me.getField();
        me.ndfd.getSource().updateParams(
        {
          'LAYERS' : layers,
          'VT' : me.getValidTime()
        });
        var units = '';
        if (me.mapObject.setFieldNdfdButton.getValue().indexOf('MPH') !== -1) {
          units = '.english';
        }
        me.ndfdPoints.getSource().updateParams(
        {
          'LAYERS' : layers + '.points' + units,
          'VT' : me.getValidTime()
        });
        me.ndfdBarbs.getSource().updateParams(
        {
          'LAYERS' : 'ndfd.' + me.getRegion() + '.' + 'windspd.windbarbs' + units,
          'VT' : me.getValidTime()
        });

        // Update legend
        me.mapObject.ndfdLegend.setSource('https://digital.weather.gov/scripts/wxmap_legendImage.php?dataset=ndfd&element=' + me.getField() + '&region=' + me.getRegion() + '&opacity=1.0&vt=' + me.getValidTime() + '&width=272&ms=english');
      }
      me.changeLayerTimer.stop();
    }, this);
  },
  members :
  {
    /**
     * Update all appropriate layers
     * */
    updateLayer : function(value)
    {
      var me = this;

      // Trigger layer updates, but do not do it immediately (too many requests...)
      me.changeLayerTimer.restart();

      // Update Labels
      me.mapObject.ndfdLegendLabel.setValue('<b>' + me.mapObject.setFieldNdfdButton.getValue() + '&nbsp;Forecast</b><br>Valid: ' + new moment.utc(me.getValidTime()).local().format('h:mm a ddd M/DD/YYYY'));
      var label = 'Valid: ' + new moment.utc(me.getValidTime()).local().format('h:mm a ddd M/DD/YYYY');
      label += "<br>Issued: " + new moment.utc(me.getIssuedTime()).local().format('h:mm a ddd M/DD/YYYY');
      me.mapObject.ndfdTimeLabel.setValue(label);

      // State border on top
      me.mapObject.putVectorLayerOnTop("U.S. States");
    },
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
      if (typeof (me.ndfdBarbs) !== "undefined") {
        if (me.getField() == "windgust" || me.getField() == "windspd") {
          me.ndfdBarbs.setVisible(true);
        } else {
          me.ndfdBarbs.setVisible(false);
        }
      }
      me.validTimeRequest.setUrl(url);
      me.timeStepTimer.restart();
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
        opacity : 0.7,
        source : new ol.source.TileWMS(
        {
          url : 'https://digital.weather.gov/wms.php',
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
          url : 'https://digital.weather.gov/wms.php',
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
      me.ndfdBarbs = new ol.layer.Tile(
      {
        name : 'NDFD Wind Barbs',
        source : new ol.source.TileWMS(
        {
          url : 'https://digital.weather.gov/wms.php',
          params :
          {
            'LAYERS' : 'ndfd.' + me.getRegion() + '.' + 'windspd.windbarbs',
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
      me.ndfdBarbs.setVisible(false);
      me.map.addLayer(me.ndfd);

      // State border on top
      me.mapObject.putVectorLayerOnTop("U.S. States");
      me.map.addLayer(me.ndfdPoints);
      me.map.addLayer(me.ndfdBarbs);
    }
  }
});

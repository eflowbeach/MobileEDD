/**
* NowCOAST loopable class for Radar
*
*/

/*global qx*/

/*global ol*/

/*global mobileedd*/
qx.Class.define("mobileedd.Radar",
{
  extend : qx.core.Object,
  type : "singleton",
  properties :
  {
    opacity :
    {
      init : 0.7,
      apply : "__changeOpacity"
    },
    sliderIndex :
    {
      init : 5,
      apply : "changeIndex"
    },
    frames :
    {
      init : 5,
      apply : "changeFrames"
    },
    active : {
      init : true
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
    me.radarLayers = {

    };

    // Set up the radar frame time message
    me.timeMessage = new qx.event.message.Message("edd.view.radar.time");

    // Timer
    me.timer = new qx.event.Timer(0);
    var refreshRate = 30;
    me.timer.addListener("interval", function(e)
    {
      me.timer.setInterval(1000 * refreshRate);
      me.timesReq.send();
    });

    // Set up the query timestamp request
    me.timesReq = new qx.io.request.Jsonp(me.c.getSecure() + "//nowcoast.noaa.gov/layerinfo?request=timestops&service=radar_meteo_imagery_nexrad_time&layers=3&format=jsonp");

    // Request Succeeded
    me.timesReq.addListener("success", function(e)
    {
      var response = e.getTarget().getResponse();

      // Get last X frames/times
      var serverRadarTimes = response.layers[0].timeStops.slice(-1 * me.getFrames());

      // Loop through response and check to see if radarLayers is missing any scan.
      serverRadarTimes.forEach(function(obj) {
        // Be sure to match type (string)
        if (!new qx.data.Array(Object.keys(this.radarLayers)).contains(obj + ""))
        {
          // console.log("adding layer", obj);
          this.addLayer(obj);

          // Remove any older scans
          me.removeLayers(me.getFrames());

          // Show latest scan if there are enough frames - performance enhancement
          if (Object.keys(this.radarLayers).length > me.getFrames() - 1)
          {
            // Toggle radar loop slider value to initiate a change event
            var mapClass = mobileedd.page.Map.getInstance();
            if (mapClass.radarToggleButton.getValue())
            {
              var radarLoopSlider = mapClass.radarLoopSlider;
              radarLoopSlider.setValue(radarLoopSlider.getMaximum() - 1);

              // Show latest - wait a 1/2 second so listeners get initialized
              new qx.event.Timer.once(function() {
                radarLoopSlider.setValue(radarLoopSlider.getMaximum());
              }, this, 500);
            }
          }
        }
      }, this);
      me.timer.restart();
    }, this);

    // Request Failed
    me.timesReq.addListener("fail", function(e) {
      console.log('MRMS radar request failed...');
    });
  },
  members :
  {
    /**
    * Specify the number of frames to keep. Remove others
    */
    removeLayers : function(keep)
    {
      var me = this;
      while (Object.keys(this.radarLayers).length > keep)
      {
        var firstKey = Object.keys(me.radarLayers).sort()[0];
        if (typeof firstKey !== "undefined")
        {
          me.map.removeLayer(me.radarLayers[firstKey]);
          me.radarLayers[firstKey] = null;
          delete me.radarLayers[firstKey];
        } else
        {
          // Probably an empty object
          break;
        }
      }
    },

    /**
    * Start the timer
    */
    start : function()
    {
      var me = this;
      me.timer.setInterval(0);
      me.timer.start();
    },

    /**
    * Stop the timer
    */
    stop : function(removeLayers)
    {
      var me = this;
      me.timer.stop();
      if (removeLayers) {
        me.removeLayers(-1);
      }
    },

    /**
    * Change the opacity
    */
    __changeOpacity : function(value)
    {
      var me = this;
      Object.keys(me.radarLayers).sort().forEach(function(obj, index) {
        if (me.getSliderIndex() == index) {
          me.radarLayers[obj].setOpacity(value);
        } else {
          me.radarLayers[obj].setOpacity(0);
        }
      });
    },

    /**
    * Toggle the Visibility
    */
    toggleVisibility : function(value)
    {
      var me = this;
      Object.keys(me.radarLayers).sort().forEach(function(obj, index) {
        me.radarLayers[obj].setVisible(value);
      });
    },

    /**
    * Show currently active layer
    */
    changeIndex : function(sliderIndex)
    {
      var me = this;
      Object.keys(me.radarLayers).sort().forEach(function(obj, index) {
        if (sliderIndex == index)
        {
          // Make the layer visible if it isn't.
          if (!me.radarLayers[obj].getVisible()) {
            me.radarLayers[obj].setVisible(true);
          }

          // Set the opacity
          me.radarLayers[obj].setOpacity(me.getOpacity());
        } else
        {
          me.radarLayers[obj].setOpacity(0);
        }
      });
      me.updateLegend(sliderIndex);
    },

    /**
    * Change Loop Length
    */
    changeFrames : function(number)
    {
      var me = this;
      var mapClass = mobileedd.page.Map.getInstance();
      var radarLoopSlider = mapClass.radarLoopSlider;
      radarLoopSlider.setMaximum(number - 1);
      me.setSliderIndex(number);
      me.timesReq.send();
    },

    /**
    * Update the Radar legend
    */
    updateLegend : function(index)
    {
      var me = this;
      Object.keys(me.radarLayers).sort().forEach(function(obj, index) {
        if (me.getSliderIndex() == index)
        {
          me.timeMessage.setData(new Date(obj * 1));
          me.bus.dispatch(me.timeMessage);
        }
      }, this);
    },

    /**
    * Add a new radar Layer
    */
    addLayer : function(time)
    {
      var me = this;
      var time_range = time + ',' + time;
      if (typeof me.map == "undefined") {
        return;
      }
      me.radarLayers[time] = new ol.layer.Image(
      {
        name : "MRMS - " + time,
        source : new ol.source.ImageArcGISRest(
        {
          params :
          {
            'LAYERS' : 'show:1,2,3',
            'F' : 'image',
            'FORMAT' : 'png8',
            'TRANSPARENT' : 'true',
            'BBOXSR' : '102100',
            'IMAGESR' : '102100',
            'DPI' : 96,
            'time' : time_range
          },
          ratio: 1,
          url : 'https://nowcoast.noaa.gov/arcgis/rest/services/nowcoast/radar_meteo_imagery_nexrad_time/MapServer'//,
//          serverType: 'mapserver'
        })
      });
      me.map.addLayer(me.radarLayers[time]);
      me.radarLayers[time].setVisible(false);
      me.radarLayers[time].setOpacity(me.getOpacity());

      // State border on top
      me.mapObject.putVectorLayerOnTop("U.S. States");

      // Silly way to get Vector Layer on top...
      me.mapObject.putVectorLayerOnTop('Hazards');
    }
  }
});

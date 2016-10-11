/**
* NowCOAST loopable class for radarPhase
*
*/

/*global qx*/

/*global ol*/

/*global mobileedd*/
qx.Class.define("mobileedd.RadarPhase",
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
      init : false
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
    me.radarPhaseLayers = {

    };

    // Set up the radarPhase frame time message
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

    // Need to use EDD's since UW's server doesn't serve the correct response type: text/json rather than application/json
    me.timesReq = new qx.io.request.Jsonp("http://preview.weather.gov/edd/resource/edd/universities/getUWVectorTimes.php?layer=nexrphase");

    // Request Succeeded
    me.timesReq.addListener("success", function(e)
    {
      var response = e.getTarget().getResponse();

      // Get last X frames/times
      var serverTimes = response[0].times.slice(-1 * me.getFrames());

      // Loop through response and check to see if radarPhaseLayers is missing any scan.
      serverTimes.forEach(function(obj) {
        // Be sure to match type (string)
        if (!new qx.data.Array(Object.keys(this.radarPhaseLayers)).contains(obj + ""))
        {
          // console.log("adding layer", obj);
          this.addLayer(obj);

          // Remove any older scans
          me.removeLayers(me.getFrames());

          // Show latest scan if there are enough frames - performance enhancement
          if (Object.keys(this.radarPhaseLayers).length > me.getFrames() - 1)
          {
            // Toggle radarPhase loop slider value to initiate a change event
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
      console.log('RadarPhase request failed...');
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
      while (Object.keys(this.radarPhaseLayers).length > keep)
      {
        var firstKey = Object.keys(me.radarPhaseLayers).sort()[0];
        if (typeof firstKey !== "undefined")
        {
          me.map.removeLayer(me.radarPhaseLayers[firstKey]);
          me.radarPhaseLayers[firstKey] = null;
          delete me.radarPhaseLayers[firstKey];
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
      Object.keys(me.radarPhaseLayers).sort().forEach(function(obj, index) {
        if (me.getSliderIndex() == index) {
          me.radarPhaseLayers[obj].setOpacity(value);
        } else {
          me.radarPhaseLayers[obj].setOpacity(0);
        }
      });
    },

    /**
    * Toggle the Visibility
    */
    toggleVisibility : function(value)
    {
      var me = this;
      Object.keys(me.radarPhaseLayers).sort().forEach(function(obj, index) {
        me.radarPhaseLayers[obj].setVisible(value);
      });
    },

    /**
    * Show currently active layer
    */
    changeIndex : function(sliderIndex)
    {
      var me = this;
      Object.keys(me.radarPhaseLayers).sort().forEach(function(obj, index) {
        if (sliderIndex == index)
        {
          // Make the layer visible if it isn't.
          if (!me.radarPhaseLayers[obj].getVisible()) {
            me.radarPhaseLayers[obj].setVisible(true);
          }

          // Set the opacity
          me.radarPhaseLayers[obj].setOpacity(me.getOpacity());
        } else
        {
          me.radarPhaseLayers[obj].setOpacity(0);
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
      var radarPhaseLoopSlider = mapClass.radarPhaseLoopSlider;
      radarPhaseLoopSlider.setMaximum(number - 1);
      me.setSliderIndex(number);
      me.timesReq.send();
    },

    /**
    * Update the radarPhase legend
    */
    updateLegend : function(index)
    {
      var me = this;
      Object.keys(me.radarPhaseLayers).sort().forEach(function(obj, index) {
        if (me.getSliderIndex() == index)
        {
          me.timeMessage.setData(new moment.utc(obj, "YYYYMMDD.HHmmss").toDate());
          me.bus.dispatch(me.timeMessage);
        }
      }, this);
    },

    /**
    * Add a new radarPhase Layer
    */
    addLayer : function(time)
    {
      var me = this;
      var time_range = time + ',' + time;
      if (typeof me.map == "undefined") {
        return;
      }
      me.radarPhaseLayers[time] = new ol.layer.Tile(
      {
        name : "UW - " + time,
        source : new ol.source.XYZ( {
          url : me.c.getSecure() + '//realearth.ssec.wisc.edu/proxy/image.php?products=nexrphase_' + time.replace('.', '_') + '&x={x}&y={y}&z={z}'
        })
      });
      me.map.addLayer(me.radarPhaseLayers[time]);

      // me.radarPhaseLayers[time].setVisible(false);
      me.radarPhaseLayers[time].setOpacity(me.getOpacity());

      // State border on top
      me.mapObject.putVectorLayerOnTop("U.S. States");

      // Silly way to get Vector Layer on top...
      me.mapObject.putVectorLayerOnTop('Hazards');
    }
  }
});

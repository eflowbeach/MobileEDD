/* ************************************************************************

   Copyright:

   License:

   Authors:

************************************************************************ */

/*global qx*/

/*global ol*/

/*global mobileedd*/

/**
 */
qx.Class.define("mobileedd.page.Map",
{
  extend : qx.ui.mobile.page.NavigationPage,
  type : "singleton",
  properties :
  {
    jsonpRoot : {
      init : ""
    },
    mapUri : {
      init : ""
    },
    ready : {
      init : false
    },
    basemap : {
      init : "ESRI Dark Gray"
    },
    myPosition :
    {
      init : null,
      nullable : true
    },
    stateBorderColor : {
      init : "#717171"
    },
    countyBorderColor : {
      init : "#717171"
    }
  },
  construct : function()
  {
    this.base(arguments);
    this.c = mobileedd.config.Config.getInstance();
    this.bus = qx.event.message.Bus.getInstance();
    this.setTitle("Mobile EDD");
    var me = this;

    // Set the service root

    // preview does not have https - either way it gets blocked...
    me.setJsonpRoot(me.c.getSecure() + "//preview.weather.gov/edd/resource/edd/");

    /**
     * Mapping Library
     * */

    // me.setMapUri("resource/mobileedd/ol.js");
    me.setMapUri("resource/mobileedd/ol-debug.js");

    // Busy indicator
    var busyIndicator = new qx.ui.mobile.dialog.BusyIndicator("Please wait...");
    this.busyPopup = new qx.ui.mobile.dialog.Popup(busyIndicator);

    /**
     * Set up common urls for "More Layers"
     * */
    var msExport = '/MapServer/export';
    var nc = me.c.getSecure() + '//nowcoast.noaa.gov/arcgis/rest/services/nowcoast/';
    var idp = me.c.getSecure() + '//idpgis.ncep.noaa.gov/arcgis/rest/services/';
    var qpf = 'NWS_Forecasts_Guidance_Warnings/wpc_qpf' + msExport;
    var spc = 'NWS_Forecasts_Guidance_Warnings/SPC_wx_outlks' + msExport;
    var npsg = me.c.getSecure() + '//psgeodata.fs.fed.us/arcgis/rest/services/NPSG/';

    this.layer_list =
    {
      "Lightning Density" :
      {
        "source" : nc + "sat_meteo_emulated_imagery_lightningstrikedensity_goes_time" + msExport,
        "layer" : "show:3"
      },

      // "Observations" :

      // {

      //   "source" : nc + "obs_meteocean_insitu_sfc_time" + msExport,

      //   "layer" : "show:0"

      // },

      // "Hydrology" : {

      //   "group" : {
      "National Water Model" :
      {
        "source" : me.c.getSecure() + "//mapservice.nohrsc.noaa.gov/arcgis/rest/services/national_water_model/river_network" + msExport,
        "layer" : "show:0,1,2,3"

        //   }

        // }
      },
      "Fire Weather" : {
        "group" :
        {
          "Active Fire Perimeters" :
          {
            "source" : me.c.getSecure() + "//tmservices1.esri.com/arcgis/rest/services/LiveFeeds/Wildfire_Activity" + msExport,
            "layer" : "show:2"
          },
          "Forecasted Fire Danger" :
          {
            "source" : npsg + 'Fire_Danger' + msExport,
            "layer" : "show:0"
          },
          "Haines Index" :
          {
            "source" : npsg + 'Fire_Danger' + msExport,
            "layer" : "show:1"
          },
          "ERC Day 1" :
          {
            "source" : npsg + 'Fire_Danger' + msExport,
            "layer" : "show:3"
          },
          "ERC Day 2" :
          {
            "source" : npsg + 'Fire_Danger' + msExport,
            "layer" : "show:4"
          },
          "ERC Day 3" :
          {
            "source" : npsg + 'Fire_Danger' + msExport,
            "layer" : "show:5"
          },
          "ERC Day 4" :
          {
            "source" : npsg + 'Fire_Danger' + msExport,
            "layer" : "show:6"
          },
          "ERC Day 5" :
          {
            "source" : npsg + 'Fire_Danger' + msExport,
            "layer" : "show:7"
          },
          "ERC Day 6" :
          {
            "source" : npsg + 'Fire_Danger' + msExport,
            "layer" : "show:8"
          },
          "ERC Day 7" :
          {
            "source" : npsg + 'Fire_Danger' + msExport,
            "layer" : "show:9"
          },
          "Fuel Moisture (100 hr)" :
          {
            "source" : npsg + 'Fuel_Moisture' + msExport,
            "layer" : "show:1"
          },
          "Fuel Moisture (1000 hr)" :
          {
            "source" : npsg + 'Fuel_Moisture' + msExport,
            "layer" : "show:0"
          }
        }
      },
      "SPC Convective Outlooks" : {
        "group" :
        {
          "Convective Outlook - Day 1" :
          {
            "source" : idp + spc,
            "layer" : "show:1"
          },
          "Convective Outlook - Day 2" :
          {
            "source" : idp + spc,
            "layer" : "show:2"
          },
          "Convective Outlook - Day 3" :
          {
            "source" : idp + spc,
            "layer" : "show:3"
          },
          "Hail Outlook - Day 1" :
          {
            "source" : idp + spc,
            "layer" : "show:5"
          },
          "Tornado Outlook - Day 1" :
          {
            "source" : idp + spc,
            "layer" : "show:6"
          },
          "Wind Outlook - Day 1" :
          {
            "source" : idp + spc,
            "layer" : "show:7"
          }
        }
      },
      "Precipitation (Forecast & Estimates)" : {
        "group" :
        {
          "Forecast - Day 1 QPF" :
          {
            "source" : idp + qpf,
            "layer" : "show:1"
          },
          "Forecast - Day 2 QPF" :
          {
            "source" : idp + qpf,
            "layer" : "show:2"
          },
          "Forecast - Day 3 QPF" :
          {
            "source" : idp + qpf,
            "layer" : "show:3"
          },
          "Forecast - Day 4-5 QPF" :
          {
            "source" : idp + qpf,
            "layer" : "show:4"
          },
          "Forecast - Day 6-7 QPF" :
          {
            "source" : idp + qpf,
            "layer" : "show:5"
          },
          "Forecast - Day 1-2 QPF" :
          {
            "source" : idp + qpf,
            "layer" : "show:8"
          },
          "Forecast - Day 1-5 QPF" :
          {
            "source" : idp + qpf,
            "layer" : "show:9"
          },
          "Forecast - Day 1-7 QPF" :
          {
            "source" : idp + qpf,
            "layer" : "show:10"
          },
          "Estimate - 1 hour QPE" :
          {
            "source" : nc + "analysis_meteohydro_sfc_qpe_time" + msExport,
            "layer" : "show:3"
          },
          "Estimate - 3 hour QPE" :
          {
            "source" : nc + "analysis_meteohydro_sfc_qpe_time" + msExport,
            "layer" : "show:7"
          },
          "Estimate - 6 hour QPE" :
          {
            "source" : nc + "analysis_meteohydro_sfc_qpe_time" + msExport,
            "layer" : "show:11"
          },
          "Estimate - 12 hour QPE" :
          {
            "source" : nc + "analysis_meteohydro_sfc_qpe_time" + msExport,
            "layer" : "show:15"
          },
          "Estimate - 24 hour QPE" :
          {
            "source" : nc + "analysis_meteohydro_sfc_qpe_time" + msExport,
            "layer" : "show:19"
          },
          "Estimate - 48 hour QPE" :
          {
            "source" : nc + "analysis_meteohydro_sfc_qpe_time" + msExport,
            "layer" : "show:23"
          },
          "Estimate - 72 hour QPE" :
          {
            "source" : nc + "analysis_meteohydro_sfc_qpe_time" + msExport,
            "layer" : "show:27"
          }
        }
      },
      "Tropical Cyclone Track/Intensity" :
      {
        "source" : nc + "wwa_meteocean_tropicalcyclones_trackintensityfcsts_time" + msExport,
        "layer" : "show:2,3,4,5,7,8,9"
      },
      "Satellite Imagery" : {
        "group" :
        {
          "Satellite - Visible" :
          {
            "source" : nc + "sat_meteo_imagery_goes_time" + msExport,
            "layer" : "show:3"
          },
          "Satellite - IR" :
          {
            "source" : nc + "sat_meteo_imagery_goes_time" + msExport,
            "layer" : "show:11"
          },
          "Satellite - Water Vapor" :
          {
            "source" : nc + "sat_meteo_imagery_goes_time" + msExport,
            "layer" : "show:7"
          }
        }
      },
      "Storm Reports" :
      {
        "source" : null, 
        "layer" : null  
      }
    };
  },
  members :
  {
    // overridden
    _initialize : function()
    {
      var me = this;
      this.base(arguments);
      this._loadMapLibrary();

      // me.drawer
      me.drawer = new qx.ui.mobile.container.Drawer();
      me.drawer.setOrientation("right");
      me.drawer.setTapOffset(0);

      // me.drawer.show();
      me.ready = false;
      me.optionReady = true;
      me.drawer.addListener("changeVisibility", function(e) {
        me.ready = true;
      })
      var scroll = new qx.ui.mobile.container.Scroll();
      var scrollContainer = new qx.ui.mobile.container.Composite();
      scroll.add(scrollContainer);
      me.drawer.add(scroll);

      /**
       * Radar Container
       */
      var composite = new qx.ui.mobile.container.Composite();
      composite.addCssClass("hboxPad");
      composite.setLayout(new qx.ui.mobile.layout.HBox());
      me.radarToggleButton = new qx.ui.mobile.form.ToggleButton(false, "Hide", "Show");
      me.radarToggleButton.addListener("changeValue", function(e)
      {
        var radarClass = mobileedd.Radar.getInstance();
        if (e.getData())
        {
          radarClass.start();
          me.radarContainer.setVisibility("visible");
          me.radarLegendContainer.setVisibility('visible')
        } else
        {
          me.loopControl.setValue(false);
          radarClass.stop();
          me.radarContainer.setVisibility("excluded");
          me.radarLegendContainer.setVisibility('excluded')
        }
        radarClass.toggleVisibility(e.getData());
      });
      var radarLabel = new qx.ui.mobile.basic.Label("Radar: ");
      radarLabel.addCssClass("menuLabels");
      composite.add(radarLabel, {
        flex : 1
      });
      composite.add(me.radarToggleButton);
      scrollContainer.add(composite);

      /**
       * Radar Loop Timer
       * - Add a listener for the timer. This switches frames on the map
       */
      me.loopTimer = new qx.event.Timer(500);
      me.loopTimer.addListener("interval", function(e)
      {
        if (!me.loopControl.getValue()) {
          me.loopTimer.stop();
        }
        var currentIndex = me.radarLoopSlider.getValue();

        // Delay on last frame
        if (currentIndex == me.radarLoopSlider.getMaximum())
        {
          me.loopTimer.stop();
          setTimeout(function() {
            // If it stops during the delay be sure to stop it again and don't show a new frame
            if (!me.loopControl.getValue()) {
              me.loopTimer.stop();
            } else {
              me.radarLoopSlider.setValue(me.radarLoopSlider.getMinimum());
              me.loopTimer.start();
            }
          }, 1000);
        } else
        {
          me.radarLoopSlider.setValue(me.radarLoopSlider.getValue() + 1);
        }
      });

      /**
       * Radar Container
       */
      me.radarContainer = new qx.ui.mobile.container.Composite();
      me.radarContainer.setLayout(new qx.ui.mobile.layout.VBox());

      // Loop
      var radarLoopComposite = new qx.ui.mobile.container.Composite();
      radarLoopComposite.setLayout(new qx.ui.mobile.layout.HBox());
      me.loopControl = new qx.ui.mobile.form.ToggleButton(false, "Yes", "No");
      me.loopControl.addListener("changeValue", function(e)
      {
        var bool = e.getData();
        if (bool)
        {
          me.loopTimer.start();
          me.radarToggleButton.setValue(true);
        } else
        {
          me.loopTimer.stop();
        }
      });
      var loopLabel = new qx.ui.mobile.basic.Label("Loop Radar: ");
      loopLabel.addCssClass("loopLabel");
      radarLoopComposite.add(loopLabel, {
        flex : 1
      });
      radarLoopComposite.add(me.loopControl);
      me.radarContainer.add(radarLoopComposite);

      // Long loop
      var radarLoopComposite = new qx.ui.mobile.container.Composite();
      radarLoopComposite.setLayout(new qx.ui.mobile.layout.HBox());
      me.longLoop = new qx.ui.mobile.form.ToggleButton(false, "Yes", "No");
      me.longLoop.addListener("changeValue", function(e)
      {
        var bool = e.getData();
        if (bool) {
          mobileedd.Radar.getInstance().setFrames(20)
        } else {
          mobileedd.Radar.getInstance().setFrames(5)
        }
      });
      var loopLabel = new qx.ui.mobile.basic.Label("Long Loop: ");
      loopLabel.addCssClass("loopLabel");
      radarLoopComposite.add(loopLabel, {
        flex : 1
      });
      radarLoopComposite.add(me.longLoop);
      me.radarContainer.add(radarLoopComposite);

      // Radar Loop Slider
      var radarLoopSliderComposite = new qx.ui.mobile.container.Composite();
      radarLoopSliderComposite.setLayout(new qx.ui.mobile.layout.HBox());
      me.radarLoopSlider = new qx.ui.mobile.form.Slider().set(
      {
        minimum : 0,
        maximum : 4,
        step : 1
      });
      me.radarLoopSlider.addListener("changeValue", function(e)
      {
        var radarMrms = mobileedd.Radar.getInstance();
        radarMrms.setSliderIndex(e.getData());
      }, this);
      radarLoopSliderComposite.add(me.radarLoopSlider, {
        flex : 1
      });
      me.radarContainer.add(radarLoopSliderComposite);

      /**
       * Radar Time Label
       */
      var radarTimeComposite = new qx.ui.mobile.container.Composite();
      me.radarTimeLabel = new qx.ui.mobile.basic.Label();
      radarTimeComposite.setLayout(new qx.ui.mobile.layout.HBox().set( {
        alignX : "center"
      }));
      radarTimeComposite.add(me.radarTimeLabel);
      me.radarTimeLabel.addCssClass("timeLabel");
      me.radarContainer.add(radarTimeComposite);
      scrollContainer.add(me.radarContainer);

      /**
      * Hazards Container
      */
      var composite = new qx.ui.mobile.container.Composite();
      composite.addCssClass("hboxPad");
      composite.setLayout(new qx.ui.mobile.layout.HBox());
      var hazardsLabel = new qx.ui.mobile.basic.Label("Hazards: ");
      composite.add(hazardsLabel, {
        flex : 1
      });
      hazardsLabel.addCssClass("menuLabels");
      me.hazardToggleButton = new qx.ui.mobile.form.ToggleButton(false, "Hide", "Show");
      me.hazardToggleButton.addListener("changeValue", function(e)
      {
        me.hazardObject = mobileedd.Hazards.getInstance();
        if (typeof me.hazardObject.hazardLayer == "undefined") {
          me.hazardObject.addHazardsLayer();
        }
        me.hazardObject.hazardLayer.setVisible(e.getData());
        if (e.getData())
        {
          me.hazardObject.hazardRequestTimer.start();
          me.showAllComposite.setVisibility("visible");
          me.showHazardLabelComposite.setVisibility("visible");
        } else
        {
          me.hazardObject.hazardRequestTimer.stop();
          me.showAllComposite.setVisibility("excluded");
          me.showHazardLabelComposite.setVisibility("excluded");
        }
      }, this);
      composite.add(me.hazardToggleButton);
      scrollContainer.add(composite);

      /**
           * Longfuse Container
           */
      me.showAllComposite = new qx.ui.mobile.container.Composite();
      me.showAllComposite.setLayout(new qx.ui.mobile.layout.HBox());
      var hazardsLabel = new qx.ui.mobile.basic.Label("Show All: ");
      hazardsLabel.addCssClass("loopLabel");
      me.showAllComposite.add(hazardsLabel, {
        flex : 1
      });

      me.longfuseButton = new qx.ui.mobile.form.ToggleButton(false, "Yes", "No");
      me.longfuseButton.addListener("changeValue", function(e)
      {
        var url = me.getJsonpRoot() + "hazards/getShortFusedHazards.php";
        if (me.longfuseButton.getValue()) {
          url += "?all=t";
        }
        me.hazardObject.hazardRequest.setUrl(url);
        me.hazardObject.hazardRequest.send();
      }, this);
      me.showAllComposite.add(me.longfuseButton);
      scrollContainer.add(me.showAllComposite);

      /**
        * Longfuse - Show Label
        */
      me.showHazardLabelComposite = new qx.ui.mobile.container.Composite();
      me.showHazardLabelComposite.setLayout(new qx.ui.mobile.layout.HBox());
      var showHazardLabel = new qx.ui.mobile.basic.Label("Show Label: ");
      showHazardLabel.addCssClass("loopLabel");
      me.showHazardLabelComposite.add(showHazardLabel, {
        flex : 1
      });
      me.showLongFuseLabelButton = new qx.ui.mobile.form.ToggleButton(false, "Yes", "No");
      me.showLongFuseLabelButton.addListener("changeValue", function(e)
      {
        var hazards = mobileedd.Hazards.getInstance();
        if (hazards.hazardLayer.getSource() !== null) {
          hazards.hazardLayer.getSource().dispatchEvent('change');
        }
      }, this);
      me.showHazardLabelComposite.add(me.showLongFuseLabelButton);
      scrollContainer.add(me.showHazardLabelComposite);
      var spacer = new qx.ui.mobile.container.Composite();
      spacer.addCssClass("thinseparator");
      scrollContainer.add(spacer)

      /**
           * Observation Container
           */
      var composite = new qx.ui.mobile.container.Composite();
      composite.addCssClass("hboxPad");
      composite.setLayout(new qx.ui.mobile.layout.HBox());
      var observationsLabel = new qx.ui.mobile.basic.Label("Observations: ");
      composite.add(observationsLabel, {
        flex : 1
      });
      observationsLabel.addCssClass("menuLabels");
      me.observationToggleButton = new qx.ui.mobile.form.ToggleButton(false, "Hide", "Show");
      me.observationToggleButton.addListener("changeValue", function(e)
      {
        var observationObject = mobileedd.Observations.getInstance();
        if (typeof observationObject.observationLayer == "undefined" && e.getData())
        {
          observationObject.addLayer();
          observationObject.observationLayer.setVisible(true);
        } else if (typeof observationObject.observationLayer == "undefined" && !e.getData()) {
          return;
        } else {
          observationObject.observationLayer.setVisible(e.getData());
          if (e.getData()) {
            observationObject.timer.restartWith(0);
          } else {
            observationObject.timer.stop();
          }
        }

        //Hide show option containers
        if (e.getData())
        {
          me.obDisplayFieldContainer.setVisibility('visible');
          me.obPeriodContainer.setVisibility('visible');
        } else
        {
          me.obPeriodContainer.setVisibility('excluded');
          me.obDisplayFieldContainer.setVisibility('excluded');
          me.obBusyIndicator.setVisibility('excluded');
        }
      }, this);
      composite.add(me.observationToggleButton);
      scrollContainer.add(composite);
      me.obBusyIndicator = new qx.ui.mobile.dialog.BusyIndicator("Please wait...");
      me.obBusyIndicator.setVisibility('excluded');
      qx.bom.element.Style.setCss(me.obBusyIndicator.getContainerElement(), 'background-color:#bbbbbb;');
      scrollContainer.add(me.obBusyIndicator);

      /**
       * Observation display field
       * */
      me.obDisplayFieldContainer = new qx.ui.mobile.container.Composite();
      me.obDisplayFieldContainer.setVisibility('excluded');
      me.obDisplayFieldContainer.setLayout(new qx.ui.mobile.layout.HBox());
      var obDisplayFieldLabel = new qx.ui.mobile.basic.Label("Displayed Field:");
      obDisplayFieldLabel.addCssClass("loopLabel");
      me.obDisplayFieldContainer.add(obDisplayFieldLabel, {
        flex : 1
      });

      // // fieldDisplayED MENU POPUP
      me.obDisplayButton = new qx.ui.mobile.form.Button("Temperature");
      me.obDisplayButton.addListener("tap", function(e) {
        this.__fieldDisplayMenu.show();
      }, this);
      var fields = ["Temperature", "Dew Point", "RH", "Heat Index", "Wind Speed", "Wind Gust", "Precipitation", "Meteorological Ob", "Wave Height", "Primary Swell", "Visibility"]
      var fieldDisplayMenuModel = new qx.data.Array(fields.sort());
      this.__fieldDisplayMenu = new qx.ui.mobile.dialog.Menu(fieldDisplayMenuModel, me.obDisplayButton);
      this.__fieldDisplayMenu.setTitle("Field");
      this.__fieldDisplayMenu.addListener("changeSelection", function(e)
      {
        if (e.getData().item == "Precipitation") {
          me.obPeriodContainer.setVisibility('visible');
        } else {
          me.obPeriodContainer.setVisibility('excluded');
        }
        me.obDisplayButton.setValue(e.getData().item);
        mobileedd.Observations.getInstance().setDisplayField(e.getData().item);
        me.c.setObDisplayedField(e.getData().item);
      }, this);
      me.obDisplayFieldContainer.add(me.obDisplayButton);
      scrollContainer.add(me.obDisplayFieldContainer);

      /**
       * Observation Period
       * */
      me.obPeriodContainer = new qx.ui.mobile.container.Composite();
      me.obPeriodContainer.setVisibility('excluded');

      // me.obPeriod.addCssClass("hboxPad");
      me.obPeriodContainer.setLayout(new qx.ui.mobile.layout.HBox());
      var obPeriodLabel = new qx.ui.mobile.basic.Label("Ob Period (hours):");
      obPeriodLabel.addCssClass("loopLabel");
      me.obPeriodContainer.add(obPeriodLabel, {
        flex : 1
      });
      me.obPeriodButton = new qx.ui.mobile.form.Button("1");
      me.obPeriodButton.addListener("tap", function(e) {
        this.__obPeriodMenu.show();
      }, this);
      var obPeriodMenuModel = new qx.data.Array(["1", "2", "3", "6", "12", "24", "48"]);
      this.__obPeriodMenu = new qx.ui.mobile.dialog.Menu(obPeriodMenuModel, me.obPeriodButton);
      this.__obPeriodMenu.setTitle("Last X hours");
      this.__obPeriodMenu.addListener("changeSelection", function(e)
      {
        me.obPeriodButton.setValue(e.getData().item);
        mobileedd.Observations.getInstance().setPeriod(e.getData().item);
      }, this);
      me.obPeriodContainer.add(me.obPeriodButton);
      scrollContainer.add(me.obPeriodContainer);

      /**
      * River Container
      */
      var composite = new qx.ui.mobile.container.Composite();
      composite.addCssClass("hboxPad");
      composite.setLayout(new qx.ui.mobile.layout.HBox());
      var riversLabel = new qx.ui.mobile.basic.Label("Rivers: ");
      composite.add(riversLabel, {
        flex : 1
      });
      riversLabel.addCssClass("menuLabels");
      me.riverToggleButton = new qx.ui.mobile.form.ToggleButton(false, "Hide", "Show");
      me.riverToggleButton.addListener("changeValue", function(e)
      {
        var riverObject = mobileedd.Rivers.getInstance();
        if (typeof riverObject.riverLayer == "undefined") {
          riverObject.addLayer();
        }
        riverObject.riverLayer.setVisible(e.getData());
        if (e.getData()) {
          riverObject.timer.start();
        } else {
          riverObject.timer.stop();
        }
      }, this);
      composite.add(me.riverToggleButton);
      scrollContainer.add(composite);

      /**
       * More Layers
       * */
      var moreLayersButton = new qx.ui.mobile.form.Button("More Layers...", "mobileedd/images/layers.png");
      moreLayersButton.addListener("tap", function(e)
      {
        var items = Object.keys(me.layer_list).sort(me.sortAlphaNum);
        items.push('Cancel');
        var model = new qx.data.Array(items);
        var menu = new qx.ui.mobile.dialog.Menu(model);
        menu.show();

        // Loop through More Layers layers to find which ones are selected then color the background green
        var mlClass = mobileedd.MoreLayers.getInstance();
        Object.keys(mlClass.layers).forEach(function(obj, index)
        {
          console.log(obj);
          if (mlClass.layers[obj].getVisible()) {
            new qx.bom.Selector.query('li>div>div', menu.getContainerElement()).forEach(function(div, index2) {
              if (div.innerHTML == obj) {
                // Divide index2 by 2 as 2 divs comprise a button

                // Select the li tag for styling
                qx.bom.element.Style.setCss(new qx.bom.Selector.query('li', menu.getContainerElement())[index2 / 2], 'background-color:#63FF72;')
              }
            })
          }
        }, this)
        menu.addListener("changeSelection", function(evt)
        {
          var selectedItem = evt.getData().item;
          if (selectedItem == 'Cancel') {
            return;
          }
          if (selectedItem == 'Storm Reports')
          {
            mobileedd.MoreLayers.getInstance().addStormReports();
            return;
          }
          me.group = selectedItem;
          var layer = me.layer_list[selectedItem];

          // Handle a group
          if (layer.group)
          {
            var subitems = Object.keys(layer.group).sort(me.sortAlphaNum);
            subitems.push('Cancel');
            var submodel = new qx.data.Array(subitems);
            var submenu = new qx.ui.mobile.dialog.Menu(submodel);
            submenu.show();

            // Loop through More Layers layers to find which ones are selected then color the background green
            var mlClass = mobileedd.MoreLayers.getInstance();
            Object.keys(mlClass.layers).forEach(function(obj, index) {
              if (mlClass.layers[obj].getVisible()) {
                new qx.bom.Selector.query('li>div>div', submenu.getContainerElement()).forEach(function(div, index2) {
                  if (div.innerHTML == obj) {
                    // Divide index2 by 2 as 2 divs comprise a button

                    // Select the li tag for styling
                    qx.bom.element.Style.setCss(new qx.bom.Selector.query('li', submenu.getContainerElement())[index2 / 2], 'background-color:#63FF72;')
                  }
                })
              }
            }, this)
            submenu.addListener("changeSelection", function(evt)
            {
              var selectedItem = evt.getData().item;
              if (selectedItem == 'Cancel') {
                return;
              }
              var layer = me.layer_list[me.group].group[selectedItem];
              var params =
              {
                "name" : selectedItem,
                "source" : layer.source,
                "layer" : layer.layer,
                "time" : layer.time,
                "group" : me.group
              };
              mobileedd.MoreLayers.getInstance().addRestLayer(params);
              me.drawer.hide();
            }, this);
            return;
          }

          // Handle a single value
          var params =
          {
            "name" : selectedItem,
            "source" : layer.source,
            "layer" : layer.layer,
            "time" : layer.time
          };
          mobileedd.MoreLayers.getInstance().addRestLayer(params);
          me.drawer.hide();
        }, this);
      }, this);
      scrollContainer.add(moreLayersButton);

      /**
       * Background (basemap)
       * */
      var bgButton = new qx.ui.mobile.form.Button("Change Background Map", "mobileedd/images/map_icon.png");
      bgButton.addListener("tap", function(e)
      {
        var option_names = [];
        me.BasemapOptions.forEach(function(obj) {
          option_names.push(obj.get('name'));
        });
        var options = option_names.sort();
        options.push('Cancel');
        var model = new qx.data.Array(options);
        var menu = new qx.ui.mobile.dialog.Menu(model);
        menu.show();
        menu.addListener("changeSelection", function(evt)
        {
          var selectedItem = evt.getData().item;
          if (selectedItem == "Cancel") {
            return;
          }
          me.setBasemap(selectedItem);
          me.setBasemapByName(selectedItem);
          me.drawer.hide();
        }, this);
      }, this);
      scrollContainer.add(bgButton);

      /**
      * Travel Hazards
      */
      var travelButton = new qx.ui.mobile.form.Button("Weather Travel Hazards", "mobileedd/images/car.png");
      travelButton.addListener("tap", function(e)
      {
        this.c.setTravelActive(true);
        qx.core.Init.getApplication().getRouting().executeGet("/travelhazards");
        me.drawer.hide();
      }, this);
      scrollContainer.add(travelButton);

      /**
       * Share
       */
      var shareButton = new qx.ui.mobile.form.Button("Generate Web Link", "mobileedd/images/url.png");
      shareButton.addListener("tap", function(e)
      {
        var composite = new qx.ui.mobile.container.Composite();
        composite.setLayout(new qx.ui.mobile.layout.VBox());
        var popup = new qx.ui.mobile.dialog.Popup();
        var form = new qx.ui.mobile.form.Form();
        var tf = new qx.ui.mobile.form.TextArea();
        tf.setValue(this.makeUrl());
        form.add(tf, "Web Link: ");
        composite.add(new qx.ui.mobile.form.renderer.Single(form))
        var widget = new qx.ui.mobile.form.Button("Go to Link");
        widget.addListener("tap", function() {
          window.location = this.makeUrl();
        }, this);
        composite.add(widget);
        var widget = new qx.ui.mobile.form.Button("Close");
        widget.addListener("tap", function() {
          popup.hide();
        }, this);
        composite.add(widget);
        popup.add(composite);
        popup.show();
      }, this);
      scrollContainer.add(shareButton);

      /**
       * State border color
       * */
      var showPopupButton = new qx.ui.mobile.form.Button("Configure", "resource/mobileedd/images/settings.png");
      showPopupButton.addListener("tap", function(e)
      {
        this.__popup.show();
        me.drawer.hide();
      }, this);
      var composite = new qx.ui.mobile.container.Composite();
      composite.setLayout(new qx.ui.mobile.layout.VBox());
      var html = new qx.ui.mobile.embed.Html();
      html.setHtml('<div id="test"></div>');
      showPopupButton.addListener("appear", function()
      {
        document.getElementById('test').appendChild(document.getElementById('foo'));
        document.getElementById('test').appendChild(document.getElementById('foo2'));
      })
      var closeDialogButton1 = new qx.ui.mobile.form.Button("Close");

      // Add to popup
      var countyContainer = new qx.ui.mobile.container.Composite();
      countyContainer.addCssClass("hboxPad");
      countyContainer.setLayout(new qx.ui.mobile.layout.HBox('left', 'middle'));
      var countyLabel = new qx.ui.mobile.basic.Label("County Borders");
      countyContainer.add(countyLabel);

      //countyLabel.addCssClass("menuLabels");
      me.countyToggleButton = new qx.ui.mobile.form.ToggleButton(false, "Hide", "Show");
      me.countyToggleButton.addListener("changeValue", function(e) {
        me.countyBorder.setVisible(e.getData());
      })
      countyContainer.add(me.countyToggleButton);
      composite.add(html);
      composite.add(countyContainer);
      composite.add(closeDialogButton1);
      this.__popup = new qx.ui.mobile.dialog.Popup(composite);
      this.__popup.setTitle("Configure");
      closeDialogButton1.addListener("tap", function(e)
      {
        this.__popup.hide();
        e.preventDefault();
        e.stopPropagation();
      }, this);
      scrollContainer.add(showPopupButton);

      /**
      * Close
      * */
      var closeButton = new qx.ui.mobile.form.Button("Close", "resource/mobileedd/images/close_black.png");
      closeButton.addListener("tap", function(e)
      {
        me.drawer.hide();
        me.map.updateSize();
      }, this);
      scrollContainer.add(closeButton, {
        flex : 1
      });

      // Menu Button
      var menuButton = new qx.ui.mobile.navigationbar.Button("Menu");
      menuButton.addListener("tap", function(e) {
        me.drawer.show();
      }, this);
      this.getRightContainer().add(menuButton);

      // Reset Button
      var resetButton = new qx.ui.mobile.navigationbar.Button("Reset");
      resetButton.addListener("tap", function(e) {
        me.reset();
      }, this);
      this.getLeftContainer().add(resetButton);

      // Radar Time
      var weekday = new Array(7);
      weekday[0] = "Sun";
      weekday[1] = "Mon";
      weekday[2] = "Tue";
      weekday[3] = "Wed";
      weekday[4] = "Thu";
      weekday[5] = "Fri";
      weekday[6] = "Sat";
      me.bus.subscribe("edd.view.radar.time", function(e)
      {
        var myDate = e.getData();
        var dateString = me.formatDate(myDate) + ' ' + weekday[myDate.getDay()] + ' ' + myDate.getMonth() + '/' + myDate.getDate() + '/' + myDate.getFullYear();
        me.radarTimeLabel.setValue('<b>' + dateString + '</b>');
        me.radarLegendLabel.setValue('<b>Radar - ' + dateString + '</b>');
      }, this);
    },

    // Alphanumeric sort
    sortAlphaNum : function(a, b)
    {
      var reA = /[^a-zA-Z]/g;
      var reN = /[^0-9]/g;
      var aA = a.replace(reA, "");
      var bA = b.replace(reA, "");
      if (aA === bA)
      {
        var aN = parseInt(a.replace(reN, ""), 10);
        var bN = parseInt(b.replace(reN, ""), 10);
        return aN === bN ? 0 : aN > bN ? 1 : -1;
      } else
      {
        return aA > bA ? 1 : -1;
      }
    },

    /**
        * Generate a url
        */
    reset : function()
    {
      var me = this;
      me.loopControl.setValue(false);
      me.radarToggleButton.setValue(false);
      me.longLoop.setValue(false);

      // Hazards
      me.longfuseButton.setValue(false);
      me.showLongFuseLabelButton.setValue(false);
      me.hazardToggleButton.setValue(false);

      // Observations
      me.observationToggleButton.setValue(false);

      // Rivers
      me.riverToggleButton.setValue(false);
      me.countyToggleButton.setValue(false);

      // Toggle all other layer visibilities off
      me.map.getLayers().getArray().forEach(function(obj) {
        if (obj.getVisible() && obj.get('type') !== "base" && obj.get('name') != "U.S. States" && obj.get('name') != "Location Marker") {
          obj.setVisible(false);
        }
      })

      // More Layers
      mobileedd.MoreLayers.getInstance().showLegendVisibilityOfAll(false);
    },

    /**
     * Generate a url
     */
    makeUrl : function()
    {
      var me = this;
      var url = document.location.href;
      if (url.indexOf("?") > -1) {
        url = url.substr(0, url.indexOf("?"));
      }

      // Remove specific page
      url = decodeURIComponent(url).replace('#/', '').replace('#', '');

      // Radar Looping...
      url += '?lr=';
      url += me.loopControl.getValue() ? 'T' : 'F';
      url += '&r=';
      url += me.radarToggleButton.getValue() ? 'T' : 'F';
      url += '&rll=';
      url += me.longLoop.getValue() ? 'T' : 'F';

      // Hazards
      url += '&ah=';
      url += me.longfuseButton.getValue() ? 'T' : 'F';
      url += '&lh=';
      url += me.showLongFuseLabelButton.getValue() ? 'T' : 'F';
      url += '&h=';
      url += me.hazardToggleButton.getValue() ? 'T' : 'F';

      // Observations
      url += '&obs=';
      url += me.observationToggleButton.getValue() ? 'T' : 'F';
      url += '&obfield=' + me.c.getObDisplayedField();

      // Rivers
      url += '&riv=';
      url += me.riverToggleButton.getValue() ? 'T' : 'F';

      // Zoom
      url += '&z=';
      url += me.map.getView().getZoom();

      // Center
      url += '&ll=';
      var ll = ol.proj.transform(mobileedd.page.Map.getInstance().map.getView().getCenter(), 'EPSG:3857', 'EPSG:4326');
      url += ll[0].toFixed(4) + ',';
      url += ll[1].toFixed(4);

      // Basemap
      url += '&bm=';
      url += me.getBasemap()

      /**
       * Borders
       * */

      // Show counties
      url += '&c=';
      url += me.countyToggleButton.getValue() ? 'T' : 'F';

      // Colors
      url += '&sc=';
      url += me.getStateBorderColor().replace('#', '');
      url += '&cc=';
      url += me.getCountyBorderColor().replace('#', '');

      // More Layers
      var layers = mobileedd.MoreLayers.getInstance().layers;
      var ml = '';
      Object.keys(layers).forEach(function(obj) {
        if (layers[obj].getVisible()) {
          ml += obj + '|' + layers[obj].group + '|' + layers[obj].get('opacity') + ',';
        }
      }, this)

      // Remove trailing comma and encode
      ml = encodeURIComponent(ml.slice(0, -1));
      url += '&ml=' + ml;
      return url;
    },

    /**
     * Set the URL parameters
     * */
    setUrlParams : function()
    {
      var me = this;

      // Check for params
      if (this.getURLParameter('lr') == null) {
        return;
      }

      // Set view
      var z = me.getURLParameter('z');
      var ll = me.getURLParameter('ll').split(',');
      var newView = new ol.View(
      {
        zoom : z,
        center : ol.proj.transform([Number(ll[0]), Number(ll[1])], 'EPSG:4326', 'EPSG:3857')
      })
      me.map.setView(newView);

      // Set Basemap
      var bm = me.setBasemapByName(me.getURLParameter('bm'));

      // Toggle buttons
      var bool = me.getURLParameter('lr') == "T" ? true : false;
      me.loopControl.setValue(bool);
      var bool = me.getURLParameter('r') == "T" ? true : false;
      me.radarToggleButton.setValue(bool);
      var bool = me.getURLParameter('rll') == "T" ? true : false;
      me.longLoop.setValue(bool);
      var bool = me.getURLParameter('ah') == "T" ? true : false;
      me.longfuseButton.setValue(bool);
      var bool = me.getURLParameter('lh') == "T" ? true : false;
      me.showLongFuseLabelButton.setValue(bool);
      var bool = me.getURLParameter('h') == "T" ? true : false;
      me.hazardToggleButton.setValue(bool);
      var bool = me.getURLParameter('c') == "T" ? true : false;
      me.countyToggleButton.setValue(bool);

      // Observations
      var bool = me.getURLParameter('obs') == "T" ? true : false;
      me.observationToggleButton.setValue(bool);
      var field = me.getURLParameter('obfield');
      if (field != null)
      {
        me.c.setObDisplayedField(field);
        me.obDisplayButton.setValue(field);
      }

      // Rivers
      var bool = me.getURLParameter('riv') == "T" ? true : false;
      me.riverToggleButton.setValue(bool);

      // More Layers
      var ml = me.getURLParameter('ml');
      if (ml != null)
      {
        ml = decodeURIComponent(ml);
        ml.split(',').forEach(function(obj)
        {
          var mlLayer = obj.split('|');
          var name = mlLayer[0];
          var group = mlLayer[1];
          var opacity = mlLayer[2];
          if (name == "Storm Reports")
          {
            mobileedd.MoreLayers.getInstance().addStormReports();
            return;
          }
          if (typeof (group) == "undefined" || group == "undefined")
          {
            var layer = me.layer_list[name];
            var params =
            {
              "name" : name,
              "source" : layer.source,
              "layer" : layer.layer,
              "time" : layer.time,
              "opacity" : opacity
            };
            mobileedd.MoreLayers.getInstance().addRestLayer(params);
          } else
          {
            var layer = me.layer_list[group].group[name];
            var params =
            {
              "name" : name,
              "source" : layer.source,
              "layer" : layer.layer,
              "time" : layer.time,
              "group" : group,
              "opacity" : opacity
            };
            mobileedd.MoreLayers.getInstance().addRestLayer(params);
          }
        });
      }

      // Border colors
      me.setStateBorderColor('#' + me.getURLParameter('sc'));
      qx.bom.Selector.query('#foo>input')[0].jscolor.fromString(me.getStateBorderColor());
      me.setCountyBorderColor('#' + me.getURLParameter('cc'));
      qx.bom.Selector.query('#foo2>input')[0].jscolor.fromString(me.getCountyBorderColor());
      var mqk = me.getURLParameter('mqk');
      if (typeof mqk !== "undefined" && mqk != null) {
        me.c.setMapQuestKey(mqk);
      }
    },

    /**
     * Format the Radar Date
     */
    formatDate : function(date)
    {
      var hours = date.getHours();
      var minutes = date.getMinutes();
      var ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12;
      hours = hours ? hours : 12;  // the hour '0' should be '12'
      minutes = minutes < 10 ? '0' + minutes : minutes;
      var strTime = hours + ':' + minutes + ' ' + ampm;
      return strTime;
    },

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

    // overridden
    _createContent : function()
    {
      var me = this;

      // Disable menu for Windows Phone 8.
      if (navigator.userAgent.match(/IEMobile\/10\.0/)) {
        return null;
      }

      // Radar Label on map
      me.legendContainer = new qx.ui.mobile.container.Composite();
      me.legendContainer.setId("mapMenu");
      me.radarLegendContainer = new qx.ui.mobile.container.Composite();
      me.radarLegendLabel = new qx.ui.mobile.basic.Label("");
      me.radarLegendContainer.add(me.radarLegendLabel);
      var image = new qx.ui.mobile.basic.Image("resource/mobileedd/images/legend/radar.png");
      me.radarLegendContainer.add(image);
      me.legendContainer.add(me.radarLegendContainer);

      //qpe
      me.qpeContainer = new qx.ui.mobile.container.Composite();
      me.qpeContainer.setVisibility('excluded');
      me.qpeLegendLabel = new qx.ui.mobile.basic.Label("<b>MRMS QPE</b>");
      var image = new qx.ui.mobile.basic.Image("resource/mobileedd/images/legend/precipitation.png");
      me.qpeContainer.add(me.qpeLegendLabel);
      me.qpeContainer.add(image);
      me.legendContainer.add(me.qpeContainer);

      //lightning
      me.lightningContainer = new qx.ui.mobile.container.Composite();
      me.lightningContainer.setVisibility('excluded');
      me.lightningLegendLabel = new qx.ui.mobile.basic.Label("<b>Lightning Density</b>");
      var image = new qx.ui.mobile.basic.Image("resource/mobileedd/images/legend/lightningstrikedensity.png");
      me.lightningContainer.add(me.lightningLegendLabel);
      me.lightningContainer.add(image);
      me.legendContainer.add(me.lightningContainer);

      // Scroll
      me.dynamicLegendScrollContainer = new qx.ui.mobile.container.Scroll();

      // Ensure contents do not get too big
      qx.bom.element.Style.setCss(me.dynamicLegendScrollContainer.getContainerElement(), 'width:250px;');
      me.dynamicLegendContainer = new qx.ui.mobile.container.Composite();
      me.dynamicLegendScrollContainer.add(me.dynamicLegendContainer);
      me.legendContainer.add(me.dynamicLegendScrollContainer);
      return me.legendContainer;
    },

    /**
     * Loads JavaScript library which is needed for the map.
     */
    _loadMapLibrary : function()
    {
      var me = this;
      var req = new qx.bom.request.Script();
      req.onload = function()
      {
        me.defaultView = new ol.View(
        {
          center : ol.proj.transform([-99, 40], 'EPSG:4326', 'EPSG:3857'),
          zoom : 4
        });

        // Firefox never triggers geolocation fail
        setTimeout(function() {
          if (me.map.getView().getCenter() == null) {
            me.map.setView(me.defaultView);
          }
        }, 3000);

        // Background Maps
        me.terrain = new ol.layer.Tile(
        {
          name : "Stamen Terrain",
          type : 'base',
          source : new ol.source.Stamen( {
            layer : 'terrain'
          })
        });
        me.lite = new ol.layer.Tile(
        {
          name : "Stamen Lite",
          type : 'base',
          source : new ol.source.Stamen( {
            layer : 'toner-lite'
          })
        });
        var attribution = new ol.Attribution( {
          html : 'Tiles &copy; <a href=me.c.getSecure() + "//services.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer">ArcGIS</a>'
        });
        me.natgeo = new ol.layer.Tile(
        {
          name : "ESRI National Geographic",
          type : 'base',
          source : new ol.source.XYZ(
          {
            attributions : [attribution],
            url : me.c.getSecure() + '//server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}'
          })
        });

        // Try someday...

        // new ol.layer.Group({

        //                         title: 'Satellite and labels',

        //                         type: 'base',

        //                         combine: true,

        //                         visible: false,

        //                         layers: [

        //                             new ol.layer.Tile({

        //                                 source: new ol.source.BingMaps({

        //                                     // Get your own key at https://www.bingmapsportal.com/

        //                                     key: 'Ahd_32h3fT3C7xFHrqhpKzoixGJGHvOlcvXWy6k2RRYARRsrfu7KDctzDT2ei9xB',

        //                                     imagerySet: 'Aerial'

        //                                 })

        //                             }),

        //                             new ol.layer.Tile({

        //                                 source: new ol.source.Stamen({

        //                                     layer: 'terrain-labels'

        //                                 })

        //                             })

        //                         ]

        //                     })

        // ESRI Dark
        var source = new ol.source.XYZ(
        {
          attributions : [attribution],
          url : me.c.getSecure() + '//server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
        });

        // Application ready after tiles load
        source.once('tileloadend', function(event)
        {
          me.setReady(true);
          me.setUrlParams();
          me.hazardObject.hazardRequest.send();
        });
        var attribution = new ol.Attribution( {
          html : 'Tiles &copy; <a href=me.c.getSecure() + "//services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer">ArcGIS</a>'
        });
        me.esridark = new ol.layer.Tile(
        {
          name : "ESRI Dark Gray",
          type : 'base',
          source : source
        });
        var attribution = new ol.Attribution( {
          html : 'Tiles &copy; <a href=me.c.getSecure() + "//services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer">ArcGIS</a>'
        });
        me.esridark_reference = new ol.layer.Tile(
        {
          name : "ESRI Dark Gray Reference",
          type : 'base',
          source : new ol.source.XYZ( {
            url : me.c.getSecure() + '//server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}'
          })
        });
        me.esrilite = new ol.layer.Tile(
        {
          name : "ESRI Light Gray",
          type : 'base',
          source : new ol.source.XYZ(
          {
            attributions : [attribution],
            url : me.c.getSecure() + '//server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}'
          })
        });
        var attribution = new ol.Attribution( {
          html : 'Copyright:&copy; 2013 ESRI, i-cubed, GeoEye'
        });
        var projection = ol.proj.get('EPSG:4326');
        var projectionExtent = projection.getExtent();

        // The tile size supported by the ArcGIS tile service.
        var tileSize = 512;

        /**
         * Calculate the resolutions supported by the ArcGIS tile service.
         * There are 16 resolutions, with a factor of 2 between successive
         * resolutions. The max resolution is such that the world (360°)
         * fits into two (512x512 px) tiles.
         */
        var maxResolution = ol.extent.getWidth(projectionExtent) / (tileSize * 2);
        var resolutions = new Array(16);
        var z;
        for (z = 0; z < 16; ++z) {
          resolutions[z] = maxResolution / Math.pow(2, z);
        }
        var urlTemplate = me.c.getSecure() + '//services.arcgisonline.com/arcgis/rest/services/ESRI_Imagery_World_2D/MapServer/tile/{z}/{y}/{x}';
        me.esriimage = new ol.layer.Tile(
        {
          name : "ESRI Satellite",
          type : 'base',

          /* ol.source.XYZ and ol.tilegrid.XYZ have no resolutions config */
          source : new ol.source.TileImage(
          {
            attributions : [attribution],
            tileUrlFunction : function(tileCoord, pixelRatio, projection)
            {
              var z = tileCoord[0];
              var x = tileCoord[1];
              var y = -tileCoord[2] - 1;

              // wrap the world on the X axis
              var n = Math.pow(2, z + 1);  // 2 tiles at z=0
              x = x % n;
              if (x * n < 0) {
                // x and n differ in sign so add n to wrap the result to the correct sign
                x = x + n;
              }
              return urlTemplate.replace('{z}', z.toString()).replace('{y}', y.toString()).replace('{x}', x.toString());
            },
            projection : projection,
            tileGrid : new ol.tilegrid.TileGrid(
            {
              origin : ol.extent.getTopLeft(projectionExtent),
              resolutions : resolutions,
              tileSize : 512
            })
          })
        });
        var attribution = new ol.Attribution( {
          html : 'Tiles &copy; <a href=me.c.getSecure() + "//services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer">ArcGIS</a>'
        });
        me.esrilite_reference = new ol.layer.Tile(
        {
          name : "ESRI Light Gray Reference",
          type : 'base',
          source : new ol.source.XYZ( {
            url : me.c.getSecure() + '//server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}'
          })
        });
        var attribution = new ol.Attribution( {
          html : 'Tiles &copy; <a href=me.c.getSecure() + "//services.arcgisonline.com/arcgis/rest/services/NGS_Topo_US_2D/MapServer">ArcGIS</a>'
        });
        var urlTemplateTopo = me.c.getSecure() + '//services.arcgisonline.com/arcgis/rest/services/NGS_Topo_US_2D/MapServer/tile/{z}/{y}/{x}';
        me.esritopo = new ol.layer.Tile(
        {
          name : "ESRI Topographic",
          type : 'base',
          source : new ol.source.TileImage(
          {
            attributions : [attribution],
            tileUrlFunction : function(tileCoord, pixelRatio, projection)
            {
              var z = tileCoord[0];
              var x = tileCoord[1];
              var y = -tileCoord[2] - 1;

              // wrap the world on the X axis
              var n = Math.pow(2, z + 1);  // 2 tiles at z=0
              x = x % n;
              if (x * n < 0) {
                // x and n differ in sign so add n to wrap the result to the correct sign
                x = x + n;
              }
              return urlTemplateTopo.replace('{z}', z.toString()).replace('{y}', y.toString()).replace('{x}', x.toString());
            },
            projection : projection,
            tileGrid : new ol.tilegrid.TileGrid(
            {
              origin : ol.extent.getTopLeft(projectionExtent),
              resolutions : resolutions,
              tileSize : 512
            })
          })
        });
        var source = new ol.source.TileJSON(
        {
          url : me.c.getSecure() + '//api.tiles.mapbox.com/v3/mapbox.world-bright.json',
          crossOrigin : 'anonymous'
        });
        me.mapboxWorldbright = new ol.layer.Tile(
        {
          name : "Mapbox World Bright",
          source : source
        });
        me.BasemapOptions = [me.terrain, me.lite, me.natgeo, me.esridark, me.esrilite, me.mapboxWorldbright, me.esriimage, me.esritopo];

        // Don't allow rotations
        var interactions = ol.interaction.defaults(
        {
          altShiftDragRotate : false,
          pinchRotate : false
        });

        // The map
        me.map = new ol.Map(
        {
          target : 'map',
          interactions : interactions,
          controls : ol.control.defaults( {
            rotate : false
          }).extend([new ol.control.ScaleLine( {
            units : 'us'
          })]),
          layers : [me.esridark, me.esridark_reference],
          view : new ol.View( {
            zoom : 6
          })
        });
        var req = new qx.bom.request.Script();
        req.onload = function()
        {
          // Popup layer
          me.popup = new ol.Overlay.Popup();
          me.map.addOverlay(me.popup);
        }
        req.open("GET", 'resource/mobileedd/libs/ol3-popup.js');
        req.send();

        // The map click listener
        me.map.on("click", function(e)
        {
          // Default load value is visible, so listen for a change event on drawer visibility then set ready
          if (me.drawer.getVisibility() == "visible" && me.ready) {
            return;
          }

          // The option menu is up
          if (!me.optionReady) {
            return;
          }
          me.handleMapClick(e);
        });

        /**
         * Geolocation
         * */

        // Geolocation marker
        var markerEl = document.getElementById('geolocation_marker');
        var marker = new ol.Overlay(
        {
          positioning : 'center-center',
          element : markerEl,
          stopEvent : false
        });
        me.map.addOverlay(marker);

        // LineString to store the different geolocation positions. This LineString is time aware.

        // The Z dimension is actually used to store the rotation (heading). /** @type {ol.geom.GeometryLayout} */
        var positions = new ol.geom.LineString([], ('XYZM'));

        // Geolocation Control

        /** @type {olx.GeolocationOptions} */
        var geolocation = new ol.Geolocation((
        {
          projection : me.map.getView().getProjection(),  //me.defaultView.getProjection(),
          trackingOptions :
          {
            maximumAge : 10000,
            enableHighAccuracy : true,
            timeout : 600000
          }
        }));
        var deltaMean = 500;  // the geolocation sampling period mean in ms
        geolocation.once('change', function(evt) {
          me.map.getView().setCenter(geolocation.getPosition());
        })

        // Listen to position changes
        geolocation.on('change', function()
        {
          var position = geolocation.getPosition();
          me.setMyPosition(position);
          var accuracy = geolocation.getAccuracy();
          var heading = geolocation.getHeading() || 0;
          var speed = geolocation.getSpeed() || 0;
          var m = Date.now();
          addPosition(position, heading, m, speed);
          qx.bom.element.Style.setCss(qx.bom.Selector.query('#geolocation_marker')[0], 'transform:rotate(' + Math.round(radToDeg(heading)) + 'deg)')
        });

        // FIXME we should remove the coordinates in positions
        geolocation.on('error', function(error)
        {
          //var closeDialogButton1 = new qx.ui.mobile.form.Button("Close");
          var html = new qx.ui.mobile.embed.Html();
          html.setHtml(error.message.match(/.{1,36}/g).join('<br>'));
          var popup = new qx.ui.mobile.dialog.Popup(html);
          popup.setTitle('Geolocation Error');
          popup.addListener("tap", function(e)
          {
            popup.hide();
            e.preventDefault();
            e.stopPropagation();
          }, this);
          if (error.message != "Only secure origins are allowed (see: https://goo.gl/Y0ZkNV).") {
            popup.show();
          }
          qx.event.Timer.once(function() {
            popup.hide();
          }, this, 5000)

          // Show default view
          me.map.setView(me.defaultView);
        });

        // convert radians to degrees
        function radToDeg(rad) {
          return rad * 360 / (Math.PI * 2);
        }

        // convert degrees to radians
        function degToRad(deg) {
          return deg * Math.PI * 2 / 360;
        }

        // modulo for negative values
        function mod(n) {
          return ((n % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
        }
        function addPosition(position, heading, m, speed)
        {
          var x = position[0];
          var y = position[1];
          var fCoords = positions.getCoordinates();
          var previous = fCoords[fCoords.length - 1];
          var prevHeading = previous && previous[2];
          if (prevHeading)
          {
            var headingDiff = heading - mod(prevHeading);

            // force the rotation change to be less than 180°
            if (Math.abs(headingDiff) > Math.PI)
            {
              var sign = (headingDiff >= 0) ? 1 : -1;
              headingDiff = -sign * (2 * Math.PI - Math.abs(headingDiff));
            }
            heading = prevHeading + headingDiff;
          }
          positions.appendCoordinate([x, y, heading, m]);

          // only keep the 20 last coordinates
          positions.setCoordinates(positions.getCoordinates().slice(-20));

          // FIXME use speed instead

          // if (heading && speed) {

          //   markerEl.src = 'resource/mobileedd/images/geolocation_marker_heading.png';

          // } else

          // {

          //   markerEl.src = 'resource/mobileedd/images/geolocation_marker_heading.png';

          //   //markerEl.src = 'resource/mobileedd/images/geolocation_marker.png';

          // }
        }
        var previousM = 0;

        // change center and rotation before render
        me.map.beforeRender(function(map, frameState)
        {
          if (frameState !== null)
          {
            // use sampling period to get a smooth transition
            var m = frameState.time - deltaMean * 1.5;
            m = Math.max(m, previousM);
            previousM = m;

            // interpolate position along positions LineString
            var c = positions.getCoordinateAtM(m, true);

            // var view = frameState.viewState;
            if (c) {
              // view.center = getCenterWithHeading(c, -c[2], view.resolution);

              // view.rotation = -c[2];
              marker.setPosition(c);
            }
          }

          // return true;  // Force animation to continue
        });

        // postcompose callback
        function render() {
          me.map.render();
        }

        /**
         * Start position tracking
         * */
        geolocation.setTracking(true);
        me.map.on('postcompose', render);
        me.map.render();

        // Orientation
        var deviceOrientation = new ol.DeviceOrientation();

        // tilt the map
        deviceOrientation.on(['change:beta', 'change:gamma'], function(event)
        {
          var center = view.getCenter();
          var resolution = view.getResolution();
          var beta = event.target.getBeta() || 0;
          var gamma = event.target.getGamma() || 0;
          center[0] -= resolution * gamma * 25;
          center[1] += resolution * beta * 25;
          view.setCenter(view.constrainCenter(center));
        });

        // Turn on radar and hazards
        me.radarToggleButton.setValue(true);
        me.hazardToggleButton.setValue(true);

        // State Border
        me.stateBorder = new ol.layer.Vector(
        {
          name : "U.S. States",
          source : new ol.source.Vector(
          {
            url : 'resource/mobileedd/data/us-states.json',
            format : new ol.format.TopoJSON()
          }),
          style : function(feature, resolution)
          {
            var styleArray = [new ol.style.Style( {
              stroke : new ol.style.Stroke(
              {
                color : me.getStateBorderColor(),
                width : 3
              })
            })];
            return feature.getId() !== undefined ? styleArray : null;
          }
        });
        me.map.addLayer(me.stateBorder);

        // County Border
        me.countyBorder = new ol.layer.Vector(
        {
          name : "U.S. Counties",
          visible : false,
          source : new ol.source.Vector(
          {
            url : 'resource/mobileedd/data/us-named.json',
            format : new ol.format.TopoJSON()
          }),
          style : function(feature, resolution)
          {
            var countyLabel = '';
            if (resolution < 1000) {
              countyLabel = feature.get('name');
            }
            var styleArray = [new ol.style.Style(
            {
              text : new ol.style.Text(
              {
                text : countyLabel,
                stroke : new ol.style.Stroke(
                {
                  width : 2,
                  color : "white"
                })
              }),
              stroke : new ol.style.Stroke(
              {
                color : me.getCountyBorderColor(),
                width : 1
              })
            })];
            return feature.getId() !== undefined ? styleArray : null;
          }
        });
        me.map.addLayer(me.countyBorder);

        // Weak test polygons to determine region
        var wkt = new ol.format.WKT();
        var geojsonFormat = new ol.format.GeoJSON();

        // Generated with EDD v4.0: new OpenLayers.Format.WKT().write(me.map.getLayersByName("Drawing Tool Vector Layer")[0].features[0])
        me.alaska = geojsonFormat.writeFeatureObject(wkt.readFeature("POLYGON((-19483335.908861 9326281.8460132,-21929320.813646 7506469.076853,-21420555.953451 6038878.1339819,-17135190.400267 6351964.2017944,-14689205.495482 6586778.7526538,-14023897.60138 7115111.4920874,-14141304.87681 9600232.1553491,-16137228.559115 12144056.456326,-18994138.927904 11341773.407556,-19483335.908861 9326281.8460132))"));
        me.conus = geojsonFormat.writeFeatureObject(wkt.readFeature("POLYGON((-13793975.02033 6454695.5677955,-14038573.510808 6063337.9830299,-13970085.933474 4086982.1799635,-12962340.152703 3255347.3123365,-10545707.066775 2727014.572903,-8559567.3240897 2805286.0898561,-7140896.0793143 5965498.5868385,-7894259.4299882 6288368.5942701,-11064255.86659 6542751.0243678,-13793975.02033 6454695.5677955))"));
        me.puertorico = geojsonFormat.writeFeatureObject(wkt.readFeature("POLYGON((-7691242.6828912 2387022.6711379,-7564051.4678424 1795094.3241799,-7126220.1698859 1831784.0977516,-6866945.7699786 2093504.4825636,-7336574.8716974 2362562.82209,-7691242.6828912 2387022.6711379))"));
        me.hawaii = geojsonFormat.writeFeatureObject(wkt.readFeature("POLYGON((-18754432.407234 3372754.5877662,-18778892.256282 1430642.5733668,-15119698.838723 1293667.4186988,-16166580.377971 3348294.7387183,-18754432.407234 3372754.5877662))"));
        me.guam = geojsonFormat.writeFeatureObject(wkt.readFeature("POLYGON((15988948.67656 1618371.914809,15978553.240714 1403125.2431879,16321602.62361 1398844.7696046,16321602.62361 1627544.358202,15988948.67656 1618371.914809))"));

        // Add state overlay

        //me.addStatesLayer();
      }.bind(this);
      req.open("GET", this.getMapUri());
      req.send();
    },
    getNdfdRegion : function(mercatorLL)
    {
      var me = this;
      var geojsonFormat = new ol.format.GeoJSON();
      var feature = new ol.Feature( {
        geometry : new ol.geom.Point(mercatorLL)
      });
      var point = geojsonFormat.writeFeatureObject(feature);

      // For turf inside function to work need point and polygon in GeoJSON format
      if (turf.inside(point, me.conus)) {
        return "conus";
      } else if (turf.inside(point, me.hawaii)) {
        return "hawaii";
      } else if (turf.inside(point, me.alaska)) {
        return "alaska";
      } else if (turf.inside(point, me.puertorico)) {
        return "puertori";
      } else if (turf.inside(point, me.guam)) {
        return "guam";
      }




    },

    /**
      Add a state  layer ...
      */
    addStatesLayer : function()
    {
      var me = this;
      var tms_layer = new ol.layer.Tile(
      {
        name : 'US States',
        source : new ol.source.XYZ( {
          url : me.c.getSecure() + '//ridgewms.srh.noaa.gov/c/tc.py/1.0.0/state/{z}/{x}/{y}.png'
        }),
        opacity : 0.8
      });
      me.map.addLayer(tms_layer);
    },

    /**
     * Handle the map click
     */
    handleMapClick : function(e)
    {
      var me = this;
      var items = ['Get Forecast For This Point...', 'Monitor this location'];
      var hazards = [];
      var travelSegment = [];
      var travelPoint = [];
      var stormReports = {

      };
      var hydrographs = {

      };
      var observations = {

      };

      // Drill through all of the layers
      me.map.forEachFeatureAtPixel(e.pixel, function(feature, layer)
      {
        if (layer.get('name') == "Hazards") {
          hazards.push(feature);
        }
        if (layer.get('name') == "Travel Hazards Segments") {
          travelSegment.push(feature);
        }
        if (layer.get('name') == "Travel Hazards Points") {
          travelPoint.push(feature);
        }
        if (layer.get('name') == "Storm Reports")
        {
          var key = 'Storm Report - ' + feature.get('magnitude') + ' ' + feature.get('typetext') + ' (id:' + feature.id_ + ')';
          stormReports[key] = feature;
          items.push(key);
        }
        if (layer.get('name') == "Rivers")
        {
          var value = 'Hydrograph - ' + feature.get("location");
          var test = new qx.data.Array(items);
          if (!test.contains(value))
          {
            items.push(value);
            hydrographs[value] = feature;
          }
        }
        if (layer.get('name') == "Observations")
        {
          var features = feature.get('features');
          for (var i = 0; i < features.length; i++)
          {
            var value = 'Ob - ' + features[i].get("NAME");
            items.push(value);
            observations[value] = features[i];
          }
        }
      });
      hazards.forEach(function(obj)
      {
        var htype = obj.get('warn_type');
        var hsig = 'Warning';
        if (typeof htype == "undefined")
        {
          htype = obj.get('phenomenon');
          hsig = obj.get('significance');
        }
        items.push(htype + ' ' + hsig + ' - #' + obj.get('etn'));
      });

      // Travel items
      if (this.c.getTravelActive())
      {
        travelSegment.forEach(function(obj, index) {
          items.push('Travel Hazard Segment - #' + index);
        })
        travelPoint.forEach(function(obj, index) {
          items.push('Travel Hazard Point - #' + index);
        })
        items.push("Set Travel Origin");

        // Handle Waypoints
        if (typeof mobileedd.page.PageTravelHazards.getInstance().waypoints !== "undefined") {
          mobileedd.page.PageTravelHazards.getInstance().waypoints.forEach(function(obj, index) {
            items.push("Set Travel Waypoint #" + (Number(index) + 1));
          })
        }
        items.push("Set Travel Destination");
      }
      items.push("Layer Options");

      // Cancel
      items.push("Cancel");
      me.model = new qx.data.Array(items);
      var menu = new qx.ui.mobile.dialog.Menu(me.model);
      menu.show();
      var nwm = me.getLayerByName("National Water Model");
      if (nwm != null && nwm.getVisible())
      {
        // hazards.push(feature);
        if (typeof (jQuery) === "undefined" || typeof (jQuery.plot) === "undefined")
        {
          var req = new qx.bom.request.Script();
          req.open("GET", "resource/mobileedd/libs/flot/flot-combo.js");
          req.send();
        }
        var waterRequest = new qx.io.request.Jsonp();
        var url = me.getJsonpRoot() + "hazards/getShortFusedHazards.php";
        var extent = me.map.getView().calculateExtent(me.map.getSize()).toString();
        var ll = e.coordinate;
        var url = 'http://mapservice.nohrsc.noaa.gov/arcgis/rest/services/national_water_model/flowlines/Mapserver/identify?f=json&tolerance=1&returnGeometry=false&imageDisplay=1280,581,1&geometry={"x":' + ll[0] + ',"y":' + ll[1] + '}&geometryType=esriGeometryPoint&sr=102100&mapExtent=' + extent + '&layers=top';
        waterRequest.setUrl(url);
        waterRequest.setCallbackParam('callback');
        waterRequest.addListenerOnce("success", function(e)
        {
          var data = e.getTarget().getResponse();
          data.results.forEach(function(obj)
          {
            var name = "NWM - " + obj.attributes.reach_id + " (" + obj.attributes.gnis_name + ")";
            me.model.insertAt(0, name.replace('(Null)', ''));
          }, this)
        }, this);
        waterRequest.send();
      }

      // Parse for hazards and highlight
      new qx.bom.Selector.query('li>div>div', menu.getContainerElement()).forEach(function(div, index2)
      {
        if (div.innerHTML.indexOf("Warning") !== -1) {
          qx.bom.element.Style.setCss(new qx.bom.Selector.query('li', menu.getContainerElement())[index2 / 2], 'background-color:#ff3737;color:#FFF000')
        }
        if (div.innerHTML.indexOf("Watch") !== -1) {
          qx.bom.element.Style.setCss(new qx.bom.Selector.query('li', menu.getContainerElement())[index2 / 2], 'background-color:#FEBB39;')
        }
        if (div.innerHTML.indexOf("Advisory") !== -1) {
          qx.bom.element.Style.setCss(new qx.bom.Selector.query('li', menu.getContainerElement())[index2 / 2], 'background-color:#FDF028;')
        }
      })

      // Get address
      var ll = ol.proj.transform(e.coordinate, 'EPSG:3857', 'EPSG:4326');
      var geo = new mobileedd.geo.EsriGeo();
      geo.reverseGeocodeReq.addListenerOnce("success", function(e)
      {
        var response = e.getTarget().getResponse();
        if (typeof response.address !== "undefined" && response.address.City != null) {
          var address = response.address.City + ', ' + response.address.Region;
        } else {
          address = 'Lon:' + ll[0].toFixed(2) + ' Lat:' + ll[1].toFixed(2);
        }
        try {
          new qx.bom.Selector.query('li>div>div', menu.getContainerElement()).forEach(function(div, index2)
          {
            if (div.innerHTML == 'Get Forecast For This Point...')
            {
              div.innerHTML = 'Get Forecast For ' + address;  // This Point...'
            }
            if (div.innerHTML == 'Monitor this location')
            {
              div.innerHTML = 'Monitor ' + address;  // This Point...'
            }
          })
        }catch (e) {
          return;
        }
      }, this)
      geo.reverseGeoRequest(ll[1], ll[0]);

      // Handle selection
      menu.addListenerOnce("changeSelection", function(evt)
      {
        var selectedIndex = evt.getData().index;
        var selectedItem = evt.getData().item;

        // National Water Model
        if (selectedItem.indexOf("NWM") !== -1)
        {
          var runID = selectedItem.split(' - ')[1].split(' (')[0];
          var message = new qx.event.message.Message("edd.streamflow");
          message.setData([runID, selectedItem]);
          qx.core.Init.getApplication().getRouting().executeGet("/nwm");
          me.bus.dispatch(message);
          return;
        }

        // Storm reports
        if (selectedItem.indexOf("Storm Report") !== -1)
        {
          var geom = e.coordinate;
          var content = '<table>';
          Object.keys(stormReports[selectedItem].values_).forEach(function(obj)
          {
            console.log(obj, stormReports[selectedItem].values_[obj]);
            if (obj == "geometry") {
              geom = stormReports[selectedItem].values_[obj].flatCoordinates;
            } else {
              content += '<tr><td><b>' + capitalizeFirstLetter(obj) + ':</b></td>';
              content += '<td>' + stormReports[selectedItem].values_[obj] + '</td></tr>';
            }
          })
          content += '</table>';
          me.popup.show(geom, content);
        }

        // Public Forecast
        if (selectedItem.indexOf("Get Forecast For") !== -1)
        {
          var ll = ol.proj.transform(e.coordinate, 'EPSG:3857', 'EPSG:4326');
          mobileedd.page.Forecast.getInstance();
          var text = new qx.event.message.Message("edd.forecast");
          text.setData(ll);
          qx.core.Init.getApplication().getRouting().executeGet("/forecast");
          me.bus.dispatch(text);
          return;
        }

        // Monitor a location
        if (selectedItem.indexOf("Monitor") !== -1)
        {
          me.setMyPosition(e.coordinate);
          me.checkWwaAtLocation();
          return;
        }

        // Travel Forecast
        if (selectedItem == "Set Travel Destination")
        {
          var ll = ol.proj.transform(e.coordinate, 'EPSG:3857', 'EPSG:4326');
          mobileedd.page.PageTravelHazards.getInstance().setDestination(ll);
          qx.core.Init.getApplication().getRouting().executeGet("/travelhazards");
          return;
        }
        if (selectedItem == "Set Travel Origin")
        {
          var ll = ol.proj.transform(e.coordinate, 'EPSG:3857', 'EPSG:4326');
          mobileedd.page.PageTravelHazards.getInstance().setOrigin(ll);
          qx.core.Init.getApplication().getRouting().executeGet("/travelhazards");
          return;
        }
        if (selectedItem.indexOf("Set Travel Waypoint") !== -1)
        {
          var indexToChange = selectedItem.split('#')[1] - 1;
          var ll = ol.proj.transform(e.coordinate, 'EPSG:3857', 'EPSG:4326');
          mobileedd.page.PageTravelHazards.getInstance().setWaypoint(ll, indexToChange);
          qx.core.Init.getApplication().getRouting().executeGet("/travelhazards");
          return;
        }

        // Hydrographs
        if (selectedItem.indexOf("Hydrograph") !== -1)
        {
          var key = selectedItem;
          var text = new qx.event.message.Message("edd.hydrograph");
          text.setData(hydrographs[key]);
          qx.core.Init.getApplication().getRouting().executeGet("/hydrograph");
          me.bus.dispatch(text);
          return;
        }

        // Observation Graphs
        if (selectedItem.indexOf("Ob - ") !== -1)
        {
          var key = selectedItem;
          var text = new qx.event.message.Message("edd.observation");
          text.setData(observations[key]);
          qx.core.Init.getApplication().getRouting().executeGet("/observation");
          me.bus.dispatch(text);
          return;
        }

        // Layer options
        if (selectedItem == "Layer Options")
        {
          // FIXME - Clicks were getting propagated through the menu, so added a boolean to check to see if the menu is visible.
          me.optionReady = false;
          var items = [];
          var found = false;
          me.map.getLayers().getArray().forEach(function(obj) {
            if (obj.getVisible() && obj.get('type') != "base") {
              if (obj.get('name').indexOf("MRMS -") !== -1)
              {
                if (!found) {
                  items.push('Radar');
                }
                found = true;
              } else
              {
                items.push(obj.get('name'));
              }
            }
          })
          items = items.sort(me.sortAlphaNum);
          items.push('Cancel');
          var model = new qx.data.Array(items);
          var menu = new qx.ui.mobile.dialog.Menu(model);
          menu.show();
          menu.addListener("changeSelection", function(evt)
          {
            var selectedItem = evt.getData().item;
            if (selectedItem == "Cancel")
            {
              me.optionReady = true;
              return;
            }
            me.opacityName = selectedItem;
            var buttonsWidget = new qx.ui.mobile.container.Composite(new qx.ui.mobile.layout.VBox());
            var toTopButton = new qx.ui.mobile.form.Button("Move To Top");
            var cancelButton = new qx.ui.mobile.form.Button("Close");
            var slider = new qx.ui.mobile.form.Slider().set(
            {
              minimum : 0,
              maximum : 100
            });
            if (me.opacityName == "Radar")
            {
              slider.setValue(mobileedd.Radar.getInstance().getOpacity() * 100);
              slider.addListener("changeValue", function(e) {
                mobileedd.Radar.getInstance().setOpacity(e.getData() / 100);
              }, this);
            } else
            {
              slider.setValue(me.getLayerByName(me.opacityName).get('opacity') * 100);
              slider.addListener("changeValue", function(e) {
                me.getLayerByName(me.opacityName).setOpacity(e.getData() / 100);
              }, this);
            }
            buttonsWidget.add(slider, {
              flex : 1
            });
            buttonsWidget.add(toTopButton);
            buttonsWidget.add(cancelButton);
            var popup = new qx.ui.mobile.dialog.Popup(buttonsWidget);
            popup.setTitle("Change Opacity");
            popup.show();
            toTopButton.addListener("tap", function()
            {
              // Silly way to get Vector Layer on top...
              var layer = me.getLayerByName(me.opacityName);
              me.map.removeLayer(layer);
              me.map.getLayers().setAt(me.map.getLayers().getArray().length, layer);
            }, this);
            cancelButton.addListener("tap", function()
            {
              popup.hide();

              // Wait a second before allowing map clicks
              new qx.event.Timer.once(function() {
                me.optionReady = true;
              }, this, 500);
            }, this);
          });
          return;
        }
        if (selectedItem == "Cancel") {
          return;
        }
        if (selectedItem.indexOf("Travel Hazard S") != -1) {
          travelSegment.forEach(function(obj, index) {
            if (selectedItem.split('#')[1] == index)
            {
              qx.core.Init.getApplication().getRouting().executeGet("/travelsample");
              var text = new qx.event.message.Message("edd.travelsample");
              text.setData(travelSegment[index]);
              me.bus.dispatch(text);
            }
          })
        }
        if (selectedItem.indexOf("Travel Hazard P") != -1) {
          travelPoint.forEach(function(obj, index) {
            if (selectedItem.split('#')[1] == index)
            {
              qx.core.Init.getApplication().getRouting().executeGet("/travelsample");
              var text = new qx.event.message.Message("edd.travelsample");
              text.setData(travelPoint[index]);
              me.bus.dispatch(text);
            }
          })
        }

        // Make Hazard options for menu
        var hsplit = selectedItem.split(' - ');
        var htype1 = hsplit[0];
        var hetn = hsplit[1].replace('#', '');
        hazards.forEach(function(feature)
        {
          var htype = feature.get('warn_type');
          var hsig = 'Warning';
          if (typeof htype == "undefined")
          {
            htype = feature.get('phenomenon');
            hsig = feature.get('significance');
          }
          if (htype + ' ' + hsig == htype1 && feature.get('etn') == hetn)
          {
            var wfo = feature.get('office').substr(1, 4);
            var phenom = feature.get('phenomenon').length == 2 ? feature.get('phenomenon') : me.hazardObject.hazardMap[feature.get('phenomenon')];
            var eventid = feature.get('etn').replace(/ /g, '');
            var sig = (typeof feature.get('significance') == "undefined") ? 'W' : me.hazardObject.sigMap[feature.get('significance')];
            var url = me.getJsonpRoot() + 'getWarningText.php';
            url += '?year=' + new Date(feature.get('end') * 1000).getFullYear();
            url += '&wfo=' + wfo;
            url += '&phenomena=' + phenom;
            url += '&eventid=' + eventid;
            url += '&significance=' + sig;
            var hazardTextRequest = new qx.io.request.Jsonp();
            hazardTextRequest.setUrl(url);
            hazardTextRequest.setCallbackParam('callback');
            hazardTextRequest.addListenerOnce("success", function(e)
            {
              qx.core.Init.getApplication().getRouting().executeGet("/hazardtext");
              var text = new qx.event.message.Message("edd.hazard");
              var html = '';
              if ((phenom == "TO" | phenom == "SV" | phenom == "FF") && sig == 'W') {
                html += '<img style="width: 100%;" src="' + me.c.getSecure() + '//www.weather.gov/images/crh/impact/K' + wfo + "_" + phenom + "_" + eventid + "_" + feature.get('end') + '.png">';
              }
              html += e.getTarget().getResponse().data[0].report;
              text.setData(html);
              me.bus.dispatch(text);
              me.busyPopup.hide();
            }, this);
            hazardTextRequest.send();
            me.busyPopup.show();
          }
        });
      }, this);
    },

    /**
     * Get the map
     */
    getMap : function() {
      return this.map;
    },

    /**
     * Get the center of the map
     * */
    getCenter : function() {
      if (typeof ol != "undefined") {
        return ol.proj.transform(this.map.getView().getCenter(), 'EPSG:3857', 'EPSG:4326');
      } else {
        return null;
      }
    },

    /**
     * Set the basemap
     * */
    setBasemapByName : function(selectedItem)
    {
      var me = this;
      var layers = me.map.getLayers();

      // Remove current layer
      me.BasemapOptions.forEach(function(obj) {
        if (obj.get('name') == layers.getArray()[0].get('name'))
        {
          // Hide/Remove the reference too
          me.esridark_reference.setVisible(false);
          me.esrilite_reference.setVisible(false);
          me.map.removeLayer(obj);
        }
      });
      me.BasemapOptions.forEach(function(obj)
      {
        // Add the reference too
        if (obj.get('name') == selectedItem) {
          layers.insertAt(0, obj);
        }
        if (selectedItem == "ESRI Dark Gray") {
          me.esridark_reference.setVisible(true);
        } else if (selectedItem == "ESRI Light Gray")
        {
          var loaded = false;
          layers.getArray().forEach(function(obj) {
            if (obj.get('name') == "ESRI Light Gray Reference") {
              loaded = true;
            }
          });
          if (!loaded) {
            layers.insertAt(1, me.esrilite_reference);
          }
          me.esrilite_reference.setVisible(true);
        }

      });
    },

    /**
     * Get a layer by name
     */
    getLayerByName : function(name)
    {
      var me = this;
      var match = null;
      me.map.getLayers().getArray().forEach(function(obj) {
        if (obj.get('name') == name) {
          match = obj;
        }
      });
      return match;
    },

    /**
    Set opacity of a layer by name
    */
    setOpacity : function(name, opacity)
    {
      var me = this;
      me.map.getLayers().forEach(function(layer) {
        if (layer.get('name') == name) {
          layer.setOpacity(opacity);
        }
      });
    },

    // From: http://stackoverflow.com/questions/11582512/how-to-get-url-parameters-with-javascript/11582513#11582513
    getURLParameter : function(name) {
      return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
    }
  }
});

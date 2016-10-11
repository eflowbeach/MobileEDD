/* ************************************************************************

   Copyright: 2016

   License: MIT

   Authors: Jonathan Wolfe

************************************************************************ */

/*global qx*/

/*global ol*/

/*global moment*/

/**
 */
qx.Class.define("mobileedd.page.PageTravelHazards",
{
  extend : qx.ui.mobile.page.NavigationPage,
  type : 'singleton',
  construct : function()
  {
    this.base(arguments);
    this.c = mobileedd.config.Config.getInstance();
    this.bus = qx.event.message.Bus.getInstance();
    this.setTitle("Travel Hazards");
    this.setShowBackButton(true);
    this.setBackButtonText("Back");
    if (typeof (Storage) !== "undefined") {
      if (localStorage.getItem("mapquestkey") != null) {
        this.c.setMapQuestKey(JSON.parse(localStorage.getItem("mapquestkey")));
      }
    }

    // Putting these up here so they're not as annoying to the user to have to initialize the travel instance

    // Origin
    this.__start = new qx.ui.mobile.form.TextField().set( {
      placeholder : "Type location or tap the map."
    });

    // Destination
    this.__end = new qx.ui.mobile.form.TextField().set( {
      placeholder : "Type location or tap the map."
    });
  },
  members :
  {
    // overridden
    _initialize : function()
    {
      this.base(arguments);
      var closeDialogButton1 = new qx.ui.mobile.form.Button("Close");
      this.__popup = new qx.ui.mobile.dialog.Popup(closeDialogButton1);
      this.__popup.setTitle("Missing start/end point");
      closeDialogButton1.addListener("tap", function() {
        this.__popup.hide();
      }, this);
      var spacer = new qx.ui.mobile.container.Composite();
      spacer.addCssClass("hboxPad");
      this.getContent().add(spacer)
      var startLabel = new qx.ui.mobile.basic.Label("Origin");
      startLabel.addCssClass("menuLabels");
      this.getContent().add(startLabel);
      this.getContent().add(this.__start);
      this.waypointContainer = new qx.ui.mobile.container.Composite();
      this.waypointContainer.setLayout(new qx.ui.mobile.layout.VBox());
      this.waypointContainer.addCssClass("hboxPad");
      this.getContent().add(this.waypointContainer)

      // Destination
      var endLabel = new qx.ui.mobile.basic.Label("Destination");
      endLabel.addCssClass("menuLabels");
      this.getContent().add(endLabel);
      this.getContent().add(this.__end)
      var spacer = new qx.ui.mobile.container.Composite();
      spacer.addCssClass("hboxPad");
      this.getContent().add(spacer)

      // Use map
      var useMap = new qx.ui.mobile.form.Button("Use Map...", "resource/mobileedd/images/map.png");
      useMap.addListener("tap", function(e)
      {
        qx.core.Init.getApplication().getRouting().executeGet("/");
        var text = new qx.event.message.Message("edd.message");
        text.setData(['<b>Tap map to:<br>"Set Travel Origin" or<br>"Set Travel Destination".</b>', 5000]);
        this.bus.dispatch(text);
      }, this);
      this.getContent().add(useMap)

      // Use location
      this.myLocationButton = new qx.ui.mobile.form.Button("Use My Location...", "resource/mobileedd/images/map-marker-icon.png");
      this.myLocationButton.addListener("tap", function(e) {
        this.setMyLocation();
      }, this);
      this.getContent().add(this.myLocationButton);

      // Leave at
      this.showPickerButton = new qx.ui.mobile.form.Button("Leave at:", "resource/mobileedd/images/calendar.png");
      this.showPickerButton.addListener("tap", function(e) {
        this.__pickerDialog.show();
      }, this);
      this._createPicker(this.showPickerButton);
      this.getContent().add(this.showPickerButton);

      // Add waypoint
      this.waypoints = [];
      this.waypointsLonLat = [];
      this.waypointsNumber = 0;
      this.waypoints[this.waypointsNumber] = new qx.ui.mobile.form.TextField().set( {
        placeholder : "Get from map tap or type it"
      });

      // this.myWaypointButton = new qx.ui.mobile.form.Button("Add Waypoint...", "resource/mobileedd/images/map-marker-icon-blue.png");

      // this.myWaypointButton.addListener("tap", function(e) {

      //   this.addWaypointContainer();

      // }, this);

      // this.getContent().add(this.myWaypointButton);

      // Use your own key
      this.myKeyButton = new qx.ui.mobile.form.Button("Change MapQuest Key...", "resource/mobileedd/images/key.png");
      this.myKeyButton.addListener("tap", function(e)
      {
        var composite = new qx.ui.mobile.container.Composite();
        composite.setLayout(new qx.ui.mobile.layout.VBox());
        var popup = new qx.ui.mobile.dialog.Popup();
        var form = new qx.ui.mobile.form.Form();
        var tf = new qx.ui.mobile.form.TextArea();
        tf.setValue(this.c.getMapQuestKey());
        form.add(tf, "Your MapQuest Key: ");
        composite.add(new qx.ui.mobile.form.renderer.Single(form))

        // Get a key
        var widget = new qx.ui.mobile.form.Button("Get a Key...");
        widget.addListener("tap", function() {
          window.open('https://developer.mapquest.com/plan_purchase/steps/business_edition/business_edition_free/register', '_blank'  // <- This is what makes it open in a new window.
          );
        }, this);
        composite.add(widget);

        // Go to link
        var widget = new qx.ui.mobile.form.Button("Apply the Above Key");
        widget.addListener("tap", function()
        {
          this.c.setMapQuestKey(tf.getValue());
          if (typeof (Storage) !== "undefined") {
            localStorage.setItem("mapquestkey", JSON.stringify(tf.getValue()))
          }
          popup.hide();
        }, this);
        composite.add(widget);

        // Reset
        var widget = new qx.ui.mobile.form.Button("Reset");
        widget.addListener("tap", function()
        {
          this.c.setMapQuestKey(this.c.getMapQuestKeyBackup());
          if (typeof (Storage) !== "undefined") {
            localStorage.setItem("mapquestkey", JSON.stringify(this.c.getMapQuestKeyBackup()));
          }
          popup.hide();
        }, this);
        composite.add(widget);

        // Close
        var widget = new qx.ui.mobile.form.Button("Close");
        widget.addListener("tap", function() {
          popup.hide();
        }, this);
        composite.add(widget);
        popup.add(composite);
        popup.show();
      }, this);
      this.getContent().add(this.myKeyButton);

      // Go button
      this.goButton = new qx.ui.mobile.form.Button("Go!", "resource/mobileedd/images/greenball.png");
      this.goButton.addListener("tap", function(e)
      {
        var th = mobileedd.TravelHazards.getInstance();
        var geo = new mobileedd.geo.EsriGeo();

        // Set up the start request listener
        geo.geoReq.addListenerOnce("success", function(e)
        {
          // Set the start location lat/lon and make a string for the direction request
          var response = e.getTarget().getResponse();
          var lat = response.locations[0].feature.geometry.y;
          var lon = response.locations[0].feature.geometry.x;
          th.setStartLocationLL(lat + ',' + lon);
          geo.geoReq.addListenerOnce("success", function(e)
          {
            var response = e.getTarget().getResponse();
            var lat = response.locations[0].feature.geometry.y;
            var lon = response.locations[0].feature.geometry.x;
            th.setEndLocationLL(lat + ',' + lon);
            var waypoints = '';
            if (typeof this.waypointsLonLat !== "undefined")
            {
              this.waypointsLonLat.forEach(function(obj)
              {
                var lonlat = obj.slice();
                var latlon = lonlat.reverse();
                waypoints += '&to=' + latlon.toString();
              })
              th.setWaypointString(waypoints);
            }

            // *** Make the directions request now that we have start/end lat/lons. ***
            th.getRoutePoints();
            qx.core.Init.getApplication().getRouting().executeGet("/");
          }, this);
          geo.geoReq.addListenerOnce("error", function(e)
          {
            this.__popup.setTitle("Could not determine end location address.");
            this.__popup.show();
          })

          // Find the end location lat/lon from text entry
          var endAddress = this.__end.getValue();
          if (endAddress == "")
          {
            this.__popup.setTitle("Missing end point");
            this.__popup.show();
            return;
          }
          geo.geoRequest(endAddress);
        }, this);
        geo.geoReq.addListenerOnce("error", function(e)
        {
          this.__popup.setTitle("Could not determine start location address.");
          this.__popup.show();
        })

        // Find the start location lat/lon from text entry
        var startAddress = this.__start.getValue();
        if (startAddress == "")
        {
          this.__popup.setTitle("Missing start point");
          this.__popup.show();
          return;
        }
        geo.geoRequest(startAddress);
      }, this);
      this.getContent().add(this.goButton);
      this.getSelectedTime();

      //Add legend
      mobileedd.MoreLayers.getInstance().addTravelHazardLegend();
      this.c.setTravelActive(true);
    },

    /**
        * Creates the date picker dialog.
        * @param anchor {qx.ui.mobile.core.Widget} the anchor of the popup.
        */
    _createPicker : function(anchor)
    {
      var pickerDialog = this.__pickerDialog = new qx.ui.mobile.dialog.Popup(anchor);
      pickerDialog.setTitle("Date Picker");
      var picker = this.__picker = new qx.ui.mobile.control.Picker();
      picker.addListener("changeSelection", this.__onPickerChangeSelection, this);
      this.__pickerDaySlotData = this._createDayPickerSlot(0, new Date().getFullYear());
      picker.addSlot(this._createHourPickerSlot());
      picker.addSlot(this._createAMPickerSlot());
      picker.addSlot(this._createMonthPickerSlot());
      picker.addSlot(this.__pickerDaySlotData);
      picker.addSlot(this._createYearPickerSlot());

      // Initialize
      this.__picker.setSelectedIndex(0, new moment().format('h') - 1);
      var ampm = (new moment().format('A') == "AM") ? 0 : 1;
      this.__picker.setSelectedIndex(1, ampm);
      this.__picker.setSelectedIndex(2, new moment().format('M') - 1);
      this.__picker.setSelectedIndex(3, new moment().format('D') - 1);
      this.__picker.setSelectedIndex(4, 1);
      var hidePickerButton = new qx.ui.mobile.form.Button("OK");
      hidePickerButton.addListener("tap", function(e)
      {
        this.getSelectedTime();
        pickerDialog.hide();
      }, this);
      var pickerDialogContent = new qx.ui.mobile.container.Composite();
      pickerDialogContent.add(picker);
      pickerDialogContent.add(hidePickerButton);
      pickerDialog.add(pickerDialogContent);
    },

    /**
     * Get the selected time from picker
     */
    getSelectedTime : function()
    {
      if (typeof this.__picker.getModel().toArray()[0].toArray()[this.__picker.getSelectedIndex(0)] != "undefined")
      {
        var hour = this.__picker.getModel().toArray()[0].toArray()[this.__picker.getSelectedIndex(0)].title;
        var ampm = this.__picker.getModel().toArray()[1].toArray()[this.__picker.getSelectedIndex(1)].title;
        var month = this.__picker.getModel().toArray()[2].toArray()[this.__picker.getSelectedIndex(2)].title;
        var day = this.__picker.getModel().toArray()[3].toArray()[this.__picker.getSelectedIndex(3)].title;
        var year = this.__picker.getModel().toArray()[4].toArray()[this.__picker.getSelectedIndex(4)].title;
        var timestring = hour + ' ' + ampm + ', ' + month + ' ' + day + ' ' + year;
      } else
      {
        var timestring = new moment().format("h A, MMM D YYYY");
      }
      var selectedDate = new moment(timestring, "h A, MMM D YYYY").toDate();
      this.showPickerButton.setValue("Leave at: " + timestring);
      if (!new moment(timestring, "h A, MMM D YYYY").isAfter(new moment().subtract(1, 'hours')))
      {
        var closeDialogButton = new qx.ui.mobile.form.Button("Close");
        var popup = new qx.ui.mobile.dialog.Popup(closeDialogButton);
        popup.setTitle("Depart time is in the past.");
        closeDialogButton.addListener("tap", function()
        {
          popup.hide();
          this.__pickerDialog.show();
        }, this);
        popup.show();
        return;
      } else
      {
        mobileedd.TravelHazards.getInstance().setLeaveAt(selectedDate);
      }
    },

    /**
     * Creates the picker slot data for month names, based on current locale settings.
     */
    _createMonthPickerSlot : function()
    {
      var names = qx.locale.Date.getMonthNames("abbreviated", qx.locale.Manager.getInstance().getLocale());
      var slotData = [];
      for (var i = 0; i < names.length; i++) {
        slotData.push( {
          title : "" + names[i]
        });
      }
      return new qx.data.Array(slotData);
    },

    /**
        * Creates the picker slot data for days in month.
        * @param month {Integer} current month.
        * @param year {Integer} current year.
        */
    _createDayPickerSlot : function(month, year)
    {
      var daysInMonth = new Date(year, month + 1, 0).getDate();
      var slotData = [];
      for (var i = 1; i <= daysInMonth; i++) {
        slotData.push( {
          title : "" + i
        });
      }
      return new qx.data.Array(slotData);
    },

    /**
     * Creates the picker slot data from 1950 till current year.
     */
    _createYearPickerSlot : function()
    {
      var slotData = [];
      for (var i = new Date().getFullYear() + 1; i > 1950; i--) {
        slotData.push( {
          title : "" + i
        });
      }
      return new qx.data.Array(slotData);
    },

    /**
         * Creates the picker slot time data.
         */
    _createHourPickerSlot : function()
    {
      var slotData = [];
      for (var i = 1; i <= 12; i++) {
        slotData.push( {
          title : "" + i
        });
      }
      return new qx.data.Array(slotData);
    },

    /**
         * Creates the picker slot AM/PM.
         */
    _createAMPickerSlot : function()
    {
      var slotData = [ {
        title : "AM"
      }, {
        title : "PM"
      }]
      return new qx.data.Array(slotData);
    },

    /**
        * Reacts on "changeSelection" event on picker.
        */
    __onPickerChangeSelection : function(e) {
      if (e.getData().slot != 3)
      {
        if (this._updatePickerTimer)
        {
          clearTimeout(this._updatePickerTimer);
          this._updatePickerTimer = null;
        }
        this._updatePickerTimer = setTimeout(function() {
          this._updatePickerDaySlot();
        }.bind(this), 250);
      }
    },

    /**
    * Updates the shown days in the picker slot.
    */
    _updatePickerDaySlot : function()
    {
      var monthIndex = this.__picker.getSelectedIndex(2);
      var dayIndex = this.__picker.getSelectedIndex(3);
      var yearIndex = this.__picker.getSelectedIndex(4);
      var slotData = this._createDayPickerSlot(monthIndex, new Date().getFullYear() - yearIndex);
      var oldDayData = this.__picker.getModel().getItem(3);
      var diff = slotData.length - oldDayData.length;
      if (diff < 0) {
        for (var i = 0; i < -diff; i++) {
          oldDayData.pop();
        }
      } else if (diff > 0)
      {
        var ref = oldDayData.length;
        for (var i = 0; i < diff; i++) {
          oldDayData.push( {
            title : "" + (ref + i + 1)
          });
        }
      }

      this.__picker.setSelectedIndex(3, dayIndex);
    },

    /**
     * Set my location
     */
    setMyLocation : function()
    {
      var geo = new mobileedd.geo.EsriGeo();
      geo.reverseGeocodeReq.addListenerOnce("success", function(e)
      {
        var response = e.getTarget().getResponse();
        try
        {
          var address = response.address.Match_addr;
          this.__start.setValue(address)
        }catch (e) {
          return;
        }
      }, this)
      var ll = ol.proj.transform(mobileedd.page.Map.getInstance().getMyPosition(), 'EPSG:3857', 'EPSG:4326')
      geo.reverseGeoRequest(ll[1], ll[0]);
    },

    /**
     * Set the origin
     */
    setOrigin : function(ll)
    {
      var geo = new mobileedd.geo.EsriGeo();
      geo.reverseGeocodeReq.addListenerOnce("success", function(e)
      {
        var response = e.getTarget().getResponse();

        // try

        // {
        var address = response.address.Match_addr;
        this.__start.setValue(address);

        // var text = new qx.event.message.Message("edd.message");

        // text.setData(['<b>Origin set to:</b><br>' + address, 3000]);

        // this.bus.dispatch(text);

        // }catch (e)

        // {

        // this.__popup.setTitle("Unable to find address<br> for the specified location.");

        // this.__popup.show();

        // var text = new qx.event.message.Message("edd.message");

        // text.setData(["Unable to find address<br> for the specified location.", 3000]);

        // this.bus.dispatch(text);

        // setTimeout(function() {

        //   qx.core.Init.getApplication().getRouting().executeGet("/");

        // }, 2000);

        // return;

        // }
        var iconFeature = new ol.Feature( {
          geometry : new ol.geom.Point(ol.proj.transform([ll[0], ll[1]], 'EPSG:4326', 'EPSG:3857'))
        });
        iconFeature.setProperties(
        {
          "image" : "origin",
          "address" : response.address.City + ',' + response.address.Region
        });
        var th = mobileedd.TravelHazards.getInstance();
        th.pointSource.addFeature(iconFeature);
        th.pointLayer.setVisible(true)
        var text = new qx.event.message.Message("edd.message");
        text.setData(['<b>Origin set to:</b><br>' + address, 3000]);
        this.bus.dispatch(text);

        // Slight delay
        setTimeout(function() {
          qx.core.Init.getApplication().getRouting().executeGet("/");
        }, 2000);
      }, this)
      mobileedd.TravelHazards.getInstance().pointSource.getFeatures().forEach(function(obj) {
        if (obj.get('image') == "origin") {
          mobileedd.TravelHazards.getInstance().pointSource.removeFeature(obj);
        };
      })
      geo.reverseGeoRequest(ll[1], ll[0]);

      // qx.core.Init.getApplication().getRouting().executeGet("/travelhazards");
    },

    /**
    * Set the waypoint
    */
    setWaypoint : function(ll, index)
    {
      var geo = new mobileedd.geo.EsriGeo();
      geo.reverseGeocodeReq.addListenerOnce("success", function(e)
      {
        var response = e.getTarget().getResponse();
        try
        {
          var address = response.address.Match_addr;
          if (typeof this.waypoints[index] == "undefined") {
            this.addWaypointContainer();
          }
          this.waypointsLonLat[index] = ll;
          this.waypoints[index].setValue(address);
          var text = new qx.event.message.Message("edd.message");
          text.setData(['<b>Waypoint ' + index + 1 + ' set to:</b><br>' + address, 3000]);
          this.bus.dispatch(text);
          var iconFeature = new ol.Feature( {
            geometry : new ol.geom.Point(ol.proj.transform([ll[0], ll[1]], 'EPSG:4326', 'EPSG:3857'))
          });
          iconFeature.setProperties(
          {
            "image" : "waypoint",
            "address" : response.address.City + ',' + response.address.Region
          });
          var th = mobileedd.TravelHazards.getInstance();
          th.pointSource.addFeature(iconFeature);
          th.pointLayer.setVisible(true)
        }catch (e)
        {
          var text = new qx.event.message.Message("edd.message");
          text.setData(["Unable to find address<br> for the specified location.", 3000]);
          this.bus.dispatch(text);
          return;
        }

        //if (!this.c.getTravelActive()) {
        setTimeout(function() {
          qx.core.Init.getApplication().getRouting().executeGet("/");
        }, 2000)

        // }
      }, this)
      geo.reverseGeoRequest(ll[1], ll[0]);
    },

    /**
        * Set the destination
        */
    setDestination : function(ll)
    {
      var geo = new mobileedd.geo.EsriGeo();
      geo.reverseGeocodeReq.addListenerOnce("success", function(e)
      {
        var response = e.getTarget().getResponse();
        try
        {
          var address = response.address.Match_addr;
          this.__end.setValue(address);
          var iconFeature = new ol.Feature( {
            geometry : new ol.geom.Point(ol.proj.transform([ll[0], ll[1]], 'EPSG:4326', 'EPSG:3857'))
          });
          iconFeature.setProperties(
          {
            "image" : "destination",
            "address" : response.address.City + ',' + response.address.Region
          });
          var th = mobileedd.TravelHazards.getInstance();
          th.pointSource.addFeature(iconFeature);
          th.pointLayer.setVisible(true)
        }catch (e)
        {
          var text = new qx.event.message.Message("edd.message");
          text.setData(["Unable to find address<br> for the specified location.", 3000]);
          this.bus.dispatch(text);
          setTimeout(function() {
            qx.core.Init.getApplication().getRouting().executeGet("/");
          }, 2000);
          return;
        }
      }, this)
      mobileedd.TravelHazards.getInstance().pointSource.getFeatures().forEach(function(obj) {
        if (obj.get('image') == "destination") {
          mobileedd.TravelHazards.getInstance().pointSource.removeFeature(obj);
        };
      })
      geo.reverseGeoRequest(ll[1], ll[0]);
      qx.core.Init.getApplication().getRouting().executeGet("/travelhazards");
    },

    /**
        * Add waypoint container
        */
    addWaypointContainer : function()
    {
      // var labelContainer = new qx.ui.mobile.container.Composite();

      // labelContainer.setLayout(new qx.ui.mobile.layout.HBox());
      var container = new qx.ui.mobile.container.Composite();
      container.setLayout(new qx.ui.mobile.layout.HBox());

      // container.addCssClass("hboxPad");

      //var label = new qx.ui.mobile.basic.Label("<b>Waypoint #" + (Number(this.waypointsNumber) + 1) + '</b>');
      var removeButton = new qx.ui.mobile.form.Button("<b>Waypoint #" + (Number(this.waypointsNumber) + 1) + '</b>', "resource/mobileedd/images/delete.png");
      removeButton.setIconPosition('right');
      removeButton.addListener("tap", function(e)
      {
        // Find the index to remove
        var buttonLabel = e.getTarget().getLabel();
        var indexToRemove;
        e.getTarget().getLayoutParent().getChildren().forEach(function(obj, index) {
          if (index % 2 == 0 && obj.getLabel() == buttonLabel) {
            indexToRemove = index;
          }
        })

        // Clean up arrays
        this.waypointsNumber--;
        this.waypoints.splice(indexToRemove, 1);
        this.waypointsLonLat.splice(indexToRemove, 1);

        // Update route
        var th = mobileedd.TravelHazards.getInstance();
        var waypoints = '';
        this.waypointsLonLat.forEach(function(obj)
        {
          var lonlat = obj.slice();
          var latlon = lonlat.reverse();
          waypoints += '&to=' + latlon.toString();
        })
        th.setWaypointString(waypoints);

        // Get rid of buttons (textfield first...)
        e.getTarget().getLayoutParent().getChildren()[indexToRemove + 1].destroy();
        e.getTarget().getLayoutParent().getChildren()[indexToRemove].destroy();
      }, this);

      // endLabel.addCssClass("menuLabels");
      this.waypoints[this.waypointsNumber] = new qx.ui.mobile.form.TextField().set( {
        placeholder : "Get from map tap or type it"
      });
      container.add(this.waypoints[this.waypointsNumber])
      this.waypointsNumber++;

      // labelContainer.add(label);

      // labelContainer.add(removeButton);
      this.waypointContainer.add(removeButton);
      this.waypointContainer.add(container);
    },

    // overridden
    _back : function()
    {
      qx.core.Init.getApplication().getRouting().back();
      new qx.bom.Selector.query('#hideButton')[0].style.visibility = "visible";
      mobileedd.page.Map.getInstance().map.updateSize();
    }
  }
});

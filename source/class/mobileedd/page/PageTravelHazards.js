/* ************************************************************************

   Copyright:

   License:

   Authors: Jonathan Wolfe
************************************************************************ */

/*global qx*/

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
      startLabel = new qx.ui.mobile.basic.Label("Origin");
      startLabel.addCssClass("menuLabels");
      this.getContent().add(startLabel);

      // START FIELD
      this.__start = new qx.ui.mobile.form.TextField().set( {
        placeholder : "Get from map tap or type it"
      });
      this.getContent().add(this.__start);
      this.waypointContainer = new qx.ui.mobile.container.Composite();
      this.waypointContainer.setLayout(new qx.ui.mobile.layout.VBox());
      this.waypointContainer.addCssClass("hboxPad");
      this.getContent().add(this.waypointContainer)
      endLabel = new qx.ui.mobile.basic.Label("Destination");
      endLabel.addCssClass("menuLabels");
      this.getContent().add(endLabel);
      this.__end = new qx.ui.mobile.form.TextField().set( {
        placeholder : "Get from map tap or type it"
      });
      this.getContent().add(this.__end)
      var spacer = new qx.ui.mobile.container.Composite();
      spacer.addCssClass("hboxPad");
      this.getContent().add(spacer)
      this.showPickerButton = new qx.ui.mobile.form.Button("Leave at:", "resource/mobileedd/images/calendar.png");
      this.showPickerButton.addListener("tap", function(e) {
        this.__pickerDialog.show();
      }, this);
      this._createPicker(this.showPickerButton);
      this.getContent().add(this.showPickerButton);

      // Use location
      this.myLocationButton = new qx.ui.mobile.form.Button("Use my location...", "resource/mobileedd/images/map-marker-icon.png");
      this.myLocationButton.addListener("tap", function(e) {
        this.setMyLocation();
      }, this);
      this.getContent().add(this.myLocationButton);

      // Add waypoint
      this.waypoints = [];
      this.waypointsLonLat = [];
      this.waypointsNumber = 0;
      this.myWaypointButton = new qx.ui.mobile.form.Button("Add Waypoint...", "resource/mobileedd/images/map-marker-icon-blue.png");
      this.myWaypointButton.addListener("tap", function(e) {
        this.addWaypointContainer();
      }, this);
      this.getContent().add(this.myWaypointButton);

      // Use your own key
      this.myKeyButton = new qx.ui.mobile.form.Button("MapQuest Key...", "resource/mobileedd/images/key.png");
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

        // Go to link
        var widget = new qx.ui.mobile.form.Button("Apply");
        widget.addListener("tap", function()
        {
          this.c.setMapQuestKey(tf.getValue());
          popup.hide();
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
            this.waypointsLonLat.forEach(function(obj)
            {
              var lonlat = obj.slice();
              var latlon = lonlat.reverse();
              waypoints += '&to=' + latlon.toString();
            })
            th.setWaypointString(waypoints);

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
      mobileedd.TravelHazards.getInstance().setLeaveAt(selectedDate);
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
          this.__end.setValue(address)
        }catch (e)
        {
          this.__popup.setTitle("Unable to find address for the specified location.");
          this.__popup.show();
          return;
        }
      }, this)
      geo.reverseGeoRequest(ll[1], ll[0]);
      qx.core.Init.getApplication().getRouting().executeGet("/travelhazards");
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
        try
        {
          var address = response.address.Match_addr;
          this.__start.setValue(address)
        }catch (e)
        {
          this.__popup.setTitle("Unable to find address for the specified location.");
          this.__popup.show();
          return;
        }
      }, this)
      geo.reverseGeoRequest(ll[1], ll[0]);
      qx.core.Init.getApplication().getRouting().executeGet("/travelhazards");
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
          this.waypoints[index].setValue(address)
        }catch (e)
        {
          this.__popup.setTitle("Unable to find address for the specified waypoint location.");
          this.__popup.show();
          return;
        }
      }, this)
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

/* ************************************************************************

   Copyright:

   License:

   Authors:
me.imageurl = "http://www.weather.gov/images/crh/impact/" + f.office + "_" + wtype + "_" + eventid + "_" + f.end + ".png";
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
      var spacer = new qx.ui.mobile.container.Composite();
      spacer.addCssClass("hboxPad");
      this.getContent().add(spacer)
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
      var req = new qx.bom.request.Script();

      // req.onload = function()

      // {
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

      // Go button
      this.goButton = new qx.ui.mobile.form.Button("Go!", "resource/mobileedd/images/greenball.png");
      this.goButton.addListener("tap", function(e)
      {
        // this.__pickerDialog.show();
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

            // *** Make the directions request now that we have start/end lat/lons. ***
            th.getRoutePoints();  //me.getStartLocationLL(), me.getEndLocationLL());
            qx.core.Init.getApplication().getRouting().executeGet("/");
          }, this);
          geo.geoReq.addListenerOnce("error", function(e)
          {
            // qxnws.ui.notification.Manager.getInstance().postWarning("Could not determine end location address.", 15);
          })

          // Find the end location lat/lon from text entry
          var endAddress = this.__end.getValue();  //document.getElementById('endLocation-input').value;
          if (endAddress == "")
          {
            this.__popup.show();
            return;
          }
          geo.geoRequest(endAddress);
        }, this);
        geo.geoReq.addListenerOnce("error", function(e)
        {
          // qxnws.ui.notification.Manager.getInstance().postWarning("Could not determine start location address.", 15);
        })

        // Find the start location lat/lon from text entry
        var startAddress = this.__start.getValue();  //document.getElementById('startLocation-input').value;
        if (startAddress == "")
        {
          this.__popup.show();
          return;
        }
        geo.geoRequest(startAddress);
      }, this);
      this.getContent().add(this.goButton);
      this.getSelectedTime();

      // }.bind(this);

      // req.open("GET", "resource/mobileedd/libs/mobileeddlibs.js");

      // req.send();

      // this.getContent().add(new qx.ui.mobile.form.renderer.Single(this.__form));
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
         * Creates the picker slot data from 1950 till current year.
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
        * Reacts on "changeSelection" event on picker, and displays the values on resultsLabel.
        */
    __onPickerChangeSelection : function(e)
    {
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
      if (e.getData().item)
      {
        // this.__resultsLabel.setValue(

        //   "Received <b>changeSelection</b> from Picker Dialog. [slot: " +

        //   e.getData().slot + "] [item: " + e.getData().item.title + "]"

        // );
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
        }catch (e) {
          //qxnws.ui.notification.Manager.getInstance().postWarning("Unable to find address for the specified location.", 15);
          return;
        }
      }, this)
      geo.reverseGeoRequest(ll[1], ll[0]);
      qx.core.Init.getApplication().getRouting().executeGet("/travelhazards");
    },
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
        }catch (e) {
          //qxnws.ui.notification.Manager.getInstance().postWarning("Unable to find address for the specified location.", 15);
          return;
        }
      }, this)
      geo.reverseGeoRequest(ll[1], ll[0]);
      qx.core.Init.getApplication().getRouting().executeGet("/travelhazards");
    },

    // overridden
    _back : function()
    {
      qx.core.Init.getApplication().getRouting().back();
      mobileedd.page.Map.getInstance().map.updateSize();
    }
  }
});

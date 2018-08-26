(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return crm.DailyCalendarControl;
        },

        init: function (options) {
            var that = this;

            that._FirstHour = 0;
            that._LastHour = 23;
            that._ItemsHeight = 50;
            that._AdjustControlsDisabled = true;
            that._IsInCreateItems = that._IsInRefreshItems = false;

            afw.BasePanel.fn.init.call(that, options);
            var formObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            afw.uiApi.CreateControlByObjectData(that, formObjectData, false);

            var hoursDockPanel = that.FindControl("HoursDockPanel");
            
            hoursDockPanel.SetVisible(false);

            that._WrapperDockPanel = that.FindControl("WrapperDockPanel");
            that._ServerDate = afw.DateTimeHelper.GetServerDateTime().split(" ")[0];

            var currentDateControl = that.FindControl("DateControl");
            currentDateControl.SetValue(that._ServerDate);
            currentDateControl.bind("ValueChanged", function (e) { that._CurrentDateControl_ValueChanged(e); });
            
            var filterComboBox = that.FindControl("FilterComboBox");
            var filterComboBoxItems = [
                { Key: "MyActivities", Title: "فعالیت های من" },
                { Key: "AllActivities", Title: "همه فعالیت ها" }];
            filterComboBox.SetItemsDataSource(filterComboBoxItems);
            filterComboBox.SetValue("MyActivities");
            filterComboBox.bind("ValueChanged", function (e) { that.RefreshItems(); });

            that._CreateHours();
            that.RefreshItems();

            var hoursScrollInnerPanel = that.FindControl("HoursScrollInnerPanel");

            that._CurrentTimeIndicatorControl = afw.uiApi.CreateSavedFormByName(
                hoursScrollInnerPanel,
                "crm.DailyCalendar_CurrentTimeIndicatorControl",
                { Name: "CurrentTimeIndicatorControl" });
            that._CurrentTimeIndicatorControl.SetVisible(false);

            that._RefreshItemsInterval =
                setInterval(function () {
                    if (that._IsInCreateItems == true || that._IsInRefreshItems == true || !that._GetControlIsActive())
                        return;
                    that.RefreshItems();
                }, 60000);
        },

        _DoDestroy: function () {
            var that = this;
            afw.BasePanel.fn._DoDestroy(that);

            clearInterval(that._RefreshItemsInterval);
        },

        _CreateHours: function () {
            var that = this;

            var hoursDockPanel = that.FindControl("HoursDockPanel");

            var hourStr = null;
            var panesCount = 0;
            for (var hour = that._FirstHour; hour <= that._LastHour; hour++) {
                hourStr = hour < 10 ? "0" + hour: "" + hour;

                var panesCount = hoursDockPanel.GetPanesCount();
                hoursDockPanel.InsertPane(panesCount, { Size: that._ItemsHeight }, false);//for hour
                that._CreateHourControl(hoursDockPanel.Panes[panesCount], hourStr + ":00");
                panesCount = hoursDockPanel.GetPanesCount();
                hoursDockPanel.InsertPane(panesCount, { Size: that._ItemsHeight }, false);//for half hour
                that._CreateHourControl(hoursDockPanel.Panes[panesCount], hourStr + ":30");
            }

            hoursDockPanel.AppendPane();//last pane should be fill
        },

        RefreshItems: function () {
            var that = this;

            that._AdjustControlsDisabled = true;
            that._IsInRefreshItems = true;

            that._HideError();
            try
            {
                //Remove all items:
                var hoursDockPanel = that.FindControl("HoursDockPanel");
                var hourItemsDockPanel = null;
                for (var hourPaneIndex = 0; hourPaneIndex < hoursDockPanel.GetPanesCount() - 1; hourPaneIndex++) {
                    hourItemsDockPanel = that.GetHourItemsDockPanel(hoursDockPanel.Panes[hourPaneIndex].ChildControls[0]);

                    while (hourItemsDockPanel.GetPanesCount() > 0) {
                        hourItemsDockPanel.RemovePane(0);
                    }
                }

                afw.uiApi.ShowProgress(that);
                that._CreateItems(
                    function (result) {
                        afw.uiApi.HideProgress(that);

                        that._AdjustControlsDisabled = false;
                        that._IsInRefreshItems = false;

                        if (result.HasError)
                            that._ShowError("خطا در ایجاد آیتم ها");
                        else {
                            hoursDockPanel.SetVisible(true);
                            that._AdjustControls();
                        }
                    });
            }
            catch (ex)
            {
                that._AdjustControlsDisabled = false;
                that._IsInRefreshItems = false;
            }
        },

        _CreateItems: function (callback) {
            var that = this;

            that._IsInCreateItems = true;
            try {
                var dateControl = that.FindControl("DateControl");
                if (ValueIsEmpty(dateControl.GetValue()))
                    dateControl.SetValue(afw.DateTimeHelper.GetServerDateTime());

                var selectedDate = that.FindControl("DateControl").GetValue();
                var filterComboBox = that.FindControl("FilterComboBox");

                var itemsFilter = String.Format("ItemDate is not null and ItemDate between '{0}' and '{1}'",
                    selectedDate, selectedDate);
                if (filterComboBox.GetValue() == "MyActivities")
                    itemsFilter += String.Format(" and OwnerUser = '{0}'", afw.App.Session.GetFieldValue("SystemUser"));
                else if (filterComboBox.GetValue() == "AllActivities")
                    itemsFilter += "";

                afw.QueryHelper.FetchEntityListOfQueryAsync("crm.DailyCalenderActivitiesView", null, null, itemsFilter, "ItemTime", null, null,
                    function (result) {
                        if (result.HasError) {
                            that._IsInCreateItems = false;
                            callback({ HasError: true });
                        }
                        else {
                            try {
                                var itemEntities = result.Value.Entities;

                                for (var i = 0; i < itemEntities.length; i++) {
                                    that._CreateItemControl(itemEntities[i]);
                                }

                                //Append fill pane to all HourItemList panes:
                                var hoursDockPanel = that.FindControl("HoursDockPanel");
                                for (var hourPaneIndex = 0; hourPaneIndex < hoursDockPanel.GetPanesCount() - 1; hourPaneIndex++) {
                                    that.GetHourItemsDockPanel(hoursDockPanel.Panes[hourPaneIndex].ChildControls[0]).AppendPane();
                                }

                                that._IsInCreateItems = false;
                                callback({ HasError: false });
                            }
                            catch (ex) {
                                that._IsInCreateItems = false;
                                callback({ HasError: true });
                            }
                        }
                    });
            }
            catch (ex) {
                that._IsInCreateItems = false;
                callback({ HasError: true });
            }
        },

        _ShowError: function (errorMessage) {
            var that = this;

            var errorPanel = that.FindControl("ErrorPanel");
            var errorLabel = that.FindControl("ErrorLabel");

            errorLabel.SetText(errorMessage);
            errorPanel.SetVisible(true);
            that._WrapperDockPanel.SetPaneSizeSetting(4, 40);
        },

        _HideError: function () {
            var that = this;

            var errorPanel = that.FindControl("ErrorPanel");
            var errorLabel = that.FindControl("ErrorLabel");

            errorLabel.SetText(null);
            errorPanel.SetVisible(false);
            that._WrapperDockPanel.SetPaneSizeSetting(4, 1);
        },

        _OnResize: function () {
            var that = this;

            afw.BasePanel.fn._OnResize.call(that);

            that._AdjustControls();
        },

        _AdjustControls: function () {
            var that = this;

            if (that._AdjustControlsDisabled == true)
                return;
            
            var hoursScrollInnerPanel = that.FindControl("HoursScrollInnerPanel");
            var hoursDockPanel = that.FindControl("HoursDockPanel");

            if (hoursScrollInnerPanel != null && hoursScrollInnerPanel.ParentControl.GetWidth() > 20) {
                hourHeight = totalHoursHeight = 0;
                var hourPane = null;
                var hourControl = null;
                var hourItemsDockPanel = null;
                var hourPanesSizeSetting = [];

                for (var i = 0; i < hoursDockPanel.Panes.length - 1; i++) {
                    hourControl = hoursDockPanel.Panes[i].ChildControls[0];
                    hourItemsDockPanel = that.GetHourItemsDockPanel(hourControl);
                    
                    if (hourItemsDockPanel.Panes != null) {
                        hourHeight = ((hourItemsDockPanel.Panes.length - 1) * that._ItemsHeight) + 2;
                    }

                    if (hourHeight < 80)
                        hourHeight = 80;
                    
                    totalHoursHeight += hourHeight;

                    //hoursDockPanel.SetPaneSizeSetting(i, hourHeight); //method of setting size changed to SetPanesSizeSetting for performance
                    hourPanesSizeSetting.push(hourHeight);
                }

                hoursDockPanel.SetPanesSizeSetting(hourPanesSizeSetting);
                
                hoursScrollInnerPanel.SetSize(hoursScrollInnerPanel.ParentControl.GetWidth() - 15, totalHoursHeight);
                
                var selectedDate = that.FindControl("DateControl").GetValue();
                if (hoursDockPanel.GetVisible() == true
                        && !ValueIsEmpty(selectedDate) && afw.DateTimeHelper.ToTenCharactersDateFormat(selectedDate) == that._ServerDate) {
                    setTimeout(function () {
                        if (that.IsDestroying)
                            return;

                        var serverTime = that._GetServerTime();
                        that._CurrentTimeIndicatorControl.SetTime(serverTime);
                        that._CurrentTimeIndicatorControl.SetVisible(true);

                        var timePosition = that._GetTimePosition(that._CurrentTimeIndicatorControl.GetTime());
                        that._CurrentTimeIndicatorControl.SetPosition(5, timePosition);
                        var time = that._CurrentTimeIndicatorControl.GetTime();
                        var currentTimePosition = that._GetTimePosition(time);
                        var hoursScrollOuterPanel = that.FindControl("HoursScrollOuterPanel");
                        var centerOffset = (that.GetHeight() / 2) - (that.GetHeight() - hoursScrollOuterPanel.GetHeight());
                        hoursScrollOuterPanel.SetScrollTop(currentTimePosition - centerOffset);
                    }, 100);
                }
                else {
                    that._CurrentTimeIndicatorControl.SetVisible(false);
                    var hoursScrollOuterPanel = that.FindControl("HoursScrollOuterPanel");
                    hoursScrollOuterPanel.SetScrollTop(0);
                }
            }
        },

        _CreateHourControl: function (parentControl, time) {
            var that = this;

            var hourControl = afw.uiApi.CreateSavedControl("crm.DailyCalendarHourControl",
                {
                    Name: "DailyCalendarHourControl_" + time.Replace(":", "_"),
                    ParentControl: parentControl,
                    FillParent: true
                });

            hourControl.FindControl("HourLabel").SetText(time);
        },

        _CreateItemControl: function (itemInfoEntity) {
            var that = this;

            var itemDateTime = itemInfoEntity.GetFieldValue("ItemTime");
            var itemTime = itemDateTime.split(" ")[1].substring(0, 5);
            var itemTimeHourStr = itemTime.split(":")[0];
            var itemTimeMinuteStr = itemTime.split(":")[1];
            var itemTimeHour = parseInt(itemTimeHourStr);
            var itemTimeMinute = parseInt(itemTimeMinuteStr);
            var itemHourControlName = "DailyCalendarHourControl_" + itemTimeHourStr + "_" + (itemTimeMinute < 30 ? "00" : "30");

            var itemHourControl = that.FindControl(itemHourControlName);
            var hourItemsDockPanel = that.GetHourItemsDockPanel(itemHourControl);
            var itemPaneIndex = hourItemsDockPanel.GetPanesCount();
            var itemPane = hourItemsDockPanel.InsertPane(itemPaneIndex, { Size: that._ItemsHeight }, false);
            var itemControl = afw.uiApi.CreateSavedFormByName(hourItemsDockPanel.Panes[itemPaneIndex], "crm.DailyCalendarItemControl",
                {
                    Name: "DailyCalendarHourControl_" + GenerateGuid(),
                    ItemInfoEntity: itemInfoEntity,
                    ParentDailyCalendarControl: that
                });
        },

        _CurrentDateControl_ValueChanged: function (e) {
            var that = this;

            that.RefreshItems();
        },

        _GetTimePosition: function (timeStr) {
            var that = this;

            var firstHourStr = that._FirstHour < 10? "0" + that._FirstHour + ":00": that._FirstHour + ":00";
            var lastHourStr = that._LastHour < 10? "0" + that._LastHour + ":59": that._LastHour + ":59";
            
            if (timeStr.length != 5 || timeStr < firstHourStr || timeStr > lastHourStr)
                throw "Invalid time";

            var timeHourStr = timeStr.split(":")[0];
            var timeMinuteStr = timeStr.split(":")[1];
            var timeHour = parseInt(timeHourStr);
            var timeMinute = parseInt(timeMinuteStr);

            var timePaneStartTime = timeHourStr + ":" + (timeMinute < 30 ? "00" : "30");

            //Get pane of requested time:
            var timeControlName = "DailyCalendarHourControl_" + timePaneStartTime.Replace(":", "_");
            var timePane = that.FindControl(timeControlName).ParentControl;

            //Get prior panes total height:
            var hoursDockPanel = that.FindControl("HoursDockPanel");
            var priorPanesTotalHeight = 0;
            for (var i = 0; i < timePane.GetPaneIndex(); i++) {
                priorPanesTotalHeight += hoursDockPanel.Panes[i].GetHeight();
            }

            //Get requested time position in it's pane 
            var timePaneStartTimeSeconds = parseInt(timePaneStartTime.split(":")[0]) * 3600
                + parseInt(timePaneStartTime.split(":")[1]) * 60;
            var timeSeconds = timeHour * 3600 + timeMinute * 60;
            var secondsElapesedFromPaneStartTime = timeSeconds - timePaneStartTimeSeconds;
            var timePositionInPane = (timePane.GetHeight() * secondsElapesedFromPaneStartTime) / (30 * 60);

            var timePosition = priorPanesTotalHeight + timePositionInPane;

            return timePosition;
        },

        _GetServerTime: function () {
            var serverDateTime = afw.DateTimeHelper.GetServerDateTime();
            var serverTime = serverDateTime.split(" ")[1].substring(0, 5);
            return serverTime;
        },

        _GetControlIsActive: function () {
            var that = this;

            var mdiTabControl = afw.App.AppContainer.MdiTabControl;
            var selectedMdiTabIndex = mdiTabControl.GetSelectedTabIndex();
            var selectedMdiTabPage = mdiTabControl.GetTabPageByIndex(selectedMdiTabIndex)

            if (afw.App.OpenWindows.length != 0)
                return false;
            else if (selectedMdiTabPage.FindControl(that.GetName()) != null)
                return true;
            else if (selectedMdiTabPage.GetChildsCount() != 0
                    && selectedMdiTabPage.ChildControls[0].FindControl(that.GetName()) != null)
                return true;

            else
                return false;
        },

        //use this method instead of FindControl for performance
        GetHourItemsDockPanel: function (hourControl) {
            return hourControl.ChildControls[0].Panes[0].ChildControls[0].Panes[0].ChildControls[0];
        }
    });
    
    //Static Members:

    FormClass.TypeName = "crm.DailyCalendarControl";
    FormClass.BaseType = afw.BasePanel;


    crm.DailyCalendarControl = FormClass;
})();
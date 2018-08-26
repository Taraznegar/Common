(function () {
    var typeName = "wm.RialiNemodanAsnadAnbarListControl";
    var baseType = afw.DataListControl;
    var objectEvents = afw.DataListControl.Events.concat([]);

    var RialiNemodanAsnadAnbarListControl = baseType.extend({
        events: objectEvents,

        GetType: function () {
            return wm.RialiNemodanAsnadAnbarListControl;
        },

        init: function (options) {
            var that = this;

            options.LoadDataOnInit = false;
            options.Sortable = false;

            options.DataListFullName = "wm.RialiNemodanAsnadAnbarList";
            afw.DataListControl.fn.init.call(that, options);

            var activeFinancialYearStartDate = null;
            var activeFinancialYearEndDate = null;
            var activeFinancialYearEntity = cmn.GetUserActiveFinancialYearEntity();
            if (activeFinancialYearEntity != null) {
                activeFinancialYearStartDate = activeFinancialYearEntity.GetFieldValue("StartDate");
                activeFinancialYearEndDate = activeFinancialYearEntity.GetFieldValue("EndDate");
            }

            that._FinancialYearID = activeFinancialYearEntity.GetFieldValue("ID");
            that._TodayDate = afw.DateTimeHelper.GetServerDateTime();

            that._ValuateWarehouseDocs_EachPartDays = 1;//برای جلوگیری از کند شدن کل سیستم در هنگام عملیات ریالی نمودن
            that._ValuateWarehouseDocs_ToDate = null;
            that._ValuateWarehouseDocs_CurrentPartFromDate = null;
            that._ValuateWarehouseDocs_CurrentPartToDate = null;
            that._ValuateWarehouseDocs_ResultEntityList = null;

            that._VDockPanel.InsertPane(2, { Size: 100 }, true);

            var columnsFilterInfo = [
                        {
                            FieldName: "IssueDate",
                            Title: "از تاریخ صدور",
                            ControlType: "Date",
                            CompareOperator: ">=",
                            DefaultValue: activeFinancialYearStartDate
                        },
                        {
                            FieldName: "IssueDate",
                            Title: "تا تاریخ صدور",
                            ControlType: "Date",
                            CompareOperator: "<=",
                            DefaultValue: activeFinancialYearEndDate > that._TodayDate ? that._TodayDate : activeFinancialYearEndDate
                        },
                        {
                            FieldName: "VazeyatRialiShodan",
                            Title: "وضعیت ریالی شدن",
                            ControlType: "OptionSet",
                            OptionSetFullName: "wm.VaziyatRialiAsnadAnbar",
                            OptionSetValueDataMember: "Name"
                        },
                        {
                            FieldName: "FinancialDocType",
                            Title: "نوع سند مالی",
                            ControlType: "OptionSet",
                            OptionSetFullName: "cmn.FinancialDocType",
                            OptionSetValueDataMember: "Name"
                        },
                        {
                            FieldName: "GhabzOrHavaleType",
                            Title: "نوع رسید/حواله",
                            ControlType: "Lookup",
                            LookupDataListFullName: "wm.GhabzOrHavaleTypeList",
                            LookupEntityCaptionFieldName: "Title",
                            LookupControlType: "Simple"
                        },
                        {
                            FieldName: "GhabzOrHavaleNumber",
                            Title: "شماره رسید/حواله",
                            ControlType: "Numeric",
                            CompareOperator: "like"
                        },
                        {
                            FieldName: "StuffLocation",
                            Title: "انبار",
                            ControlType: "Lookup",
                            LookupDataListFullName: "cmn.StuffLocations",
                            LookupEntityCaptionFieldName: "Name",
                            LookupControlType: "Simple"
                        },
                        {
                            FieldName: "NahveRialiNemodan",
                            Title: "نحوه ریالی نمودن",
                            ControlType: "OptionSet",
                            OptionSetFullName: "wm.NahveRialiNemodan",
                            OptionSetValueDataMember: "Name"
                        } ];

            that._FilterControl = afw.uiApi.CreateSavedFormByName(
                that._VDockPanel.Panes[2],
                "cmn.DataListAdvancedFilterControl",
                {
                    ColumnsFilterInfo: columnsFilterInfo
                });

            that._FilterControl.bind("FilterChanged", function (e) { that._FilterControl_FilterChanged(e); });

            that._VDockPanel.AppendPane();
            that._ProgressStatusBarPaneIndex = that._VDockPanel.GetPanesCount() - 1;

            that._ProgressStatusLabel = new afw.Label({
                Name: "ProgressStatusLabel",
                ParentControl: that._VDockPanel.Panes[that._ProgressStatusBarPaneIndex],
                FontBold: true
            });

            that._CurrentProgressCharacterStep = 1;
            setInterval(function () {
                var progressCharacter = null;

                if (that._CurrentProgressCharacterStep == 1)
                    progressCharacter = "-";
                else if (that._CurrentProgressCharacterStep == 2)
                    progressCharacter = "\\";
                else if (that._CurrentProgressCharacterStep == 3)
                    progressCharacter = "|";
                else if (that._CurrentProgressCharacterStep == 4)
                    progressCharacter = "/";

                if (!ValueIsEmpty(that._ProgressStatusText))
                    that._ProgressStatusLabel.SetText(that._ProgressStatusText + " " + progressCharacter);

                that._CurrentProgressCharacterStep++;
                
                if (that._CurrentProgressCharacterStep == 5)
                    that._CurrentProgressCharacterStep = 1;                    
            }, 150);

            that._SetProgressStatusText(null);

            that._OperationType = null;
            that._GetDatePopup = null;

            that.LoadData();
        },

        _OnCreatingColumn: function (columnInfo) {
        },

        _CreateToolbar: function () {
            var that = this;

            afw.DataListControl.fn._CreateToolbar.call(that);

            that.Toolbar.AddButton("ValuateWarehouseDocs",
                "ریالی نمودن اسناد ... ",
              { BackgroundColor: "#4b8df9", TextColor: "#ffffff" });
            that.Toolbar.AddButton("SetRialiNashode", "خروج از ریالی ... ",
                { BackgroundColor: "#f19b12" });
            that.Toolbar.AddButton("GenerateAccDoc", "صدور سند ... ",
              { BackgroundColor: "#43c35e", TextColor: "#ffffff" });
            that.Toolbar.AddButton("DeleteAccDoc", "حذف سند ... ",
                { BackgroundColor: "#f19b12" });
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            if (buttonKey == "ValuateWarehouseDocs") {
                that._OperationType = "ValuateWarehouseDocs";
                //that._OpenGetDatePopup("بررسی اسناد جهت ریالی نمودن", "تا تاریخ", that._TodayDate);
                that._OpenGetDatePopup("ریالی نمودن اسناد", "تا تاریخ", that._TodayDate);
            }
            else if (buttonKey == "SetRialiNashode") {
                that._OperationType = "SetRialiNashode";
                that._OpenGetDatePopup("خروج از ریالی شده", "از تاریخ", that._TodayDate);
            }
            else if (buttonKey == "GenerateAccDoc") {
                that._OperationType = "GenerateAccDoc";
                that._OpenGetDatePopup("صدور سند", "تا تاریخ", that._TodayDate);
            }
            else if (buttonKey == "DeleteAccDoc") {
                that._OperationType = "DeleteAccDoc";
                that._OpenGetDatePopup("حذف سند", "از تاریخ", that._TodayDate);
            }
            else {                
                that._OperationType = null;
                afw.DataListControl.fn._OnToolbarButtonClicked.call(that, buttonKey);
            }
        },
        
        _ValuateWarehouseDocs: function (toDate) {
            var that = this;

            var firstGhabzOrHavaleEntityList = afw.uiApi.FetchEntityList("wm.GhabzOrHavale", 
                String.Format("VazeyatRialiShodan = '{0}'", afw.OptionSetHelper.GetOptionSetItemID("wm.VaziyatRialiAsnadAnbar.RialiNashode")),
                "IssueDate", 1, 1);

            if (firstGhabzOrHavaleEntityList.Entities.length == 0) {
                afw.ErrorDialog.Show("سند ریالی نشده ای پیدا نشد.");
                return;
            }

            var fromDate = afw.DateTimeHelper.ToTenCharactersDateFormat(
                firstGhabzOrHavaleEntityList.Entities[0].GetFieldValue("IssueDate"));
            toDate = afw.DateTimeHelper.ToTenCharactersDateFormat(toDate);

            if (fromDate > toDate)
                fromDate = toDate;

            if (afw.DateTimeHelper.GetDatesDayDiff(fromDate, toDate) > 365) {//to prevent stack overflow in recursive call
                afw.ErrorDialog.Show("فاصله زمانی آخرین سند ریالی شده از تاریخ انتخاب شده بیش از یک سال می باشد.");
                return;
            }

            that._ValuateWarehouseDocs_ToDate = toDate;
            that._ValuateWarehouseDocs_CurrentPartFromDate = fromDate;

            that._ValuateWarehouseDocs_CurrentPartToDate = 
                afw.DateTimeHelper.ToTenCharactersDateFormat(afw.DateTimeHelper.AddDays(fromDate, that._ValuateWarehouseDocs_EachPartDays));
            
            if (that._ValuateWarehouseDocs_CurrentPartToDate > toDate)
                that._ValuateWarehouseDocs_CurrentPartToDate = toDate;
            
            that._ValuateWarehouseDocs_ResultEntityList = afw.uiApi.CreateEntityList();

            afw.uiApi.ShowProgress(that);
            that._ValuateWarehouseDocs_Recursive();
        },

        _ValuateWarehouseDocs_Recursive: function () {
            var that = this;

            that._SetProgressStatusText(String.Format("ریالی نمودن اسناد انبار تا {0} - در حال ریالی نمودن اسناد {1}",
                afw.DateTimeHelper.GregorianToPersian(that._ValuateWarehouseDocs_ToDate),
                afw.DateTimeHelper.GregorianToPersian(that._ValuateWarehouseDocs_CurrentPartFromDate)));

            afw.uiApi.CallServerMethodAsync("wm.ValuateWarehouseDocs",
                [that._ValuateWarehouseDocs_CurrentPartFromDate, that._ValuateWarehouseDocs_CurrentPartToDate],
                function (result) {
                    if (that._IsDestroying)
                        return;

                    if (result.HasError) {
                        afw.uiApi.HideProgress(that);
                        that._SetProgressStatusText(null);

                        that.LoadData();

                        var persianCurrentPartFromDate = afw.DateTimeHelper.GregorianToPersian(that._ValuateWarehouseDocs_CurrentPartFromDate);

                        afw.ErrorDialog.Show(String.Format("از تاریخ {0} به بعد بدلیل بروز خطا اسناد بررسی نشدند: {1}.",
                            persianCurrentPartFromDate, result.ErrorMessage));

                        if (that._ValuateWarehouseDocs_ResultEntityList.Entities.length > 0)
                            that._ShowValuateWarehouseDocsResult();
                    }
                    else {
                        that._ValuateWarehouseDocs_ResultEntityList.Entities = 
                            that._ValuateWarehouseDocs_ResultEntityList.Entities.concat(result.Value.Entities);

                        if (that._ValuateWarehouseDocs_CurrentPartToDate != that._ValuateWarehouseDocs_ToDate) {
                            that._ValuateWarehouseDocs_CurrentPartFromDate = afw.DateTimeHelper.ToTenCharactersDateFormat(
                                afw.DateTimeHelper.AddDays(that._ValuateWarehouseDocs_CurrentPartToDate, that._ValuateWarehouseDocs_EachPartDays));

                            if (that._ValuateWarehouseDocs_CurrentPartFromDate > that._ValuateWarehouseDocs_ToDate)
                                that._ValuateWarehouseDocs_CurrentPartFromDate = that._ValuateWarehouseDocs_ToDate;

                            that._ValuateWarehouseDocs_CurrentPartToDate = afw.DateTimeHelper.ToTenCharactersDateFormat(
                                afw.DateTimeHelper.AddDays(that._ValuateWarehouseDocs_CurrentPartFromDate, that._ValuateWarehouseDocs_EachPartDays));

                            if (that._ValuateWarehouseDocs_CurrentPartToDate > that._ValuateWarehouseDocs_ToDate)
                                that._ValuateWarehouseDocs_CurrentPartToDate = that._ValuateWarehouseDocs_ToDate;

                            //برای جلوگیری از کند شدن کل سیستم در هنگام عملیات ریالی نمودن
                            setTimeout(function () {
                                that._ValuateWarehouseDocs_Recursive();
                            }, 500);                            
                        }
                        else {
                            that._SetProgressStatusText(null);
                            afw.uiApi.HideProgress(that);
                            that.LoadData();

                            if (that._ValuateWarehouseDocs_ResultEntityList.Entities.length > 0)
                                that._ShowValuateWarehouseDocsResult();
                            else
                                afw.MessageDialog.Show(String.Format("مشکلی برای ریالی نمودن اسناد تا تاریخ {0} یافت نشد.",
                                    afw.DateTimeHelper.GregorianToPersian(that._ValuateWarehouseDocs_ToDate)));
                        }
                    }
                });
        },

        _ShowValuateWarehouseDocsResult: function () {
            var that = this;

            that._DestroyResolveWareHouseDocsConflictsForm();

            that._ResolveWareHouseDocsConflictsForm = afw.uiApi.OpenSavedFormInMdiContainer("wm.ResolveWareHouseDocsConflictsForm",
                "مشکلات اسناد انبار برای ریالی نمودن ",
                {
                    Name: "ResolveWareHouseDocsConflicts",
                    WareHouseDocsEntityList: that._ValuateWarehouseDocs_ResultEntityList
                });
        },

        _SetRialiNashodeWarehouseDocs: function (fromDate) {
            var that = this;

            afw.uiApi.ShowProgress(that);
            afw.uiApi.CallServerMethodAsync("wm.SetRialiNashodeFromDate", [fromDate],
                function (result) {
                    if (that._IsDestroying)
                        return;

                    afw.uiApi.HideProgress(that);
                    that.LoadData();

                    if (result.HasError)
                        afw.ErrorDialog.Show(result.ErrorMessage);
                    else {
                        afw.MessageDialog.Show(String.Format("اسناد انبار بعد از تاریخ {0} به وضعیت 'ریالی نشده' انتقال یافتند.",
                                afw.DateTimeHelper.GregorianToPersian(fromDate)));
                    }

                    that.LoadData();
                });
        },

        _GenerateWarehouseAccDoc: function (toDate) {
            var that = this;

            afw.uiApi.ShowProgress(that);
            afw.uiApi.CallServerMethodAsync("wm.GenerateWarehouseAccDoc", [toDate, that._FinancialYearID],
            function (result) {
                if (that._IsDestroying)
                    return;

                afw.uiApi.HideProgress(that);
                that.LoadData();

                if (result.HasError)
                    afw.ErrorDialog.Show(result.ErrorMessage);
                else {
                    afw.MessageDialog.Show(String.Format("{1}اسناد انبار تا تاریخ {0} به وضعیت 'سند شده' انتقال یافتند.",
                         afw.DateTimeHelper.GregorianToPersian(toDate), result.Value));
                }

                that.LoadData();
            });
        },

        _DeleteWarehouseAccDoc: function (fromDate) {
            var that = this;

            afw.uiApi.ShowProgress(that);
            afw.uiApi.CallServerMethodAsync("wm.DeleteWarehouseAccDoc", [fromDate, that._FinancialYearID],
            function (result) {
                if (that._IsDestroying)
                    return;

                afw.uiApi.HideProgress(that);
                that.LoadData();

                if (result.HasError)
                    afw.ErrorDialog.Show(result.ErrorMessage);
                else {
                    afw.MessageDialog.Show(String.Format("{1}اسناد انبار از تاریخ {0} به وضعیت 'ریالی شده' انتقال یافتند.",
                         afw.DateTimeHelper.GregorianToPersian(fromDate), result.Value));
                }

                that.LoadData();
            });
        },

        _OpenGetDatePopup: function (popupTitle, dateLabelText, defaultDate) {
            var that = this;

            that._GetDatePopup = afw.uiApi.OpenSavedFormWindow("wm.GetDatePopup", {
                Name: "GetToDatePopup",
                Modal: true,
                Title: popupTitle
            });

            that._GetDatePopup.FindControl("DateLabel").SetText(dateLabelText);

            if (!ValueIsEmpty(defaultDate))
                that._GetDatePopup.FindControl("DateControl").SetValue(defaultDate);

            that._GetDatePopup.FindControl("DateControl").BindEvent("KeyPressed", function (e) { that._GetDatePopupDateControl_KeyPressed(e); });
            that._GetDatePopup.BindEvent("Closed", function (e) { that._GetDatePopup_Closed(e); });
            that._GetDatePopup.FindControl("OkButton").BindEvent("Click", function (e) { that._GetDatePopupOkButton_Click(e); });

            that._GetDatePopup.Center();
            setTimeout(function () {
                if (that._GetDatePopup != null && !that._GetDatePopup.IsDestroying)
                    that._GetDatePopup.FindControl("DateControl").Focus();
            }, 1000);
        },

        _GetDatePopupDateControl_KeyPressed: function (e) {
            var that = this;

            if (e.Key == "Enter")
                that._GetDatePopupOkButton_Click();
        },

        _GetDatePopupOkButton_Click: function (e) {
            var that = this;

            var date = that._GetDatePopup.FindControl("DateControl").GetValue();

            if (!ValueIsEmpty(date)) {
                that._GetDatePopup.Close();
                that._GetDatePopup = null;

                if (that._OperationType == "ValuateWarehouseDocs")
                    that._ValuateWarehouseDocs(date);
                else if (that._OperationType == "GenerateAccDoc")
                    that._GenerateWarehouseAccDoc(date);
                else if (that._OperationType == "SetRialiNashode")
                    that._SetRialiNashodeWarehouseDocs(date);
                else if (that._OperationType == "DeleteAccDoc")
                    that._DeleteWarehouseAccDoc(date);
                else
                    afw.ErrorDialog.Show("invalid OperationType : ", that._OperationType);
            }
        },

        _GetDatePopup_Closed: function (e) {
            var that = this;

            that._OperationType = null;
        },

        _FilterControl_FilterChanged: function (e) {
            var that = this;

            that.LoadData();
        },

        _SetProgressStatusText: function (text) {
            var that = this;

            that._ProgressStatusText = text;

            if (ValueIsEmpty(text))
                that._VDockPanel.SetPaneSizeSetting(that._ProgressStatusBarPaneIndex, 1);
            else
                that._VDockPanel.SetPaneSizeSetting(that._ProgressStatusBarPaneIndex, 40);

            that._ProgressStatusLabel.SetText(that._ProgressStatusText);
        },

        _GetTotalFilterExpression: function () {
            var that = this;

            var filterExpression = afw.DataListControl.fn._GetTotalFilterExpression.call(that);

            filterExpression = cmn.AddFilterToFilterExpression(filterExpression, that._FilterControl.GetFilterExpression());

            return filterExpression;
        },

        _LoadData: function () {
            var that = this;

            if (that._FilterControl == null)
                return;

            afw.DataListControl.fn._LoadData.call(that);

        },

        _OnLoadingData: function () {
            var that = this;

            afw.DataListControl.fn._OnLoadingData.call(that);
        },

        _OnDataLoaded: function () {
            var that = this;

            afw.DataListControl.fn._OnDataLoaded.call(that);
        },

        _ShowEntityWindow: function (entity, formMode, options) {
            var that = this;

            return afw.DataListControl.fn._ShowEntityWindow.call(that, entity, formMode, options);
        },

        _OnEntityWindowOpened: function (entityWindow) {
            var that = this;

            afw.DataListControl.fn._OnEntityWindowOpened.call(that, entityWindow);
        },

        _OnEntityWindowClosed: function (entityWindow) {
            var that = this;

            afw.DataListControl.fn._OnEntityWindowClosed.call(that, entityWindow);
        },

        _EntitiesGridView_RowDoubleClick: function (e) {
            var that = this;

            afw.DataListControl.fn._EntitiesGridView_RowDoubleClick.call(that, e);
        },

        _OnPreviewKeyUp: function (e) {
            var that = this;

            afw.DataListControl.fn._OnPreviewKeyUp.call(that, e);
        },

        _DestroyResolveWareHouseDocsConflictsForm: function () {
            var that = this;

            if (!ValueIsEmpty(that._ResolveWareHouseDocsConflictsForm)) {
                var resolveWareHouseDocsConflictsParent = that._ResolveWareHouseDocsConflictsForm.ParentControl;

                if (!resolveWareHouseDocsConflictsParent.IsDestroying)
                    resolveWareHouseDocsConflictsParent.Destroy();
            }
        },

        _DoDestroy: function () {
            var that = this;

            afw.DataListControl.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    RialiNemodanAsnadAnbarListControl.TypeName = typeName;
    RialiNemodanAsnadAnbarListControl.BaseType = baseType;
    RialiNemodanAsnadAnbarListControl.Events = objectEvents;


    wm.RialiNemodanAsnadAnbarListControl = RialiNemodanAsnadAnbarListControl;
})();

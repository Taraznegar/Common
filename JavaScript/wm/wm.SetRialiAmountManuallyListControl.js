(function () {
    var typeName = "wm.SetRialiAmountManuallyListControl";
    var baseType = afw.DataListControl;
    var objectEvents = afw.DataListControl.Events.concat([]);

    var SetRialiAmountManuallyListControl = baseType.extend({
        events: objectEvents,

        GetType: function () {
            return wm.SetRialiAmountManuallyListControl;
        },

        init: function (options) {
            var that = this;

            options.LoadDataOnInit = false;
            options.Sortable = false;

            options.DataListFullName = "wm.SetRialiAmountManuallyList";
            afw.DataListControl.fn.init.call(that, options)

            that._WarehouseDocTypeHavaleID = afw.OptionSetHelper.GetOptionSetItemID("cmn.WarehouseDocType.Havale");
            that._VaziyatRialiAsnadAnbarSanadShodeID = afw.OptionSetHelper.GetOptionSetItemID("wm.VaziyatRialiAsnadAnbar.SanadShode");
            that._VaziyatRialiAsnadAnbarRialiShodeID = afw.OptionSetHelper.GetOptionSetItemID("wm.VaziyatRialiAsnadAnbar.RialiShode");

            var activeFinancialYearStartDate = null;
            var activeFinancialYearEndDate = null;
            var activeFinancialYearEntity = cmn.GetUserActiveFinancialYearEntity();
            if (activeFinancialYearEntity != null) {
                activeFinancialYearStartDate = activeFinancialYearEntity.GetFieldValue("StartDate");
                activeFinancialYearEndDate = activeFinancialYearEntity.GetFieldValue("EndDate");
            }

            var todayDate = afw.DateTimeHelper.GetServerDateTime();

            that._VDockPanel.InsertPane(2, { Size: 100 }, true);

            var rialiKardanDasti = afw.OptionSetHelper.GetOptionSetItemID("wm.NahveRialiNemodan.Dasti");

            var columnsFilterInfo = [
                        {
                            FieldName: "IssueDate",
                            Title: "از تاریخ صدور",
                            ControlType: "Date",
                            CompareOperator: ">=",
                            DefaultValue: activeFinancialYearStartDate,
                            IsFixed: true
                        },
                        {
                            FieldName: "IssueDate",
                            Title: "تا تاریخ صدور",
                            ControlType: "Date",
                            CompareOperator: "<=",
                            DefaultValue: activeFinancialYearEndDate > todayDate ? todayDate : activeFinancialYearEndDate,
                            IsFixed: true
                        },
                        {
                            FieldName: "VazeyatRialiShodan",
                            Title: "وضعیت ریالی شدن",
                            ControlType: "OptionSet",
                            OptionSetFullName: "wm.VaziyatRialiAsnadAnbar",
                            OptionSetValueDataMember: "Name",
                            DefaultValue: afw.OptionSetHelper.GetOptionSetItemID("wm.VaziyatRialiAsnadAnbar.RialiNashode"),
                            IsFixed: true
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
                            LookupControlType: "Simple",
                            BaseFilterExpression: String.Format("NahveRialiNemodan = '{0}'", rialiKardanDasti)
                        },
                        {
                            FieldName: "GhabzOrHavaleNumber",
                            Title: "شماره رسید/حواله",
                            ControlType: "Numeric",
                            CompareOperator: "like"
                        },
                        {
                            FieldName: "StuffCode",
                            Title: "کد کالا",
                            ControlType: "Numeric",
                            CompareOperator: "like"
                        },
                        {
                            FieldName: "StuffDef",
                            Title: "کالا",
                            ControlType: "Lookup",
                            LookupDataListFullName: "cmn.StuffDefs",
                            LookupEntityCaptionFieldName: "Name",
                            LookupControlType: "Advanced"
                        },
                        {
                            FieldName: "StuffStatus",
                            Title: "وضعیت کالا",
                            ControlType: "Lookup",
                            LookupDataListFullName: "wm.StuffStatusList",
                            LookupEntityCaptionFieldName: "Title",
                            LookupControlType: "Simple"
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
                            FieldName: "BatchNumber",
                            Title: "شماره بچ",
                            ControlType: "TextBox",
                            CompareOperator: "like"
                        },
                        {
                            FieldName: "Quantity",
                            Title: "تعداد وارده / صادره",
                            ControlType: "Numeric"
                        },
                        {
                            FieldName: "RialiAmount",
                            Title: "مبلغ وارده / صادره",
                            ControlType: "ComboBox",
                            ComboBoxItems: [
                                { Value: "Null", Title: "فاقد مقدار" },
                                { Value: "NotNull", Title: "دارای مقدار" }],
                            ComboBoxDataTextField: "Title",
                            ComboBoxDataValueField: "Value"
                        }];

            that._FilterControl = afw.uiApi.CreateSavedFormByName(
                that._VDockPanel.Panes[2],
                "cmn.DataListAdvancedFilterControl",
                {
                    ColumnsFilterInfo: columnsFilterInfo
                });

            that._FilterControl.BindEvent("FilterChanged", function (e) { that._FilterControl_FilterChanged(e); });
            that._FilterControl.BindEvent("GetColumnFilterExpression", function (e) { that._FilterControl_GetColumnFilterExpression(e); });

            that.LoadData();
        },
        
        _OnCreatingColumn: function (columnInfo) {
        },

        _CreateToolbar: function () {
            var that = this;

            afw.DataListControl.fn._CreateToolbar.call(that); 
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            afw.DataListControl.fn._OnToolbarButtonClicked.call(that, buttonKey);
        },

        _FilterControl_FilterChanged: function (e) {
            var that = this;

            that.LoadData();
        },

        _FilterControl_GetColumnFilterExpression: function (e) {
            var that = this;

            if (e.ColumnFilterInfo.FieldName == "RialiAmount") {
                var filterValue = e.FilterValueControl.GetText();

                if (filterValue == "فاقد مقدار")
                    e.FilterExpression = "RialiAmount is null";
                else if (filterValue == "دارای مقدار")
                    e.FilterExpression = "RialiAmount is not null";
                else if (ValueIsEmpty(filterValue))
                    e.FilterExpression = null;
                else if (Number(filterValue) == 0 || Number(filterValue) < 0 || Number(filterValue) > 0)//is number
                    e.FilterExpression = String.Format("RialiAmount = {0}", filterValue);
                else
                    throw "مقدار 'مبلغ وارده / صادره' نامعتبر است.";
            }
        },

        _GetTotalFilterExpression: function () {
            var that = this;

            var filterExpression = afw.DataListControl.fn._GetTotalFilterExpression.call(that);

            var filter = that._FilterControl.GetFilterExpression();            
            if (!ValueIsEmpty(filter)) {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";

                filterExpression += filter;
            }

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

            that._OpenGetAmountPopupForm();
        },

        _OnPreviewKeyUp: function (e) {
            var that = this;

            if (e.Key == "Enter") 
                that._OpenGetAmountPopupForm();
            
            afw.DataListControl.fn._OnPreviewKeyUp.call(that, e);
        },

        _OpenGetAmountPopupForm: function () {
            var that = this;
            
            var selectedRows = that._EntitiesGridView.GetSelectedRows();

            if (selectedRows.length != 0) {                
                that._AmountPopupWindow = afw.uiApi.OpenSavedFormWindow("wm.GetRialiAmountPopupForm", {
                    Name: "GetRialiAmountPopupForm",
                    Modal: true
                });

                that._AmountPopupWindow.Center();

                that._RialiAmountTextBox = that._AmountPopupWindow.FindControl("RialiAmountTextBox");
                var approveButton = that._AmountPopupWindow.FindControl("ApproveButton");
                var cancelButton = that._AmountPopupWindow.FindControl("CancelButton");

                approveButton.BindEvent("Click", function (e) { that._SaveRialiAmountChanges(); });
                cancelButton.BindEvent("Click", function (e) { that._CloseAmountPopupWindow(); });
                that._RialiAmountTextBox.BindEvent("KeyPressed", function (e) { that._RialiAmountTextBox_KeyPressed(e); });
                that._RialiAmountTextBox.BindEvent("ValueChanged", function (e) { that._RialiAmountTextBox_ValueChanged(e); });

                if (selectedRows[0].DataItem["WarehouseDocType"] == that._WarehouseDocTypeHavaleID)
                    that._AmountPopupWindow.FindControl("AmountLabel").SetText("مبلغ صادره");
                else
                    that._AmountPopupWindow.FindControl("AmountLabel").SetText("مبلغ وارده");

                that._AmountPopupWindow.FindControl("QuantityLabel").SetText(selectedRows[0].DataItem["Quantity"]);
                that._RialiAmountTextBox.SetValue(selectedRows[0].DataItem["RialiAmount"]);
                
                if (!afw.PermissionHelper.UserHasPermissionToItem("wm.TaghirMablaghRialiAsnadAnbar") ||
                    selectedRows[0].DataItem["VazeyatRialiShodan"] == that._VaziyatRialiAsnadAnbarRialiShodeID ||
                    selectedRows[0].DataItem["VazeyatRialiShodan"] == that._VaziyatRialiAsnadAnbarSanadShodeID) {
                    that._RialiAmountTextBox.SetReadOnly(true);
                }

                setTimeout(function () { that._RialiAmountTextBox.Focus(); }, 1000);
            }
        },

        _SaveRialiAmountChanges: function () {
            var that = this;

            if (ValueIsEmpty(that._RialiAmountTextBox.GetText())) {
                that._RialiAmountTextBox.Focus();
                return;
            }

            var selectedRows = that._EntitiesGridView.GetSelectedRows();
            if (selectedRows.length != 0) {

                if (!afw.PermissionHelper.UserHasPermissionToItem("wm.TaghirMablaghRialiAsnadAnbar") ||
                   selectedRows[0].DataItem["VazeyatRialiShodan"] == that._VaziyatRialiAsnadAnbarRialiShodeID ||
                   selectedRows[0].DataItem["VazeyatRialiShodan"] == that._VaziyatRialiAsnadAnbarSanadShodeID) {
                    that._CloseAmountPopupWindow();
                    return;
                }

                var rialiAmount = parseInt(that._RialiAmountTextBox.GetValue());
                //var quantity = ValueIsEmpty(parseInt(selectedRows[0].DataItem["Quantity"])) || parseInt(selectedRows[0].DataItem["Quantity"]) == 0 ? 1 : Math.abs(parseInt(selectedRows[0].DataItem["Quantity"]))

                afw.uiApi.ShowProgress(that);
                afw.uiApi.CallServerMethodAsync("wm.SaveRialiAmountChanges",
                    [selectedRows[0].DataItem["GhabzOrHavaleID"], selectedRows[0].DataItem["GhabzOrHavaleItemID"],
                    rialiAmount],
                        function (result) {
                            afw.uiApi.HideProgress(that);

                            if (result.HasError)
                                afw.Application.HandleError(result.ErrorMessage);                            

                            that._CloseAmountPopupWindow();
                        });
            }
        },

        _CloseAmountPopupWindow: function(){
            var that = this;
            
            var selectedRows = that._EntitiesGridView.GetSelectedRows();
            var selectedRowIndex = 0;

            if (selectedRows.length != 0) 
                selectedRowIndex = selectedRows[0].RowIndex

            that._AmountPopupWindow.Close();
            that.LoadData();

            if (!ValueIsEmpty(selectedRowIndex))
                setTimeout(function () {
                    var selectedRows = that._EntitiesGridView.GetSelectedRows();

                    if (selectedRows.length == 0) {
                        that._EntitiesGridView.SelectRowByIndex(0);
                        that._EntitiesGridView.Focus();
                    }
                }, 1000);
        },

        _RialiAmountTextBox_KeyPressed: function (e) {
            var that = this;

            if (e.Key == "Enter") {
                that._EntitiesGridView.Focus();
                that._SaveRialiAmountChanges();
            }
            else if (e.Key == "Escape")
                that._CloseAmountPopupWindow();
        },

        _RialiAmountTextBox_ValueChanged: function (e) {
            var that = this;

            var unitPriceTextBox = that._AmountPopupWindow.FindControl("UnitPriceTextBox");
            var quantity = parseInt(that._AmountPopupWindow.FindControl("QuantityLabel").GetText());

            if (ValueIsEmpty(that._RialiAmountTextBox.GetValue()))
                unitPriceTextBox.SetValue(0);
            else
                unitPriceTextBox.SetValue(that._RialiAmountTextBox.GetValue() / quantity);
        },

        _DoDestroy: function () {
            var that = this;

            afw.DataListControl.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    SetRialiAmountManuallyListControl.TypeName = typeName;
    SetRialiAmountManuallyListControl.BaseType = baseType;
    SetRialiAmountManuallyListControl.Events = objectEvents;


    wm.SetRialiAmountManuallyListControl = SetRialiAmountManuallyListControl;
})();

(function () {
    var typeName = "wm.HavaleListControl";
    var baseType = afw.DataListControl;
    var events = afw.DataListControl.Events.concat([]);

    var HavaleListControl = baseType.extend({
        events: events,

        GetType: function () {
            return wm.HavaleListControl;
        },

        init: function (options) {
            var that = this;

            options.DataListFullName = "wm.HavaleList";
            afw.DataListControl.fn.init.call(that, options);

            var activeFinancialYearEntity = cmn.GetUserActiveFinancialYearEntity();
            var activeFinancialYearStartDate = null;
            var activeFinancialYearEndDate = null;
            if (activeFinancialYearEntity != null) {
                activeFinancialYearStartDate = activeFinancialYearEntity.GetFieldValue("StartDate");
                activeFinancialYearEndDate = activeFinancialYearEntity.GetFieldValue("EndDate");
            }

            var warehouseDocType = afw.OptionSetHelper.GetOptionSetItemID("cmn.WarehouseDocType.Havale");

            that._VDockPanel.InsertPane(2, { Size: 100 }, true);

            that._FilterControl = afw.uiApi.CreateSavedFormByName(
                that._VDockPanel.Panes[2],
                "cmn.DataListAdvancedFilterControl", {
                    ColumnsFilterInfo: [
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
                            DefaultValue: activeFinancialYearEndDate,
                            IsFixed: true
                        },
                        {
                            FieldName: "GhabzOrHavaleNumber",
                            Title: "شماره حواله",
                            ControlType: "TextBox",
                            CompareOperator: "like"
                        },
                        {
                            FieldName: "Havale_ShomarehBarnameh",
                            Title: "شماره بارنامه",
                            ControlType: "TextBox",
                            CompareOperator: "like"
                        },
                        {
                            FieldName: "GhabzOrHavaleType",
                            Title: "نوع حواله",
                            ControlType: "Lookup",
                            LookupDataListFullName: "wm.GhabzOrHavaleTypeList",
                            LookupEntityCaptionFieldName: "Title",
                            LookupControlType: "Advanced",
                            BaseFilterExpression: String.Format("WarehouseDocType = '{0}'", warehouseDocType)
                        },
                        {
                            FieldName: "ReferenceDocType",
                            Title: "نوع عملیات مرتبط",
                            ControlType: "Lookup",
                            LookupDataListFullName: "wm.ReferenceDocTypeList",
                            LookupEntityCaptionFieldName: "Title",
                            LookupControlType: "Advanced"
                        },
                        {
                            FieldName: "ReferenceDocNumber",
                            Title: "شماره عملیات مرتبط",
                            ControlType: "TextBox",
                            CompareOperator: "like"
                        },
                        {
                            FieldName: "TarafHesab_Person",
                            Title: "شخص طرف حساب",
                            ControlType: "Lookup",
                            LookupDataListFullName: "cmn.Persons",
                            LookupEntityCaptionFieldName: "FullName",
                            LookupControlType: "Advanced"
                        },
                        {
                            FieldName: "OrganizationUnit",
                            Title: "واحد سازمانی",
                            ControlType: "Lookup",
                            LookupDataListFullName: "cmn.OrganizationInformationList",
                            LookupEntityCaptionFieldName: "Name",
                            LookupControlType: "Simple"
                        },
                        {
                            FieldName: "FinancialDocType",
                            Title: "نوع سند مالی",
                            ControlType: "OptionSet",
                            OptionSetFullName: "cmn.FinancialDocType",
                            OptionSetValueDataMember: "Name"
                        },
                        {
                            FieldName: "StuffLocation",
                            Title: "انبار",
                            ControlType: "Lookup",
                            LookupDataListFullName: "cmn.StuffLocations",
                            LookupEntityCaptionFieldName: "Name",
                            LookupControlType: "Simple"
                        }]
                });
            that._FilterControl.bind("FilterChanged", function (e) { that._FilterControl_FilterChanged(e); });

            that.LoadData();

            that.bind("EntityWindowClosed", function (e) { that._EntityWindowClosed(e); });
        },

        _EntityWindowClosed: function (e) {
            var that = this;

            that.LoadData();
        },

        _CreateToolbar: function () {
            var that = this;

            afw.DataListControl.fn._CreateToolbar.call(that);

            that._Toolbar = that.FindControl(that.GetName() + "_Toolbar");
            that._Toolbar.AddButton("PrintHavale", "چاپ حواله", { Image: "resource(cmn.PrintToolbarIcon)" });
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            afw.DataListControl.fn._OnToolbarButtonClicked.call(that, buttonKey);

            var selectedEntities = that._EntitiesGridView.GetSelectedRows();
            if (ValueIsIn(buttonKey, ["PrintHavale"])) {
                if (selectedEntities.length == 0) {
                    afw.ErrorDialog.Show("ابتدا یک حواله را انتخاب نمایید.");
                    return;
                }
            }

            if (buttonKey == "PrintHavale") {
                that._PrintHavale(selectedEntities[0].DataItem["ID"]);
            }
        },

        _PrintHavale: function (havaleID) {
            var that = this;

            var parameterNames = ["ID"];
            var parameterValues = [havaleID];

            afw.uiApi.ShowProgress(that);
            afw.ReportHelper.RunReport("wm.HavaleReport", parameterNames, parameterValues, null,
                function (result) {
                    afw.uiApi.HideProgress(that);
                    if (result.HasError) {
                        afw.ErrorDialog.Show(result.ErrorMessage);
                    } else {
                        var returnValue = result.Value;
                    }
                });
        },

        _FilterControl_FilterChanged: function (e) {
            var that = this;

            that.LoadData();
        },

        _GetTotalFilterExpression: function () {
            var that = this;

            var filterExpression = afw.DataListControl.fn._GetTotalFilterExpression.call(that);

            filterExpression = cmn.AddActiveFinancialYearFilterToFilterExpression(filterExpression);
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

        _ShowEntityWindow: function (entity, formMode, options) {
            var that = this;

            if (ValueIsEmpty(options))
                options = {};

            options = {
                WarehouseDocTypeName: "Havale"
            }
            return afw.DataListControl.fn._ShowEntityWindow.call(that, entity, formMode, options);
        },

        _OnEntityWindowOpened: function (entityWindow) {
            var that = this;

            afw.DataListControl.fn._OnEntityWindowOpened.call(that, entityWindow);
        },

        _EntitiesGridView_RowDoubleClick: function (e) {
            var that = this;

            afw.DataListControl.fn._EntitiesGridView_RowDoubleClick.call(that, e);
        }
    });

    //Static Members:

    HavaleListControl.TypeName = typeName;
    HavaleListControl.BaseType = baseType;
    HavaleListControl.Events = events;


    wm.HavaleListControl = HavaleListControl;
})();
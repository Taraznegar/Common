(function () {
    var typeName = "wm.VarianceGhabzOrHavaleStuffsReportControl";
    var baseType = afw.DataListControl;
    var objectEvents = afw.DataListControl.Events.concat([]);

    var VarianceGhabzOrHavaleStuffsReportControl = baseType.extend({
        events: objectEvents,

        GetType: function () {
            return wm.VarianceGhabzOrHavaleStuffsReportControl;
        },

        init: function (options) {
            var that = this;

            var activeFinancialYearEntity = cmn.GetUserActiveFinancialYearEntity();

            options.DataListFullName = "wm.VarianceGhabzOrHavaleStuffsReport";
            afw.DataListControl.fn.init.call(that, options);

            var activeFinancialYearStartDate = null;
            var activeFinancialYearEndDate = null;
            if (activeFinancialYearEntity != null) {
                activeFinancialYearStartDate = activeFinancialYearEntity.GetFieldValue("StartDate");
                activeFinancialYearEndDate = activeFinancialYearEntity.GetFieldValue("EndDate");
            }

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
                            Title: "شماره رسید/حواله",
                            ControlType: "TextBox",
                            CompareOperator: "like"
                        },
                        {
                            FieldName: "Stuff",
                            Title: "کالا",
                            ControlType: "Lookup",
                            LookupDataListFullName: "cmn.Stuffs",
                            LookupEntityCaptionFieldName: "DisplayName",
                            LookupControlType: "Advanced"
                        },
                        {
                            FieldName: "WarehouseDocType",
                            Title: "نوع سند انبار",
                            ControlType: "OptionSet",
                            OptionSetFullName: "cmn.WarehouseDocType",
                            OptionSetValueDataMember: "Name"
                        },
                        {
                            FieldName: "GhabzOrHavaleType",
                            Title: "نوع رسید/حواله",
                            ControlType: "Lookup",
                            LookupDataListFullName: "wm.GhabzOrHavaleTypeList",
                            LookupEntityCaptionFieldName: "Title",
                            LookupControlType: "Advanced"
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
                            FieldName: "InvoiceNumber",
                            Title: "شماره عملیات مرتبط",
                            ControlType: "TextBox",
                            CompareOperator: "like"
                        },
                        {
                            FieldName: "OrganizationUnit",
                            Title: "واحد سازمانی",
                            ControlType: "Lookup",
                            LookupDataListFullName: "cmn.OrganizationInformationList",
                            LookupEntityCaptionFieldName: "Name",
                            LookupControlType: "Simple"
                        }]
                });
            that._FilterControl.bind("FilterChanged", function (e) { that._FilterControl_FilterChanged(e); });

            that.LoadData();
        },

        _FilterControl_FilterChanged: function (e) {
            var that = this;

            that.LoadData();
        },

        _GetTotalFilterExpression: function () {
            var that = this;

            var filterExpression = afw.DataListControl.fn._GetTotalFilterExpression.call(that);

            if (!ValueIsEmpty(that._FilterControl.GetFilterExpression())) {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";

                filterExpression += that._FilterControl.GetFilterExpression();
            }

            return filterExpression;
        },

        _LoadData: function () {
            var that = this;

            if (that._FilterControl == null)
                return;

            afw.DataListControl.fn._LoadData.call(that);
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

        _OnLoadingData: function () {
            var that = this;

            afw.DataListControl.fn._OnLoadingData.call(that);
        },

        _OnDataLoaded: function () {
            var that = this;

            afw.DataListControl.fn._OnDataLoaded.call(that);
        },
        
        _OpenEntityWindow: function (entity, formMode, options) {
            var that = this;

            return afw.DataListControl.fn._OpenEntityWindow.call(that, entity, formMode, options);
        },

        _OpenEntityForm: function (entity, formMode, options) {
            var that = this;

            return afw.DataListControl.fn._OpenEntityForm.call(that, entity, formMode, options);
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

        _DoDestroy: function () {
            var that = this;

            afw.DataListControl.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    VarianceGhabzOrHavaleStuffsReportControl.TypeName = typeName;
    VarianceGhabzOrHavaleStuffsReportControl.BaseType = baseType;
    VarianceGhabzOrHavaleStuffsReportControl.Events = objectEvents;


    wm.VarianceGhabzOrHavaleStuffsReportControl = VarianceGhabzOrHavaleStuffsReportControl;
})();
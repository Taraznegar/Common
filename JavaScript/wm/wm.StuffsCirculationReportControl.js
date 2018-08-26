(function () {
    var typeName = "wm.StuffsCirculationReportControl";
    var baseType = afw.DataListControl;
    var objectEvents = afw.DataListControl.Events.concat([]);

    var StuffsCirculationReportControl = baseType.extend({
        events: objectEvents,

        GetType: function () {
            return wm.StuffsCirculationReportControl;
        },

        init: function (options) {
            var that = this;

            options.Sortable = false;

            options.DataListFullName = "wm.StuffsCirculationReport";
            afw.DataListControl.fn.init.call(that, options);

            that._VDockPanel.InsertPane(2, { Size: 100 }, true);

            that._FilterControl = afw.uiApi.CreateSavedFormByName(
                that._VDockPanel.Panes[2],
                "cmn.DataListAdvancedFilterControl", {
                    ColumnsFilterInfo: [
                        {
                            FieldName: "IssueDate",
                            Title: "از تاریخ صدور",
                            ControlType: "Date",
                            CompareOperator: ">="
                        },
                        {
                            FieldName: "IssueDate",
                            Title: "تا تاریخ صدور",
                            ControlType: "Date",
                            CompareOperator: "<="
                        },
                        {
                            FieldName: "GhabzOrHavaleType",
                            Title: "نوع قبض/حواله",
                            ControlType: "Lookup",
                            LookupDataListFullName: "wm.GhabzOrHavaleTypeList",
                            LookupEntityCaptionFieldName: "Title",
                            LookupControlType: "Advanced"
                        },
                        {
                            FieldName: "StuffID",
                            Title: "کالا",
                            ControlType: "Lookup",
                            LookupDataListFullName: "cmn.Stuffs",
                            LookupEntityCaptionFieldName: "DisplayName",
                            LookupControlType: "Advanced"
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
                            FieldName: "StuffStatus",
                            Title: "وضعیت",
                            ControlType: "Lookup",
                            LookupDataListFullName: "wm.StuffStatusList",
                            LookupEntityCaptionFieldName: "Title",
                            LookupControlType: "Simple"
                        },
                        {
                            FieldName: "BatchNumber",
                            Title: "شماره بچ",
                            ControlType: "TextBox"
                        },
                        {
                            FieldName: "Code",
                            Title: "کد",
                            ControlType: "TextBox"
                        },
                        {
                            FieldName: "Custom_CodeAnbar",
                            Title: "ردیف انبار",
                            ControlType: "TextBox"
                        }]
                });
            that._FilterControl.BindEvent("FilterChanged", function (e) { that._FilterControl_FilterChanged(e); });
            that._FilterControl.BindEvent("GetColumnFilterExpression", function (e) { that._FilterControl_GetColumnFilterExpression(e); });
            
            that.SetParameterNames(["FromDate"]);

            that.LoadData();
        },

        _FilterControl_FilterChanged: function (e) {
            var that = this;

            that.LoadData();
        },

        _FilterControl_GetColumnFilterExpression: function (e) {
            var that = this;

            if (e.ColumnFilterInfo.FieldName == "IssueDate" && e.ColumnFilterInfo.CompareOperator == ">=")
                e.FilterExpression = "";
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

            var fromDate = that._FilterControl.FindControl("IssueDate_IsMoreOrEqual").GetValue();
            that.SetParameterValues([fromDate]);

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

        _DoDestroy: function () {
            var that = this;

            afw.DataListControl.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    StuffsCirculationReportControl.TypeName = typeName;
    StuffsCirculationReportControl.BaseType = baseType;
    StuffsCirculationReportControl.Events = objectEvents;


    wm.StuffsCirculationReportControl = StuffsCirculationReportControl;
})();
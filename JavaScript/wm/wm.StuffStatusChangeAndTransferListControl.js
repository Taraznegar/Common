﻿(function () {
    var typeName = "wm.StuffStatusChangeAndTransferListControl";
    var baseType = afw.DataListControl;
    var objectEvents = afw.DataListControl.Events.concat([]);

    var StuffStatusChangeAndTransferListControl = baseType.extend({
        events: objectEvents,

        GetType: function () {
            return wm.StuffStatusChangeAndTransferListControl;
        },

        init: function (options) {
            var that = this;

            options.DataListFullName = "wm.StuffStatusChangeAndTransferList";
            afw.DataListControl.fn.init.call(that, options);

            var activeFinancialYearEntity = cmn.GetUserActiveFinancialYearEntity();
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
                            FieldName: "OpNumber",
                            Title: "شماره عملیات",
                            ControlType: "TextBox",
                            CompareOperator: "like"
                        },
                        {
                            FieldName: "PrimaryStatus",
                            Title: "وضعیت اولیه",
                            ControlType: "Lookup",
                            LookupDataListFullName: "wm.StuffStatusList",
                            LookupEntityCaptionFieldName: "Title",
                            LookupControlType: "Simple"
                        },
                        {
                            FieldName: "SeconderyStatus",
                            Title: "وضعیت ثانویه",
                            ControlType: "Lookup",
                            LookupDataListFullName: "wm.StuffStatusList",
                            LookupEntityCaptionFieldName: "Title",
                            LookupControlType: "Simple"
                        },
                        {
                            FieldName: "SourceStuffLocation",
                            Title: "انبار مبدا",
                            ControlType: "Lookup",
                            LookupDataListFullName: "cmn.StuffLocations",
                            LookupEntityCaptionFieldName: "Name",
                            LookupControlType: "Simple"
                        },
                        {
                            FieldName: "DestinationStuffLocation",
                            Title: "انبار مقصد",
                            ControlType: "Lookup",
                            LookupDataListFullName: "cmn.StuffLocations",
                            LookupEntityCaptionFieldName: "Name",
                            LookupControlType: "Simple"
                        }]
                });
            that._FilterControl.bind("FilterChanged", function (e) { that._FilterControl_FilterChanged(e); });

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

        _GetTotalFilterExpression: function () {
            var that = this;

            var filterExpression = afw.DataListControl.fn._GetTotalFilterExpression.call(that);

            filterExpression = cmn.AddFilterToFilterExpression(filterExpression, that._FilterControl.GetFilterExpression());
            filterExpression = cmn.AddActiveFinancialYearFilterToFilterExpression(filterExpression);

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

        _DoDestroy: function () {
            var that = this;

            afw.DataListControl.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    StuffStatusChangeAndTransferListControl.TypeName = typeName;
    StuffStatusChangeAndTransferListControl.BaseType = baseType;
    StuffStatusChangeAndTransferListControl.Events = objectEvents;


    wm.StuffStatusChangeAndTransferListControl = StuffStatusChangeAndTransferListControl;
})();


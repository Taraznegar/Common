(function () {
    var typeName = "wm.StuffsSerialNumberListControl";
    var baseType = afw.DataListControl;
    var objectEvents = afw.DataListControl.Events.concat([]);

    var StuffsSerialNumberListControl = baseType.extend({
        events: objectEvents,

        GetType: function () {
            return wm.StuffsSerialNumberListControl;
        },

        init: function (options) {
            var that = this;

            options.DataListFullName = "wm.StuffsSerialNumberList";
            afw.DataListControl.fn.init.call(that, options);

            that._VDockPanel.InsertPane(2, { Size: 100 }, true);

            that._FilterControl = afw.uiApi.CreateSavedFormByName(
                that._VDockPanel.Panes[2],
                "cmn.DataListAdvancedFilterControl", {
                    ColumnsFilterInfo: [
                        {
                            FieldName: "Code",
                            Title: "کد",
                            ControlType: "TextBox"
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
                            FieldName: "GhabzOrHavaleNumber",
                            Title: "شماره قبض/حواله",
                            ControlType: "TextBox",
                            CompareOperator: "like"
                        },
                        {
                            FieldName: "GhabzOrHavaleType",
                            Title: "نوع قبض/حواله",
                            ControlType: "Lookup",
                            LookupDataListFullName: "wm.GhabzOrHavaleTypeList",
                            LookupEntityCaptionFieldName: "Title",
                            LookupControlType: "Advanced",
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
                            FieldName: "RefDocNo",
                            Title: "شماره عملیات مرتبط",
                            ControlType: "TextBox"
                        },
                        {
                            FieldName: "RequestNumber",
                            Title: "شماره درخواست",
                            ControlType: "Numeric"
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
                            FieldName: "FinancialDocType",
                            Title: "نوع سند مالی",
                            ControlType: "OptionSet",
                            OptionSetFullName: "cmn.FinancialDocType",
                            OptionSetValueDataMember: "Name"
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

    StuffsSerialNumberListControl.TypeName = typeName;
    StuffsSerialNumberListControl.BaseType = baseType;
    StuffsSerialNumberListControl.Events = objectEvents;


    wm.StuffsSerialNumberListControl = StuffsSerialNumberListControl;
})();
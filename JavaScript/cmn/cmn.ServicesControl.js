(function () {
    var typeName = "cmn.ServicesControl";
    var baseType = afw.DataListControl;
    var objectEvents = afw.DataListControl.Events.concat([]);

    var ServicesControl = baseType.extend({
        events: objectEvents,

        GetType: function () {
            return cmn.ServicesControl;
        },

        init: function (options) {
            var that = this;

            options.LoadDataOnInit = false;

            options.DataListFullName = "cmn.Services";
            afw.DataListControl.fn.init.call(that, options);

            that._VDockPanel.InsertPane(2, { Size: 100 }, true);

            that._FilterControl = afw.uiApi.CreateSavedFormByName(
                that._VDockPanel.Panes[2],
                "cmn.DataListAdvancedFilterControl", {
                    ColumnsFilterInfo: [
                        {
                            FieldName: "Name",
                            Title: "نام",
                            ControlType: "TextBox",
                            CompareOperator: "like"
                        },
                        {
                            FieldName: "Code",
                            Title: "کد",
                            ControlType: "TextBox"
                        },
                        {
                            FieldName: "MeasurementUnit",
                            Title: "گروه فرعی",
                            ControlType: "Lookup",
                            LookupDataListFullName: "cmn.MeasurementsUnits",
                            LookupEntityCaptionFieldName: "Title",
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

            if (!ValueIsEmpty(that._FilterControl.GetFilterExpression())) {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";

                filterExpression += that._FilterControl.GetFilterExpression();
            }

            if (!ValueIsEmpty(filterExpression))
                filterExpression += " and ";

            filterExpression += String.Format(
                "( \r\n" +
                "   exists( \r\n" +
                "       select 1 \r\n" +
                "       from cmn_ServiceOrganizationUnits \r\n" +
                "       where Service = InnerQuery.ID and {0}) \r\n" +
                "   or not exists(select 1 from cmn_ServiceOrganizationUnits where Service = InnerQuery.ID) \r\n" +
                ")",
                cmn.GetUserActiveOrganizationUnitsFilterExpression());

            return filterExpression;
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

    ServicesControl.TypeName = typeName;
    ServicesControl.BaseType = baseType;
    ServicesControl.Events = objectEvents;


    cmn.ServicesControl = ServicesControl;
})();
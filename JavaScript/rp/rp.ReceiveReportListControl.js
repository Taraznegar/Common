(function () {
    var typeName = "rp.ReceiveReportListControl";
    var baseType = afw.DataListControl;
    var objectEvents = afw.DataListControl.Events.concat([]);

    var ReceiveReportListControl = baseType.extend({
        events: objectEvents,

        GetType: function () {
            return rp.ReceiveReportListControl;
        },

        init: function (options) {
            var that = this;

            options.DataListFullName = "rp.ReceiveReportList";
            afw.DataListControl.fn.init.call(that, options);

            that._ParentForm = options.ReceiveReportForm;
        },
        
        _GetTotalFilterExpression: function () {
            var that = this;

            var filterExpression = afw.DataListControl.fn._GetTotalFilterExpression.call(that);

            if (that._ParentForm != null) {
                var filter = that._ParentForm.GetFilterControlsFilterExpression();

                if (!ValueIsEmpty(filter)) {
                    if (!ValueIsEmpty(filterExpression))
                        filterExpression += " and ";

                    filterExpression += filter;
                }
            }

            return filterExpression;
        },

        _LoadData: function () {
            var that = this;

            afw.DataListControl.fn._LoadData.call(that);

            if (that._ParentForm != null)
                that._ParentForm.CaclulateSummaryFields(that._GetTotalFilterExpression());
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

    ReceiveReportListControl.TypeName = typeName;
    ReceiveReportListControl.BaseType = baseType;
    ReceiveReportListControl.Events = objectEvents;


    rp.ReceiveReportListControl = ReceiveReportListControl;
})();

(function () {
    var typeName = "crm.SalesCaseHistoryControl";
    var baseType = afw.DataListControl;
    var events = afw.DataListControl.Events.concat([]);

    var SalesCaseHistoryControl = baseType.extend({
        events: events,

        GetType: function () {
            return crm.SalesCaseHistoryControl;
        },

        init: function (options) {
            var that = this;

            options.DataListFullName = "crm.SalesCaseHistory";
            afw.DataListControl.fn.init.call(that, options);
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

        _ShowEntityWindow: function (entity, formMode) {
            var that = this;

            afw.DataListControl.fn._ShowEntityWindow.call(that, entity, formMode);
        },

        _OnEntityWindowOpened: function (entityWindow) {
            var that = this;

            afw.DataListControl.fn._OnEntityWindowOpened.call(that, entityWindow);
        },

        _EntitiesGridView_RowDoubleClick: function (e) {
            var that = this;

            //afw.DataListControl.fn._EntitiesGridView_RowDoubleClick.call(that, e);
        }
    });

    //Static Members:

    SalesCaseHistoryControl.TypeName = typeName;
    SalesCaseHistoryControl.BaseType = baseType;
    SalesCaseHistoryControl.Events = events;


    crm.SalesCaseHistoryControl = SalesCaseHistoryControl;
})();
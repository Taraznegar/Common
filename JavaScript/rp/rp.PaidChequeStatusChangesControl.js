﻿(function () {
    var typeName = "rp.PaidChequeStatusChangesControl";
    var baseType = afw.DataListControl;
    var events = afw.DataListControl.Events.concat([]);

    var PaidChequeStatusChangesControl = baseType.extend({
        events: events,

        GetType: function () {
            return rp.PaidChequeStatusChangesControl;
        },

        init: function (options) {
            var that = this;

            options.DataListFullName = "rp.PaidChequeStatusChanges";
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

            //afw.DataListControl.fn._EntitiesGridView_RowDoubleClick.call(that, e);
        }
    });

    //Static Members:

    PaidChequeStatusChangesControl.TypeName = typeName;
    PaidChequeStatusChangesControl.BaseType = baseType;
    PaidChequeStatusChangesControl.Events = events;


    rp.PaidChequeStatusChangesControl = PaidChequeStatusChangesControl;
})();

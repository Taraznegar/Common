(function () {
    var typeName = "wm.ExternalSefareshListControl";
    var baseType = afw.DataListControl;
    var events = afw.DataListControl.Events.concat([]);

    var ExternalSefareshListControl = baseType.extend({
        events: events,

        GetType: function () {
            return wm.ExternalSefareshListControl;
        },

        init: function (options) {
            var that = this;

            options.DataListFullName = "wm.ExternalSefareshList";
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

        _GetTotalFilterExpression: function () {
            var that = this;
        },

        _OnLoadingData: function () {
            var that = this;            

            afw.DataListControl.fn._OnLoadingData.call(that);
        },

        _ShowEntityWindow: function (entity, formMode, options) {
            var that = this;

            var options = {
                SefareshType: "ExternalSefaresh"
            };

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

    ExternalSefareshListControl.TypeName = typeName;
    ExternalSefareshListControl.BaseType = baseType;
    ExternalSefareshListControl.Events = events;


    wm.ExternalSefareshListControl = ExternalSefareshListControl;
})();

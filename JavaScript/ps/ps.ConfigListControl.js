(function () {
    var typeName = "ps.ConfigListControl";
    var baseType = afw.DataListControl;
    var events = afw.DataListControl.Events.concat([]);

    var ConfigListControl = baseType.extend({
        events: events,

        GetType: function () {
            return ps.ConfigListControl;
        },

        init: function (options) {
            var that = this;

            options.DataListFullName = "ps.ConfigList";
            afw.DataListControl.fn.init.call(that, options);
        },

        _CreateToolbar: function () {
            var that = this;

            afw.DataListControl.fn._CreateToolbar.call(that);

            var count = afw.DataListHelper.GetDataListEntityCount("ps.ConfigList");
            if (count > 0)
                that.ToolBar.RemoveButton("New");
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            afw.DataListControl.fn._OnToolbarButtonClicked.call(that, buttonKey);
        },

        _OnLoadingData: function () {
            var that = this;

            afw.DataListControl.fn._OnLoadingData.call(that);
        },

        _ShowEntityWindow: function (entity, formMode, options) {
            var that = this;

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

    ConfigListControl.TypeName = typeName;
    ConfigListControl.BaseType = baseType;
    ConfigListControl.Events = events;


    ps.ConfigListControl = ConfigListControl;
})();

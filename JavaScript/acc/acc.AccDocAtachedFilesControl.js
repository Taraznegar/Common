(function () {
    var typeName = "acc.AccDocAtachedFilesControl";
    var baseType = afw.DataListControl;
    var events = afw.DataListControl.Events.concat([]);

    var AccDocAtachedFilesControl = baseType.extend({
        events: events,

        GetType: function () {
            return acc.AccDocAtachedFilesControl;
        },

        init: function (options) {
            var that = this;

            options.DataListFullName = "acc.AccDocAtachedFiles";
            afw.DataListControl.fn.init.call(that, options);

            if ("AccDocID" in options)
                that._AccDocID = options.AccDocID;
            else
                that._AccDocID = null;
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

        _ShowEntityWindow: function (entity, formMode, options) {
            var that = this;

            if (ValueIsEmpty(options))
                options = {};

            options.AccDocID = that._AccDocID;

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

    AccDocAtachedFilesControl.TypeName = typeName;
    AccDocAtachedFilesControl.BaseType = baseType;
    AccDocAtachedFilesControl.Events = events;


    acc.AccDocAtachedFilesControl = AccDocAtachedFilesControl;
})();

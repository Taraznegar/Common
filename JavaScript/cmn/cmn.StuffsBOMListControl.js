(function () {
    var typeName = "cmn.StuffsBOMListControl";
    var baseType = afw.DataListControl;
    var objectEvents = afw.DataListControl.Events.concat([]);

    var StuffsBOMListControl = baseType.extend({
        events: objectEvents,

        GetType: function () {
            return cmn.StuffsBOMListControl;
        },

        init: function (options) {
            var that = this;

            options.DataListFullName = "cmn.StuffsBOMList";
            afw.DataListControl.fn.init.call(that, options);
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
        
        _OpenEntityWindow: function (entity, formMode, options) {
            var that = this;

            return afw.DataListControl.fn._OpenEntityWindow.call(that, entity, formMode, options);
        },

        _OpenEntityForm: function (entity, formMode, options) {
            var that = this;

            return afw.DataListControl.fn._OpenEntityForm.call(that, entity, formMode, options);
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

    StuffsBOMListControl.TypeName = typeName;
    StuffsBOMListControl.BaseType = baseType;
    StuffsBOMListControl.Events = objectEvents;


    cmn.StuffsBOMListControl = StuffsBOMListControl;
})();


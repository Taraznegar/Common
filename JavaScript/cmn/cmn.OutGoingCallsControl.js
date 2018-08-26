(function () {
    var typeName = "cmn.OutGoingCallsControl";
    var baseType = afw.DataListControl;
    var events = afw.DataListControl.Events.concat([]);

    var OutGoingCallsControl = baseType.extend({
        events: events,

        GetType: function () {
            return cmn.OutGoingCallsControl;
        },

        init: function (options) {
            var that = this;

            options.DataListFullName = "cmn.OutGoingCalls";
            afw.DataListControl.fn.init.call(that, options);
        },

        _CreateToolbar: function () {
            var that = this;

            afw.DataListControl.fn._CreateToolbar.call(that);

            that._Toolbar = that.FindControl(that.GetName() + "_Toolbar");
            that._Toolbar.RemoveButton("New");
            that._Toolbar.RemoveButton("Edit");
            that._Toolbar.RemoveButton("Delete");
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

    OutGoingCallsControl.TypeName = typeName;
    OutGoingCallsControl.BaseType = baseType;
    OutGoingCallsControl.Events = events;


    cmn.OutGoingCallsControl = OutGoingCallsControl;
})();

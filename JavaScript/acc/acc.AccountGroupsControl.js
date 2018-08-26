(function () {
    var typeName = "acc.AccountGroupsControl";
    var baseType = afw.DataListControl;
    var events = afw.DataListControl.Events.concat([]);

    var AccountGroupsControl = baseType.extend({
        events: events,

        GetType: function () {
            return acc.AccountGroupsControl;
        },

        init: function (options) {
            var that = this;

            options.DataListFullName = "acc.AccountGroups";
            afw.DataListControl.fn.init.call(that, options);

            that._IsActiveButtonMenu = false;
            if (that._IsActiveButtonMenu == false) {
                that._Toolbar.RemoveButton("New");
                that._Toolbar.RemoveButton("Edit");
                that._Toolbar.RemoveButton("Delete");
                that._Toolbar.RemoveButton("Reload");
            } 
        },

        _CreateToolbar: function () {
            var that = this;

            afw.DataListControl.fn._CreateToolbar.call(that);

            that._Toolbar = that.FindControl(that.GetName() + "_Toolbar"); 
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

    AccountGroupsControl.TypeName = typeName;
    AccountGroupsControl.BaseType = baseType;
    AccountGroupsControl.Events = events;


    acc.AccountGroupsControl = AccountGroupsControl;
})();

(function () {
    var typeName = "cmn.PersonConnectedPersonsControl";
    var baseType = afw.DataListControl;
    var events = afw.DataListControl.Events.concat([]);

    var PersonConnectedPersonsControl = baseType.extend({
        events: events,

        GetType: function () {
            return cmn.PersonConnectedPersonsControl;
        },

        init: function (options) {
            var that = this;

            options.DataListFullName = "cmn.PersonConnectedPersons";
            afw.DataListControl.fn.init.call(that, options);
        },

        _CreateToolbar: function () {
            var that = this;

            afw.DataListControl.fn._CreateToolbar.call(that);

            if (that.ParentControl.GetType().TypeName == "afw.ComposeEntityListControl") {
                that.Toolbar.AddButton("QuickInsert", "ثبت سریع", { TextColor: "white", BackgroundColor: "#43c35e" });
            }
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            afw.DataListControl.fn._OnToolbarButtonClicked.call(that, buttonKey);

            if (buttonKey == "QuickInsert") {
                var composeListControl = that.ParentControl;
                var parentPersonID = composeListControl.GetParentEntityID();

                var connectedPersonWindow = afw.uiApi.OpenSavedWindow("cmn.ConnectedPersonQuickInsertForm",
                    {
                        Modal: true,
                        ParentPersonID: parentPersonID
                    });

                connectedPersonWindow.bind("Close", function (e) {
                    if (e.Sender.GetDialogResult() == "Ok")
                        that.LoadData();
                });
            }
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

    PersonConnectedPersonsControl.TypeName = typeName;
    PersonConnectedPersonsControl.BaseType = baseType;
    PersonConnectedPersonsControl.Events = events;


    cmn.PersonConnectedPersonsControl = PersonConnectedPersonsControl;
})();

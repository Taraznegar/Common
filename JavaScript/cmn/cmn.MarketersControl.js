(function () {
    var typeName = "cmn.MarketersControl";
    var baseType = afw.DataListControl;
    var events = afw.DataListControl.Events.concat([]);

    var MarketersControl = baseType.extend({
        events: events,

        GetType: function () {
            return cmn.MarketersControl;
        },

        init: function (options) {
            var that = this;

            options.DataListFullName = "cmn.Marketers";
            afw.DataListControl.fn.init.call(that, options);

            that._EntityFormContainerType = "MdiContainer";
        },

        _CreateToolbar: function () {
            var that = this;

            afw.DataListControl.fn._CreateToolbar.call(that);

            that._Toolbar = that.FindControl(that.GetName() + "_Toolbar");
            that._Toolbar.RemoveButton("New");
            that._Toolbar.AddButton("CreateMarketer", "ایجاد بازاریاب", { Image: "resource(cmn.Person)" });
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            if (cmn.OpenWindowExists())
                that._EntityFormContainerType = "Window";
            else
                that._EntityFormContainerType = "MdiContainer";

            afw.DataListControl.fn._OnToolbarButtonClicked.call(that, buttonKey);

            if (buttonKey == "CreateMarketer") {
                var roleName = "Marketer";
                var personEntity = afw.uiApi.CreateNewEntity("cmn.Person"); 

                var marketerWindow = null;

                if (cmn.OpenWindowExists())
                    marketerWindow = afw.EntityHelper.OpenEntityFormInWindow(personEntity, "cmn.PersonEditForm", "New", { RoleName: roleName, Title: "ایجاد بازاریاب" });
                else
                    marketerWindow = afw.EntityHelper.OpenEntityFormInMdiContainer(personEntity, "cmn.PersonEditForm", "New", { RoleName: roleName, Title: "ایجاد بازاریاب" });

                //marketerWindow.SetTitle("ایجاد بازاریاب");

                marketerWindow.bind("Close", function (e) { that._MarketerWindows_Close(e); });
            }
        },

        _MarketerWindows_Close: function (e) {
            var that = this;
            if (e.Sender._DialogResult == "Ok")
                that._LoadData();
        },

        _OnLoadingData: function () {
            var that = this;

            afw.DataListControl.fn._OnLoadingData.call(that);
        },

        _ShowEntityWindow: function (entity, formMode) {
            var that = this;

            return afw.DataListControl.fn._ShowEntityWindow.call(that, entity, formMode);
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

    MarketersControl.TypeName = typeName;
    MarketersControl.BaseType = baseType;
    MarketersControl.Events = events;


    cmn.MarketersControl = MarketersControl;
})();

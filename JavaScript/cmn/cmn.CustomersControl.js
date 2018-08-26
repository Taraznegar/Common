(function () {
    var typeName = "cmn.CustomersControl";
    var baseType = afw.DataListControl;
    var events = afw.DataListControl.Events.concat([]);

    var CustomersControl = baseType.extend({
        events: events,

        GetType: function () {
            return cmn.CustomersControl;
        },

        init: function (options) {
            var that = this;

            options.DataListFullName = "cmn.Customers";
            afw.DataListControl.fn.init.call(that, options);

            that._EntityFormContainerType = "MdiContainer";
        },

        _CreateToolbar: function () {
            var that = this;

            afw.DataListControl.fn._CreateToolbar.call(that);

            that._Toolbar = that.FindControl(that.GetName() + "_Toolbar");
            that._Toolbar.RemoveButton("New");
            that._Toolbar.AddButton("CreateCustomer", "ایجاد مشتری", { Image: "resource(cmn.CustomerIcon)" });
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            if (cmn.OpenWindowExists())
                that._EntityFormContainerType = "Window";
            else
                that._EntityFormContainerType = "MdiContainer";

            afw.DataListControl.fn._OnToolbarButtonClicked.call(that, buttonKey);

            if (buttonKey == "CreateCustomer") { 
                var roleName = "Customer";
                var personEntity = afw.uiApi.CreateNewEntity("cmn.Person");
                //var roleCustomer = afw.uiApi.FetchEntity("cmn.PersonRole", "Name = 'Customer'")
                var customerWindow = null;

                if (cmn.OpenWindowExists())
                    customerWindow = afw.EntityHelper.OpenEntityFormInWindow(personEntity, "cmn.PersonEditForm", "New", { RoleName: roleName, Title: "ایجاد مشتری" });
                else
                    customerWindow = afw.EntityHelper.OpenEntityFormInMdiContainer(personEntity, "cmn.PersonEditForm", "New", { RoleName: roleName, Title: "ایجاد مشتری" });

                customerWindow.bind("Close", function (e) { that._CustomerWindows_Close(e); });
            }
        },

        _CustomerWindows_Close: function (e) {
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

    CustomersControl.TypeName = typeName;
    CustomersControl.BaseType = baseType;
    CustomersControl.Events = events;


    cmn.CustomersControl = CustomersControl;
})();

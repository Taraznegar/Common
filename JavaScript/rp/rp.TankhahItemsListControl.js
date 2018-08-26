(function () {
    var typeName = "rp.TankhahItemsListControl";
    var baseType = afw.DataListControl;
    var events = afw.DataListControl.Events.concat([]);

    var TankhahItemsListControl = baseType.extend({
        events: events,

        GetType: function () {
            return rp.TankhahItemsListControl;
        },

        init: function (options) {
            var that = this;

            options.DataListFullName = "rp.TankhahItemsList";
            afw.DataListControl.fn.init.call(that, options);

            that._ContainerWindow = that.GetContainerWindow();

            if (!ValueIsEmpty(that._ContainerWindow))
                that._TankhahEntity = that._ContainerWindow.GetEntity();
            else if ("TankhahID" in options) {
                that._TankhahEntity = afw.uiApi.FetchEntityByID("rp.Tankhah", options.TankhahID, null);
            }
        },

        _CreateToolbar: function () {
            var that = this;

            afw.DataListControl.fn._CreateToolbar.call(that);
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            if (!ValueIsEmpty(that._ContainerWindow)) {
                if (buttonKey == "New") {

                    if (that._ContainerWindow.Save()) {

                        var tankhahItemEntity = afw.uiApi.CreateNewEntity("rp.TankhahItem");
                        tankhahItemEntity.SetFieldValue("Tankhah", that._TankhahEntity.GetFieldValue("ID"));

                        that.ShowEntityWindow(tankhahItemEntity, "New");
                    }
                }
                else
                    afw.DataListControl.fn._OnToolbarButtonClicked.call(that, buttonKey);
            }
            else
                afw.ErrorDialog.Show("در این بخش مجوز ثبت و حذف وجود ندارد.");
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

            var selectedEntities = that._EntitiesGridView.GetSelectedRows();

            if (selectedEntities.length != 0
                && that._TankhahEntity.ChangeStatus == "Modify"
                && that._TankhahEntity.GetFieldValue("AccDoc") != null) {
                var entityId = selectedEntities[0].DataItem["ID"];
                var tankhahItem = afw.uiApi.FetchEntityByID("rp.TankhahItem", entityId);

                that.ShowEntityWindow(tankhahItem, "Edit", { IsView: true });
            }
            else
                afw.DataListControl.fn._EntitiesGridView_RowDoubleClick.call(that, e);
        }
    });

    //Static Members:

    TankhahItemsListControl.TypeName = typeName;
    TankhahItemsListControl.BaseType = baseType;
    TankhahItemsListControl.Events = events;


    rp.TankhahItemsListControl = TankhahItemsListControl;
})();

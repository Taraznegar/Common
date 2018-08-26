(function () {
    var typeName = "wm.ItemsOfGhabzOrHavaleControl";
    var baseType = afw.DataListControl;
    var events = afw.DataListControl.Events.concat([]);

    var ItemsOfGhabzOrHavaleControl = baseType.extend({
        events: events,

        GetType: function () {
            return wm.ItemsOfGhabzOrHavaleControl;
        },

        init: function (options) {
            var that = this;

            options.Sortable = false;

            options.DataListFullName = "wm.ItemsOfGhabzOrHavale";
            afw.DataListControl.fn.init.call(that, options);

            var userHasPermissionToRialiAmount = afw.PermissionHelper.UserHasPermissionToItem("wm.TaghirMablaghRialiAsnadAnbar");
            that.SetColumnVisible("RialiAmount", userHasPermissionToRialiAmount);

            that._ContainerWindow = that.GetContainerWindow();

            that._EntitiesGridView = that.GetEntitiesGridView();
        },

        _CreateToolbar: function () {
            var that = this;

            afw.DataListControl.fn._CreateToolbar.call(that);

            that._Toolbar = that.FindControl(that.GetName() + "_Toolbar");
            //if (that.GetContainerWindow().FormIsReadOnly()) {
            //    that._Toolbar.RemoveButton("New");
            //    that._Toolbar.RemoveButton("Edit");
            //    that._Toolbar.RemoveButton("Delete");
            //}
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            var ghabzOrHavaleEntity = that._ContainerWindow._BindableEntity.GetEntity();

            if (buttonKey == "New") {
                var rowNo = 0;

                var ghabzOrHavaleItemEntity = afw.uiApi.CreateNewEntity("wm.GhabzOrHavaleItem");
                var ghabzOrHavaleItemEntityList = afw.uiApi.FetchEntityList("wm.GhabzOrHavaleItem",
                    String.Format("GhabzOrHavale = '{0}'", ghabzOrHavaleEntity.GetFieldValue("ID")), "RowNumber");

                if (ghabzOrHavaleItemEntityList.Entities.length > 0) {
                    var len = ghabzOrHavaleItemEntityList.Entities.length;
                    rowNo = ghabzOrHavaleItemEntityList.Entities[len - 1].GetFieldValue("RowNumber");
                }

                ghabzOrHavaleItemEntity.SetFieldValue("GhabzOrHavale", ghabzOrHavaleEntity.GetFieldValue("ID"));
                ghabzOrHavaleItemEntity.SetFieldValue("RowNumber", rowNo + 1);

                that._ContainerWindow.CreateGhabzOrHavaleItemForm(that._ContainerWindow, ghabzOrHavaleItemEntity, "New");
            }
            else if (buttonKey == "Edit") {
                var selectedEntities = that._EntitiesGridView.GetSelectedRows();
                if (selectedEntities.length == 0) {
                    that._ContainerWindow._DataListDockPanel.SetPaneSizeSetting(1, 1);
                    afw.ErrorDialog.Show("ابتدا یک ردیف را انتخاب نمایید.");
                }
                else
                    that._OpenGhabzOrHavaleItemEditForm();
            }
            else
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

        _EntitiesGridView_SelectedRowsChanged: function (e) {
            var that = this;

        },

        _EntitiesGridView_RowDoubleClick: function (e) {
            var that = this;

            //if (that._ContainerWindow.FormIsReadOnly())
            //    return;

            that._OpenGhabzOrHavaleItemEditForm();

            afw.DataListControl.fn._EntitiesGridView_RowDoubleClick.call(that, e);
        },

        _OnDataLoaded: function () {
            var that = this;

            afw.DataListControl.fn._OnDataLoaded.call(that);    
        },

        _EntitiesGridView_RowKeyPressed: function (e) {
            var that = this;

            if (e.Key == "Enter")
                that._OpenGhabzOrHavaleItemEditForm();
        },

        _OpenGhabzOrHavaleItemEditForm: function () {
            var that = this;

            var selectedEntities = that._EntitiesGridView.GetSelectedRows();
           
            var ghabzOrHavaleItemID = selectedEntities[0].DataItem["ID"];
            var ghabzOrHavaleItemEntity = afw.uiApi.FetchEntity("wm.GhabzOrHavaleItem", String.Format("ID = '{0}'", ghabzOrHavaleItemID));

            that._ContainerWindow.CreateGhabzOrHavaleItemForm(that._ContainerWindow, ghabzOrHavaleItemEntity, "Edit");
        }
    });

    //Static Members:

    ItemsOfGhabzOrHavaleControl.TypeName = typeName;
    ItemsOfGhabzOrHavaleControl.BaseType = baseType;
    ItemsOfGhabzOrHavaleControl.Events = events;

    wm.ItemsOfGhabzOrHavaleControl = ItemsOfGhabzOrHavaleControl;
})();
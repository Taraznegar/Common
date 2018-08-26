(function () {
    var typeName = "acc.AccDocOneItemsControl";
    var baseType = afw.DataListControl;
    var events = afw.DataListControl.Events.concat([]);

    var AccDocOneItemsControl = baseType.extend({
        events: events,

        GetType: function () {
            return acc.AccDocOneItemsControl;
        },

        init: function (options) {
            var that = this;

            options.Sortable = false;
            that.ParentControl = options.ParentControl;
            that._AccDocEditForm = that.GetRootContainer().ChildControls[0];

            options.DataListFullName = "acc.AccDocOneItems";
            afw.DataListControl.fn.init.call(that, options);

            that._EntitiesGridView = that.GetEntitiesGridView();
        },

        _CreateToolbar: function () {
            var that = this;

            afw.DataListControl.fn._CreateToolbar.call(that);

            that._Toolbar = that.FindControl(that.GetName() + "_Toolbar");
            if (that._AccDocEditForm.FormIsReadOnly()) {
                that._Toolbar.RemoveButton("New");
                that._Toolbar.RemoveButton("Edit");
                that._Toolbar.RemoveButton("Delete");
            }
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            var accDocEntity = that._AccDocEditForm._BindableEntity.GetEntity();

            if (buttonKey == "New") {
                var rowNo = 0;

                var accDocItemEntity = afw.uiApi.CreateNewEntity("acc.AccDocItem");
                var accDocItemEntityList = afw.uiApi.FetchEntityList("acc.AccDocItem",
                    String.Format("AccDoc = '{0}'", accDocEntity.GetFieldValue("ID")), "RowNo");

                if (accDocItemEntityList.Entities.length > 0) {
                    var len = accDocItemEntityList.Entities.length;
                    rowNo = accDocItemEntityList.Entities[len - 1].GetFieldValue("RowNo");
                }

                accDocItemEntity.SetFieldValue("AccDoc", accDocEntity.GetFieldValue("ID"));
                accDocItemEntity.SetFieldValue("RowNo", rowNo + 1);

                that._AccDocEditForm.CreateAccDocItemForm(that._AccDocEditForm, accDocItemEntity, "New");
            }
            else if (buttonKey == "Edit") {
                var selectedEntities = that._EntitiesGridView.GetSelectedRows();
                if (selectedEntities.length == 0) {
                    that._AccDocEditForm._DataListDockPanel.SetPaneSizeSetting(1, 1);
                    afw.ErrorDialog.Show("ابتدا یک ردیف را انتخاب نمایید.");
                }
                else
                    that._OpenAccDocItemEditForm();
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

            if (that._AccDocEditForm.FormIsReadOnly())
                return;

            that._OpenAccDocItemEditForm();

            afw.DataListControl.fn._EntitiesGridView_RowDoubleClick.call(that, e);
        },

        _OnDataLoaded: function () {
            var that = this;

            afw.DataListControl.fn._OnDataLoaded.call(that);    
        },

        _OpenAccDocItemEditForm: function () {
            var that = this;

            var selectedEntities = that._EntitiesGridView.GetSelectedRows();
           
            var accDocItemID = selectedEntities[0].DataItem["ID"];
            var accDocItemEntity = afw.uiApi.FetchEntity("acc.AccDocItem", String.Format("ID = '{0}'", accDocItemID));

            that._AccDocEditForm.CreateAccDocItemForm(that._AccDocEditForm, accDocItemEntity, "Edit");
        }
    });

    //Static Members:

    AccDocOneItemsControl.TypeName = typeName;
    AccDocOneItemsControl.BaseType = baseType;
    AccDocOneItemsControl.Events = events;

    acc.AccDocOneItemsControl = AccDocOneItemsControl;
})();

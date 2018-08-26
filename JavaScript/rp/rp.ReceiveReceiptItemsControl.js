(function () {
    var typeName = "rp.ReceiveReceiptItemsControl";
    var baseType = afw.DataListControl;
    var events = afw.DataListControl.Events.concat([]);

    var ReceiveReceiptItemsControl = baseType.extend({
        events: events,

        GetType: function () {
            return rp.ReceiveReceiptItemsControl;
        },

        init: function (options) {
            var that = this;

            options.DataListFullName = "rp.ReceiveReceiptItems";           
            afw.DataListControl.fn.init.call(that, options);

            that._ReceiveReceiptEditForm = that.GetRootContainer().ChildControls[0];
            that._ReceiptEntity = that._ReceiveReceiptEditForm._BindableEntity.GetEntity();

        },

        _CreateToolbar: function () {
            var that = this;

            afw.DataListControl.fn._CreateToolbar.call(that);

            that._Toolbar = that.FindControl(that.GetName() + "_Toolbar");

            var receiveReceiptEditForm = that.GetRootContainer().ChildControls[0];

            if (receiveReceiptEditForm.FormIsReadOnly()) {
                that._Toolbar.RemoveButton("New");
                that._Toolbar.RemoveButton("Edit");
                that._Toolbar.RemoveButton("Delete");
            }
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            if (buttonKey == "New") {

                if (that._ReceiveReceiptEditForm.Save()) {

                    var entity = afw.uiApi.CreateNewEntity("rp.ReceiveReceiptItem");
                    entity.SetFieldValue("ReceiveReceipt", that._ReceiptEntity.GetFieldValue("ID"));

                    that.ShowEntityWindow(entity, "New",
                        {
                            ReceiveReceiptItemsDataListControl: that,
                            ReceiptEntity: that._ReceiptEntity
                        });
                }
            }
            else if (buttonKey == "Edit") {
                var selectedEntities = that._EntitiesGridView.GetSelectedRows();
                if (selectedEntities == 0) {
                    afw.ErrorDialog.Show("ابتدا یک سطر را انتخاب نمایید.");
                }
                else {
                    var receiveReceiptItemID = selectedEntities[0].DataItem["ID"];
                    var fetchedEntity = afw.uiApi.FetchEntity("rp.ReceiveReceiptItem", String.Format("ID = '{0}'", receiveReceiptItemID));

                    that.ShowEntityWindow(fetchedEntity, "Edit",
                        {
                            ReceiveReceiptItemsDataListControl: that,
                            ReceiptEntity: that._ReceiptEntity
                        });
                }

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

        _EntitiesGridView_RowDoubleClick: function (e) {
            var that = this;

            var selectedEntities = that._EntitiesGridView.GetSelectedRows();

            if (selectedEntities.length != 0) {
                var receiveReceiptItemID = selectedEntities[0].DataItem["ID"];
                var receiveReceiptItemEntity = afw.uiApi.FetchEntityByID("rp.ReceiveReceiptItem", receiveReceiptItemID);

                var isView = false;
                if (that._ReceiveReceiptEditForm.FormIsReadOnly())
                    isView = true;

                that.ShowEntityWindow(receiveReceiptItemEntity, "Edit",
                    {
                        ReceiveReceiptItemsDataListControl: that,
                        ReceiptEntity: that._ReceiptEntity,
                        IsView: isView
                    });
            }
        }
    });

    //Static Members:

    ReceiveReceiptItemsControl.TypeName = typeName;
    ReceiveReceiptItemsControl.BaseType = baseType;
    ReceiveReceiptItemsControl.Events = events;


    rp.ReceiveReceiptItemsControl = ReceiveReceiptItemsControl;
})();

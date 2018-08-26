(function () {
    var typeName = "rp.PayReceiptItemsControl";
    var baseType = afw.DataListControl;
    var events = afw.DataListControl.Events.concat([]);

    var PayReceiptItemsControl = baseType.extend({
        events: events,

        GetType: function () {
            return rp.PayReceiptItemsControl;
        },

        init: function (options) {
            var that = this;

            options.DataListFullName = "rp.PayReceiptItems";
            afw.DataListControl.fn.init.call(that, options);

            that._PayReceiptEditForm = that.GetRootContainer().ChildControls[0];
            that._ReceiptEntity = that._PayReceiptEditForm._BindableEntity.GetEntity();            
        },

        _CreateToolbar: function () {
            var that = this;

            afw.DataListControl.fn._CreateToolbar.call(that);

            that._Toolbar = that.FindControl(that.GetName() + "_Toolbar");

            var payReceiptEditForm = that.GetRootContainer().ChildControls[0];
            if (payReceiptEditForm.FormIsReadOnly()) {
                that._Toolbar.RemoveButton("New");
                that._Toolbar.RemoveButton("Edit");
                that._Toolbar.RemoveButton("Delete");
            }
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            if (buttonKey == "New") {

                if (that._PayReceiptEditForm.Save()) {

                    var entity = afw.uiApi.CreateNewEntity("rp.PayReceiptItem");
                    entity.SetFieldValue("PayReceipt", that._ReceiptEntity.GetFieldValue("ID"));

                    that.ShowEntityWindow(entity, "New",
                        {
                            PayReceiptItemsDataListControl: that,
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
                    var payReceiptItemID = selectedEntities[0].DataItem["ID"];
                    var fetchedEntity = afw.uiApi.FetchEntity("rp.PayReceiptItem", String.Format("ID = '{0}'", payReceiptItemID));

                    that.ShowEntityWindow(fetchedEntity, "Edit",
                        {
                            PayReceiptItemsDataListControl: that,
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
                var payReceiptItemID = selectedEntities[0].DataItem["ID"];
                var payReceiptItemEntity = afw.uiApi.FetchEntity("rp.PayReceiptItem", String.Format("ID = '{0}'", payReceiptItemID));

                var isView = false;
                if (that._PayReceiptEditForm.FormIsReadOnly())
                    isView = true;

                that.ShowEntityWindow(payReceiptItemEntity, "Edit",
                    {
                        PayReceiptItemsDataListControl: that,
                        ReceiptEntity: that._ReceiptEntity,
                        IsView: isView
                    });
            }
        }
    });

    //Static Members:

    PayReceiptItemsControl.TypeName = typeName;
    PayReceiptItemsControl.BaseType = baseType;
    PayReceiptItemsControl.Events = events;


    rp.PayReceiptItemsControl = PayReceiptItemsControl;
})();

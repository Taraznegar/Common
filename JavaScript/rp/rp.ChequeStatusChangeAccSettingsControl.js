(function () {
    var typeName = "rp.ChequeStatusChangeAccSettingsControl";
    var baseType = afw.DataListControl;
    var events = afw.DataListControl.Events.concat([]);

    var ChequeStatusChangeAccSettingsControl = baseType.extend({
        events: events,

        GetType: function () {
            return rp.ChequeStatusChangeAccSettingsControl;
        },

        init: function (options) {
            var that = this;

            options.DataListFullName = "rp.ChequeStatusChangeAccSettings";
            afw.DataListControl.fn.init.call(that, options);
        },

        _CreateToolbar: function () {
            var that = this;

            afw.DataListControl.fn._CreateToolbar.call(that);
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            var selectedEntities = that._EntitiesGridView.GetSelectedRows();

            if (buttonKey == "Delete") {

                if (selectedEntities.length == 0) {
                    return;
                }

                var id = selectedEntities[0].DataItem["ID"];

                if (that._HasAccDoc(id)) {
                    var confirmDialog = afw.ConfirmDialog.Show("برای این حساب وضعیت سند خورده است ، ادامه می دهید؟");
                    confirmDialog.bind("Close", function () {
                        if (confirmDialog.GetDialogResult() == "Yes") {
                            afw.DataListControl.fn._OnToolbarButtonClicked.call(that, buttonKey);
                        }
                    });
                }
                else
                    afw.DataListControl.fn._OnToolbarButtonClicked.call(that, buttonKey);
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

            afw.DataListControl.fn._EntitiesGridView_RowDoubleClick.call(that, e);
        },

        _HasAccDoc: function (id) {
            var that = this;

            var has = false;

            var entity = afw.uiApi.FetchEntity("rp.ChequeStatusChangeAccSetting", String.Format("ID = '{0}'", id));
            var AccDocItemList = null;
            var chequeTypeName = afw.OptionSetHelper.GetOptionSetItemName(entity.GetFieldValue("ChequeType"));
            switch (chequeTypeName) {
                case "Received": {
                    AccDocItemList = afw.uiApi.FetchEntityList("acc.AccDocItem",
                                                    String.Format("RefOp_ReceivedChequeStatusChange is not null and Account = '{0}'",
                                                    entity.GetFieldValue("AccountInCoding")));
                    break;
                }
                case "Paid": {
                    AccDocItemList = afw.uiApi.FetchEntityList("acc.AccDocItem",
                                                    String.Format("RefOp_PaidChequeStatusChange is not null and Account = '{0}'",
                                                    entity.GetFieldValue("AccountInCoding")));
                    break;
                }
            }

            if (AccDocItemList.Entities.length > 0) {
                has = true;
            }

            return has;
        }

    });

    //Static Members:

    ChequeStatusChangeAccSettingsControl.TypeName = typeName;
    ChequeStatusChangeAccSettingsControl.BaseType = baseType;
    ChequeStatusChangeAccSettingsControl.Events = events;


    rp.ChequeStatusChangeAccSettingsControl = ChequeStatusChangeAccSettingsControl;
})();

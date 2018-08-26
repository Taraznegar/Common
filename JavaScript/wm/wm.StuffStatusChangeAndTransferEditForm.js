(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return wm.StuffStatusChangeAndTransferEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._MainDockPanel = that.FindControl("MainDockPanel");

            that.FetchedStuffs = [];

            that.BatchList = afw.DataListHelper.FetchEntityListOfDataList("wm.BatchList").ToDataSourceData();
            that._StatusEntityList = afw.uiApi.FetchEntityList("wm.StuffStatus", null, "DisplayeOrder").Entities;
            that._FinancialGroupList = afw.uiApi.FetchEntityList("cmn.FinancialGroup").Entities;
            that._StuffStatusChangeAndTransferTypeFieldControl = that.FindControl("StuffStatusChangeAndTransferTypeFieldControl");
            that._StuffStatusChangeAndtransferTypeEntity = null;
            that._ActiveFinancialYearID = cmn.GetUserActiveFinancialYearID();

            that._SourceStuffLocationFieldControl = that.FindControl("SourceStuffLocationFieldControl");
            that._DestinationStuffLocationFieldControl = that.FindControl("DestinationStuffLocationFieldControl");
            that._PrimaryStatusFieldControl = that.FindControl("PrimaryStatusFieldControl");
            that._SeconderyStatusFieldControl = that.FindControl("SeconderyStatusFieldControl");
            that._IssueDateFieldControl = that.FindControl("IssueDateFieldControl");
            that._IssueDateFieldControl.FindControl("InnerControl").SetShowRequiredStar(true)

            that._StuffStatusChangeAndTransferTypeFieldControl.bind("ValueChanged", function (e) {
                that._StuffStatusChangeAndTransferTypeFieldControl_ValueChanged(e);
            });

            that._SourceStuffLocationFieldControl.bind("ValueChanged", function (e) {
                that._SourceStuffLocationFieldControl_ValueChanged(e);
            });

            that._PrimaryStatusFieldControl.bind("ValueChanged", function (e) {
                that._PrimaryStatusFieldControl_ValueChanged(e);
            });

            var itemsEntityList = null;

            var entity = that._BindableEntity.GetEntity();

            if (!entity.FieldExists("StuffStatusChangeAndTransferItems"))
                entity.AddField("StuffStatusChangeAndTransferItems");
            else {
                entity.RemoveField("StuffStatusChangeAndTransferItems");
                entity.AddField("StuffStatusChangeAndTransferItems");
            }

            if (that._FormMode == "New") {
                if (ValueIsEmpty(entity.GetFieldValue("StuffStatusChangeAndTransferItems"))) {
                    itemsEntityList = afw.uiApi.CreateEntityList("wm.StuffStatusChangeAndTransferItem");
                    entity.SetFieldValue("StuffStatusChangeAndTransferItems", itemsEntityList);
                }
                else
                    entity.SetFieldValue("StuffStatusChangeAndTransferItems", itemsEntityList);

                that._SourceStuffLocationFieldControl.SetValue(wm.GetDefaultSourceStuffLocation());

                that._BindableEntity.set("FinancialYear", that._ActiveFinancialYearID);
                entity.SetFieldValue("OpNumber", -1);

                that._AdjustFormValues();
            }
            else {
                if (ValueIsEmpty(entity.GetFieldValue("StuffStatusChangeAndTransferItems"))) {
                    itemsEntityList = afw.uiApi.FetchEntityList("wm.StuffStatusChangeAndTransferItem",
                        String.Format("StuffStatusChangeAndTransfer = '{0}'",
                        that._BindableEntity.get("ID")), "RowNumber", null, null, ["Stuff.StuffDef"]);
                    entity.SetFieldValue("StuffStatusChangeAndTransferItems", itemsEntityList);
                }

                if (that._BindableEntity.get("StuffStatusChangeAndTransferType") != null) {
                    that._StuffStatusChangeAndtransferTypeEntity = afw.uiApi.FetchEntityByID("wm.StuffStatusChangeAndtransferType",
                        that._BindableEntity.get("StuffStatusChangeAndTransferType"));
                }
            }

            that.ItemsEntityList = that._BindableEntity._Entity.GetFieldValue("StuffStatusChangeAndTransferItems");

            that._CreateItemsGridControl(that.ItemsEntityList);

            that._AdjustForm();
        },

        _CreateItemsGridControl: function (itemsEntityList) {
            var that = this;

            that._ItemsGridControl = new wm.StuffStatusChangeAndTransferItemsGridControl({
                ParentControl: that._MainDockPanel.Panes[2],
                Name: "ItemsGridControl",
                StuffStatusChangeAndTransferEditForm: that,
                RowsEntityList: itemsEntityList,
                FillParent: true
            });

            if (itemsEntityList.Entities.length == 0)
                that._ItemsGridControl.AddEmptyItems(1);
            else {
                for (var i = 0; i < itemsEntityList.Entities.length; i++) {
                    that._ItemsGridControl.AddRow(itemsEntityList.Entities[i]);
                }
            }
        },

        _PrimaryStatusFieldControl_ValueChanged: function (e) {
            var that = this;

            that._SeconderyStatusFieldControl.SetValue(that._PrimaryStatusFieldControl.GetValue());

            if (that._ItemsGridControl != null)
                that._ItemsGridControl.SetStockLabelText();
        },

        _StuffStatusChangeAndTransferTypeFieldControl_ValueChanged: function (e) {
            var that = this;

            that._SetBindableEntityFieldsToNull();

            that._StuffStatusChangeAndtransferTypeEntity = null;

            if (!ValueIsEmpty(that._StuffStatusChangeAndTransferTypeFieldControl.GetValue())) {

                that._StuffStatusChangeAndtransferTypeEntity = afw.uiApi.FetchEntityByID("wm.StuffStatusChangeAndtransferType",
                    that._StuffStatusChangeAndTransferTypeFieldControl.GetValue());
            }

            that._AdjustForm();
            that._AdjustFormValues();
        },

        _SourceStuffLocationFieldControl_ValueChanged: function () {
            var that = this;

            if (!ValueIsEmpty(that._StuffStatusChangeAndtransferTypeEntity)
                && !that._StuffStatusChangeAndtransferTypeEntity.GetFieldValue("AllowDestinationWarehouseChange")
                && that._StuffStatusChangeAndtransferTypeEntity.GetFieldValue("DestinationWarehouse") == null) {
                that._DestinationStuffLocationFieldControl.SetValue(that._SourceStuffLocationFieldControl.GetValue());
            }

            if (that._ItemsGridControl != null)
                that._ItemsGridControl.SetStockLabelText();

            wm.SetDefaultSourceStuffLocation(that._SourceStuffLocationFieldControl.GetValue());

            that._AdjustForm();
        },

        _SetBindableEntityFieldsToNull: function () {
            var that = this;

            that._BindableEntity.set("SourceStuffLocation", null);
            that._BindableEntity.set("DestinationStuffLocation", null);
            that._BindableEntity.set("Description", null);
            that._BindableEntity.set("PrimaryStatus", null);
            that._BindableEntity.set("SeconderyStatus", null);
            that._BindableEntity.set("StuffStatusChangeAndTransferItems", null);
        },

        _OnOpening: function (sender, e) {
            var that = this;

            afw.Window.fn._OnOpening.call(that);
        },

        _OnOpened: function (sender, e) {
            var that = this;

            afw.Window.fn._OnOpened.call(that);

            if (that._FormMode == "New") {
                if (that._ActiveFinancialYearID == null) {
                    afw.ErrorDialog.Show("سال مالی فعال تعیین نشده است.");
                    that.Close();
                    return;
                }

                var activeOrgUnitID = cmn.GetUserActiveOrganizationUnitIDs();
                if (activeOrgUnitID.length != 1) {
                    afw.ErrorDialog.Show("واحد سازمانی فعال انتخاب نشده است.");
                    that.Close();
                    return;
                }

                that._BindableEntity.set("OrganizationUnit", activeOrgUnitID[0]);
            }
        },

        _OnClosed: function () {
            var that = this;

            afw.Window.fn._OnClosed.call(that);
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            afw.EntityWindowBase.fn._OnToolbarButtonClicked.call(that, buttonKey);
        },

        _AdjustForm: function () {
            var that = this;

            afw.EntityWindowBase.fn._AdjustForm.call(that);

            if (!ValueIsEmpty(that._StuffStatusChangeAndtransferTypeEntity)) {

                if (that._StuffStatusChangeAndtransferTypeEntity.GetFieldValue("AllowSeconderyStatusChange"))
                    that._SeconderyStatusFieldControl.SetReadOnly(false);
                else
                    that._SeconderyStatusFieldControl.SetReadOnly(true);

                if (that._StuffStatusChangeAndtransferTypeEntity.GetFieldValue("AllowDestinationWarehouseChange"))
                    that._DestinationStuffLocationFieldControl.SetReadOnly(false);
                else
                    that._DestinationStuffLocationFieldControl.SetReadOnly(true);

                if (that._StuffStatusChangeAndtransferTypeEntity.GetFieldValue("SourceWarehouse") != null)
                    that._SourceStuffLocationFieldControl.SetReadOnly(true);
                else
                    that._SourceStuffLocationFieldControl.SetReadOnly(false);
            }
            else {
                that._SeconderyStatusFieldControl.SetReadOnly(false);
                that._DestinationStuffLocationFieldControl.SetReadOnly(false);
                that._SourceStuffLocationFieldControl.SetReadOnly(false);
            }

            if (that._SourceStuffLocationFieldControl.GetValue() != null) {
                if (that._ItemsGridControl != null) {
                    that._ItemsGridControl.SetControlReadOnly("StuffLookupControl", false);
                    that._ItemsGridControl.SetStuffsLookupBaseFilterExpression();
                }
            }
            else {
                if (that._ItemsGridControl != null)
                    that._ItemsGridControl.SetControlReadOnly("StuffLookupControl", true);
            }
        },

        _AdjustFormValues: function () {
            var that = this;

            if (that._FormMode == "New") {
                if (that._StatusEntityList.length != 0)
                    that._PrimaryStatusFieldControl.SetValue(that._StatusEntityList[0].GetFieldValue("ID"));

                if (that._FinancialGroupList.length == 1)
                    that._BindableEntity.set("FinancialGroup", that._FinancialGroupList[0].GetFieldValue("ID"));
            }

            if (!ValueIsEmpty(that._StuffStatusChangeAndtransferTypeEntity)) {
                if (!that._StuffStatusChangeAndtransferTypeEntity.GetFieldValue("AllowDestinationWarehouseChange")
                    && that._StuffStatusChangeAndtransferTypeEntity.GetFieldValue("DestinationWarehouse") != null)
                    that._DestinationStuffLocationFieldControl.SetValue(that._StuffStatusChangeAndtransferTypeEntity.GetFieldValue("DestinationWarehouse"));
                else
                    that._DestinationStuffLocationFieldControl.SetValue(that._StuffStatusChangeAndtransferTypeEntity.GetFieldValue("SourceWarehouse"));

                that._SourceStuffLocationFieldControl.SetValue(that._StuffStatusChangeAndtransferTypeEntity.GetFieldValue("SourceWarehouse"));
            }
            else {
                that._DestinationStuffLocationFieldControl.SetValue(null);
                that._SourceStuffLocationFieldControl.SetValue(null);
            }
        },

        _ValidateForm: function () {
            var that = this;

            if (!afw.EntityWindowBase.fn._ValidateForm.call(that))
                return false;

            if (ValueIsEmpty(that._IssueDateFieldControl.GetValue())) {
                afw.ErrorDialog.Show("زمان صدور وارد نشده است.");
                return false;
            }

            return true;
        },

        GetFormMode: function () {
            var that = this;

            return that._FormMode;
        },

        _Save: function () {
            var that = this;

            var saved = afw.EntityWindowBase.fn._Save.call(that);

            if (saved) {
                for (var i = 0; i < that.ItemsEntityList.Entities.length; i++)
                    that.ItemsEntityList.Entities[i].ChangeStatus = "None";
            }

            return saved;
        }
    });

    //Static Members:

    FormClass.TypeName = "wm.StuffStatusChangeAndTransferEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    wm.StuffStatusChangeAndTransferEditForm = FormClass;
})();
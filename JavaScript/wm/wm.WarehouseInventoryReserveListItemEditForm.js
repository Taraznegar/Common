(function () {
    var objectEvents = afw.EntityWindowBase.Events.concat([]);

    var FormClass = afw.EntityWindowBase.extend({
        events: objectEvents,

        GetType: function () {
            return wm.WarehouseInventoryReserveListItemEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            var entity = that._BindableEntity.GetEntity();

            that._InsertOrganizationUnitComboBox = that.FindControl("InsertOrganizationUnitComboBox");
            that._CreatorUserFieldControl = that.FindControl("CreatorUserFieldControl");
            that._CreationTimeFieldControl = that.FindControl("CreationTimeFieldControl");
            that._Unreserve_RelatedReserveItemFieldControl = that.FindControl("Unreserve_RelatedReserveItemFieldControl");
            that._QuantityFieldControl = that.FindControl("QuantityFieldControl").FindControl("InnerControl");
            that._StuffStatusControl = that.FindControl("StuffStatusFieldControl").FindControl("InnerControl");

            var creatorUserFieldControl = that.FindControl("CreatorUserFieldControl");
            that._StuffFieldControl = that.FindControl("StuffFieldControl").FindControl("InnerControl");

            var organDataSource = cmn.GetUserOrganizationUnitsDataSourceData();
            that._InsertOrganizationUnitComboBox.SetItemsDataSource(organDataSource);

            that._StuffFieldControl.BindEvent("ValueChanged", function (e) { that._CheckHasStock(); });
            that._StuffStatusControl.BindEvent("ValueChanged", function (e) { that._CheckHasStock(); });
            that._QuantityFieldControl.BindEvent("ValueChanged", function (e) { that._CheckHasStock(); });

            creatorUserFieldControl.FindControl("InnerControl").SetHasEntityViewButton(false);
            that._StuffFieldControl.SetHasEntityViewButton(false);
            that._Unreserve_RelatedReserveItemFieldControl.FindControl("InnerControl").SetHasEntityViewButton(false);

            that._CreatorUserFieldControl.SetReadOnly(true);
            that._CreationTimeFieldControl.SetReadOnly(true);
            that._Unreserve_RelatedReserveItemFieldControl.SetReadOnly(true);

            
            var reserveTypeID = afw.OptionSetHelper.GetOptionSetItemID("wm.WarehouseInventoryReserveListItemType.Reserve");
            
            if (that._FormMode == "New") {
                that._CreatorUserFieldControl.SetVisible(false);
                that._CreationTimeFieldControl.SetVisible(false);

                if (ValueIsEmpty(that._BindableEntity.get("ReserveOrUnreserve")))
                    that._BindableEntity.set("ReserveOrUnreserve", reserveTypeID);

                if (entity.GetFieldValue("ReserveOrUnreserve") == reserveTypeID) {
                    var activeOrgUnitID = cmn.GetUserActiveOrganizationUnitIDs();
                    if (activeOrgUnitID.length == 1) {
                        that._BindableEntity.set("InsertOrganizationUnit", activeOrgUnitID[0]);
                    }
                    else
                        that._BindableEntity.set("InsertOrganizationUnit", organDataSource[1].ID);

                    that._StuffStatusControl.SetValue(
                        afw.DataListHelper.FetchEntityListOfDataList("wm.StuffStatusList",
                            null, null, null, "DisplayeOrder", 1, 1).Entities[0].GetFieldValue("ID"));                    
                }
            }

            if (entity.GetFieldValue("ReserveOrUnreserve") != reserveTypeID) {
                that._Unreserve_RelatedReserveItemFieldControl.SetVisible(true);
                that._QuantityFieldControl.SetLabelText("تعداد برگشت از رزرو");
                that._StuffFieldControl.SetReadOnly(true);
                that._InsertOrganizationUnitComboBox.SetReadOnly(true);
                that._StuffStatusControl.SetReadOnly(true);
            }
            else {
                that._Unreserve_RelatedReserveItemFieldControl.SetVisible(false);
                that._QuantityFieldControl.SetLabelText("تعداد رزرو شده");
            }

        },

        _QuantityFieldControl_ValueChanged: function (e) {
            var that = this;

            that._CheckHasStock();

        },

        _CheckHasStock: function () {
            var that = this;
            
            if(ValueIsEmpty(that._StuffFieldControl.GetValue())){
                that._StuffFieldControl.Focus();
                return;
            }

            if ( that._GetStuffStatusDataSourceCount() > 1 && ValueIsEmpty(that._StuffStatusControl.GetValue())){
                that._StuffStatusControl.Focus();
                return;
            }

            afw.uiApi.ShowProgress(that);
            afw.uiApi.CallServerMethodAsync("wm.GetUnreservedStuffStock",
                [that._StuffFieldControl.GetValue(), that._StuffStatusControl.GetValue(), that._BindableEntity.get("ID")],
                function (result) {
                    if (that._IsDestroying)
                        return;

                    afw.uiApi.HideProgress(that);
                    if (result.HasError)
                        afw.ErrorDialog.Show(result.ErrorMessage);
                    else {
                        if (result.Value == 0) {
                            afw.ErrorDialog.Show("موجودی کالا 0 است.");
                            return;
                        }
                        else if (!ValueIsEmpty(that._QuantityFieldControl.GetValue()) && result.Value - that._QuantityFieldControl.GetValue() < 0) {
                            afw.ErrorDialog.Show(String.Format("موجودی کالا برای رزرو کافی نیست. تعداد کالای قابل رزرو : {0}", result.Value));
                            return;
                        }
                    }});
        },

        _OnOpening: function () {
            var that = this;

            afw.EntityWindowBase.fn._OnOpening.call(that);
        },

        _OnOpened: function () {
            var that = this;

            afw.EntityWindowBase.fn._OnOpened.call(that);
        },

        _OnClosed: function () {
            var that = this;

            afw.EntityWindowBase.fn._OnClosed.call(that);
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            afw.EntityWindowBase.fn._OnToolbarButtonClicked.call(that, buttonKey);
        },

        _AdjustForm: function () {
            var that = this;

            afw.EntityWindowBase.fn._AdjustForm.call(that);
        },

        _ValidateForm: function () {
            var that = this;

           
            if ( that._GetStuffStatusDataSourceCount() > 1 && ValueIsEmpty(that._StuffStatusControl.GetValue()))
            {
                afw.ErrorDialog.Show("وضعیت کالا را انتخاب نمایید.");
                return false;
            }

            if (!afw.EntityWindowBase.fn._ValidateForm.call(that))
                return false;

            return true;
        },

        _GetStuffStatusDataSourceCount: function(e){
            var that = this;

            return that._StuffStatusControl.GetDropDownList().GetItemsDataSource()._data.length;
        },

        _Save: function () {
            var that = this;
            
            if (that._ValidateForm()) {
                var saved = afw.EntityWindowBase.fn._Save.call(that);

                return saved;
            }
            return false;
        },

        _OnPreviewKeyUp: function (e) {
            var that = this;

            afw.EntityWindowBase.fn._OnPreviewKeyUp.call(that, e);
        },

        _DoDestroy: function () {
            var that = this;

            afw.EntityWindowBase.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "wm.WarehouseInventoryReserveListItemEditForm";
    FormClass.BaseType = afw.EntityWindowBase;
    FormClass.Events = objectEvents;

    wm.WarehouseInventoryReserveListItemEditForm = FormClass;
})();
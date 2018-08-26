(function () {
    var FormClass = afw.EntityFormBase.extend({
        GetType: function () {
            return rp.PayReceiptEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityFormBase.fn.init.call(that, options);

            that._ReceiptNumberFieldControl = that.FindControl("ReceiptNumberFieldControl");
            that._FinancialDocTypeFieldControl = that.FindControl("FinancialDocTypeFieldControl").FindControl("InnerControl");
            that._FinancialDocTypeDropDownList = that._FinancialDocTypeFieldControl.FindControl("InnerControl_DropDownList");
            that._DescriptionFieldControl = that.FindControl("DescriptionFieldControl");
            that._DateFieldControl = that.FindControl("DateFieldControl");
            that._TotalAmountFieldControl = that.FindControl("TotalAmountFieldControl");
            that._PayeeFieldControl = that.FindControl("PayeeFieldControl");
            that._PayeeFieldControl_InnerControl = that._PayeeFieldControl.FindControl("InnerControl");
            that._PayeeFieldControl_InnerControl.SetBaseFilterExpression("isnull(FinancialAccountCode, '') <> '' ");
            that._PayeeFieldControl_AutoComplete = that._PayeeFieldControl.FindControl("InnerControl").GetAutoComplete();
            that._PayeeFieldControl_BrowseButton = that._PayeeFieldControl.FindControl("InnerControl").FindControl("BrowseButton");

            that._PayeeFieldControl_AutoComplete.bind("KeyPressed", function (e) { that._PayeeFieldControl_AutoComplete_KeyPressed(e); });

            that._FinancialDocTypeDropDownList.bind("ValueChanged", function (e) { that._FinancialDocTypeDropDownList_ValueChanged(); });

            that._TotalAmountFieldControl.SetReadOnly(true);

            var toolBar = that.FindControl("ToolBar");
            toolBar.RemoveButton("Save");
            toolBar.RemoveButton("SaveAndClose");

            if (!that.FormIsReadOnly())
                toolBar.AddButton("FinalSave", "ثبت نهایی");

            that._TabControl1 = that.FindControl("TabControl1");
            that._TabControl1.SelectTabByIndex(0);

            that._ActiveFinancialYearID = cmn.GetUserActiveFinancialYearID();

            if (that._FormMode == "New") {

                that._DateFieldControl.SetValue(afw.DateTimeHelper.GetServerDateTime());
                that._TotalAmountFieldControl.SetValue(0);

                var filter = String.Format("FinancialYear = '{0}'", that._ActiveFinancialYearID);
                var lastReceiptNumber = afw.uiApi.CallServerMethodSync("cmn.GetFieldMaxIntValue", ["ReceiptNumber", "rp_PayReceipts", filter]);
                that._ReceiptNumberFieldControl.SetValue(lastReceiptNumber + 1);

                that._BindableEntity.set("FinancialYear", that._ActiveFinancialYearID);
            }
        },

        _PayeeFieldControl_AutoComplete_KeyPressed: function (e) {
            var that = this;

            if (e.Key == "Enter") {
                that._PayeeFieldControl_BrowseButton.Focus();
            }
        },

        _FinancialDocTypeDropDownList_ValueChanged: function (e) {
            var that = this;

            if (ValueIsEmpty(that._FinancialDocTypeDropDownList.GetValue()))
                return;

            try {
                var financialGroupEntity = cmn.GetFinancialGroupEntity(that._BindableEntity.get("OrganizationUnit"),
                    that._BindableEntity.get("FinancialYear"), that._BindableEntity.get("FinancialDocType"));
                if (financialGroupEntity != null)
                    that._BindableEntity.set("FinancialGroup", financialGroupEntity.GetFieldValue("ID"));
                else
                    that._BindableEntity.set("FinancialGroup", null);
            }
            catch (ex) {
                that._BindableEntity.set("FinancialDocType", null);
                afw.ErrorDialog.Show(ex);
            }
        },

        FormIsReadOnly: function () {
            var that = this;

            if (that._BindableEntity.get("AccDoc") == null)
                return false;

            var finalDoc = afw.uiApi.FetchEntity("acc.accDoc", String.Format("ID = '{0}' and FinalNumber is not null", that._BindableEntity.get("AccDoc")));
            if (finalDoc != null)
                return true;
            else
                return false;
        },

        _OnOpened: function (sender, e) {
            var that = this;

            afw.EntityFormBase.fn._OnOpened.call(that);

            that._ItemsDataListControl = that.FindControl("ItemsFieldControl").FindControl("InnerControl").FindControl("DataListControl");
            that._ItemsDataListControl.bind("DataLoaded", function (e) { that._ItemsDataListControl_DataLoaded(e); });
            that._ItemsDataListControl.bind("EntityWindowOpened", function (e) { that._ItemsDataListControl_EntityWindowOpened(e); });

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

                setTimeout(
                    function () {
                        that._PayeeFieldControl_AutoComplete.Focus();
                    }, 800);
            }
            else {
                var data = that._ItemsDataListControl.GetEntitiesGridView().GetDataSource().data();
                if (data.length > 0) {
                    setTimeout(
                    function () {
                        that._PayeeFieldControl.SetReadOnly(true);
                    }, 500);
                }
            }
        },

        _OnClosed: function () {
            var that = this;

            //بررسی صفر نبودن مبلغ کل
            var entity = afw.uiApi.FetchEntityByID("rp.PayReceipt", that._BindableEntity.get("ID"));
            if (entity != null && entity.GetFieldValue("TotalAmount") == 0) {
                afw.uiApi.DeleteEntity(entity);
                that.SetDialogResult("Ok");
            }
            else {
                if (!ValueIsEmpty(that._BindableEntity.get("AccDoc"))) {
                    try {
                        afw.uiApi.CallServerMethodSync("rp.UpdatePayReceiptAccDocItems", [that._BindableEntity.get("ID")]);
                        that.SetDialogResult("Ok");
                    }
                    catch (ex) {
                        afw.ErrorDialog.Show("مشکل در بروزرسانی سند حسابداری" + ex.ErrorDetails);
                    }
                }
            }

            afw.EntityFormBase.fn._OnClosed.call(that);
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            afw.EntityFormBase.fn._OnToolbarButtonClicked.call(that, buttonKey);

            if (buttonKey == "FinalSave") {

                //بررسی صفر نبودن مبلغ کل
                if (that._BindableEntity.get("TotalAmount") == 0) {
                    afw.ErrorDialog.Show("مبلغ کل نباید صفر باشد");
                }
                else
                    if (that._ValidateForm()) {
                        try {
                            afw.uiApi.CallServerMethodSync("rp.FinalSavePayReceipt", [that._BindableEntity.GetEntity()]);
                            that.SetDialogResult("Ok");
                            that.Close();
                        }
                        catch (ex) {
                            afw.ErrorDialog.Show("ثبت نهایی انجام نشد" + ex.ErrorDetails);
                        }
                    }
            }
        },

        _ItemsDataListControl_DataLoaded: function (e) {
            var that = this;

            var payReceiptID = that._BindableEntity.get("ID");
            var fetchedPayReceipt = afw.uiApi.FetchEntity("rp.PayReceipt", String.Format("ID = '{0}'", payReceiptID));
            if (fetchedPayReceipt != null)
                that._BindableEntity.set("TotalAmount", fetchedPayReceipt.GetFieldValue("TotalAmount"));

            var data = that._ItemsDataListControl.GetEntitiesGridView().GetDataSource().data();
            if (data.length > 0) {
                that._PayeeFieldControl.SetReadOnly(true);
            }
            else
                that._PayeeFieldControl.SetReadOnly(false);

        },

        _ItemsDataListControl_EntityWindowOpened: function (e) {
            var that = this;

        },

        _AdjustForm: function () {
            var that = this;

            afw.EntityFormBase.fn._AdjustForm.call(that);

            if (that.FormIsReadOnly()) {
                that._ReceiptNumberFieldControl.SetReadOnly(true);
                that._DateFieldControl.SetReadOnly(true);
                that._PayeeFieldControl.SetReadOnly(true);
                that._FinancialDocTypeDropDownList.SetReadOnly(true);
                that._DescriptionFieldControl.SetReadOnly(true);
                that.EntityFormBaseVDockPanel1.Panes[0].SetSizeSetting(1, 1);
            }
        },

        _ValidateForm: function () {
            var that = this;

            if (!afw.EntityFormBase.fn._ValidateForm.call(that))
                return false;

            return true;
        },

        _Save: function () {
            var that = this;

            var saved = afw.EntityFormBase.fn._Save.call(that);

            return saved;
        },

        Save: function () {
            var that = this;

            return that._Save();
        },

        GetEntity: function () {
            var that = this;

            return that._BindableEntity._Entity;
        }

    });

    //Static Members:

    FormClass.TypeName = "rp.PayReceiptEditForm";
    FormClass.BaseType = afw.EntityFormBase;


    rp.PayReceiptEditForm = FormClass;
})();
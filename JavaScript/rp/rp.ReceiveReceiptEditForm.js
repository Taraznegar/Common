(function () {
    var FormClass = afw.EntityFormBase.extend({
        GetType: function () {
            return rp.ReceiveReceiptEditForm;
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
            that._PayerFieldControl = that.FindControl("PayerFieldControl");
            that._PayerFieldControl_InnerControl = that._PayerFieldControl.FindControl("InnerControl");
            that._PayerFieldControl_InnerControl.SetBaseFilterExpression("isnull(FinancialAccountCode, '') <> '' ");
            that._PayerFieldControl_AutoComplete = that._PayerFieldControl.FindControl("InnerControl").GetAutoComplete();
            that._PayerFieldControl_BrowseButton = that._PayerFieldControl.FindControl("InnerControl").FindControl("BrowseButton");

            that._PayerFieldControl_AutoComplete.bind("KeyPressed", function (e) { that._PayerFieldControl_AutoComplete_KeyPressed(e); });
            that._PayerFieldControl.bind("ValueChanged", function (e) { that._PayerFieldControl_ValueChanged(e); });

            that._FinancialDocTypeDropDownList.bind("ValueChanged", function (e) { that._FinancialDocTypeDropDownList_ValueChanged(); });

            var toolBar = that.FindControl("ToolBar");
            toolBar.RemoveButton("Save");
            toolBar.RemoveButton("SaveAndClose");

            if (!that.FormIsReadOnly())
                toolBar.AddButton("FinalSave", "ثبت نهایی");

            that._TotalAmountFieldControl.SetReadOnly(true);

            that._TabControl1 = that.FindControl("TabControl1");
            that._TabControl1.SelectTabByIndex(0);

            that._ActiveFinancialYearID = cmn.GetUserActiveFinancialYearID();

            if (that._FormMode == "New") {

                that._DateFieldControl.SetValue(afw.DateTimeHelper.GetServerDateTime());
                that._TotalAmountFieldControl.SetValue(0);

                var filter = String.Format("FinancialYear = '{0}'", that._ActiveFinancialYearID);
                var lastReceiptNumber = afw.uiApi.CallServerMethodSync("cmn.GetFieldMaxIntValue", ["ReceiptNumber", "rp_ReceiveReceipts", filter]);
                that._ReceiptNumberFieldControl.SetValue(lastReceiptNumber + 1);

                that._BindableEntity.set("FinancialYear", that._ActiveFinancialYearID);
            }
        },

        _PayerFieldControl_ValueChanged: function (e) {
            var that = this;

            var payerID = that._PayerFieldControl.GetValue();
            if (payerID != null) {
                that._PayerFieldControl_BrowseButton.Focus();
            }
        },

        FormIsReadOnly: function () {
            var that = this;

            if (that._BindableEntity.get("AccDoc") == null)
                return false;

            var accDoc = afw.uiApi.FetchEntity("acc.accDoc", String.Format("ID = '{0}' and FinalNumber is not null", that._BindableEntity.get("AccDoc")));
            if (accDoc != null)
                return true;
            else
                return false;
        },

        _PayerFieldControl_AutoComplete_KeyPressed: function (e) {
            var that = this;

            if (e.Key == "Enter") {
                that._PayerFieldControl_BrowseButton.Focus();
            }
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
                        that._PayerFieldControl_AutoComplete.Focus();
                    }, 800);
            }
            else {
                var data = that._ItemsDataListControl.GetEntitiesGridView().GetDataSource().data();
                if (data.length > 0) {

                    setTimeout(
                    function () {
                        that._PayerFieldControl.SetReadOnly(true);
                    }, 500);
                }
            }
        },

        _OnClosed: function () {
            var that = this;

            //بررسی صفر نبودن مبلغ کل
            var entity = afw.uiApi.FetchEntityByID("rp.ReceiveReceipt", that._BindableEntity.get("ID"));
            if (entity != null && entity.GetFieldValue("TotalAmount") == 0) {
                afw.uiApi.DeleteEntity(entity);
                that.SetDialogResult("Ok");
            }
            else {
                if (!ValueIsEmpty(that._BindableEntity.get("AccDoc"))) {
                    try {
                        var accDoc = afw.uiApi.FetchEntityByID("acc.AccDoc", that._BindableEntity.get("AccDoc"));
                        if (accDoc.GetFieldValue("FinalNumber") == null)
                            afw.uiApi.CallServerMethodSync("rp.UpdateReceiveReceiptAccDocItems", [that._BindableEntity.get("ID")]);

                        that.SetDialogResult("Ok");
                    }
                    catch (ex) {
                        afw.ErrorDialog.Show("خطا در بروزرسانی سند حسابداری\r\n" + ex.ErrorDetails);
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
                else if (that._ValidateForm()) {
                    try {
                        afw.uiApi.CallServerMethodSync("rp.FinalSaveReceiveReceipt", [that._BindableEntity.GetEntity()]);
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

            var receiveReceiptID = that._BindableEntity.get("ID");
            var fetchedReceiveReceipt = afw.uiApi.FetchEntity("rp.ReceiveReceipt", String.Format("ID = '{0}'", receiveReceiptID));
            if (fetchedReceiveReceipt != null)
                that._BindableEntity.set("TotalAmount", fetchedReceiveReceipt.GetFieldValue("TotalAmount"));

            var data = that._ItemsDataListControl.GetEntitiesGridView().GetDataSource().data();
            if (data.length > 0) {
                that._PayerFieldControl.SetReadOnly(true);
            }
            else
                that._PayerFieldControl.SetReadOnly(false);
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

        _AdjustForm: function () {
            var that = this;

            afw.EntityFormBase.fn._AdjustForm.call(that);

            if (that.FormIsReadOnly()) {
                that._ReceiptNumberFieldControl.SetReadOnly(true);
                that._DateFieldControl.SetReadOnly(true);
                that._PayerFieldControl.SetReadOnly(true);
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

        _ItemsDataListControl_EntityWindowOpened: function (e) {
            var that = this;

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

    FormClass.TypeName = "rp.ReceiveReceiptEditForm";
    FormClass.BaseType = afw.EntityFormBase;


    rp.ReceiveReceiptEditForm = FormClass;
})();
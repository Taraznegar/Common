(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return rp.PayReceiptItemEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._UserActiveFinancialYearID = cmn.GetUserActiveFinancialYearID();

            that._IsInit = true;

            that._SelectFromAccAccountID = '00000000-0000-0000-0000-000000000000';

            that._InnerItemEntity = null;
            that._IsInOnOpened = false;

            that._PayTypeFieldControl = that.FindControl("PayTypeFieldControl")/*.FindControl("InnerControl")*/;
            that._PayTypeDropDownList = that._PayTypeFieldControl.FindControl("InnerControl").GetDropDownList();
            that._PayTypeDropDownList.bind("KeyPressed", function (e) { that._Control_KeyPressed(e); });

            that._DebtorAccountFieldControl = that.FindControl("DebtorAccountFieldControl");
            that._DebtorAccountLookupControl = that._DebtorAccountFieldControl.FindControl("InnerControl");
            that._CreditorAccountFieldControl = that.FindControl("CreditorAccountFieldControl");
            that._CreditorAccountLookupControl = that._CreditorAccountFieldControl.FindControl("InnerControl");
            that._MainDockPanel = that.FindControl("MainDockPanel");
            that._DebtorAccountPanel = that.FindControl("DebtorAccountPanel");

            that._DebtorAccountFloatSelectionControl = afw.uiApi.CreateSavedControl("acc.FloatAccountsSelectionControl", {
                ParentControl: that._DebtorAccountPanel,
                Name: "DebtorAccountFloatSelectionControl",
                BindableEntity: that._BindableEntity,
                PersonFieldName: null,
                CostCenterFieldName: "Debtor_CostCenter",
                ProjectFieldName: "Debtor_Project",
                ForeignCurrencyFieldName: null,
                Visible: false
            });

            that._ItemFormContainerPanel = that.FindControl("ItemFormContainerPanel");

            that._FinancialOpKindDropDownList = that.FindControl("FinancialOpKindDropDownList");
            that._FinancialOpKindDropDownList.bind("KeyPressed", function (e) { that._FinancialOpKindDropDownList_KeyPressed(e); });
            that._FinancialOpKindDropDownList.bind("ValueChanged", function (e) { that._FinancialOpKindDropDownList_ValueChanged(e); });
            that._FinancialOpKindDropDownList.SetShowRequiredStar(true);

            that._DebtorAccountFieldControl.bind("ValueChanged", function (e) { that._DebtorAccountFieldControl_ValueChanged(e); });
            that._CreditorAccountFieldControl.bind("ValueChanged", function (e) { that._CreditorAccountFieldControl_ValueChanged(e); });
            that._DebtorAccountFieldControl.bind("OpeningLookup", function (e) { that._AccountslookupControl_OpeningLookup(e); });
            that._CreditorAccountFieldControl.bind("OpeningLookup", function (e) { that._AccountslookupControl_OpeningLookup(e); });

            that._CopiedPayeeID = options.CopiedPayeeID;
            that._PayReceiptItemsDataListControl = options.PayReceiptItemsDataListControl;
            that._ReceiptEntity = options.ReceiptEntity;
            that._ReceiptPayee = (options.ReceiptEntity).GetFieldValue("Payee");
            that._PayReceipt_FinancialYear = (options.ReceiptEntity).GetFieldValue("FinancialYear");

            that._DebtorAccountLookupControl.SetBaseFilterExpression(String.Format("FinancialYear = '{0}'", that._PayReceipt_FinancialYear));
            that._CreditorAccountLookupControl.SetBaseFilterExpression(String.Format("FinancialYear = '{0}'", that._PayReceipt_FinancialYear));

            that._PayTypeFieldControl.bind("ValueChanged", function (e) { that._PayTypeFieldControl_ValueChanged(e); });

            that._BindableEntity._Entity.AddField("InnerItem");

            that._FormHasUnsavedChanges = true;

            var toolBar = that.FindControl("ToolBar");
            toolBar.RemoveButton("Save");
            toolBar.AddButton("SaveAndNew", "ثبت و جدید");

            that._DefaultPayTypeID = rp.GetPayTypeID("Cheque");

            that._PayTypeFieldControlPreviousValue = null;//برای تکرار نشدن انجام عملیات رخداد  

            if (that._FormMode == "New") {
                that._PayTypeFieldControl.SetValue(that._DefaultPayTypeID);

            }
            else {
                var entityFullName = "";
                var payTypeName = that._GetPayTypeName();
                var fieldName = "";
                switch (payTypeName) {
                    case "Cheque":
                        entityFullName = "rp.PaidCheque";
                        fieldName = "FinancialItem_Cheque";
                        break;
                    case "Havale":
                        entityFullName = "rp.HavalePardakhti";
                        fieldName = "FinancialItem_Havale";
                        break;
                    case "Naghd":
                        entityFullName = "rp.NaghdePardakhti";
                        fieldName = "FinancialItem_Naghd";
                        break;
                    case "ChekeZemanat":
                        entityFullName = "rp.ChekeZemanatePardakhti";
                        fieldName = "FinancialItem_ChekeZemanat";
                        break;
                }

                that._InnerItemEntity = afw.uiApi.FetchEntity(entityFullName, String.Format("ID = '{0}'", that._BindableEntity.get(fieldName)));
                that._BindableEntity._Entity.SetFieldValue("InnerItem", that._InnerItemEntity);

                that._PayTypeFieldControl.SetReadOnly(true);

                that._CreateItemControl(payTypeName);

                var financialOpKindID = that._BindableEntity.get("FinancialOpKind");
                that._SetFinancialOpKindItems();
                if (financialOpKindID != null)
                    that._FinancialOpKindDropDownList.SetValue(financialOpKindID);
                else
                    that._FinancialOpKindDropDownList.SetValue(that._SelectFromAccAccountID);

            }
            that._IsInit = false;
        },

        _AccountslookupControl_OpeningLookup: function (e) {
            var that = this;

            e.Sender.SetLookupDataListControlCustomOptions({ FinancialYear: that._PayReceipt_FinancialYear });
        },

        _Control_KeyPressed: function (e) {
            var that = this;

            if (e.Key == "Enter") {

                if (e.Sender == that._PayTypeDropDownList)
                    that._FinancialOpKindDropDownList.Focus();

                else if (e.Sender == that._FinancialOpKindDropDownList) {
                    var control = that._ItemFormContainerPanel.FindControl("ItemEditForm");
                    if (control != null)
                        control.SetFocus();

                }

            }
        },

        _ResetForm: function () {
            var that = this;

            var payTypeID = that._PayTypeFieldControl.GetValue();

            if (payTypeID == that._PayTypeFieldControlPreviousValue)
                return;

            if (ValueIsEmpty(payTypeID)) {
                that._PayTypeFieldControl.SetValue(that._DefaultPayTypeID);
                return;
            }

            that._PayTypeValueChanged();

            that._PayTypeFieldControlPreviousValue = payTypeID;
        },

        _PayTypeFieldControl_ValueChanged: function (e) {
            var that = this;

            that._ResetForm();
        },

        _FinancialOpKindDropDownList_ValueChanged: function (e) {
            var that = this;

            //that._ResetForm();

            if (that._FormMode == "New" || !that._IsInit) {
                that._BindableEntity.set("DebtorAccount", null);
                that._BindableEntity.set("CreditorAccount", null);

                var itemFromContainerPanel = that._ItemFormContainerPanel.FindControl("ItemEditForm");
                that._ItemFormContainerPanel.SetEnabled(false);
                itemFromContainerPanel.SetBindableEntityFieldsToNull();

                if (!ValueIsEmpty(that._FinancialOpKindDropDownList.GetValue())) {
                    that._ItemFormContainerPanel.SetEnabled(true);
                    if (that._FinancialOpKindDropDownList.GetValue() != that._SelectFromAccAccountID)
                        that._SetAccountsLookupControlValue();
                }

                if (that._ReceiptPayee == null) {
                    var control = that._ItemFormContainerPanel.FindControl("ItemEditForm");
                    if (control == null)
                        return;

                    if (that._BindableEntity.get("DebtorAccount") == null) {
                        control.SetPayeeReadonly();
                        control.SetPayee(null);
                    }
                    that._SetItemPersonFilter();
                }
                that._AdjustForm();
            }
        },

        _DebtorAccountFieldControl_ValueChanged: function (e) {
            var that = this;

            if (!ValueIsEmpty(that._DebtorAccountFieldControl.GetValue()))
                if (!acc.AccountHasFloat(that._DebtorAccountFieldControl.GetValue(), "Person")) {
                    that._DebtorAccountFieldControl.SetValue(null);
                    afw.ErrorDialog.Show("حساب بدهکار انتخاب شده باید دارای شناور شخص باشد");
                }

            if (that._ReceiptPayee == null) {
                var control = that._ItemFormContainerPanel.FindControl("ItemEditForm");
                if (control == null)
                    return;

                if (!that._IsInOnOpened)
                    control.SetPayee(null);

                if (that._BindableEntity.get("DebtorAccount") == null)
                    control.SetPayeeReadonly();
                else
                    control.FindControl("PayeeFieldControl").SetReadOnly(false);
            }

            that._SetItemPersonFilter();
            that._AdjustFloatAccountsSelectionControl();
        },

        _CreditorAccountFieldControl_ValueChanged: function (e) {
            var that = this;

            var payTypeName = that._GetPayTypeName();
            if (!ValueIsEmpty(that._CreditorAccountFieldControl.GetValue()) && payTypeName != "Naghd")
                if (acc.AccountHasFloat(that._CreditorAccountFieldControl.GetValue(), null)) {
                    that._CreditorAccountFieldControl.SetValue(null);
                    afw.ErrorDialog.Show("امکان انتخاب حساب بستانکار دارای شناور در عملیات پرداخت وجود ندارد");
                }
        },

        _AdjustFloatAccountsSelectionControl: function () {
            var that = this;

            var debtorAccountID = that._DebtorAccountFieldControl.GetValue();
            that._DebtorAccountFloatSelectionControl.SetAccount(debtorAccountID);

            if (!ValueIsEmpty(debtorAccountID)
                && (acc.AccountHasFloat(debtorAccountID, "CostCenter") ||
                    acc.AccountHasFloat(debtorAccountID, "Project"))) {
                if (that._FormMode == "New")
                    that._DebtorAccountPanel.SetFillParent(true);

                that._MainDockPanel.SetPaneSizeSetting(2, 70);
                that._DebtorAccountPanel.SetVisible(true);
                that._DebtorAccountFloatSelectionControl.SetVisible(true);
                that._DebtorAccountFloatSelectionControl.SetFillParent(true);
            }
            else {
                that._MainDockPanel.SetPaneSizeSetting(2, 1);
                that._DebtorAccountPanel.SetVisible(false);
                that._DebtorAccountPanel.SetFillParent(false);
                that._DebtorAccountFloatSelectionControl.SetVisible(false);
                that._DebtorAccountFloatSelectionControl.SetFillParent(false);
            }
        },

        _SetAccountsLookupControlValue: function () {
            var that = this;

            var financialOpKindAccSetting = afw.uiApi.FetchEntity("rp.FinancialOpKindAccSetting",
                         String.Format("FinancialOpKind = '{0}' and FinancialYear = '{1}'", that._BindableEntity.get("FinancialOpKind"),
                            that._PayReceipt_FinancialYear));
            if (financialOpKindAccSetting != null) {
                that._BindableEntity.set("DebtorAccount", financialOpKindAccSetting.GetFieldValue("DebtorAccount"));
                that._BindableEntity.set("CreditorAccount", financialOpKindAccSetting.GetFieldValue("CreditorAccount"));
            }
        },

        _OnOpened: function (sender, e) {
            var that = this;

            that._IsInOnOpened = true;
            try {
                afw.Window.fn._OnOpened.call(that);

                var control = that._ItemFormContainerPanel.FindControl("ItemEditForm");

                if (control == null)
                    return;

                if (that._ReceiptPayee != null) {
                    control.SetPayee(that._ReceiptPayee);
                    control.SetPayeeReadonly();
                }
                else
                    if (that._FormMode == "New" && that._GetPayTypeName() == "Cheque" && that._CopiedPayeeID != null) {
                        control.FindControl("PayeeFieldControl").SetValue(that._CopiedPayeeID);
                    }

                setTimeout(function () {
                    control.SetFocus();
                }, 500);

                that._SetItemPersonFilter();

                if (that._BindableEntity.get("FinancialOpKind") != null && that._FinancialOpKindDropDownList.GetValue() != that._SelectFromAccAccountID
                    && that._BindableEntity.get("CreditorAccount") == null && that._BindableEntity.get("DebtorAccount") == null)
                    that._SetAccountsLookupControlValue();

                that._IsInOnOpened = false;
            }
            catch (ex) {
                afw.ErrorDialog.Show(ex);
                that.Close();
            }
        },

        _OnClosed: function () {
            var that = this;

            afw.Window.fn._OnClosed.call(that);

            if (that._PayReceiptItemsDataListControl != null)
                that._PayReceiptItemsDataListControl.LoadData();
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            if (buttonKey == "SaveAndNew") {
                that.SaveAndNew();
            }
            else
                afw.EntityWindowBase.fn._OnToolbarButtonClicked.call(that, buttonKey);
        },

        _AdjustForm: function () {
            var that = this;

            afw.EntityWindowBase.fn._AdjustForm.call(that);

            if (!ValueIsEmpty(that._FinancialOpKindDropDownList.GetValue())) {

                if (that._FinancialOpKindDropDownList.GetValue() == that._SelectFromAccAccountID) {
                    that._DebtorAccountFieldControl.SetVisible(true);
                    that._MainDockPanel.SetPaneSizeSetting(1, 45);
                    that._MainDockPanel.SetPaneSizeSetting(2, 1);
                }
                else {
                    that._MainDockPanel.SetPaneSizeSetting(1, 1);
                    that._MainDockPanel.SetPaneSizeSetting(2, 1);
                    that._DebtorAccountFieldControl.SetVisible(false);
                }
            }
            else {
                that._MainDockPanel.SetPaneSizeSetting(1, 1);
                that._MainDockPanel.SetPaneSizeSetting(2, 1);
                that._DebtorAccountFieldControl.SetVisible(false);
            }

            that._CreditorAccountFieldControl.SetVisible(false);
            that._MainDockPanel.SetPaneSizeSetting(3, 1);
            that._DebtorAccountLookupControl.SetShowRequiredStar(true);
            that._CreditorAccountLookupControl.SetShowRequiredStar(true);
            that._DebtorAccountLookupControl.SetHasEntityViewButton(false);
            that._CreditorAccountLookupControl.SetHasEntityViewButton(false);

            that._AdjustFloatAccountsSelectionControl();
        },

        _ValidateForm: function () {
            var that = this;

            if (!afw.EntityWindowBase.fn._ValidateForm.call(that))
                return false;

            if (ValueIsEmpty(that._BindableEntity.get("DebtorAccount")) && that._IsDebtorAccount) {
                afw.MessageDialog.Show("مقدار فیلد حساب بدهکار را وارد نکرده اید.");
                return false;
            }

            if (ValueIsEmpty(that._BindableEntity.get("CreditorAccount"))) {
                afw.MessageDialog.Show("مقدار فیلد حساب بستانکار را وارد نکرده اید.");
                return false;
            }

            if (!that._DebtorAccountFloatSelectionControl.ValidateControl())
                return false;

            var innerItemValidationResult = that._InnerItemEntity.Validate();
            if (innerItemValidationResult.HasError) {
                afw.ErrorDialog.Show(innerItemValidationResult.ErrorMessage);
                return false;
            }

            var itemEditForm = that._ItemFormContainerPanel.FindControl("ItemEditForm");
            if (itemEditForm != null && itemEditForm.FindControl("AmountFieldControl").GetValue() == 0) {
                afw.ErrorDialog.Show("مبلغ نباید صفر باشد");
                return false;
            }

            return true;
        },

        _Save: function () {
            var that = this;

            var saved = false;

            try {
                that._BindableEntity.set("FinancialItem_Cheque", null);
                that._BindableEntity.set("FinancialItem_Havale", null);
                that._BindableEntity.set("FinancialItem_Naghd", null);
                that._BindableEntity.set("FinancialItem_ChekeZemanat", null);

                var payTypeName = that._GetPayTypeName();
                switch (payTypeName) {
                    case "Cheque":
                        that._BindableEntity.set("FinancialItem_Cheque", that._InnerItemEntity.GetFieldValue("ID"));
                        break;
                    case "Havale":
                        that._BindableEntity.set("FinancialItem_Havale", that._InnerItemEntity.GetFieldValue("ID"));
                        break;
                    case "Naghd":
                        that._BindableEntity.set("FinancialItem_Naghd", that._InnerItemEntity.GetFieldValue("ID"));
                        break;
                    case "ChekeZemanat":
                        that._BindableEntity.set("FinancialItem_ChekeZemanat", that._InnerItemEntity.GetFieldValue("ID"));
                        break;
                }

                that._BindableEntity._Entity.SetFieldValue("InnerItem", that._InnerItemEntity);

                saved = afw.EntityWindowBase.fn._Save.call(that, false);

            }
            catch (ex) {
                if (ex.ErrorDetails.Contains("ChequeNumberExists"))
                    afw.ErrorDialog.Show("شماره این چک قبلا ثبت شده است");
                else if (ex.ErrorDetails.Contains("ShomareHavaleVojoodDarad"))
                    afw.ErrorDialog.Show("شماره این حواله قبلا ثبت شده است");
                else
                    afw.ErrorDialog.Show(ex.message);
            }

            return saved;
        },

        _PayTypeValueChanged: function () {
            var that = this;

            var payTypeID = that._PayTypeFieldControl.GetValue();

            var control = that._ItemFormContainerPanel.FindControl("ItemEditForm");
            if (control != null) {
                control.Destroy();
                control = null;
            }

            var payTypeName = that._GetPayTypeName();
            switch (payTypeName) {
                case "Cheque":
                    that._InnerItemEntity = afw.uiApi.CreateNewEntity("rp.PaidCheque");
                    //var lastRadifeDaftareChek = afw.uiApi.CallServerMethodSync("cmn.GetFieldMaxIntValue",["RadifeDaftareChek", "rp_ReceivedCheques", null]);
                    var chequeStatusID = afw.OptionSetHelper.GetOptionSetItemID("rp.PaidChequeStatus.PasNashode");
                    //that._InnerItemEntity.SetFieldValue("RadifeDaftareChek", lastRadifeDaftareChek + 1);
                    that._InnerItemEntity.SetFieldValue("ChequeStatus", chequeStatusID);
                    break;
                case "Havale":
                    that._InnerItemEntity = afw.uiApi.CreateNewEntity("rp.HavalePardakhti");
                    break;
                case "Naghd":
                    that._InnerItemEntity = afw.uiApi.CreateNewEntity("rp.NaghdePardakhti");
                    break;
                case "ChekeZemanat":
                    that._InnerItemEntity = afw.uiApi.CreateNewEntity("rp.ChekeZemanatePardakhti");
                    //var lastRadifeDaftareChekeZemanat = afw.uiApi.CallServerMethodSync("cmn.GetFieldMaxIntValue", ["RadifeDaftareChek", "rp_ChekeZemanateDaryafti", null]);
                    //that._InnerItemEntity.SetFieldValue("RadifeDaftareChek", lastRadifeDaftareChekeZemanat + 1);
                    break;
            }

            that._CreateItemControl(payTypeName);

            that._SetFinancialOpKindItems();
            that._FinancialOpKindDropDownList.SetValue(null);
            that._ItemFormContainerPanel.SetEnabled(false);
        },

        _GetPayTypeName: function () {
            var that = this;

            var payTypeID = that._PayTypeFieldControl.GetValue();

            if (payTypeID == null)
                return null;
            else
                return rp.GetPayTypeName(payTypeID);
        },

        _CreateItemControl: function (payTypeName) {
            var that = this;

            var editFormName = "";
            switch (payTypeName) {
                case "Cheque":
                    editFormName = "rp.PaidChequeEditForm";
                    break;
                case "Havale":
                    editFormName = "rp.HavalePardakhtiEditForm";
                    break;
                case "Naghd":
                    editFormName = "rp.NaghdePardakhtiEditForm";
                    break;
                case "ChekeZemanat":
                    editFormName = "rp.ChekeZemanatePardakhtiEditForm";
                    break;
            }

            var control = afw.uiApi.CreateSavedFormByName(
                         that._ItemFormContainerPanel, editFormName,
                         { Name: "ItemEditForm", Entity: that._InnerItemEntity });

            control.SetFillParent(true);

            if (that._ReceiptPayee != null) {
                control.SetPayee(that._ReceiptPayee);
                control.SetPayeeReadonly();
            }
        },

        _SetFinancialOpKindItems: function () {
            var that = this;

            var filter = "";

            var selectedPayTypeID = that._PayTypeFieldControl.GetValue();

            if (ValueIsEmpty(selectedPayTypeID))
                filter = "1 = 0";
            else {
                filter += "(";

                filter += String.Format(
                    "PayDocType = '{0}' " +
                    "and IsActive = 1 " +
                    "and ID in ( " +
                    "   select FinancialOpKind " +
                    "   from rp_FinancialOpKindAccSettings " +
                    "   where FinancialYear = '{1}') ",
                    selectedPayTypeID, that._PayReceipt_FinancialYear);

                if (that._ReceiptPayee != null) {
                    filter = filter + String.Format(
                        "and ID in ( " +
                        "   select FinancialOpKindAccSetting.FinancialOpKind  " +
                        "   from cmn_PersonGroupRelations PersonGroupRelation  " +
                        "       inner join acc_PersonGroupAccounts PersonGroupAccount on PersonGroupAccount.PersonGroup = PersonGroupRelation.PersonGroup  " +
                        "       inner join rp_FinancialOpKindAccSettings FinancialOpKindAccSetting on FinancialOpKindAccSetting.DebtorAccount = PersonGroupAccount.Account  " +
                        "   where PersonGroupRelation.Person = '{0}' and FinancialOpKindAccSetting.FinancialYear = '{1}' )",
                        that._ReceiptPayee, that._PayReceipt_FinancialYear);
                }

                filter += ")";

                if (that._FormMode == "Edit" &&
                    !ValueIsEmpty(that._BindableEntity.get("FinancialOpKind")) &&
                    !ValueIsEmpty(that._SelectFromAccAccountID))
                    filter += String.Format(" or ID = '{0}'", that._BindableEntity.get("FinancialOpKind"));
            }

            var financialOpKindEntityList = afw.DataListHelper.FetchEntityListOfDataList("rp.FinancialOpKinds", null, null, filter).ToDataSourceData();
            //financialOpKindEntityList.splice(0, 0, { ID: that._SelectFromAccAccountID, Title: "انتخاب از کدینگ حسابداری" });
            that._FinancialOpKindDropDownList.SetItemsDataSource(financialOpKindEntityList);
        },

        SaveAndNew: function () {
            var that = this;

            if (that._Save()) {
                that.SetDialogResult("Ok");
                that.Close();

                var entity = afw.uiApi.CreateNewEntity("rp.PayReceiptItem");
                var payReceiptID = that._BindableEntity.get("PayReceipt");
                entity.SetFieldValue("PayReceipt", payReceiptID);

                var copiedPayeeID = null;
                if (that.FindControl("ItemEditForm").FindControl("CopyPayeeCheckBox").GetChecked() == true)
                    copiedPayeeID = that._InnerItemEntity.GetFieldValue("Payee");

                that._PayReceiptItemsDataListControl.ShowEntityWindow(entity, "New", {
                    PayReceiptItemsDataListControl: that._PayReceiptItemsDataListControl,
                    CopiedPayeeID: copiedPayeeID,
                    ReceiptEntity: that._ReceiptEntity
                });
            }
        },

        _SetItemPersonFilter: function () {
            var that = this;

            var control = that._ItemFormContainerPanel.FindControl("ItemEditForm");
            if (control == null)
                return;

            var personFilter = "";

            var debtorAccount = that._BindableEntity.get("DebtorAccount");
            if (debtorAccount != null) {

                personFilter = String.Format("ID in (" +
                    "select PersonGroupRelation.Person " +
                    "from cmn_PersonGroupRelations PersonGroupRelation " +
                    "   inner join acc_PersonGroupAccounts PersonGroupAccount on PersonGroupAccount.PersonGroup = PersonGroupRelation.PersonGroup " +
                    "   inner join cmn_Persons Person on Person.ID = PersonGroupRelation.Person  " +
                    "where PersonGroupAccount.Account = '{0}' and isnull(Person.FinancialAccountCode, '') <> '' ) ",
                    debtorAccount);
            }
            control.SetPersonFilter(personFilter);
        }
    });

    //Static Members:

    FormClass.TypeName = "rp.PayReceiptItemEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    rp.PayReceiptItemEditForm = FormClass;
})();
(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return rp.ReceiveReceiptItemEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._IsInit = true;

            that._UserActiveFinancialYearID = cmn.GetUserActiveFinancialYearID();

            that._InnerItemEntity = null;
            that._IsInOnOpened = false;

            that._SelectFromAccAccountID = '00000000-0000-0000-0000-000000000000';

            that._ReceiveTypeFieldControl = that.FindControl("ReceiveTypeFieldControl");;
            that._ReceiveTypeDropDownList = that._ReceiveTypeFieldControl.FindControl("InnerControl").GetDropDownList();
            that._ReceiveTypeDropDownList.bind("KeyPressed", function (e) { that._Control_KeyPressed(e); });

            that._DebtorAccountFieldControl = that.FindControl("DebtorAccountFieldControl");
            that._DebtorAccountLookupControl = that._DebtorAccountFieldControl.FindControl("InnerControl");
            that._CreditorAccountFieldControl = that.FindControl("CreditorAccountFieldControl");
            that._CreditorAccountLookupControl = that._CreditorAccountFieldControl.FindControl("InnerControl");
            that._MainDockPanel = that.FindControl("MainDockPanel");
            that._CreditorAccountPanel = that.FindControl("CreditorAccountPanel");

            that._CreditorAccountFloatSelectionControl = afw.uiApi.CreateSavedControl("acc.FloatAccountsSelectionControl", {
                ParentControl: that._CreditorAccountPanel,
                Name: "CreditorAccountFloatSelectionControl",
                BindableEntity: that._BindableEntity,
                PersonFieldName: null,
                CostCenterFieldName: "Creditor_CostCenter",
                ProjectFieldName: "Creditor_Project",
                ForeignCurrencyFieldName: null,
                Visible: false
            });

            that._ItemFormContainerPanel = that.FindControl("ItemFormContainerPanel");

            that._FinancialOpKindDropDownList = that.FindControl("FinancialOpKindDropDownList");
            that._FinancialOpKindDropDownList.bind("KeyPressed", function (e) { that._FinancialOpKindDropDownList_KeyPressed(e); });
            that._FinancialOpKindDropDownList.bind("ValueChanged", function (e) { that._FinancialOpKindDropDownList_ValueChanged(e); });

            that._DebtorAccountFieldControl.bind("ValueChanged", function (e) { that._DebtorAccountFieldControl_ValueChanged(e); });
            that._CreditorAccountFieldControl.bind("ValueChanged", function (e) { that._CreditorAccountFieldControl_ValueChanged(e); });
            that._DebtorAccountFieldControl.bind("OpeningLookup", function (e) { that._AccountslookupControl_OpeningLookup(e); });
            that._CreditorAccountFieldControl.bind("OpeningLookup", function (e) { that._AccountslookupControl_OpeningLookup(e); });

            that._ReceiveReceiptItemsDataListControl = options.ReceiveReceiptItemsDataListControl;
            that._CopiedPayerID = options.CopiedPayerID;
            that._ReceiptEntity = options.ReceiptEntity;
            that._ReceiptPayer = (options.ReceiptEntity).GetFieldValue("Payer");
            that._ReceiveReceipt_FinancialYear = (options.ReceiptEntity).GetFieldValue("FinancialYear");

            that._DebtorAccountLookupControl.SetBaseFilterExpression(String.Format("FinancialYear = '{0}'", that._ReceiveReceipt_FinancialYear));
            that._CreditorAccountLookupControl.SetBaseFilterExpression(String.Format("FinancialYear = '{0}'", that._ReceiveReceipt_FinancialYear));

            that._ReceiveTypeFieldControl.bind("ValueChanged", function (e) { that._ReceiveTypeFieldControl_ValueChanged(e); });

            that._BindableEntity._Entity.AddField("InnerItem");

            that._FormHasUnsavedChanges = true;

            var toolBar = that.FindControl("ToolBar");
            toolBar.RemoveButton("Save");
            toolBar.AddButton("SaveAndNew", "ثبت و جدید");

            that._DefaultReceiveTypeID = rp.GetReceiveTypeID("Cheque");

            that._ReceiveTypeFieldControlPreviousValue = null;//برای تکرار نشدن انجام عملیات رخداد              

            if (that._FormMode == "New") {
                that._ReceiveTypeFieldControl.SetValue(that._DefaultReceiveTypeID);
            }
            else {
                var entityFullName = "";
                var receiveTypeName = that._GetReceiveTypeName();
                var fieldName = "";
                switch (receiveTypeName) {
                    case "Cheque":
                        entityFullName = "rp.ReceivedCheque";
                        fieldName = "FinancialItem_Cheque";
                        break;
                    case "Safte":
                        entityFullName = "rp.SafteDaryafti";
                        fieldName = "FinancialItem_Safte";
                        break;
                    case "Havale":
                        entityFullName = "rp.HavaleDaryafti";
                        fieldName = "FinancialItem_Havale";
                        break;
                    case "Naghd":
                        entityFullName = "rp.NaghdeDaryafti";
                        fieldName = "FinancialItem_Naghd";
                        break;
                    case "ChekeZemanat":
                        entityFullName = "rp.ChekeZemanateDaryafti";
                        fieldName = "FinancialItem_ChekeZemanat";
                        break;
                    case "Pos":
                        entityFullName = "rp.ReceivedPos";
                        fieldName = "FinancialItem_Pos";
                        break;
                }

                that._InnerItemEntity = afw.uiApi.FetchEntity(entityFullName, String.Format("ID = '{0}'", that._BindableEntity.get(fieldName)));
                that._BindableEntity._Entity.SetFieldValue("InnerItem", that._InnerItemEntity);

                that._ReceiveTypeFieldControl.SetReadOnly(true);

                that._CreateItemControl(receiveTypeName);

                var financialOpKindID = that._BindableEntity.get("FinancialOpKind");
                that._SetFinancialOpKindItems();
                if (financialOpKindID != null)
                    that._FinancialOpKindDropDownList.SetValue(financialOpKindID);
                else
                    that._FinancialOpKindDropDownList.SetValue(that._SelectFromAccAccountID);

                if (options.IsView)
                    that.EntityWindowBaseVDockPanel1.Panes[0].SetSizeSetting(1, 1);
            }
            that._IsInit = false;
        },

        _AccountslookupControl_OpeningLookup: function (e) {
            var that = this;

            e.Sender.SetLookupDataListControlCustomOptions({ FinancialYear: that._ReceiveReceipt_FinancialYear });
        },

        _DebtorAccountFieldControl_ValueChanged: function (e) {
            var that = this;

            var receiveTypeName = that._GetReceiveTypeName();
            if (!ValueIsEmpty(that._DebtorAccountFieldControl.GetValue()) && receiveTypeName != "Naghd")
                if (acc.AccountHasFloat(that._DebtorAccountFieldControl.GetValue())) {
                    that._DebtorAccountFieldControl.SetValue(null);
                    afw.ErrorDialog.Show("امکان انتخاب حساب بدهکار دارای شناور در عملیات دریافت وجود ندارد");
                }
        },

        _GetReceiveTypeName: function () {
            var that = this;

            var receiveTypeID = that._ReceiveTypeFieldControl.GetValue();

            if (receiveTypeID == null)
                return null;
            else
                return rp.GetReceiveTypeName(receiveTypeID);
        },

        _CreditorAccountFieldControl_ValueChanged: function (e) {
            var that = this;

            if (!ValueIsEmpty(that._CreditorAccountFieldControl.GetValue()))
                if (!acc.AccountHasFloat(that._CreditorAccountFieldControl.GetValue(), "Person")) {
                    that._CreditorAccountFieldControl.SetValue(null);
                    afw.ErrorDialog.Show("حساب بستانکار انتخاب شده باید دارای شناور شخص باشد");
                }

            if (that._ReceiptPayer == null) {
                var control = that._ItemFormContainerPanel.FindControl("ItemEditForm");
                if (control == null)
                    return;

                if (!that._IsInOnOpened)
                    control.SetPayer(null);

                if (that._BindableEntity.get("CreditorAccount") == null) {
                    control.SetPayerReadonly();
                    control.SetPayer(null);
                }
                else
                    control.FindControl("PayerFieldControl").SetReadOnly(false);
            }

            that._SetItemPersonFilter();
            that._AdjustFloatAccountsSelectionControl();
        },

        _AdjustFloatAccountsSelectionControl: function () {
            var that = this;

            var creditorAccountID = that._CreditorAccountFieldControl.GetValue();
            that._CreditorAccountFloatSelectionControl.SetAccount(creditorAccountID);

            if (!ValueIsEmpty(creditorAccountID)
                && (acc.AccountHasFloat(creditorAccountID, "CostCenter") || acc.AccountHasFloat(creditorAccountID, "Project"))) {
                if (that._FormMode == "New")
                    that._CreditorAccountPanel.SetFillParent(true);

                that._MainDockPanel.SetPaneSizeSetting(3, 70);
                that._CreditorAccountPanel.SetVisible(true);
                that._CreditorAccountFloatSelectionControl.SetVisible(true);
                that._CreditorAccountFloatSelectionControl.SetFillParent(true);
            }
            else {
                that._MainDockPanel.SetPaneSizeSetting(3, 1);
                that._CreditorAccountPanel.SetVisible(false);
                that._CreditorAccountPanel.SetFillParent(false);
                that._CreditorAccountFloatSelectionControl.SetVisible(false);
                that._CreditorAccountFloatSelectionControl.SetFillParent(false);
            }
        },

        _FinancialOpKindDropDownList_KeyPressed: function (e) {
            var that = this;

            if (e.Key == "Enter") {

                if (e.Sender == that._ReceiveTypeDropDownList)
                    that._FinancialOpKindDropDownList.Focus();

                else if (e.Sender == that._FinancialOpKindDropDownList_DropDownList) {
                    var control = that._ItemFormContainerPanel.FindControl("ItemEditForm");
                    if (control != null)
                        control.SetFocus();
                }

            }
        },

        _ResetForm: function () {
            var that = this;

            var receiveTypeID = that._ReceiveTypeFieldControl.GetValue();

            if (receiveTypeID == that._ReceiveTypeFieldControlPreviousValue)
                return;

            if (ValueIsEmpty(receiveTypeID)) {
                that._ReceiveTypeFieldControl.SetValue(that._DefaultReceiveTypeID);
                return;
            }

            that._ReceiveTypeValueChanged();

            that._ReceiveTypeFieldControlPreviousValue = receiveTypeID;
        },

        _ReceiveTypeFieldControl_ValueChanged: function (e) {
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

                if (that._ReceiptPayer == null) {
                    var control = that._ItemFormContainerPanel.FindControl("ItemEditForm");
                    if (control == null)
                        return;

                    if (that._BindableEntity.get("CreditorAccount") == null) {
                        control.SetPayerReadonly();
                        control.SetPayer(null);
                    }
                    that._SetItemPersonFilter();
                }
                that._AdjustForm();
            }
        },


        _SetAccountsLookupControlValue: function () {
            var that = this;

            var financialOpKindAccSetting = afw.uiApi.FetchEntity("rp.FinancialOpKindAccSetting",
                         String.Format("FinancialOpKind = '{0}' and FinancialYear = '{1}'", that._BindableEntity.get("FinancialOpKind"),
                            that._ReceiveReceipt_FinancialYear));
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

                if (that._ReceiptPayer != null) {
                    control.SetPayer(that._ReceiptPayer);
                    control.SetPayerReadonly();
                }
                else
                    if (that._FormMode == "New" && that._GetReceiveTypeName() == "Cheque" && that._CopiedPayerID != null) {
                        control.FindControl("PayerFieldControl").SetValue(that._CopiedPayerID);
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

            if (that._ReceiveReceiptItemsDataListControl != null)
                that._ReceiveReceiptItemsDataListControl.LoadData();
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
                var receiveOrPayDocType = afw.uiApi.FetchEntityByID("rp.ReceiveType", that._ReceiveTypeFieldControl.GetValue());

                if (ValueIsIn(receiveOrPayDocType.GetFieldValue("Name"), ["Havale", "Pos", "Naghd"])) {
                    if (that._FinancialOpKindDropDownList.GetValue() == that._SelectFromAccAccountID) {
                        that._MainDockPanel.SetPaneSizeSetting(1, 1);
                        that._MainDockPanel.SetPaneSizeSetting(2, 45);
                        that._DebtorAccountFieldControl.SetVisible(false);
                        that._CreditorAccountFieldControl.SetVisible(true);
                    }
                    else {
                        that._MainDockPanel.SetPaneSizeSetting(1, 1);
                        that._MainDockPanel.SetPaneSizeSetting(2, 1);
                        that._MainDockPanel.SetPaneSizeSetting(3, 1);
                        that._DebtorAccountFieldControl.SetVisible(false);
                        that._CreditorAccountFieldControl.SetVisible(false);
                    }
                }
                else if (ValueIsIn(receiveOrPayDocType.GetFieldValue("Name"), ["ChekeZemanat", "Safte", "Cheque"])) {
                    if (that._FinancialOpKindDropDownList.GetValue() == that._SelectFromAccAccountID) {
                        that._MainDockPanel.SetPaneSizeSetting(1, 45);
                        that._MainDockPanel.SetPaneSizeSetting(2, 45);
                        that._DebtorAccountFieldControl.SetVisible(true);
                        that._CreditorAccountFieldControl.SetVisible(true);
                    }
                    else {
                        that._MainDockPanel.SetPaneSizeSetting(1, 1);
                        that._MainDockPanel.SetPaneSizeSetting(2, 1);
                        that._MainDockPanel.SetPaneSizeSetting(3, 1);
                        that._DebtorAccountFieldControl.SetVisible(false);
                        that._CreditorAccountFieldControl.SetVisible(false);
                    }
                }
            }
            else {
                that._MainDockPanel.SetPaneSizeSetting(1, 1);
                that._MainDockPanel.SetPaneSizeSetting(2, 1);
                that._MainDockPanel.SetPaneSizeSetting(3, 1);
                that._DebtorAccountFieldControl.SetVisible(true);
                that._CreditorAccountFieldControl.SetVisible(true);
            }

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

            if (ValueIsEmpty(that._BindableEntity.get("CreditorAccount")) && that._IsCreditorAccount) {
                afw.MessageDialog.Show("مقدار فیلد حساب بستانکار را وارد نکرده اید.");
                return false;
            }

            if (ValueIsEmpty(that._BindableEntity.get("DebtorAccount"))) {
                afw.MessageDialog.Show("مقدار فیلد حساب بدهکار را وارد نکرده اید.");
                return false;
            }

            if (!that._CreditorAccountFloatSelectionControl.ValidateControl())
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
                that._BindableEntity.set("FinancialItem_Safte", null);
                that._BindableEntity.set("FinancialItem_Havale", null);
                that._BindableEntity.set("FinancialItem_Naghd", null);
                that._BindableEntity.set("FinancialItem_ChekeZemanat", null);
                that._BindableEntity.set("FinancialItem_Pos", null);

                var receiveTypeName = that._GetReceiveTypeName();
                switch (receiveTypeName) {
                    case "Cheque":
                        that._BindableEntity.set("FinancialItem_Cheque", that._InnerItemEntity.GetFieldValue("ID"));
                        break;
                    case "Safte":
                        that._BindableEntity.set("FinancialItem_Safte", that._InnerItemEntity.GetFieldValue("ID"));
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
                    case "Pos":
                        that._BindableEntity.set("FinancialItem_Pos", that._InnerItemEntity.GetFieldValue("ID"));
                        break;
                }

                that._BindableEntity._Entity.SetFieldValue("InnerItem", that._InnerItemEntity);

                saved = afw.EntityWindowBase.fn._Save.call(that, false);

            }
            catch (ex) {
                if (ex.ErrorDetails.Contains("ChequeNumberExists"))
                    afw.ErrorDialog.Show("شماره این چک قبلا ثبت شده است");
                else if (ex.ErrorDetails.Contains("RadifeDaftareChekExists"))
                    afw.ErrorDialog.Show("شماره ردیف دفتر این چک قبلا ثبت شده است");
                else if (ex.ErrorDetails.Contains("ShomareSafteVojoodDarad"))
                    afw.ErrorDialog.Show("شماره این سفته قبلا ثبت شده است");
                else if (ex.ErrorDetails.Contains("ShomareHavaleVojoodDarad"))
                    afw.ErrorDialog.Show("شماره این حواله قبلا ثبت شده است");
                else if (ex.ErrorDetails.Contains("ShomareChekeZemanatVojoodDarad"))
                    afw.ErrorDialog.Show("شماره این چک ضمانت قبلا ثبت شده است");
                else if (ex.ErrorDetails.Contains("RadifeDaftareChekeZemanatVojoodDarad"))
                    afw.ErrorDialog.Show("شماره ردیف دفتر این چک ضمانت قبلا ثبت شده است");
                else
                    afw.ErrorDialog.Show(ex.message);
            }

            return saved;
        },

        _ReceiveTypeValueChanged: function () {
            var that = this;

            var receiveTypeID = that._ReceiveTypeFieldControl.GetValue();

            var control = that._ItemFormContainerPanel.FindControl("ItemEditForm");
            if (control != null) {
                control.Destroy();
                control = null;
            }

            var receiveTypeName = that._GetReceiveTypeName();
            switch (receiveTypeName) {
                case "Cheque":
                    that._InnerItemEntity = afw.uiApi.CreateNewEntity("rp.ReceivedCheque");
                    var lastRadifeDaftareChek = afw.uiApi.CallServerMethodSync("cmn.GetFieldMaxIntValue", ["RadifeDaftareChek", "rp_ReceivedCheques", null]);
                    var chequeStatusID = afw.OptionSetHelper.GetOptionSetItemID("rp.ReceivedChequeStatus.AsnadeDaryaftani");
                    that._InnerItemEntity.SetFieldValue("RadifeDaftareChek", lastRadifeDaftareChek + 1);
                    that._InnerItemEntity.SetFieldValue("ChequeStatus", chequeStatusID);
                    break;
                case "Safte":
                    that._InnerItemEntity = afw.uiApi.CreateNewEntity("rp.SafteDaryafti");
                    break;
                case "Havale":
                    that._InnerItemEntity = afw.uiApi.CreateNewEntity("rp.HavaleDaryafti");
                    break;
                case "Naghd":
                    that._InnerItemEntity = afw.uiApi.CreateNewEntity("rp.NaghdeDaryafti");
                    break;
                case "ChekeZemanat":
                    that._InnerItemEntity = afw.uiApi.CreateNewEntity("rp.ChekeZemanateDaryafti");
                    var lastRadifeDaftareChekeZemanat = afw.uiApi.CallServerMethodSync("cmn.GetFieldMaxIntValue", ["RadifeDaftareChek", "rp_ChekeZemanateDaryafti", null]);
                    that._InnerItemEntity.SetFieldValue("RadifeDaftareChek", lastRadifeDaftareChekeZemanat + 1);
                    break;
                case "Pos":
                    that._InnerItemEntity = afw.uiApi.CreateNewEntity("rp.ReceivedPos");
                    break;
            }

            that._CreateItemControl(receiveTypeName);

            that._SetFinancialOpKindItems();
            that._FinancialOpKindDropDownList.SetValue(null);

            that._ItemFormContainerPanel.SetEnabled(false);
        },

        _GetReceiveTypeName: function () {
            var that = this;

            var receiveTypeID = that._ReceiveTypeFieldControl.GetValue();

            if (receiveTypeID == null)
                return null;
            else
                return rp.GetReceiveTypeName(receiveTypeID);
        },

        _CreateItemControl: function (receiveTypeName) {
            var that = this;

            var editFormName = "";
            switch (receiveTypeName) {
                case "Cheque":
                    editFormName = "rp.ReceivedChequeEditForm";
                    break;
                case "Safte":
                    editFormName = "rp.SafteDaryaftiEditForm";
                    break;
                case "Havale":
                    editFormName = "rp.HavaleDaryaftiEditForm";
                    break;
                case "Naghd":
                    editFormName = "rp.NaghdeDaryaftiEditForm";
                    break;
                case "ChekeZemanat":
                    editFormName = "rp.ChekeZemanateDaryaftiEditForm";
                    break;
                case "Pos":
                    editFormName = "rp.ReceivedPosEditForm";
                    break;
            }

            var control = afw.uiApi.CreateSavedFormByName(
                         that._ItemFormContainerPanel, editFormName,
                         { Name: "ItemEditForm", Entity: that._InnerItemEntity });

            control.SetFillParent(true);

            if (that._ReceiptPayer != null) {
                control.SetPayer(that._ReceiptPayer);
                control.SetPayerReadonly();
            }
        },

        _SetFinancialOpKindItems: function () {
            var that = this;

            var filter = "";

            var selectedReceiveTypeID = that._ReceiveTypeFieldControl.GetValue();

            if (ValueIsEmpty(selectedReceiveTypeID))
                filter = "1 = 2";
            else {
                filter += "(";

                filter += String.Format(
                    " ReceiveDocType = '{0}' " +
                    "and IsActive = 1 " +
                    "and ID in ( " +
                    "   select FinancialOpKind " +
                    "   from rp_FinancialOpKindAccSettings " +
                    "   where FinancialYear = '{1}') ",
                    selectedReceiveTypeID, that._ReceiveReceipt_FinancialYear);

                if (that._ReceiptPayer != null) {
                    filter += String.Format(
                        "and ID in ( " +
                        "   select FinancialOpKindAccSetting.FinancialOpKind " +
                        "   from cmn_PersonGroupRelations PersonGroupRelation  " +
                        "       inner join acc_PersonGroupAccounts PersonGroupAccount on PersonGroupAccount.PersonGroup = PersonGroupRelation.PersonGroup  " +
                        "       inner join rp_FinancialOpKindAccSettings FinancialOpKindAccSetting on FinancialOpKindAccSetting.CreditorAccount = PersonGroupAccount.Account  " +
                        "   where PersonGroupRelation.Person = '{0}' and FinancialOpKindAccSetting.FinancialYear = '{1}')",
                        that._ReceiptPayer, that._ReceiveReceipt_FinancialYear);
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

                var entity = afw.uiApi.CreateNewEntity("rp.ReceiveReceiptItem");
                var receiveReceiptID = that._BindableEntity.get("ReceiveReceipt");
                entity.SetFieldValue("ReceiveReceipt", receiveReceiptID);

                var copiedPayerID = null;
                if (that.FindControl("ItemEditForm").FindControl("CopyPayerCheckBox").GetChecked() == true)
                    copiedPayerID = that._InnerItemEntity.GetFieldValue("Payer");

                that._ReceiveReceiptItemsDataListControl.ShowEntityWindow(entity, "New", {
                    ReceiveReceiptItemsDataListControl: that._ReceiveReceiptItemsDataListControl,
                    CopiedPayerID: copiedPayerID,
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

            var creditorAccount = that._BindableEntity.get("CreditorAccount");
            if (creditorAccount != null) {

                personFilter = String.Format("ID in (" +
                    "select PersonGroupRelation.Person " +
                    "from cmn_PersonGroupRelations PersonGroupRelation " +
                    "   inner join acc_PersonGroupAccounts PersonGroupAccount on PersonGroupAccount.PersonGroup = PersonGroupRelation.PersonGroup " +
                    "   inner join cmn_Persons Person on Person.ID = PersonGroupRelation.Person  " +
                    "where PersonGroupAccount.Account = '{0}' and isnull(Person.FinancialAccountCode, '') <> '' )",
                    creditorAccount);
            }
            control.SetPersonFilter(personFilter);
        }

    });

    //Static Members:

    FormClass.TypeName = "rp.ReceiveReceiptItemEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    rp.ReceiveReceiptItemEditForm = FormClass;
})();
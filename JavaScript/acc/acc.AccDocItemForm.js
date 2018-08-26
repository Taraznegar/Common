(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return acc.AccDocItemForm;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (designObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._AccDocEditForm = options.AccDocEditForm;
            that._BindableEntity = options.AccDocItemEntity.ToBindableEntity();
            that._FormMode = options.FormMode;

            that._IsCalculatingAmounts = false;
            that._CreatedControls = false;
            that._NotSetDocNoValue = -1;

            that._CloseButton = that.FindControl("CloseButton");
            that._ConfirmButton = that.FindControl("ConfirmButton");
            that._RowNoLabel = that.FindControl("RowNoLabel");
            that._AccountLookupControl = that.FindControl("AccountLookupControl");
            that._DebtorAmountTextBox = that.FindControl("DebtorAmountTextBox");
            that._CreditorAmountTextBox = that.FindControl("CreditorAmountTextBox");
            that._NoteLookupControl = that.FindControl("NoteLookupControl");
            that._NoteTextBox = that.FindControl("NoteTextBox");
            that._IsActiveCheckBox = that.FindControl("IsActiveCheckBox");

            that._PersonLookupControl = that.FindControl("PersonLookupControl");
            that._CostCenterLookupControl = that.FindControl("CostCenterLookupControl");
            that._ProjectLookupControl = that.FindControl("ProjectLookupControl");
            that._ForeignCurrencyLookupControl = that.FindControl("ForeignCurrencyLookupControl");

            that._SwitchToAccountButton = that.FindControl("SwitchToAccountButton");
            that._SwitchToFloatAccountButton = that.FindControl("SwitchToFloatAccountButton");

            that._AccountAutoComplete = that._AccountLookupControl.GetAutoComplete();
            that._PersonAutoComplete = that._PersonLookupControl.GetAutoComplete();
            that._CostCenterAutoComplete = that._CostCenterLookupControl.GetAutoComplete();
            that._ProjectAutoComplete = that._ProjectLookupControl.GetAutoComplete();
            that._ForeignCurrencyAutoComplete = that._ForeignCurrencyLookupControl.GetAutoComplete();

            that._MainDockPanel = that.FindControl("MainDockPanel");
            that._FloatAccountsPanel = that.FindControl("FloatAccountsPanel");

            that._NoteDropDownList = that._NoteLookupControl.GetDropDownList();
            that._SwapDebtorAndCreditorAmountsButton = that.FindControl("SwapDebtorAndCreditorAmountsButton");

            that._HideInsertByFloatAccountsPanel();

            that._RowNoLabel.InitDataBinding(that._BindableEntity);
            that._AccountLookupControl.InitDataBinding(that._BindableEntity);
            that._DebtorAmountTextBox.InitDataBinding(that._BindableEntity);
            that._CreditorAmountTextBox.InitDataBinding(that._BindableEntity);
            that._IsActiveCheckBox.InitDataBinding(that._BindableEntity);
            that._NoteTextBox.InitDataBinding(that._BindableEntity);

            that._IsActiveCheckBox.SetShowRequiredStar(false);

            that._FloatAccountsPanel.SetVisible(false);

            that._FloatAccountsSelectionControl = afw.uiApi.CreateSavedControl("acc.FloatAccountsSelectionControl", {
                ParentControl: that._FloatAccountsPanel,
                Name: "FloatAccountsSelectionControl",
                BindableEntity: that._BindableEntity,
                PersonFieldName: "Person",
                CostCenterFieldName: "CostCenter",
                ProjectFieldName: "Project",
                ForeignCurrencyFieldName: "ForeignCurrency",
                Visible: false
            });

            that._AdjustFloatAccountsSelectionControl();

            that._CloseButton.bind("Click", function (e) { that._CloseButton_Click(e); });
            that._ConfirmButton.bind("Click", function (e) { that._ConfirmButton_Click(e); });
            that._SwitchToAccountButton.bind("Click", function (e) { that._SwitchToAccountButton_Click(e); });
            that._SwitchToFloatAccountButton.bind("Click", function (e) { that._SwitchToFloatAccountButton_Click(e); });
            that._SwapDebtorAndCreditorAmountsButton.bind("Click", function (e) { that._SwapDebtorAndCreditorAmountsButton_Click(e); });

            that._NoteLookupControl.bind("ValueChanged", function (e) { that._NoteLookupControl_ValueChanged(e); });
            that._AccountLookupControl.bind("ValueChanged", function (e) { that._AccountLookupControl_ValueChanged(e); });
            that._PersonLookupControl.bind("ValueChanged", function (e) { that._PersonLookupControl_ValueChanged(e); });
            that._CostCenterLookupControl.bind("ValueChanged", function (e) { that._CostCenterLookupControl_ValueChanged(e); });
            that._ProjectLookupControl.bind("ValueChanged", function (e) { that._ProjectLookupControl_ValueChanged(e); });
            that._ForeignCurrencyLookupControl.bind("ValueChanged", function (e) { that._ForeignCurrencyLookupControl_ValueChanged(e); });

            that._AccountLookupControl.bind("OpeningLookup", function (e) { that._AccountLookupControl_OpeningLookup(e); });

            that._DebtorAmountTextBox.bind("TextChanged", function (e) { that._DebtorAmountTextBox_TextChanged(e); });
            that._CreditorAmountTextBox.bind("TextChanged", function (e) { that._CreditorAmountTextBox_TextChanged(e); });

            that._AccountAutoComplete.bind("KeyPressed", function (e) { that._AccountAutoComplete_KeyPressed(e); });
            that._PersonAutoComplete.bind("KeyPressed", function (e) { that._PersonAutoComplete_KeyPressed(e); });
            that._CostCenterAutoComplete.bind("KeyPressed", function (e) { that._CostCenterAutoComplete_KeyPressed(e); });
            that._ProjectAutoComplete.bind("KeyPressed", function (e) { that._ProjectAutoComplete_KeyPressed(e); });
            that._ForeignCurrencyAutoComplete.bind("KeyPressed", function (e) { that._ForeignCurrencyAutoComplete_KeyPressed(e); });

            that._DebtorAmountTextBox.bind("KeyPressed", function (e) { that._DebtorAndCreditorAmountTextBox_KeyPressed(e); });
            that._CreditorAmountTextBox.bind("KeyPressed", function (e) { that._DebtorAndCreditorAmountTextBox_KeyPressed(e); });
            that._NoteDropDownList.bind("KeyPressed", function (e) { that._NoteDropDownList_KeyPressed(e); });
            that._NoteTextBox.bind("KeyPressed", function (e) { that._NoteTextBox_KeyPressed(e); });
            that._NoteTextBox.bind("KeyPressed", function (e) { that._NoteTextBox_KeyPressed(e); });
            that._IsActiveCheckBox.bind("KeyPressed", function (e) { that._IsActiveCheckBox_KeyPressed(e); });
           
            that._FinancialYearID = cmn.GetUserActiveFinancialYearID();
            that._AccountLookupControl.SetBaseFilterExpression(String.Format("FinancialYear = '{0}'", that._FinancialYearID));

        },

        _AdjustFloatAccountsSelectionControl: function () {
            var that = this;

            that._FloatAccountsPanel.SetVisible(false);

            var accountID = that._AccountLookupControl.GetValue();
            that._FloatAccountsSelectionControl.SetAccount(accountID);

            if (!ValueIsEmpty(accountID) && acc.AccountHasFloat(accountID)) {
                var lastFloatControl = that._FloatAccountsSelectionControl.GetLastFloatControl();
                lastFloatControl.GetAutoComplete().bind("KeyPressed", function (e) { that._LastFloatControl_KeyPressed(e); });

                if (that._FormMode == "New")
                    that._FloatAccountsPanel.SetFillParent(true);

                that._MainDockPanel.SetPaneSizeSetting(3, 70);
                that._FloatAccountsPanel.SetVisible(true);
                that._FloatAccountsSelectionControl.SetVisible(true);
                that._FloatAccountsSelectionControl.SetFillParent(true);
            }
            else {
                that._MainDockPanel.SetPaneSizeSetting(3, 1);
                that._FloatAccountsPanel.SetVisible(false);
                that._FloatAccountsPanel.SetFillParent(false);
                that._FloatAccountsSelectionControl.SetVisible(false);
                that._FloatAccountsSelectionControl.SetFillParent(false);
            }
        },

        _LastFloatControl_KeyPressed: function (e) {
            var that = this;

            if (e.Key == "Enter") {
                that._DebtorAmountTextBox.Focus();
            }
        },

        _CloseButton_Click: function (e) {
            var that = this;

            that.CloseForm();
        },

        CloseForm: function () {
            var that = this;

            that._AccDocEditForm._DataListDockPanel.SetPaneSizeSetting(1, 1);

            if (!that.IsDestroying)
                that.Destroy();

            that._AccDocEditForm._AccDocItemEntitiesGridView.Focus();
            that._AccDocEditForm.SetFormSummaryFields();
        },



        _ConfirmButton_Click: function (e) {
            var that = this;

            that._Save();
        },

        _AccountLookupControl_ValueChanged: function (e) {
            var that = this;

            var accountID = that._AccountLookupControl.GetValue();

            if (accountID != null) {
                var accountInfo = that._GetAccountInfo();

                var accountLevelName = accountInfo.GetFieldValue("AccountLevel_Name");
                var accountEntityList = null;

                if (accountLevelName == 'Kol') {
                    accountEntityList = afw.uiApi.FetchEntityList("acc.Account", String.Format("ParentAccount = '{0}'", accountID));
                    if (accountEntityList.Entities.length > 0) {
                        that._AccountLookupControl.SetValue(null);
                        var messageDialog = afw.MessageDialog.Show("به علت داشتن زیرمجموعه در این سطح از کدینگ حساب نمیتوانید سند صادر کنید.");

                        messageDialog.bind("Closed", function (e) { that._AccountLookupControl.Focus(); });
                    }
                }
                else if (accountLevelName == 'Moin') {
                    accountEntityList = afw.uiApi.FetchEntityList("acc.Account", String.Format("ParentAccount = '{0}'", accountID));
                    if (accountEntityList.Entities.length > 0) {
                        that._AccountLookupControl.SetValue(null);
                        var messageDialog = afw.MessageDialog.Show("به علت داشتن زیرمجموعه در این سطح از کدینگ حساب نمیتوانید سند صادر کنید.");

                        messageDialog.bind("Closed", function (e) { that._AccountLookupControl.Focus(); });
                    }
                }
            }

            that._AdjustFloatAccountsSelectionControl();
            that._SetFocusForAfterAccountLookup();
        },

        _SwapDebtorAndCreditorAmountsButton_Click: function (e) {
            var that = this;

            if (!ValueIsEmpty(that._CreditorAmountTextBox.GetValue()) && that._CreditorAmountTextBox.GetValue() != 0) {
                that._DebtorAmountTextBox.SetValue(that._CreditorAmountTextBox.GetValue());
                that._CreditorAmountTextBox.SetValue(null);
            }
            else {
                that._CreditorAmountTextBox.SetValue(that._DebtorAmountTextBox.GetValue());
                that._DebtorAmountTextBox.SetValue(null);
            }
        },

        _OnFormSaved: function () {
            var that = this;

            setTimeout(function () {
                that.CloseForm();
                that._AccDocEditForm._ItemsDataListControl.GetPager().GoToLastPage();
            }, 700);
        },

        _IsActiveCheckBox_KeyPressed: function (e) {
            var that = this;

            if (e.Key == "Escape") {
                that.CloseForm();
            }
        },

        _AccountAutoComplete_KeyPressed: function (e) {
            var that = this;

            if (e.Key == "Enter") {
                if (ValueIsEmpty(that._AccountLookupControl.GetValue()))
                    that._AccountLookupControl._OpenLookup();
                else
                    that._SetFocusForAfterAccountLookup();
            }
            else if (e.Key == "ArrowUp") {
                that._AccDocEditForm._AccDocItemEntitiesGridView.Focus();
            }
            else if (e.Key == "Escape") {
                that.CloseForm();
            }
        },

    _PersonAutoComplete_KeyPressed: function (e) {
            var that = this;

            if (e.Key == "Enter") {
                if (ValueIsEmpty(that._PersonLookupControl.GetValue()))
                    that._PersonLookupControl._OpenLookup();
                else
                    that._CostCenterLookupControl.Focus();
            }
            else if (e.Key == "Escape") {
                that.CloseForm();
            }
        },

    _CostCenterAutoComplete_KeyPressed: function (e) {
            var that = this;

            if (e.Key == "Enter") {
                if (ValueIsEmpty(that._CostCenterLookupControl.GetValue()))
                    that._CostCenterLookupControl._OpenLookup();
                else
                    that._ProjectLookupControl.Focus();
            }
            else if (e.Key == "Escape") {
                that.CloseForm();
            }
        },

    _ProjectAutoComplete_KeyPressed: function (e) {
            var that = this;

            if (e.Key == "Enter") {
                if (ValueIsEmpty(that._ProjectLookupControl.GetValue()))
                    that._ProjectLookupControl._OpenLookup();
                else
                    that._ForeignCurrencyLookupControl.Focus();
            }
            else if (e.Key == "Escape") {
                that.CloseForm();
            }
        },

    _ForeignCurrencyAutoComplete_KeyPressed: function (e) {
            var that = this;

            if (e.Key == "Enter") {
                if (ValueIsEmpty(that._ForeignCurrencyLookupControl.GetValue()))
                    that._ForeignCurrencyLookupControl._OpenLookup();
                else
                    that._SwitchToAccountButton.Focus();

            }
            else if (e.Key == "Escape") {
                that.CloseForm();
            }
        },

        _DebtorAndCreditorAmountTextBox_KeyPressed: function (e) {
            var that = this;

            var textBoxValue = e.Sender.GetText();

            if (e.Key == "Enter") {
                if (e.Sender == that._DebtorAmountTextBox)
                    that._CreditorAmountTextBox.Focus();
                else
                    that._NoteLookupControl.Focus();
            }
            else if (e.Key == "Escape") {
                that.CloseForm();
            }
            else if (e.Key == "+") {
                e.preventDefault();

                if (textBoxValue != "0" && !ValueIsEmpty(textBoxValue))
                    e.Sender.SetText(textBoxValue + "000");
            }
            else if (e.Key == "-") {
                e.preventDefault();

                if (textBoxValue != "0" && !ValueIsEmpty(textBoxValue))
                    e.Sender.SetText(textBoxValue + "00");
            }
        },

        _DebtorAmountTextBox_TextChanged: function (e) {
            var that = this;

            if (!ValueIsEmpty(that._DebtorAmountTextBox.GetText()) && that._DebtorAmountTextBox.GetText() != "0")
                that._CreditorAmountTextBox.SetValue(null);
        },

        _CreditorAmountTextBox_TextChanged: function (e) {
            var that = this;

            if (!ValueIsEmpty(that._CreditorAmountTextBox.GetText()) && that._CreditorAmountTextBox.GetText() != "0")
                that._DebtorAmountTextBox.SetValue(null);
        },

        _NoteLookupControl_ValueChanged: function (e) {
            var that = this;

            if (!ValueIsEmpty(that._NoteLookupControl.GetValue())) {

                var preDefinedID = that._NoteDropDownList.GetValue();
                var preDefinedNote = that._NoteDropDownList.GetText();

                var preDefinedNoteEntity = afw.uiApi.FetchEntity("acc.PreDefinedNote", String.Format("ID = '{0}'", preDefinedID));
                if (preDefinedNoteEntity.GetFieldValue("IsUserDefined") == true) {
                    that._NoteTextBox.SetText(preDefinedNote);
                }
                else {
                    var accDocID = that._BindableEntity.get("AccDoc");
                    var accDocItemEntityList = afw.uiApi.FetchEntityList("acc.AccDocItem", String.Format("AccDoc = '{0}' and RowNo < {1}", accDocID, that._BindableEntity.get("RowNo")), "RowNo Desc");
                    if (accDocItemEntityList.Entities.length > 0) {
                        var accDocItemNote = accDocItemEntityList.Entities[0].GetFieldValue("Note");
                        that._NoteTextBox.SetText(accDocItemNote);
                    }
                }
            }
            else
                that._NoteTextBox.SetText("");
        },

        _NoteDropDownList_KeyPressed: function (e) {
            var that = this;

            if (e.Key == "Enter")
                that._NoteTextBox.Focus();
            else if (e.Key == "Escape")
                that.CloseForm();
        },

        _NoteTextBox_KeyPressed: function (e) {
            var that = this;

            if (e.Key == "Enter")
                that._Save();
            else if (e.Key == "Escape")
                that.CloseForm();
        },

        _NoteTextBox_TextChanged: function (e) {
            var that = this;

        },

        _AccountLookupControl_OpeningLookup: function (e) {
            var that = this;

            e.Sender.SetLookupDataListControlCustomOptions({
                AccountName: 'Tafsili',
                FinancialYear: that._FinancialYearID
            });
        },

        _ValidateForm: function () {
            var that = this;

            var validationError = null;
            var rowNo = that._BindableEntity.get("RowNo");

            if (ValueIsEmpty(that._AccountLookupControl.GetValue())) {
                var messageDialog = afw.MessageDialog.Show(String.Format("کدینگ حساب در سطر {0} وارد نشده است.", rowNo));

                messageDialog.bind("Closed", function (e) { that._AccountLookupControl.Focus(); });
                return false
            }

            if (ValueIsEmpty(that._DebtorAmountTextBox.GetText()) && ValueIsEmpty(that._CreditorAmountTextBox.GetText())) {
                var messageDialog = afw.MessageDialog.Show(String.Format("مقدار بدهکار یا بستانکار در سطر {0} وارد نشده است.", rowNo));

                messageDialog.bind("Closed", function (e) { that._DebtorAmountTextBox.Focus(); });
                return false;
            }

            if (!that._FloatAccountsSelectionControl.ValidateControl())
                return false;

            return true;
        },

        _GetAccountInfo: function () {
            var that = this;

            var accountID = that._BindableEntity.get("Account");

            if (accountID == null)
                throw "Account is not set!";

            if (that._AccountInfo == null || that._AccountInfo.GetFieldValue("ID") != accountID)
                that._AccountInfo = afw.uiApi.CallServerMethodSync("acc.GetAccountWithParents", [accountID]);

            return that._AccountInfo;
        },

        _AdjustForm: function () {
            var that = this;

            that._AdjustFloatAccountsSelectionControl();
        },

        _Save: function () {
            var that = this;

            if (!that._ValidateForm())
                return false;

            var saved = false;

            if (ValueIsEmpty(that._BindableEntity.get("DebtorAmount")))
                that._BindableEntity.set("DebtorAmount", 0);

            if (ValueIsEmpty(that._BindableEntity.get("CreditorAmount")))
                that._BindableEntity.set("CreditorAmount", 0);

            try {
                var accDocBindableEntity = that._AccDocEditForm._BindableEntity;
                var accDocEntity = that._AccDocEditForm._BindableEntity.GetEntity();
                var accDocItemEntity = that._BindableEntity.GetEntity();

                if (accDocBindableEntity.GetEntity().ChangeStatus == "Add")
                    accDocBindableEntity.set("DocNo", that._NotSetDocNoValue);

                if (accDocEntity.GetFieldValue("IsAutoGenerated") == true) {
                    var messageDialog = afw.MessageDialog.Show("امکان تغییر سند اتوماتیک وجود ندارد.");

                    messageDialog.bind("Closed", function (e) { that._AccDocEditForm._FinancialDocTypeDropDownList.Focus(); });
                    return;
                }

                if (accDocItemEntity.ChangeStatus == "Add") {
                    if (!ValueIsEmpty(accDocItemEntity.GetFieldValue("Account"))
                        && (!ValueIsEmpty(accDocItemEntity.GetFieldValue("DebtorAmount"))
                        || !ValueIsEmpty(accDocItemEntity.GetFieldValue("CreditorAmount")))) {

                        if (accDocEntity.ChangeStatus == "Add") {
                            if (ValueIsEmpty(accDocEntity.GetFieldValue("FinancialDocType"))) {
                                var messageDialog = afw.MessageDialog.Show("نوع سند مالی را انتخاب نمایید.");

                                messageDialog.bind("Closed", function (e) { that._AccDocEditForm._FinancialDocTypeDropDownList.Focus(); });
                                return false;
                            }

                            if (ValueIsEmpty(accDocEntity.GetFieldValue("OrganizationUnit"))) {
                                var messageDialog = afw.MessageDialog.Show("واحد سازمانی را انتخاب نمایید.");

                                messageDialog.bind("Closed", function (e) { that._AccDocEditForm._OrganizationUnitLookup.Focus(); });
                                return false;
                            }

                            if (ValueIsEmpty(accDocEntity.GetFieldValue("DocStatus"))) {
                                var messageDialog = afw.MessageDialog.Show("وضعیت سند را انتخاب نمایید.");

                                messageDialog.bind("Closed", function (e) { that._AccDocEditForm._FinancialDocTypeDropDownList.Focus(); });
                                return false;
                            }

                            that._AccDocEditForm.CalculateSummaryFieldsFromServer();

                            if (that._AccDocEditForm._SumDebtorAmount > that._AccDocEditForm._SumCreditorAmount) {
                                that._AccDocEditForm._BindableEntity._Entity.SetFieldValue("BalanceStatus", that._AccDocEditForm._DebtorID);
                                that._AccDocEditForm._BindableEntity._Entity.SetFieldValue("RemainingAmount", that._AccDocEditForm._SumDebtorAmount - that._AccDocEditForm._SumCreditorAmount);
                            }
                            else if (that._AccDocEditForm._SumDebtorAmount < that._AccDocEditForm._SumCreditorAmount) {
                                that._AccDocEditForm._BindableEntity._Entity.SetFieldValue("BalanceStatus", that._AccDocEditForm._CreditorID);
                                that._AccDocEditForm._BindableEntity._Entity.SetFieldValue("RemainingAmount", that._AccDocEditForm._SumDebtorAmount - that._AccDocEditForm._SumCreditorAmount);
                            }
                            else {
                                if (accDocItemEntity.GetFieldValue("DebtorAmount") > accDocItemEntity.GetFieldValue("CreditorAmount")) {
                                    that._AccDocEditForm._BindableEntity._Entity.SetFieldValue("BalanceStatus", that._AccDocEditForm._DebtorID);
                                    that._AccDocEditForm._BindableEntity._Entity.SetFieldValue("RemainingAmount", accDocItemEntity.GetFieldValue("DebtorAmount"));
                                }
                                else if (accDocItemEntity.GetFieldValue("DebtorAmount") < accDocItemEntity.GetFieldValue("CreditorAmount")) {
                                    that._AccDocEditForm._BindableEntity._Entity.SetFieldValue("BalanceStatus", that._AccDocEditForm._CreditorID);
                                    that._AccDocEditForm._BindableEntity._Entity.SetFieldValue("RemainingAmount", accDocItemEntity.GetFieldValue("CreditorAmount"));
                                }
                            }

                            afw.uiApi.ApplyEntityChanges(that._AccDocEditForm._BindableEntity._Entity);
                            that._AccDocEditForm._BindableEntity._Entity.ChangeStatus = "Modify";
                            that._AccDocEditForm._FormMode = "Edit";
                            that._AccDocEditForm.GetDocReferenceNoFromServer();

                            afw.uiApi.ApplyEntityChanges(accDocItemEntity);
                            saved = true;
                            that._BindableEntity._Entity.ChangeStatus = "None";
                            that._AccDocEditForm.CalculateSummaryFieldsFromServer();
                            that._AccDocEditForm._ItemsDataListControl._OnToolbarButtonClicked("Reload");

                            that._OnFormSaved();
                        }
                        else {
                            afw.uiApi.ApplyEntityChanges(accDocItemEntity);
                            saved = true;
                            that._BindableEntity._Entity.ChangeStatus = "None";
                            that._AccDocEditForm.CalculateSummaryFieldsFromServer();
                            that._AccDocEditForm._ItemsDataListControl._OnToolbarButtonClicked("Reload");

                            that._OnFormSaved();
                        }
                    }
                }
                else if (accDocItemEntity.ChangeStatus == "Modify") {
                    if (!ValueIsEmpty(accDocItemEntity.GetFieldValue("Account")) &&
                        (!ValueIsEmpty(accDocItemEntity.GetFieldValue("DebtorAmount")) || !ValueIsEmpty(accDocItemEntity.GetFieldValue("CreditorAmount")))) {
                        afw.uiApi.ApplyEntityChanges(accDocItemEntity);
                        saved = true;
                        that._BindableEntity._Entity.ChangeStatus = "None";
                        that._AccDocEditForm.CalculateSummaryFieldsFromServer();
                        that._AccDocEditForm._ItemsDataListControl._OnToolbarButtonClicked("Reload");

                        that._OnFormSaved();
                    }
                }
                else {
                    that.CloseForm();
                }
            }
            catch (ex) {
                saved = false;
                var errorDialog = afw.ErrorDialog.Show("مشکل در ثبت آیتم سند : " + ex.ErrorDetails);

                errorDialog.bind("Closed", function (e) { that._AccDocEditForm._FinancialDocTypeDropDownList.Focus(); });
            }

            return saved;
        },

        GetControl: function(controlName){
            var that = this;

            return that.FindControl(controlName);
        },
        
        _OnPreviewKeyUp: function (e) {
            var that = this;

            if (e.Key == "F9") {
                e.Handled = true;

                if (!that._IsInsertByFloatAccount) {
                    that._ShowInsertByFloatAccountsPanel();
                    that._PersonLookupControl.Focus();
                }
                else {
                    that._HideInsertByFloatAccountsPanel();
                    that._AccountLookupControl.Focus();
                }
            }
            else if ((e.ShiftKey && e.Key == "Control") || (e.CtrlKey && e.Key == "Shift")) {
                var accDocID = that._BindableEntity.get("AccDoc");
                var accDocItemEntityList = afw.uiApi.FetchEntityList("acc.AccDocItem", String.Format("AccDoc = '{0}' and RowNo < {1}", accDocID, that._BindableEntity.get("RowNo")), "RowNo Desc");
                if (accDocItemEntityList.Entities.length > 0) {
                    var account = accDocItemEntityList.Entities[0].GetFieldValue("Account");
                    that._AccountLookupControl.SetValue(account);
                }
            }
        },

        _ShowInsertByFloatAccountsPanel: function () {
            var that = this;

            that._IsInsertByFloatAccount = true;
            that._MainDockPanel.SetPaneSizeSetting(1, 41);
            that.FindControl("InsertByFloatAccountsDockPanel").SetVisible(true);

            that._ClearFloatAccountsLookupExcept("");
            that._HideAccountLookupPanel();
        },

        _HideInsertByFloatAccountsPanel: function () {
            var that = this;

            that._IsInsertByFloatAccount = false;
            that._MainDockPanel.SetPaneSizeSetting(1, 1);
            that._MainDockPanel.SetPaneSizeSetting(2, 41);
            that.FindControl("InsertByFloatAccountsDockPanel").SetVisible(false);

            that._AccountLookupControl.SetValue(null);
        },

        _HideAccountLookupPanel: function () {
            var that = this;

            that._MainDockPanel.SetPaneSizeSetting(2, 1);
            that._AccountLookupControl.SetValue(null);
        },

        _SwitchToAccountButton_Click: function(e){
            var that = this;

            that._HideInsertByFloatAccountsPanel();
        },

        _SwitchToFloatAccountButton_Click: function(e){
            var that = this;

            that._ShowInsertByFloatAccountsPanel();
        },

        _PersonLookupControl_ValueChanged: function (e) {
            var that = this;

            that._HideAccountLookupPanel();

            if (!ValueIsEmpty(that._PersonLookupControl.GetValue())) {
                that._ClearFloatAccountsLookupExcept("Person");

                that._RelativeAccounts = afw.uiApi.CallServerMethodSync("cmn.GetPersonAccounts", [that._PersonLookupControl.GetValue(), that._FinancialYearID]);

                if (ValueIsEmpty(that._RelativeAccounts) || that._RelativeAccounts.Entities.length <1) {
                    var messageDialog = afw.MessageDialog.Show("حسابی برای شناور انتخاب شده یافت نشد!");
                    messageDialog.bind("Closed", function (e) {
                        that._PersonLookupControl.SetValue(null);
                        that._PersonLookupControl.Focus();
                    });
                    return;
                }

                that._OpenRelativeAccountsPopup();
            }
        },

        _CostCenterLookupControl_ValueChanged: function (e) {
            var that = this;

            that._HideAccountLookupPanel();

            if (!ValueIsEmpty(that._CostCenterLookupControl.GetValue())) {
                that._ClearFloatAccountsLookupExcept("CostCenter");

                that._RelativeAccounts = afw.uiApi.CallServerMethodSync("cmn.GetCostCenterAccounts", [that._CostCenterLookupControl.GetValue(), that._FinancialYearID]);

                if (ValueIsEmpty(that._RelativeAccounts) || that._RelativeAccounts.Entities.length < 1) {
                    var messageDialog = afw.MessageDialog.Show("حسابی برای شناور انتخاب شده یافت نشد!");
                    messageDialog.bind("Closed", function (e) {
                        that._CostCenterLookupControl.SetValue(null);
                        that._CostCenterLookupControl.Focus();
                    });
                    return;
                }

                that._OpenRelativeAccountsPopup();
            }
        },

        _ProjectLookupControl_ValueChanged: function (e) {
            var that = this;

            that._HideAccountLookupPanel();

            if (!ValueIsEmpty(that._ProjectLookupControl.GetValue())) {
                that._ClearFloatAccountsLookupExcept("Project");

                that._RelativeAccounts = afw.uiApi.CallServerMethodSync("cmn.GetProjectAccounts", [that._ProjectLookupControl.GetValue(), that._FinancialYearID]);

                if (ValueIsEmpty(that._RelativeAccounts) || that._RelativeAccounts.Entities.length < 1) {
                    var messageDialog = afw.MessageDialog.Show("حسابی برای شناور انتخاب شده یافت نشد!");
                    messageDialog.bind("Closed", function (e) {
                        that._ProjectLookupControl.SetValue(null);
                        that._ProjectLookupControl.Focus();
                    });
                    return;
                }

                that._OpenRelativeAccountsPopup();
            }
        },

        _ForeignCurrencyLookupControl_ValueChanged: function (e) {
            var that = this;

            that._HideAccountLookupPanel();

            if (!ValueIsEmpty(that._ForeignCurrencyLookupControl.GetValue())) {
                that._ClearFloatAccountsLookupExcept("ForeignCurrency");

                that._RelativeAccounts = afw.uiApi.CallServerMethodSync("cmn.GetForeignCurrencyAccounts", [that._ForeignCurrencyLookupControl.GetValue(), that._FinancialYearID]);

                if (ValueIsEmpty(that._RelativeAccounts) || that._RelativeAccounts.Entities.length < 1) {
                    var messageDialog = afw.MessageDialog.Show("حسابی برای شناور انتخاب شده یافت نشد!");
                    messageDialog.bind("Closed", function (e) {
                        that._ForeignCurrencyLookupControl.SetValue(null);
                        that._ForeignCurrencyLookupControl.Focus();
                    });
                    return;
                }

                that._OpenRelativeAccountsPopup();
            }
        },

        _OpenRelativeAccountsPopup: function () {
            var that = this;

            that._AccountsListPopupForm = afw.uiApi.OpenSavedFormWindow("acc.AccountsListPopupForm",
                {
                    Name: "AccountsListPopupForm",
                    Modal: true,
                    Title: "حساب های مرتبط به شناور"
                });

            that._AccountsListPopupForm.Center();

            var accountCodeAndName = { title: "کد و نام حساب ", field: "AccountCodeAndName", rightToLeft: true, width: "fill" };
            var accountID = { title: "", field: "AccountID", rightToLeft: true};
            
            var columns = [accountCodeAndName, accountID];

            var gridView = that._AccountsListPopupForm.FindControl("GridView");
            if (gridView != null)
                gridView.Destroy();

            that._RelativeAccountsGridView = new afw.GridView({
                ParentControl: that._AccountsListPopupForm.FindControl("AccountListPanel"),
                Name: "GridView",
                FillParent: true,
                Columns: columns,
                SelectionMode: "SingleRow"
            });

            that._RelativeAccountsGridView.SetColumnVisible("AccountID", false),

            that._RelativeAccountsGridView.GetDataSource().data(that._RelativeAccounts.ToDataSourceData());            

            that._RelativeAccountsGridView.bind("RowDoubleClick", function (e) { that._RelativeAccountsGridView_RowDoubleClick(e); });
            that._RelativeAccountsGridView.bind("RowKeyPressed", function (e) { that._RelativeAccountsGridView_KeyPressed(e); });

            that._AccountsListPopupForm.BindEvent("Opened", function (e) {
                
                that._RelativeAccountsGridView.SelectRowByIndex(0);
                that._RelativeAccountsGridView.Focus();
            });
        },

        _RelativeAccountsGridView_RowDoubleClick: function (e) {
            var that = this;

            var selectedEntities = that._RelativeAccountsGridView.GetSelectedRows();

            if (selectedEntities.length == 0) {
                var errorDialog = afw.ErrorDialog.Show('ابتدا یک حساب را انتخاب نمایید.');

                errorDialog.bind("Closed", function (e) { that._AccountLookupControl.Focus(); });
                return;
            }
            else {
                that._HideInsertByFloatAccountsPanel();
                that._AccountLookupControl.SetValue(selectedEntities[0].DataItem.AccountID);
                that._SetFloatAccounts();
                that._AccountsListPopupForm.Close();
            }            
        },

        _RelativeAccountsGridView_KeyPressed: function(e){
            var that = this;

            if (e.Key == "Enter") {
                that._RelativeAccountsGridView_RowDoubleClick(e);
            }
        },

        _ClearFloatAccountsLookupExcept: function (exceptionFloatLookup) {
            var that = this;

            var floatLookup = ["Person", "Project", "CostCenter", "ForeignCurrency"];

            for (var i = 0; i < floatLookup.length ; i++) {
                if (floatLookup[i] != exceptionFloatLookup)
                    that.FindControl(floatLookup[i] + "LookupControl").SetValue(null);
            }            
        },

        _SetFloatAccounts: function () {
            var that = this;

            var floatLookup = ["Person", "Project", "CostCenter", "ForeignCurrency"];

            for (var i = 0; i < floatLookup.length ; i++) {
                var lookup = that.FindControl(floatLookup[i] + "LookupControl");
                var floatAccountPanelLookup = that._FloatAccountsSelectionControl.FindControl(floatLookup[i] + "LookupControl");
                
                if (!ValueIsEmpty(lookup.GetValue()))
                    if (!ValueIsEmpty(floatAccountPanelLookup))
                        floatAccountPanelLookup.SetValue(lookup.GetValue());
            }

            that._SetFocusForAfterAccountLookup();
        },

        _SetFocusForAfterAccountLookup: function () {
            var that = this;

            if (that._FloatAccountsPanel.GetVisible()) {
                var firstEmptyFloatLookup = that._FloatAccountsSelectionControl.GetFirstEmptyControl();

                if (firstEmptyFloatLookup != null)
                    firstEmptyFloatLookup.Focus();
                else
                    that._DebtorAmountTextBox.Focus();
            }
            else
                that._DebtorAmountTextBox.Focus();
        },

        /*
        GetFloatsInfo: function () {
            var that = this;

            var floatInfos = [];

            //if account has person floatAccount
                floatInfos.push({
                    Name: "Person",
                    Value: that._FloatAccountsSelectionControl.FindControl("PersonLookupControl").GetValue()
                });
            }
                        
            //if account has CostCenter floatAccount
                shenavars.push(that._FloatAccountsSelectionControl.FindControl("CostCenterLookupControl").GetValue());
                shenavarsType.push("CostCenter");
            }

            .
            .
            .


            if (!ValueIsEmpty(that._FloatAccountsSelectionControl.FindControl("ProjectLookupControl"))) {
                shenavars.push(that._FloatAccountsSelectionControl.FindControl("ProjectLookupControl").GetValue());
                shenavarsType.push("Project");
            }
            if (!ValueIsEmpty(that._FloatAccountsSelectionControl.FindControl("ForeignCurrencyLookupControl"))) {
                shenavars.push(that._FloatAccountsSelectionControl.FindControl("ForeignCurrencyLookupControl").GetValue());
                shenavarsType.push("ForeignCurrency");
            }

            return {
                Shenavars: shenavars,
                ShenavarsType: shenavarsType
                };
        },
        */
        Save: function () {
            var that = this;

            return that._Save();
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "acc.AccDocItemForm";
    FormClass.BaseType = afw.BasePanel;

    acc.AccDocItemForm = FormClass;
})();
(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return acc.AccDocItemEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._AccDocEditForm = options.AccDocEditForm;

            that._IsCalculatingAmounts = false;
            that._HasFloat = false;
            that._CreatedControls = false;

            that._RowNoLabel = that.FindControl("RowNoLabel");
            that._AccountLookupControl = that.FindControl("AccountLookupControl");
            that._DebtorAmountTextBox = that.FindControl("DebtorAmountTextBox");
            that._CreditorAmountTextBox = that.FindControl("CreditorAmountTextBox");
            that._NoteTextBox = that.FindControl("NoteTextBox");
            that._IsActiveCheckBox = that.FindControl("IsActiveCheckBox");
            that._AccountAutoComplete = that._AccountLookupControl.GetAutoComplete();

            that._AccountLookupControl.bind("ValueChanged", function (e) { that._AccountLookupControl_ValueChanged(e); });
            that._AccountLookupControl.bind("OpeningLookup", function (e) { that._AccountLookupControl_OpeningLookup(e); });
            that._AccountAutoComplete.bind("KeyPressed", function (e) { that._AccountAutoComplete_KeyPressed(e); });
            that._NoteTextBox.bind("KeyPressed", function (e) { that._NoteTextBox_KeyPressed(e); });
            that._DebtorAmountTextBox.bind("KeyPressed", function (e) { that._DebtorAmountTextBox_KeyPressed(e); });
            that._CreditorAmountTextBox.bind("KeyPressed", function (e) { that._CreditorAmountTextBox_KeyPressed(e); });
            that._NoteTextBox.bind("TextChanged", function (e) { that._NoteTextBox_TextChanged(e); });

            that._RowNoLabel.InitDataBinding(that._BindableEntity);
            that._NoteTextBox.InitDataBinding(that._BindableEntity);

            if (that._FormMode == "New") {
                that._AccountLookupControl.SetValue(null);
            }

            that._MainDockPanel = that.FindControl("MainDockPanel");
            that._FloatAccountsPanel = that.FindControl("FloatAccountsPanel");
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

            that._BindableEntity.bind("change", function (e) { that._BindableEntity_change(e); });
            that._AccountLookupControl.Focus();
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

                that._MainDockPanel.SetPaneSizeSetting(2, 70);
                that._FloatAccountsPanel.SetVisible(true);
                that._FloatAccountsSelectionControl.SetVisible(true);
                that._FloatAccountsSelectionControl.SetFillParent(true);
            }
            else {
                that._MainDockPanel.SetPaneSizeSetting(2, 1);
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
                        afw.MessageDialog.Show("به علت داشتن زیرمجموعه در این سطح از کدینگ حساب نمیتوانید سند صادر کنید.");
                    }
                }
                else if (accountLevelName == 'Moin') {
                    accountEntityList = afw.uiApi.FetchEntityList("acc.Account", String.Format("ParentAccount = '{0}'", accountID));
                    if (accountEntityList.Entities.length > 0) {
                        that._AccountLookupControl.SetValue(null);
                        afw.MessageDialog.Show("به علت داشتن زیرمجموعه در این سطح از کدینگ حساب نمیتوانید سند صادر کنید.");
                    }
                }
            }

            that._AdjustFloatAccountsSelectionControl();
            that._SetFocusForAfterAccountLookup();
        },

        _AccountAutoComplete_KeyPressed: function (e) {
            var that = this;
            if (e.Key == "Enter")
                that._AccountLookupControl._OpenLookup();
        },

        _DebtorAmountTextBox_KeyPressed: function (e) {
            var that = this;
            if (e.Key == "Enter")
                that._CreditorAmountTextBox.Focus();
        },

        _CreditorAmountTextBox_KeyPressed: function (e) {
            var that = this;
            if (e.Key == "Enter")
                that._SetFocusForAfterAccountLookup();
        },

        _NoteTextBox_KeyPressed: function (e) {
            var that = this;
            if (e.Key == "Enter") {

                that._OnToolbarButtonClicked("SaveAndClose");
            }
        },

        _NoteTextBox_TextChanged: function (e) {
            var that = this;

        },

        _AccountLookupControl_OpeningLookup: function (e) {
            var that = this;

            e.Sender.SetLookupDataListControlCustomOptions({
                AccountName: 'Tafsili',
                FinancialYear: cmn.GetUserActiveFinancialYearID()
            });
        },

        _BindableEntity_change: function (e) {
            var that = this;

            if (ValueIsIn(e.field, ["Account", "DebtorAmount", "CreditorAmount", "Person", "CostCenter", "Project", "ForeignCurrency"])) {
                if (that._IsCalculatingAmounts)
                    return;

                that._IsCalculatingAmounts = true;
                try {

                    if (e.field == "DebtorAmount") {
                        var debtorAmount = that._BindableEntity.get("DebtorAmount");
                        if (debtorAmount == null)
                            that._BindableEntity.set("DebtorAmount", 0);
                        else
                            that._BindableEntity.set("CreditorAmount", 0);
                    }

                    if (e.field == "CreditorAmount") {
                        var creditorAmount = that._BindableEntity.get("CreditorAmount");
                        if (creditorAmount == null)
                            that._BindableEntity.set("CreditorAmount", 0);
                        else
                            that._BindableEntity.set("DebtorAmount", 0);
                    }

                    if (e.field == "Person") {
                        that._BindableEntity.set("Person",
                            that._FloatAccountsSelectionControl.FindControl("PersonLookupControl").GetValue());
                    }

                    if (e.field == "CostCenter") {
                        that._BindableEntity.set("CostCenter",
                            that._FloatAccountsSelectionControl.FindControl("CostCenterLookupControl").GetValue());
                    }

                    if (e.field == "Project") {
                        that._BindableEntity.set("Project",
                            that._FloatAccountsSelectionControl.FindControl("ProjectLookupControl").GetValue());
                    }

                    if (e.field == "ForeignCurrency") {
                        that._BindableEntity.set("ForeignCurrency",
                            that._FloatAccountsSelectionControl.FindControl("ForeignCurrencyLookupControl").GetValue());
                    }

                    //that._AccDocEditForm._SumDebtorAndCreditor();
                }
                finally {
                    that._IsCalculatingAmounts = false;
                }
            }
        },

        _OnOpened: function (sender, e) {
            var that = this;

            afw.Window.fn._OnOpened.call(that);
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
        },

        _ValidateForm: function () {
            var that = this;

            if (!afw.EntityWindowBase.fn._ValidateForm.call(that))
                return false;

            var validationError = null;
            var rowNo = that._BindableEntity.get("RowNo");

            if (that._AccountLookupControl.GetValue() != null
                || !ValueIsEmpty(that._DebtorAmountTextBox.GetText())
                || !ValueIsEmpty(that._CreditorAmountTextBox.GetText())) {
                if (that._AccountLookupControl.GetValue() == null)
                    validationError = String.Format("کدینگ حساب در سطر {0} وارد نشده است.", rowNo);
                else if (ValueIsEmpty(that._DebtorAmountTextBox.GetText()))
                    validationError = String.Format("مقدار بدهکار در سطر {0} وارد نشده است.", rowNo);
                else if (ValueIsEmpty(that._CreditorAmountTextBox.GetText()))
                    validationError = String.Format("مقدار بستانکار در سطر {0} وارد نشده است.", rowNo);
            }

            if (ValueIsEmpty(validationError))
                return true;
            else {
                afw.MessageDialog.Show(validationError);
                return false;
            }
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

        _SetFocusForAfterAccountLookup: function () {
            var that = this;

            if (that._FloatAccountsPanel.GetVisible()) {
                var firstEmptyFloatLookup = that._FloatAccountsSelectionControl.GetFirstEmptyControl();

                if (firstEmptyFloatLookup != null)
                    firstEmptyFloatLookup.Focus();
                else
                    that._NoteTextBox.Focus();
            }
            else
                that._NoteTextBox.Focus();
        },

        _Save: function () {
            var that = this;

            var saved = afw.EntityWindowBase.fn._Save.call(that);

            return saved;
        }
    });

    //Static Members:

    FormClass.TypeName = "acc.AccDocItemEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    acc.AccDocItemEditForm = FormClass;
})();
(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return acc.AccDocItemsGridRowControl;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._BindableEntity = options.RowEntity.ToBindableEntity();
            that._GridControl = options.GridControl;

            that._IsSettingDiscount = false;
            that._IsSettingDiscountPercent = false;
            that._IsCalculatingAmounts = false;
            that._AccountInfo = null;
            that._HasFloat = false;

            that._CreatedControls = false;

            that._ItemWrapperDockPanel = that.FindControl("ItemWrapperDockPanel");
            that._ItemDockPanel = that.FindControl("ItemDockPanel");
            that._FloatItemDockPanel = that.FindControl("FloatItemDockPanel");

            that._AccountLookupControl = that.FindControl("AccountLookupControl");
            that._DebtorAmountTextBox = that.FindControl("DebtorAmountTextBox");
            that._CreditorAmountTextBox = that.FindControl("CreditorAmountTextBox");
            that._NoteLookupControl = that.FindControl("NoteLookupControl");
            that._IsActiveCheckBox = that.FindControl("IsActiveCheckBox");
            that._RemoveButton = that.FindControl("RemoveButton");
            that._RemoveButton.SetVisible(false);

            that._AccountAutoComplete = that._AccountLookupControl.GetAutoComplete();
            that._NoteAutoComplete = that._NoteLookupControl.GetAutoComplete();

            that._AccountBrowseButton = that._AccountLookupControl.FindControl("BrowseButton");
            //that._AccountBrowseButton.SetVisible(false);

            that._NoteBrowseButton = that._NoteLookupControl.FindControl("BrowseButton");
            //that._NoteBrowseButton.SetVisible(false);

            that.FindControl("RowNoLabel").InitDataBinding(that._BindableEntity);
            that._AccountLookupControl.InitDataBinding(that._BindableEntity);
            that._DebtorAmountTextBox.InitDataBinding(that._BindableEntity);
            that._CreditorAmountTextBox.InitDataBinding(that._BindableEntity);
            that._IsActiveCheckBox.InitDataBinding(that._BindableEntity);

            that._AccountLookupControl.bind("ValueChanged", function (e) { that._AccountLookupControl_ValueChanged(e); });
            that._AccountLookupControl.bind("OpeningLookup", function (e) { that._AccountLookupControl_OpeningLookup(e); });

            that._AccountAutoComplete.bind("KeyPressed", function (e) { that._AccountAutoComplete_KeyPressed(e); });
            that._NoteAutoComplete.bind("KeyPressed", function (e) { that._NoteAutoComplete_KeyPressed(e); });
            that._DebtorAmountTextBox.bind("KeyPressed", function (e) { that._DebtorAmountTextBox_KeyPressed(e); });
            that._CreditorAmountTextBox.bind("KeyPressed", function (e) { that._CreditorAmountTextBox_KeyPressed(e); });


            that._NoteAutoComplete.bind("TextChanged", function (e) { that._NoteAutoComplete_TextChanged(e); });

            that._AccountAutoComplete.bind("GotFocus", function (e) { that._InputControl_GotFocus(e); });
            that._NoteAutoComplete.bind("GotFocus", function (e) { that._InputControl_GotFocus(e); });
            that._DebtorAmountTextBox.bind("GotFocus", function (e) { that._InputControl_GotFocus(e); });
            that._CreditorAmountTextBox.bind("GotFocus", function (e) { that._InputControl_GotFocus(e); });

            that._AccountAutoComplete.bind("LostFocus", function (e) { that._InputControl_LostFocus(e); });
            that._NoteAutoComplete.bind("LostFocus", function (e) { that._InputControl_LostFocus(e); });
            that._DebtorAmountTextBox.bind("LostFocus", function (e) { that._InputControl_LostFocus(e); });
            that._CreditorAmountTextBox.bind("LostFocus", function (e) { that._InputControl_LostFocus(e); });

            that._RemoveButton.bind("Click", function (e) { that._RemoveButton_Click(e); });

            that._NoteAutoComplete.SetText(that._BindableEntity.get("Note"));
            that._IsActiveCheckBox.SetValue(that._BindableEntity.get("IsActive"));

            if (that._FormMode == "New") {
                that._AccountLookupControl.SetValue(null);
            }
            else {
                var accountID = that._AccountLookupControl.GetValue();
                if (accountID != null && acc.AccountHasFloat(accountID))
                    that._CreateFloatLookupControls(accountID);
            }

            that._BindableEntity.bind("change", function (e) { that._BindableEntity_change(e); });

            that.AdjustColor();
            that._ForeignCurrencyPopup = null;

            that._CurrencyDebtorRatio = false;
            that._CurrencyCreditorRatio = false;
        },

        GetRowIndex: function () {
            var that = this;

            return that._BindableEntity.get("RowNo") - 1;
        },

        _AccountLookupControl_ValueChanged: function (e) {
            var that = this;

            var rowIndex = that.GetRowIndex();
            var accountID = that._BindableEntity.get("Account");

            that._GridControl.PreviousSelectedRowNo = rowIndex;
            that._GridControl.PreviousSelectedAccount = accountID;

            var debtorAmount = null;
            var creditorAmount = null;

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

                if (acc.AccountHasFloat(accountID))
                    that._CreateFloatLookupControls(accountID);


                if (that._FloatItemDockPanel.Panes[2].HasChildControls) {
                    that._FloatItemDockPanel.Panes[2].ChildControls[0].Focus();
                }
                else {
                    that._DebtorAmountTextBox.Focus();
                }
            }
            else
                that._DestroyFloatLookupControls();
        },
        _FloatLookupControls_ValueChanged: function (e) {
            var that = this;

            var paneIndex = e.Sender.ParentControl.GetPaneIndex();
            if (e.Sender.GetValue() != null) {
                if (e.Sender.GetName() == "ForeignCurrencyLookupControl") {
                    that._OpenForeignCurrencyPopup();
                }
                else if (that._FloatItemDockPanel.Panes[paneIndex + 2].HasChildControls)
                    that._FloatItemDockPanel.Panes[paneIndex + 2].ChildControls[0].Focus();
                else
                    that._DebtorAmountTextBox.Focus();
            }
            else {
                //var titleFloat = that._FloatItemDockPanel.Panes[paneIndex - 1].ChildControls[0].GetText();
                //afw.MessageDialog.Show("مقدار فیلد " + titleFloat + " را مشخص نکرده اید.");
            }
        },

        _OpenForeignCurrencyPopup: function (e) {
            var that = this;

            that._ForeignCurrencyPopup = new afw.Popup({ Name: "WarningsPopup", Width: 470, Height: 115 });
            var popupContentForm = afw.uiApi.CreateSavedFormByName(that._ForeignCurrencyPopup, "acc.AccDocForeignCurrencyPopupForm",
                { FillParent: true });

            that._CurrencyAmountTextBox = popupContentForm.FindControl("CurrencyAmountTextBox");
            that._CurrencyDebtorRatioTextBox = popupContentForm.FindControl("CurrencyDebtorRatioTextBox");
            that._CurrencyCreditorRatioTextBox = popupContentForm.FindControl("CurrencyCreditorRatioTextBox");

            if (!ValueIsEmpty(that._BindableEntity.get("CurrencyAmount")))
                that._CurrencyAmountTextBox.SetText(that._BindableEntity.get("CurrencyAmount"));
            else
                that._CurrencyAmountTextBox.SetText(0);

            if (!ValueIsEmpty(that._BindableEntity.get("CurrencyDebtorRatio")))
                that._CurrencyDebtorRatioTextBox.SetText(that._BindableEntity.get("CurrencyDebtorRatio"));
            else
                that._CurrencyDebtorRatioTextBox.SetText(0);

            if (!ValueIsEmpty(that._BindableEntity.get("CurrencyCreditorRatio")))
                that._CurrencyCreditorRatioTextBox.SetText(that._BindableEntity.get("CurrencyCreditorRatio"));
            else
                that._CurrencyCreditorRatioTextBox.SetText(0);

            that._CurrencyAmountTextBox.bind("KeyPressed", function (e) { that._CurrencyItemsTextBox_KeyPressed(e); });
            that._CurrencyDebtorRatioTextBox.bind("KeyPressed", function (e) { that._CurrencyItemsTextBox_KeyPressed(e); });
            that._CurrencyCreditorRatioTextBox.bind("KeyPressed", function (e) { that._CurrencyItemsTextBox_KeyPressed(e); });

            that._CurrencyAmountTextBox.bind("ValueChanged", function (e) { that._CurrencyItemsTextBox_ValueChanged(e); });
            that._CurrencyDebtorRatioTextBox.bind("ValueChanged", function (e) { that._CurrencyItemsTextBox_ValueChanged(e); });
            that._CurrencyCreditorRatioTextBox.bind("ValueChanged", function (e) { that._CurrencyItemsTextBox_ValueChanged(e); });

            that._ForeignCurrencyPopup.SetAnchor(that._FloatItemDockPanel, "bottom right", "top right");
            that._ForeignCurrencyPopup.Open();

            setTimeout(function () {
                that._CurrencyAmountTextBox.Focus();
            }, 600);
        },

        _CurrencyItemsTextBox_ValueChanged: function (e) {
            var that = this;

            if (e.Sender.GetName() == "CurrencyDebtorRatioTextBox") {
                var currencyDebtorRatio = that._CurrencyDebtorRatioTextBox.GetValue();
                if (currencyDebtorRatio == null || currencyDebtorRatio == "0")
                    that._CurrencyDebtorRatioTextBox.SetText(0);
                else
                    that._CurrencyCreditorRatioTextBox.SetText(0);
            }

            if (e.Sender.GetName() == "CurrencyCreditorRatioTextBox") {
                var currencyCreditorRatio = that._CurrencyCreditorRatioTextBox.GetValue()
                if (currencyCreditorRatio == null || currencyCreditorRatio == "0")
                    that._CurrencyCreditorRatioTextBox.SetText(0);
                else
                    that._CurrencyDebtorRatioTextBox.SetText(0);
            }

            //if (e.Sender.GetName() == "CurrencyDebtorRatioTextBox") {
            //    try {
            //        that._CurrencyDebtorRatio = true; 
            //        if (!that._CurrencyCreditorRatio) { 
            //            if (ValueIsEmpty(that._CurrencyDebtorRatioTextBox.GetValue()))
            //                that._CurrencyDebtorRatioTextBox.SetText(0);
            //            else
            //                that._CurrencyCreditorRatioTextBox.SetText(0);
            //        }
            //    }
            //    finally {
            //        that._CurrencyDebtorRatio = false;
            //    }
            //}
            //else if (e.Sender.GetName() == "CurrencyCreditorRatioTextBox") {
            //    try {
            //        that._CurrencyCreditorRatio = true; 
            //        if (!that._CurrencyDebtorRatio) { 
            //            if (ValueIsEmpty(that._CurrencyCreditorRatioTextBox.GetValue()))
            //                that._CurrencyCreditorRatioTextBox.SetText(0);
            //            else
            //                that._CurrencyDebtorRatioTextBox.SetText(0);
            //        }
            //    }
            //    finally {
            //        that._CurrencyCreditorRatio = false;
            //    }
            //}

            if (!ValueIsEmpty(that._CurrencyDebtorRatioTextBox.GetValue() && !ValueIsEmpty(that._CurrencyAmountTextBox.GetValue()))) {
                if (that._CurrencyAmountTextBox.GetValue() != 0 && that._CurrencyDebtorRatioTextBox.GetValue() != 0) {
                    that._BindableEntity.set("CurrencyAmount", that._CurrencyAmountTextBox.GetValue());
                    that._BindableEntity.set("CurrencyDebtorRatio", that._CurrencyDebtorRatioTextBox.GetValue());
                    that._BindableEntity.set("CurrencyCreditorRatio", 0);

                    that._DebtorAmountTextBox.SetText(that._CurrencyAmountTextBox.GetValue() * that._CurrencyDebtorRatioTextBox.GetValue());
                }
                else {
                    that._DebtorAmountTextBox.SetText(0);
                }
            }

            if (!ValueIsEmpty(that._CurrencyCreditorRatioTextBox.GetValue() && !ValueIsEmpty(that._CurrencyAmountTextBox.GetValue()))) {
                if (that._CurrencyAmountTextBox.GetValue() != 0 && that._CurrencyCreditorRatioTextBox.GetValue() != 0) {
                    that._BindableEntity.set("CurrencyAmount", that._CurrencyAmountTextBox.GetValue());
                    that._BindableEntity.set("CurrencyCreditorRatio", that._CurrencyCreditorRatioTextBox.GetValue());
                    that._BindableEntity.set("CurrencyDebtorRatio", 0);

                    that._CreditorAmountTextBox.SetText(that._CurrencyAmountTextBox.GetValue() * that._CurrencyCreditorRatioTextBox.GetValue());
                }
                else {
                    that._CreditorAmountTextBox.SetText(0);
                }
            }
        },

        _CurrencyItemsTextBox_KeyPressed: function (e) {
            var that = this;

            if (e.Key == "Enter") {
                if (e.Sender.GetName() == "CurrencyAmountTextBox") {
                    that._CurrencyDebtorRatioTextBox.Focus();
                }
                else if (e.Sender.GetName() == "CurrencyDebtorRatioTextBox") {
                    that._CurrencyCreditorRatioTextBox.Focus();
                }
                else if (e.Sender.GetName() == "CurrencyCreditorRatioTextBox") {
                    that._DebtorAmountTextBox.Focus();
                    that._ForeignCurrencyPopup.Close();
                }
            }

            //if (e.Key == "ArrowUp") {
            //    if (e.Sender.GetName() == "CurrencyAmountTextBox") {
            //        that._CurrencyCreditorRatioTextBox.Focus();
            //    }
            //    else if (e.Sender.GetName() == "CurrencyDebtorRatioTextBox") {
            //        that._CurrencyAmountTextBox.Focus();
            //    }
            //    else if (e.Sender.GetName() == "CurrencyCreditorRatioTextBox") {
            //        that._CurrencyDebtorRatioTextBox.Focus();
            //    }
            //}
            //if (e.Key == "ArrowDown") {
            //    if (e.Sender.GetName() == "CurrencyAmountTextBox") {
            //        that._CurrencyDebtorRatioTextBox.Focus();
            //    }
            //    else if (e.Sender.GetName() == "CurrencyDebtorRatioTextBox") {
            //        that._CurrencyCreditorRatioTextBox.Focus();
            //    }
            //    else if (e.Sender.GetName() == "CurrencyCreditorRatioTextBox") {
            //        that._CurrencyAmountTextBox.Focus();
            //    }
            //} 
        },

        _AccountAutoComplete_KeyPressed: function (e) {
            var that = this;
            if (e.Key == "Enter")
                that._AccountLookupControl._OpenLookup();
            if (e.Key == "ArrowUp") {
                var rowIndex = that.GetRowIndex();
                var isFirstRow = (rowIndex == 0);
                if (!isFirstRow)
                    that._GridControl.GetRowByIndex(rowIndex - 1).Focus();
            }
            if (e.Key == "ArrowDown") {
                var rowIndex = that.GetRowIndex();
                var isLastRow = (rowIndex == that._GridControl.GetRowsCount() - 1);
                if (!isLastRow)
                    that._GridControl.GetRowByIndex(rowIndex + 1).Focus();
            }
        },
        _FloatAutoComplete_KeyPressed: function (e) {
            var that = this;
            if (e.Key == "Enter") {
                var paneIndex = e.Sender.ParentControl.ParentControl.ParentControl.ParentControl.GetPaneIndex();
                var floatAutoComplete = e.Sender.ParentControl.ParentControl.ParentControl;
                if (floatAutoComplete.GetValue() == null)
                    floatAutoComplete._OpenLookup();
                else {
                    if (that._FloatItemDockPanel.Panes[paneIndex + 2].HasChildControls)
                        that._FloatItemDockPanel.Panes[paneIndex + 2].ChildControls[0].Focus();
                    else
                        that._DebtorAmountTextBox.Focus();
                }
            }
            if (e.Key == "ArrowUp") {
                var rowIndex = that.GetRowIndex();
                var isFirstRow = (rowIndex == 0);
                if (!isFirstRow)
                    that._GridControl.GetRowByIndex(rowIndex - 1).Focus();
            }
            if (e.Key == "ArrowDown") {
                var rowIndex = that.GetRowIndex();
                var isLastRow = (rowIndex == that._GridControl.GetRowsCount() - 1);
                if (!isLastRow)
                    that._GridControl.GetRowByIndex(rowIndex + 1).Focus();
            }
        },
        _DebtorAmountTextBox_KeyPressed: function (e) {
            var that = this;
            if (e.Key == "Enter")
                that._CreditorAmountTextBox.Focus();
            if (e.Key == "ArrowUp") {
                var rowIndex = that.GetRowIndex();
                var isFirstRow = (rowIndex == 0);
                if (!isFirstRow)
                    that._GridControl.GetRowByIndex(rowIndex - 1).Focus();
            }
            if (e.Key == "ArrowDown") {
                var rowIndex = that.GetRowIndex();
                var isLastRow = (rowIndex == that._GridControl.GetRowsCount() - 1);
                if (!isLastRow)
                    that._GridControl.GetRowByIndex(rowIndex + 1).Focus();
            }
        },
        _CreditorAmountTextBox_KeyPressed: function (e) {
            var that = this;
            if (e.Key == "Enter")
                that._NoteLookupControl.Focus();
            if (e.Key == "ArrowUp") {
                var rowIndex = that.GetRowIndex();
                var isFirstRow = (rowIndex == 0);
                if (!isFirstRow)
                    that._GridControl.GetRowByIndex(rowIndex - 1).Focus();
            }
            if (e.Key == "ArrowDown") {
                var rowIndex = that.GetRowIndex();
                var isLastRow = (rowIndex == that._GridControl.GetRowsCount() - 1);
                if (!isLastRow)
                    that._GridControl.GetRowByIndex(rowIndex + 1).Focus();
            }
        },
        _NoteAutoComplete_KeyPressed: function (e) {
            var that = this;
            if (e.Key == "Enter") {

                var rowIndex = that.GetRowIndex();
                var isLastRow = (rowIndex == that._GridControl.GetRowsCount() - 1);
                if (!isLastRow)
                    that._GridControl.GetRowByIndex(rowIndex + 1).Focus();
                else
                    that._GridControl.AddEmptyItems(1);
            }
            if (e.Key == "ArrowUp") {
                var rowIndex = that.GetRowIndex();
                var isFirstRow = (rowIndex == 0);
                if (!isFirstRow)
                    that._GridControl.GetRowByIndex(rowIndex - 1).Focus();
            }
            if (e.Key == "ArrowDown") {
                var rowIndex = that.GetRowIndex();
                var isLastRow = (rowIndex == that._GridControl.GetRowsCount() - 1);
                if (!isLastRow)
                    that._GridControl.GetRowByIndex(rowIndex + 1).Focus();
            }
        },

        _NoteAutoComplete_TextChanged: function (e) {
            var that = this;

            var autoComplete = e.Sender;

            setTimeout(function () {
                if (autoComplete.GetText().length > 1 && autoComplete.GetValue() == null) {
                    that._Note = autoComplete.GetText();
                    that._BindableEntity._Entity.SetFieldValue("Note", that._Note);
                }
                else
                    that._Note = "";
            }, 500);
        },

        _InputControl_GotFocus: function (e) {
            var that = this;

            var rowControl = that._GetRowControl(e);

            setTimeout(function () {
                if (!rowControl.IsDestroying)
                    rowControl._RemoveButton.SetVisible(true);
            }, 400);

            that._GridControl.CurrentSelectedRowNo = rowControl._BindableEntity.get("RowNo");
            that._GridControl.CurrentSelectedAccount = rowControl._BindableEntity.get("Account");

            var docStatus_NotCheckedID = afw.OptionSetHelper.GetOptionSetItemID("acc.DocStatus.NotChecked");

            if (that._GridControl._AccDocEditForm.GetDocStatusID() == docStatus_NotCheckedID) {
                that._CompareRowControls();
            }
        },

        _InputControl_LostFocus: function (e) {
            var that = this;

            var rowControl = that._GetRowControl(e);

            setTimeout(function () {
                if (!rowControl.IsDestroying)
                    rowControl._RemoveButton.SetVisible(false);
            }, 300);

            that._GridControl.PreviousSelectedRowNo = rowControl._BindableEntity.get("RowNo");
            that._GridControl.PreviousSelectedAccount = rowControl._BindableEntity.get("Account");

            that._GridControl._PreviousRowControl = rowControl;
        },

        _AccountLookupControl_OpeningLookup: function (e) {
            var that = this;

            e.Sender.SetLookupDataListControlCustomOptions({
                AccountName: 'Tafsili',
                FinancialYear: cmn.GetUserActiveFinancialYearID()
            });
        },

        _GetRowControl: function (e) {
            var that = this;

            var findRowControl = true;
            var parentControl = e.Sender.ParentControl;

            while (findRowControl) {
                typeName = parentControl.ParentControl.GetType().TypeName;
                if (typeName == "acc.AccDocItemsGridRowControl") {
                    findRowControl = false;
                    return parentControl.ParentControl;
                }
                else {
                    parentControl = parentControl.ParentControl;
                }
            }
        },

        _CompareRowControls: function () {
            var that = this;

            if (that._GridControl.CurrentSelectedRowNo != that._GridControl.PreviousSelectedRowNo) {
                if (!ValueIsEmpty(that._GridControl._PreviousRowControl)) {
                    var rowBindableEntity = that._GridControl._PreviousRowControl.GetBindableEntity();
                    var rowEntity = rowBindableEntity.GetEntity();

                    if (rowEntity.ChangeStatus == "Add" || rowEntity.ChangeStatus == "Modify") {

                        that._GridControl.SaveRow(rowEntity);
                    }
                }
            }
        },

        GetBindableEntity: function () {
            var that = this;

            return that._BindableEntity;
        },

        AdjustColor: function () {
            var that = this;

            var rowNo = that._BindableEntity.get("RowNo");

            if (afw.BaseUtils.NumberIsOdd(rowNo))
                that.SetBackColor("#ffffff");
            else
                that.SetBackColor("#f7f7f7");
        },

        ValidateRow: function () {
            var that = this;

            var validationError = null;
            var rowNo = that._BindableEntity.get("RowNo");

            if (that._AccountLookupControl.GetValue() != null
                /*|| that._HasFloat == true*/
                || !ValueIsEmpty(that._DebtorAmountTextBox.GetText())
                || !ValueIsEmpty(that._CreditorAmountTextBox.GetText())) {
                if (that._AccountLookupControl.GetValue() == null)
                    validationError = String.Format("کدینگ حساب در سطر {0} وارد نشده است.", rowNo);
                else if (ValueIsEmpty(that._DebtorAmountTextBox.GetText()))
                    validationError = String.Format("مقدار بدهکار در سطر {0} وارد نشده است.", rowNo);
                else if (ValueIsEmpty(that._CreditorAmountTextBox.GetText()))
                    validationError = String.Format("مقدار بستانکار در سطر {0} وارد نشده است.", rowNo);
                /*else if (that._HasFloat == true) {
                    if (that._PersonLookupControl.GetValue() != null
                        || that._CostCenterLookupControl.GetValue() != null
                        || that._ProjectLookupControl.GetValue() != null) {
                        if (that._PersonLookupControl.GetValue() == null)
                            validationError = String.Format("شخص در سطر {0} وارد نشده است.", rowNo);
                        else if (that._CostCenterLookupControl.GetValue() == null)
                            validationError = String.Format("هزینه در سطر {0} وارد نشده است.", rowNo);
                        else if (that._ProjectLookupControl.GetValue() == null)
                            validationError = String.Format("پروژه در سطر {0} وارد نشده است.", rowNo);
                    }
                }*/
            }
        },

        Focus: function () {
            var that = this;

            that._GridControl.CurrentSelectedRowNo = 0;
            that._AccountLookupControl.Focus();
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

                    }
                    if (e.field == "CostCenter") {

                    }
                    if (e.field == "Project") {

                    }
                    if (e.field == "ForeignCurrency") {

                    }

                    that._GridControl._AccDocEditForm._SumDebtorAndCreditor();
                }
                finally {
                    that._IsCalculatingAmounts = false;
                }
            }

            that.AdjustColor();
        },

        _RemoveButton_Click: function (e) {
            var that = this;

            that._GridControl.RemoveRow(that);

            if (that._GridControl.GetRowsCount() > 0)
                that._GridControl.GetRowByIndex(0).Focus();
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
        _GetNoteInfo: function () {
            var that = this;

            var noteID = that._BindableEntity.get("Note");

            if (noteID == null)
                throw "Account is not set!";

            if (that._NoteInfo == null || that._NoteInfo.GetFieldValue("ID") != noteID)
                that._NoteInfo = afw.uiApi.CallServerMethodSync("acc.GetNote", [noteID]);

            return that._NoteInfo;
        },
        _GetPersonInfo: function () {
            var that = this;

            var personID = that._BindableEntity.get("Person");
            if (personID == null)
                throw "Person is not set!";

            //if (that._AccountInfo == null || that._AccountInfo.GetFieldValue("ID") != accountID)
            //    that._AccountInfo = afw.uiApi.CallServerMethodSync("acc.GetAccountWithParents", [accountID]);

            return that._PersonInfo;
        },
        _GetCostCenterInfo: function () {
            var that = this;

            var costCenterID = that._BindableEntity.get("CostCenter");
            if (costCenterID == null)
                throw "CostCenter is not set!";

            //if (that._AccountInfo == null || that._AccountInfo.GetFieldValue("ID") != accountID)
            //    that._AccountInfo = afw.uiApi.CallServerMethodSync("acc.GetAccountWithParents", [accountID]);

            return that._CostCenterInfo;
        },
        _GetProjectInfo: function () {
            var that = this;

            var projectID = that._BindableEntity.get("Project");
            if (projectID == null)
                throw "Project is not set!";

            //if (that._AccountInfo == null || that._AccountInfo.GetFieldValue("ID") != accountID)
            //    that._AccountInfo = afw.uiApi.CallServerMethodSync("acc.GetAccountWithParents", [accountID]);

            return that._ProjectInfo;
        },
        _GetForeignCurrencyInfo: function () {
            var that = this;

            var ForeignCurrencyID = that._BindableEntity.get("ForeignCurrency");
            if (ForeignCurrencyID == null)
                throw "ForeignCurrency is not set!";

            //if (that._AccountInfo == null || that._AccountInfo.GetFieldValue("ID") != accountID)
            //    that._AccountInfo = afw.uiApi.CallServerMethodSync("acc.GetAccountWithParents", [accountID]);

            return that._ForeignCurrencyInfo;
        },

        _CreateFloatLookupControls: function (accountID) {
            var that = this;

            var paneItem = 0;
            var floatLookupControl = null;
            var floatAutoComplete = null;

            var floatItems = [];

            if (accountID != null) {
                var floatPriorityEntity = afw.uiApi.FetchEntity("cmn.FloatPriority", String.Format("Account = '{0}'", accountID));
                if (floatPriorityEntity != null)
                    floatItems = that.SortPriority(floatPriorityEntity);
            }

            for (var i = 0; i < floatItems.length - 1; i++) {
                var floatName = floatItems[i + 1].Name;

                paneItem++;
                var label = new afw.Label({
                    ParentControl: that._FloatItemDockPanel.Panes[paneItem],
                    Name: "label" + (i + 1),
                    Text: floatItems[i + 1].Title,
                    Visible: true
                });

                paneItem++;
                if (floatName == "Person")
                    that._FloatItemDockPanel.SetPaneSizeSetting(paneItem, 200);
                else
                    that._FloatItemDockPanel.SetPaneSizeSetting(paneItem, 200);

                floatLookupControl = new afw.SingleEntityLookupControl({
                    ParentControl: that._FloatItemDockPanel.Panes[paneItem],
                    Name: floatName + "LookupControl",
                    DataListFullName: floatItems[i + 1].DataList,
                    EntityCaptionFieldName: floatItems[i + 1].CaptionFieldName,
                    LabelVisible: false,
                    FillParent: true,
                    HasEntityViewButton: false,
                    HasEntityBrowseButton: false,
                    ValueDataMember: floatName,
                    LabelText: floatItems[i + 1].Title,
                    Visible: true,
                    BaseFilterExpression: acc.GetAccountRelatedFloatsFilterExpression(accountID, floatName)
                });

                if (that._FormMode == "New")
                    floatLookupControl.SetValue(null);
                floatLookupControl.InitDataBinding(that._BindableEntity);
                floatLookupControl.bind("ValueChanged", function (e) { that._FloatLookupControls_ValueChanged(e); });
                floatAutoComplete = floatLookupControl.GetAutoComplete();
                floatAutoComplete.bind("KeyPressed", function (e) { that._FloatAutoComplete_KeyPressed(e); });
                floatAutoComplete.bind("GotFocus", function (e) { that._InputControl_GotFocus(e); });
                floatAutoComplete.bind("LostFocus", function (e) { that._InputControl_LostFocus(e); });
            }
        },

        _DestroyFloatLookupControls: function () {
            var that = this;
            var paneCount = that._FloatItemDockPanel.Panes.length;
            for (var p = 1; p < paneCount - 2; p++) {
                if (that._FloatItemDockPanel.Panes[p].HasChildControls) {
                    if (that._FloatItemDockPanel.Panes[p].ChildControls[0].GetName() == "PersonLookupControl")
                        that._BindableEntity.set("Person", null);
                    if (that._FloatItemDockPanel.Panes[p].ChildControls[0].GetName() == "CostCenterLookupControl")
                        that._BindableEntity.set("CostCenter", null);
                    if (that._FloatItemDockPanel.Panes[p].ChildControls[0].GetName() == "ProjectLookupControl")
                        that._BindableEntity.set("Project", null);
                    if (that._FloatItemDockPanel.Panes[p].ChildControls[0].GetName() == "ForeignCurrencyLookupControl")
                        that._BindableEntity.set("ForeignCurrency", null);

                    that._FloatItemDockPanel.Panes[p].ChildControls[0].Destroy();
                }
            }
        },

        SortPriority: function (floatPriorityEntity) {
            var that = this;

            var personPriority = floatPriorityEntity.GetFieldValue("PersonPriority");
            var costCenterPriority = floatPriorityEntity.GetFieldValue("CostCenterPriority");
            var projectPriority = floatPriorityEntity.GetFieldValue("ProjectPriority");
            var ForeignCurrencyPriority = floatPriorityEntity.GetFieldValue("ForeignCurrencyPriority");

            var floatItems = [
                { key: personPriority, Name: "Person", Title: "شخص", DataList: "cmn.PersonBriefLookupList", CaptionFieldName: "FullName" },
                { key: costCenterPriority, Name: "CostCenter", Title: "هزینه", DataList: "cmn.CostCenterBriefLookupList", CaptionFieldName: "Name" },
                { key: projectPriority, Name: "Project", Title: "پروژه", DataList: "cmn.ProjectBriefLookupList", CaptionFieldName: "Name" },
                { key: ForeignCurrencyPriority, Name: "ForeignCurrency", Title: "ارزی", DataList: "cmn.ForeignCurrencyBriefLookupList", CaptionFieldName: "Name" }
            ];


            var sorted = [];
            for (var i = 0; i < floatItems.length; i++) {
                sorted[sorted.length] = floatItems[i].key;
            }
            sorted.sort();

            var sortedFloatItems = [];
            for (var j = 0; j < sorted.length; j++) {
                for (var k = 0 ; k < floatItems.length; k++)
                    if (floatItems[k].key === sorted[j] && floatItems[k].key != 0 && floatItems[k].key != null)
                        sortedFloatItems[sorted[j]] = floatItems[k];
            }

            return sortedFloatItems;
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "acc.AccDocItemsGridRowControl";
    FormClass.BaseType = afw.BasePanel;


    acc.AccDocItemsGridRowControl = FormClass;
})();
(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return rp.QuickSettlement_Havale;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (designObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._ActiveFinancialYearID = cmn.GetUserActiveFinancialYearID();

            that._ReceiveReceiptItemEntity = options.ReceiveReceiptItemEntity;
            that._QuickSettlementForm = options.QuickSettlementForm;
            that._SettlementTotalAmount = options.SettlementTotalAmount;
            that._QuickSettlementHavaleItems = options.QuickSettlementHavaleItems;
            that._QuickSettlement_UserDefaultHavaleItemID = options.QuickSettlement_UserDefaultHavaleItemID;
            that._PayerID = options.PayerID; 
            that._ShomareHavale = options.ShomareHavale;

            that.AmountTextBox = that.FindControl("AmountTextBox");
            that._HavaleComboBox = that.FindControl("HavaleComboBox");
            that._ShomareHavaleTextBox = that.FindControl("ShomareHavaleTextBox");
            that._ShomarePeygiriTextBox = that.FindControl("ShomarePeygiriTextBox");
            that.AddButton = that.FindControl("AddButton");
            that.RemoveButton = that.FindControl("RemoveButton");

            that._ShomareHavaleTextBox.SetText(that._ShomareHavale);

            that.AddButton.SetVisible(false);
            that.RemoveButton.SetVisible(false);
             
            that._FinancialOpKindAccSettings = afw.uiApi.FetchEntityList("rp.FinancialOpKindAccSetting");
            that._BankAccountAccSettings = afw.uiApi.FetchEntityList("cmn.BankAccountAccSetting");

            that._ReceiveReceiptItemEntity.AddField("InnerItem");
            that._ReceiveType = afw.uiApi.FetchEntity("rp.ReceiveType", String.Format("Name = '{0}'", "Havale"));

            if (!ValueIsEmpty(that._QuickSettlementHavaleItems))
                that._HavaleComboBox.SetItemsDataSource(that._QuickSettlementHavaleItems);
            //else {
            //    var bankAccounts = afw.uiApi.FetchEntityList("cmn.BankAccount").ToDataSourceData();
            //    that._HavaleComboBox.SetItemsDataSource(bankAccounts);
            //}

            if (that._ReceiveReceiptItemEntity.ChangeStatus == "Add") {
                setTimeout(function () {
                    if (!ValueIsEmpty(that._QuickSettlement_UserDefaultHavaleItemID))
                        that._HavaleComboBox.SetValue(that._QuickSettlement_UserDefaultHavaleItemID);
                    //else
                    //    that._HavaleComboBox.SetValue(bankAccounts[0].ID);
                }, 800);
            }

            if (that._ReceiveReceiptItemEntity.GetFieldValue("FinancialItem_Havale") != null)
                that._HavaleDaryaftiItem = afw.uiApi.FetchEntity("rp.HavaleDaryafti", String.Format("ID = '{0}'", that._ReceiveReceiptItemEntity.GetFieldValue("FinancialItem_Havale")));

            if (ValueIsEmpty(that._HavaleDaryaftiItem)) {
                that._HavaleDaryaftiItem = afw.uiApi.CreateNewEntity("rp.HavaleDaryafti");
                that._HavaleDaryaftiItem.SetFieldValue("ShomareHavale", that._ShomareHavale);
                that._HavaleDaryaftiItem.SetFieldValue("Payer", that._PayerID);
                that._ReceiveReceiptItemEntity.SetFieldValue("FinancialItem_Havale", that._HavaleDaryaftiItem.GetFieldValue("ID"));
                that._ReceiveReceiptItemEntity.SetFieldValue("ReceiveType", that._ReceiveType.GetFieldValue("ID"));
                that._ReceiveReceiptItemEntity.SetFieldValue("Creditor_Person", that._PayerID);
            }

            that._ReceiveReceiptItemEntity.SetFieldValue("InnerItem", that._HavaleDaryaftiItem);

            that._HavaleDaryaftiBindableEntity = that._HavaleDaryaftiItem.ToBindableEntity();

            //that._HavaleComboBox.InitDataBinding(that._HavaleDaryaftiBindableEntity);
            that.AmountTextBox.InitDataBinding(that._HavaleDaryaftiBindableEntity);
            that._ShomareHavaleTextBox.InitDataBinding(that._HavaleDaryaftiBindableEntity);
            that._ShomarePeygiriTextBox.InitDataBinding(that._HavaleDaryaftiBindableEntity);

            that._QuickSettlementPosItems = rp.QuickSettlementForm.GetAllQuickSettlementPosItems();
            if (that._QuickSettlementPosItems.length == 0) {
                if (!ValueIsEmpty(that._SettlementTotalAmount)) {
                    if (that._SettlementTotalAmount > 0)
                        that.AmountTextBox.SetText(that._SettlementTotalAmount);

                    setTimeout(function () {
                        that._QuickSettlementForm.RefeshAmountLabel(that.AmountTextBox.GetValue(), 'Havale');
                    }, 100);
                }
            }

            if (that._HavaleDaryaftiItem != null && that._HavaleDaryaftiItem.ChangeStatus != "Add")
                that._QuickSettlementForm.RefeshAmountLabel(that.AmountTextBox.GetValue(), 'Havale');

            that._HavaleComboBox.bind("ValueChanged", function (e) { that._HavaleComboBox_ValueChanged(e); });
            that.AddButton.bind("Click", function (e) { that.AddButton_Click(e); });
            that.RemoveButton.bind("Click", function (e) { that.RemoveButton_Click(e); });
            that.AmountTextBox.bind("KeyPressed", function (e) { that.AmountTextBox_KeyPressed(e); });
            that.AmountTextBox.bind("LostFocus", function (e) { that.AmountTextBox_LostFocus(e); });
        },

        _HavaleComboBox_ValueChanged: function (e) {
            that = this;

            if (ValueIsEmpty(that._HavaleComboBox.GetValue())) {
                that._SetReceiveReceiptItemEntityFieldValuesToNull();
                return;
            }

            that._SetReceiveReceiptItemEntityFieldValues()
        },

        _SetReceiveReceiptItemEntityFieldValues: function () {
            var that = this;

            var quickSettlementHavaleItems = $.grep(that._QuickSettlementHavaleItems, function (o) {
                return o.ID.toLowerCase() == that._HavaleComboBox.GetValue().toLowerCase();
            });
             
            var financialOpKind = quickSettlementHavaleItems[0].FinancialOpKind;
            if (financialOpKind == null) {
                afw.ErrorDialog.Show("نوع عملیات مالی برای حساب بانکی تعیین نشده است.");
                that._HavaleComboBox.SetValue(null);
                return;
            }

            var financialOpKindAccSettings = $.grep(that._FinancialOpKindAccSettings.Entities, function (o) {
                return o.GetFieldValue("FinancialOpKind").toLowerCase() == financialOpKind.toLowerCase()
                    && o.GetFieldValue("FinancialYear").toLowerCase() == that._ActiveFinancialYearID;
            });

            if (financialOpKindAccSettings.length == 0) {
                afw.ErrorDialog.Show("تنظیمات حسابداری برای نوع عملیات مالی در سال مالی جاری تعیین نشده است.");
                that._HavaleComboBox.SetValue(null);
                return;
            }

            if (ValueIsEmpty(financialOpKindAccSettings[0].GetFieldValue("CreditorAccount"))) {
                afw.ErrorDialog.Show("مقدار حساب بستانکار در تنظیمات حسابداری برای این عملیات مالی تعیین نشده است.");
                return false;
            }

            var floatAccountsNames = acc.GetAccountFloatNames(financialOpKindAccSettings[0].GetFieldValue("CreditorAccount"));
            if (!ValueIsIn("Person", floatAccountsNames)) {
                afw.ErrorDialog.Show("حساب بستانکارانتخاب شده برای نوع عملیات مالی باید دارای شناور شخص باشد.");
                that._HavaleComboBox.SetValue(null);
                return;
            }

            if (floatAccountsNames.length != 1) {
                afw.ErrorDialog.Show("حساب بستانکارانتخاب شده برای نوع عملیات مالی فقط باید دارای شناور شخص باشد.");
                that._HavaleComboBox.SetValue(null);
                return;
            }

            var bankAccountID = quickSettlementHavaleItems[0].BankAccount;
            var bankAccountAccSettings = $.grep(that._BankAccountAccSettings.Entities, function (o) {
                return o.GetFieldValue("BankAccount").toLowerCase() == bankAccountID.toLowerCase() &&
                o.GetFieldValue("FinancialYear") == that._ActiveFinancialYearID;
            });

            if (bankAccountAccSettings.length == 0) {
                afw.ErrorDialog.Show("تنظیمات حسابداری حساب بانکی در سال مالی تعیین نشده است.");
                that._HavaleComboBox.SetValue(null);
                return;
            }

            if (ValueIsEmpty(bankAccountAccSettings[0].GetFieldValue("AccountInCoding"))) {
                afw.ErrorDialog.Show("مقدار حساب بدهکار در تنظیمات حسابداری برای این حساب بانکی تعیین نشده است.");
                that._HavaleComboBox.SetValue(null);
                return;
            }

            that._ReceiveReceiptItemEntity.SetFieldValue("FinancialOpKind", financialOpKind);
            that._ReceiveReceiptItemEntity.SetFieldValue("DebtorAccount", bankAccountAccSettings[0].GetFieldValue("AccountInCoding"));
            that._ReceiveReceiptItemEntity.SetFieldValue("CreditorAccount", financialOpKindAccSettings[0].GetFieldValue("CreditorAccount"));

            that._HavaleDaryaftiBindableEntity.set("BankAccount", bankAccountID);
        },

        _SetReceiveReceiptItemEntityFieldValuesToNull: function () {
            var that = this;

            that._ReceiveReceiptItemEntity.SetFieldValue("FinancialOpKind", null);
            that._ReceiveReceiptItemEntity.SetFieldValue("DebtorAccount", null);
            that._ReceiveReceiptItemEntity.SetFieldValue("CreditorAccount", null);

            that._HavaleDaryaftiBindableEntity.set("BankAccount", null);
        },

        AmountTextBox_KeyPressed: function (e) {
            var that = this;

            var keyTextbox = e.Key;
            if (keyTextbox == "Enter") {
                setTimeout(function () {
                    that._QuickSettlementForm.RefeshAmountLabel(that.AmountTextBox.GetValue(), 'Havale');
                }, 100);
            }
        },

        AmountTextBox_LostFocus: function (e) {
            var that = this;

            setTimeout(function () {
                that._QuickSettlementForm.RefeshAmountLabel(that.AmountTextBox.GetValue(), 'Havale');
            }, 100);
        },

        RemoveButton_Click: function () {
            var that = this;

            that._ReceiveReceiptItemEntity.ChangeStatus = "Delete";

            that._QuickSettlementForm.RemoveItemControl(that);

            that._QuickSettlementForm.RefeshAmountLabel(that.AmountTextBox.GetValue(), 'Havale');
        },

        AddButton_Click: function () {
            var that = this;

            that._QuickSettlementForm.CreateNewQuickSettlement_Havale();

            that.AddButton.SetVisible(false);
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "rp.QuickSettlement_Havale";
    FormClass.BaseType = afw.BasePanel;


    rp.QuickSettlement_Havale = FormClass;
})();
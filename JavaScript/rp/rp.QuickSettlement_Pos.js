(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return rp.QuickSettlement_Pos;
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
            that._QuickSettlementPosItems = options.QuickSettlementPosItems; 

            that._PayerID = options.PayerID;

            that.AmountTextBox = that.FindControl("AmountTextBox");
            that._PosComboBox = that.FindControl("PosComboBox");
            that.AddButton = that.FindControl("AddButton");
            that.RemoveButton = that.FindControl("RemoveButton");
              
            that.AddButton.SetVisible(false);
            that.RemoveButton.SetVisible(false);

            that._PosDevices = afw.uiApi.FetchEntityList("rp.PosDevice");  
            that._FinancialOpKindAccSettings = afw.uiApi.FetchEntityList("rp.FinancialOpKindAccSetting");
            that._BankAccountAccSettings = afw.uiApi.FetchEntityList("cmn.BankAccountAccSetting");

            that._ReceiveReceiptItemEntity.AddField("InnerItem");
            that._ReceiveType = afw.uiApi.FetchEntity("rp.ReceiveType", String.Format("Name = '{0}'", "Pos"));

            if (!ValueIsEmpty(that._QuickSettlementPosItems))
                that._PosComboBox.SetItemsDataSource(that._QuickSettlementPosItems);
            //else {
            //    var bankAccounts = afw.uiApi.FetchEntityList("cmn.BankAccount").ToDataSourceData();
            //    that._PosComboBox.SetItemsDataSource(bankAccounts);
            //}

            if (that._QuickSettlementPosItems.length == 1)
                rp.QuickSettlementForm.UserLastSelectedPosItemID = that._QuickSettlementPosItems[0].ID;

            that._PosComboBox.bind("ValueChanged", function (e) { that._PosComboBox_ValueChanged(e); });

            if (that._ReceiveReceiptItemEntity.ChangeStatus == "Add") {
                setTimeout(function () {
                    if (!ValueIsEmpty(rp.QuickSettlementForm.UserLastSelectedPosItemID)) {                        
                        var defaultItemFound = $.grep(that._QuickSettlementPosItems, function (o) {
                            return o.ID.toLowerCase() == rp.QuickSettlementForm.UserLastSelectedPosItemID.toLowerCase();
                        }).length > 0;

                        if (defaultItemFound)
                            that._PosComboBox.SetValue(rp.QuickSettlementForm.UserLastSelectedPosItemID);

                        that._SetReceiveReceiptItemEntityFieldValues();
                    }
                }, 800);
            }

            if (that._ReceiveReceiptItemEntity.GetFieldValue("FinancialItem_Pos") != null)
                that._PosDaryaftiItem = afw.uiApi.FetchEntity("rp.ReceivedPos", String.Format("ID = '{0}'", that._ReceiveReceiptItemEntity.GetFieldValue("FinancialItem_Pos")));

            if (ValueIsEmpty(that._PosDaryaftiItem)) {
                that._PosDaryaftiItem = afw.uiApi.CreateNewEntity("rp.ReceivedPos"); 
                that._PosDaryaftiItem.SetFieldValue("Payer", that._PayerID);
                that._ReceiveReceiptItemEntity.SetFieldValue("FinancialItem_Pos", that._PosDaryaftiItem.GetFieldValue("ID"));
                that._ReceiveReceiptItemEntity.SetFieldValue("ReceiveType", that._ReceiveType.GetFieldValue("ID"));
                that._ReceiveReceiptItemEntity.SetFieldValue("Creditor_Person", that._PayerID); 
            }

            that._ReceiveReceiptItemEntity.SetFieldValue("InnerItem", that._PosDaryaftiItem);

            that._PosDaryaftiBindableEntity = that._PosDaryaftiItem.ToBindableEntity();

            //that._PosComboBox.InitDataBinding(that._PosDaryaftiBindableEntity);
            that.AmountTextBox.InitDataBinding(that._PosDaryaftiBindableEntity);

            if (!ValueIsEmpty(that._SettlementTotalAmount)) {
                if (that._SettlementTotalAmount > 0)
                    that.AmountTextBox.SetText(that._SettlementTotalAmount);

                setTimeout(function () {
                    that._QuickSettlementForm.RefeshAmountLabel(that.AmountTextBox.GetValue(), 'Pos');
                }, 100);
            }

            if (that._PosDaryaftiItem != null && that._PosDaryaftiItem.ChangeStatus != "Add")
                that._QuickSettlementForm.RefeshAmountLabel(that.AmountTextBox.GetValue(), 'Pos');
             
            that.AddButton.bind("Click", function (e) { that.AddButton_Click(e); });
            that.RemoveButton.bind("Click", function (e) { that.RemoveButton_Click(e); });
            that.AmountTextBox.bind("KeyPressed", function (e) { that.AmountTextBox_KeyPressed(e); });
            that.AmountTextBox.bind("LostFocus", function (e) { that.AmountTextBox_LostFocus(e); }); 
        },
         
        _PosComboBox_ValueChanged: function (e) {  
            that = this;

            rp.QuickSettlementForm.UserLastSelectedPosItemID = that._PosComboBox.GetValue();

            if (ValueIsEmpty(that._PosComboBox.GetValue()))
                that._SetReceiveReceiptItemEntityFieldValuesToNull();
            else {
                that._SetReceiveReceiptItemEntityFieldValues();

                that._QuickSettlementForm.RefeshAmountLabel(that.AmountTextBox.GetValue(), 'Pos');
            }
        },

        _SetReceiveReceiptItemEntityFieldValues: function () {
            var that = this;
             
            var quickSettlementPosItems = null;
            var posDevices = null;
            var financialOpKind = null;
            var financialOpKindAccSettings = [];
            var bankAccountAccSettings = null;

            if (!ValueIsEmpty(that._PosComboBox.GetValue())) {
                quickSettlementPosItems = $.grep(that._QuickSettlementPosItems, function (o) {
                    return o.ID.toLowerCase() == that._PosComboBox.GetValue().toLowerCase();
                });
            }
              
            if (!ValueIsEmpty(quickSettlementPosItems) && quickSettlementPosItems.length > 0) {
                var posDeviceID = quickSettlementPosItems[0].PosDevice;
                posDevices = $.grep(that._PosDevices.Entities, function (o) {
                    return o.GetFieldValue("ID").toLowerCase() == posDeviceID.toLowerCase();
                });
            }

            if (!ValueIsEmpty(posDevices) && posDevices.length > 0) {
                that._QuickSettlementForm.TerminalNumber = posDevices[0].GetFieldValue("TerminalNumber");
                that._QuickSettlementForm.ConnectionType = posDevices[0].GetFieldValue("ConnectionType");
                that._QuickSettlementForm.IpAddress = posDevices[0].GetFieldValue("IpAddress");
                that._QuickSettlementForm.PortNumber = posDevices[0].GetFieldValue("PortNumber");
                that._QuickSettlementForm.AccountType = posDevices[0].GetFieldValue("AccountType");
                that._QuickSettlementForm.Language = posDevices[0].GetFieldValue("Language");

                financialOpKind = quickSettlementPosItems[0].FinancialOpKind;
                if (financialOpKind == null) {
                    afw.ErrorDialog.Show("نوع عملیات مالی برای حساب بانکی تعیین نشده است.");
                    that._PosComboBox.SetValue(null);
                    return;
                }
            }

            if (!ValueIsEmpty(financialOpKind)) {
                financialOpKindAccSettings = $.grep(that._FinancialOpKindAccSettings.Entities, function (o) {
                    return o.GetFieldValue("FinancialOpKind").toLowerCase() == financialOpKind.toLowerCase()
                        && o.GetFieldValue("FinancialYear").toLowerCase() == that._ActiveFinancialYearID;
                });
            }

            if (financialOpKindAccSettings.length == 0) {
                afw.ErrorDialog.Show("تنظیمات حسابداری برای نوع عملیات مالی در سال مالی جاری تعیین نشده است.");
                that._PosComboBox.SetValue(null);
                return;
            }
             
            if (ValueIsEmpty(financialOpKindAccSettings[0].GetFieldValue("CreditorAccount"))) {
                afw.ErrorDialog.Show("مقدار حساب بستانکار در تنظیمات حسابداری برای این عملیات مالی تعیین نشده است.");
                return false;
            }

            var floatAccountsNames = acc.GetAccountFloatNames(financialOpKindAccSettings[0].GetFieldValue("CreditorAccount"));
            if (!ValueIsIn("Person", floatAccountsNames)) {
                afw.ErrorDialog.Show("حساب بستانکارانتخاب شده برای نوع عملیات مالی باید دارای شناور شخص باشد.");
                that._PosComboBox.SetValue(null);
                return;
            }

            if (floatAccountsNames.length != 1) {
                afw.ErrorDialog.Show("حساب بستانکارانتخاب شده برای نوع عملیات مالی فقط باید دارای شناور شخص باشد.");
                that._PosComboBox.SetValue(null);
                return;
            }

            if (!ValueIsEmpty(posDevices) && posDevices.length > 0) {
                var BankAccountID = posDevices[0].GetFieldValue("BankAccount");
                bankAccountAccSettings = $.grep(that._BankAccountAccSettings.Entities, function (o) {
                    return o.GetFieldValue("BankAccount").toLowerCase() == BankAccountID.toLowerCase() &&
                        o.GetFieldValue("FinancialYear") == that._ActiveFinancialYearID;
                });
            }

            if (!ValueIsEmpty(bankAccountAccSettings) && bankAccountAccSettings.length == 0) {
                afw.ErrorDialog.Show("تنظیمات حسابداری حساب بانکی برای سال مالی جاری تعیین نشده است.");
                that._PosComboBox.SetValue(null);
                return;
            }

            if (ValueIsEmpty(bankAccountAccSettings[0].GetFieldValue("AccountInCoding"))) {
                afw.ErrorDialog.Show("مقدار حساب بدهکار در تنظیمات حسابداری برای این حساب بانکی تعیین نشده است.");
                that._PosComboBox.SetValue(null);
                return;
            }

            that._ReceiveReceiptItemEntity.SetFieldValue("FinancialOpKind", financialOpKind);
            that._ReceiveReceiptItemEntity.SetFieldValue("DebtorAccount", bankAccountAccSettings[0].GetFieldValue("AccountInCoding"));
            that._ReceiveReceiptItemEntity.SetFieldValue("CreditorAccount", financialOpKindAccSettings[0].GetFieldValue("CreditorAccount"));

            that._PosDaryaftiBindableEntity.set("BankAccount", BankAccountID);
        },

        _SetReceiveReceiptItemEntityFieldValuesToNull: function () {
            var that = this;

            that._ReceiveReceiptItemEntity.SetFieldValue("FinancialOpKind", null);
            that._ReceiveReceiptItemEntity.SetFieldValue("DebtorAccount", null);
            that._ReceiveReceiptItemEntity.SetFieldValue("CreditorAccount", null);

            that._PosDaryaftiBindableEntity.set("BankAccount", null);
        },

        AmountTextBox_KeyPressed: function (e) {
            var that = this;

            var keyTextbox = e.Key;
            if (keyTextbox == "Enter") {
                setTimeout(function () {
                    that._QuickSettlementForm.RefeshAmountLabel(that.AmountTextBox.GetValue(), 'Pos');
                }, 100);
            }
        },

        AmountTextBox_LostFocus: function (e) {
            var that = this;

            setTimeout(function () {
                that._QuickSettlementForm.RefeshAmountLabel(that.AmountTextBox.GetValue(), 'Pos');
            }, 100);
        },
         
        RemoveButton_Click: function () {
            var that = this;

            that._ReceiveReceiptItemEntity.ChangeStatus = "Delete";

            that._QuickSettlementForm.RemoveItemControl(that);

            that._QuickSettlementForm.RefeshAmountLabel(that.AmountTextBox.GetValue(), 'Pos');
        },

        AddButton_Click: function () {
            var that = this;

            that._QuickSettlementForm.CreateNewQuickSettlement_Pos();

            that.AddButton.SetVisible(false);
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "rp.QuickSettlement_Pos";
    FormClass.BaseType = afw.BasePanel;


    rp.QuickSettlement_Pos = FormClass;
})();
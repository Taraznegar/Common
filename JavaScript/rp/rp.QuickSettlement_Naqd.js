(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return rp.QuickSettlement_Naqd;
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
            that._QuickSettlementCashItems = options.QuickSettlementCashItems;
            that._QuickSettlement_UserDefaultCashItemID = options.QuickSettlement_UserDefaultCashItemID;
            that._Payer = options.PayerID;

            that.AmountTextBox = that.FindControl("AmountTextBox");
            that._NaqdComboBox = that.FindControl("NaqdComboBox");

            if (!ValueIsEmpty(that._QuickSettlementCashItems))
                that._NaqdComboBox.SetItemsDataSource(that._QuickSettlementCashItems);
            //else {
            //    var cashes = afw.uiApi.FetchEntityList("rp.Cash").ToDataSourceData();
            //    that._NaqdComboBox.SetItemsDataSource(cashes);
            //}
             
            that._FinancialOpKindAccSettings = afw.uiApi.FetchEntityList("rp.FinancialOpKindAccSetting");
            that._CashAccSettings = afw.uiApi.FetchEntityList("rp.CashAccSetting");

            if (that._ReceiveReceiptItemEntity.ChangeStatus == "Add") {
                setTimeout(function () {
                    if (!ValueIsEmpty(that._QuickSettlement_UserDefaultCashItemID))
                        that._NaqdComboBox.SetValue(that._QuickSettlement_UserDefaultCashItemID);
                //    else
                //        that._NaqdComboBox.SetValue(cashes[0].ID);
                }, 800);
            }

            that._ReceiveReceiptItemEntity.AddField("InnerItem");
            that._ReceiveType = afw.uiApi.FetchEntity("rp.ReceiveType", String.Format("Name = '{0}'", "Naghd"));
            //FinancialItem_Naghd 
            if (that._ReceiveReceiptItemEntity.GetFieldValue("FinancialItem_Naghd") != null)
                that._NaqdDaryaftiItem = afw.uiApi.FetchEntity("rp.NaghdeDaryafti", String.Format("ID = '{0}'", that._ReceiveReceiptItemEntity.GetFieldValue("FinancialItem_Naghd")));

            if (ValueIsEmpty(that._NaqdDaryaftiItem)) {
                that._NaqdDaryaftiItem = afw.uiApi.CreateNewEntity("rp.NaghdeDaryafti");
                that._NaqdDaryaftiItem.SetFieldValue("Payer", that._Payer);
                that._ReceiveReceiptItemEntity.SetFieldValue("FinancialItem_Naghd", that._NaqdDaryaftiItem.GetFieldValue("ID"));
                that._ReceiveReceiptItemEntity.SetFieldValue("ReceiveType", that._ReceiveType.GetFieldValue("ID"));
                that._ReceiveReceiptItemEntity.SetFieldValue("Creditor_Person", that._Payer);
            }

            that._ReceiveReceiptItemEntity.SetFieldValue("InnerItem", that._NaqdDaryaftiItem);

            that._NaqdDaryaftiBindableEntity = that._NaqdDaryaftiItem.ToBindableEntity();

            //that._NaqdComboBox.InitDataBinding(that._NaqdDaryaftiBindableEntity);
            that.AmountTextBox.InitDataBinding(that._NaqdDaryaftiBindableEntity);

            if (that._NaqdDaryaftiItem != null && that._NaqdDaryaftiItem.ChangeStatus != "Add")
                that._QuickSettlementForm.RefeshAmountLabel(that.AmountTextBox.GetValue(), 'Naqd');

            that._NaqdComboBox.bind("ValueChanged", function (e) { that._NaqdComboBox_ValueChanged(e); });
            that.AmountTextBox.bind("KeyPressed", function (e) { that.AmountTextBox_KeyPressed(e); });
            that.AmountTextBox.bind("LostFocus", function (e) { that.AmountTextBox_LostFocus(e); });
        },

        _NaqdComboBox_ValueChanged: function (e) {
            that = this;

            if (ValueIsEmpty(that._NaqdComboBox.GetValue())) {
                that._SetReceiveReceiptItemEntityFieldValuesToNull();
                return;
            }

            that._SetReceiveReceiptItemEntityFieldValues();
        },

        _SetReceiveReceiptItemEntityFieldValues: function () {
            var that = this;

            var quickSettlementCashItems = $.grep(that._QuickSettlementCashItems, function (o) {
                return o.ID.toLowerCase() == that._NaqdComboBox.GetValue().toLowerCase();
            });

            var financialOpKind = quickSettlementCashItems[0].FinancialOpKind;
            if (financialOpKind == null) {
                afw.ErrorDialog.Show("نوع عملیات مالی برای صندوق تعیین نشده است.");
                that._NaqdComboBox.SetValue(null);
                return;
            }

            var financialOpKindAccSettings = $.grep(that._FinancialOpKindAccSettings.Entities, function (o) {
                return o.GetFieldValue("FinancialOpKind").toLowerCase() == financialOpKind.toLowerCase()
                    && o.GetFieldValue("FinancialYear").toLowerCase() == that._ActiveFinancialYearID;
            });

            if (financialOpKindAccSettings.length == 0) {
                afw.ErrorDialog.Show("تنظیمات حسابداری برای نوع عملیات مالی در سال مالی جاری تعیین نشده است.");
                that._NaqdComboBox.SetValue(null);
                return;
            }

            if (ValueIsEmpty(financialOpKindAccSettings[0].GetFieldValue("CreditorAccount"))) {
                afw.ErrorDialog.Show("مقدار حساب بستانکار در تنظیمات حسابداری برای این عملیات مالی تعیین نشده است.");
                return false;
            }

            var floatAccountsNames = acc.GetAccountFloatNames(financialOpKindAccSettings[0].GetFieldValue("CreditorAccount"));
            if (!ValueIsIn("Person", floatAccountsNames)) {
                afw.ErrorDialog.Show("حساب بستانکارانتخاب شده برای نوع عملیات مالی باید دارای شناور شخص باشد.");
                that._NaqdComboBox.SetValue(null);
                return;
            }

            if (floatAccountsNames.length != 1) {
                afw.ErrorDialog.Show("حساب بستانکارانتخاب شده برای نوع عملیات مالی فقط باید دارای شناور شخص باشد.");
                that._NaqdComboBox.SetValue(null);
                return;
            }

            var cashID = quickSettlementCashItems[0].Cash; 
            var cashAccSettings = $.grep(that._CashAccSettings.Entities, function (o) {
                return o.GetFieldValue("Cash").toLowerCase() == cashID.toLowerCase() &&
                o.GetFieldValue("FinancialYear") == that._ActiveFinancialYearID;
            });

            if (cashAccSettings.length == 0) {
                afw.ErrorDialog.Show("تنظیمات حسابداری صندوق برای سال مالی جاری تعیین نشده است.");
                that._NaqdComboBox.SetValue(null);
                return;
            }

            if (ValueIsEmpty(cashAccSettings[0].GetFieldValue("AccountInCoding"))) {
                afw.ErrorDialog.Show("مقدار حساب بدهکار در تنظیمات حسابداری برای این صندوق تعیین نشده است.");
                that._NaqdComboBox.SetValue(null);
                return;
            }

            that._ReceiveReceiptItemEntity.SetFieldValue("FinancialOpKind", financialOpKind);
            that._ReceiveReceiptItemEntity.SetFieldValue("DebtorAccount", cashAccSettings[0].GetFieldValue("AccountInCoding"));
            that._ReceiveReceiptItemEntity.SetFieldValue("CreditorAccount", financialOpKindAccSettings[0].GetFieldValue("CreditorAccount"));

            that._NaqdDaryaftiBindableEntity.set("Cash", cashID);
        },

        _SetReceiveReceiptItemEntityFieldValuesToNull:function(){
            var that = this;

            that._ReceiveReceiptItemEntity.SetFieldValue("FinancialOpKind", null);
            that._ReceiveReceiptItemEntity.SetFieldValue("DebtorAccount", null);
            that._ReceiveReceiptItemEntity.SetFieldValue("CreditorAccount", null);

            that._NaqdDaryaftiBindableEntity.set("Cash", null);
        },

        AmountTextBox_KeyPressed: function (e) {
            var that = this;

            var keyTextbox = e.Key;
            if (keyTextbox == "Enter") {
                setTimeout(function () {
                    that._QuickSettlementForm.RefeshAmountLabel(that.AmountTextBox.GetValue(), 'Naqd');
                }, 100);
            }
        },

        AmountTextBox_LostFocus: function (e) {
            var that = this;

            setTimeout(function () {
                that._QuickSettlementForm.RefeshAmountLabel(that.AmountTextBox.GetValue(), 'Naqd');
            }, 100);
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "rp.QuickSettlement_Naqd";
    FormClass.BaseType = afw.BasePanel;


    rp.QuickSettlement_Naqd = FormClass;
})();
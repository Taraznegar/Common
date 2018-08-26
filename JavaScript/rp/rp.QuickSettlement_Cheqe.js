(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return rp.QuickSettlement_Cheqe;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (designObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._ReceiveReceiptItemEntity = options.ReceiveReceiptItemEntity;
            that._QuickSettlementForm = options.QuickSettlementForm;
            that._PayerID = options.PayerID;
            that._SettlementTotalAmount = options.SettlementTotalAmount; 

            that.AmountTextBox = that.FindControl("AmountTextBox");
            that._CheqeComboBox = that.FindControl("CheqeComboBox");
            that._CeqeDateTimeControl = that.FindControl("CeqeDateTimeControl");
            that.AddButton = that.FindControl("AddButton");
            that.RemoveButton = that.FindControl("RemoveButton");
            that._CheqeNumberTextBox = that.FindControl("CheqeNumberTextBox");
            
            that._AsnadeDaryaftaniID = afw.OptionSetHelper.GetOptionSetItemID("rp.ReceivedChequeStatus.AsnadeDaryaftani");
             
            var banks = afw.uiApi.FetchEntityList("cmn.Bank").ToDataSourceData();
            that._CheqeComboBox.SetItemsDataSource(banks);
            that._CheqeComboBox.SetValue(banks[0].ID);
            //FinancialItem_Naghd  
            that._ReceiveReceiptItemEntity.AddField("InnerItem");
            that._FinancialOpKind = afw.uiApi.FetchEntity("rp.FinancialOpKind", String.Format("Name = '{0}'", "DaryaftChequeAzMoshtaryan"));
            that._ReceiveType = afw.uiApi.FetchEntity("rp.ReceiveType", String.Format("Name = '{0}'", "Cheque"));

            if (that._ReceiveReceiptItemEntity.GetFieldValue("FinancialItem_Cheque") != null)
                that._CheqeDaryaftiItem = afw.uiApi.FetchEntity("rp.ReceivedCheque", String.Format("ID = '{0}'", that._ReceiveReceiptItemEntity.GetFieldValue("FinancialItem_Cheque")));

            if (that._CheqeDaryaftiItem == null) {
                that._CheqeDaryaftiItem = afw.uiApi.CreateNewEntity("rp.ReceivedCheque");
                that._CheqeDaryaftiItem.SetFieldValue("Payer", that._PayerID);
                that._ReceiveReceiptItemEntity.SetFieldValue("FinancialItem_Cheque", that._CheqeDaryaftiItem.GetFieldValue("ID"));
                that._ReceiveReceiptItemEntity.SetFieldValue("FinancialOpKind", that._FinancialOpKind.GetFieldValue("ID"));
                that._ReceiveReceiptItemEntity.SetFieldValue("ReceiveType", that._ReceiveType.GetFieldValue("ID"));
                that._CheqeDaryaftiItem.SetFieldValue("ChequeStatus", that._AsnadeDaryaftaniID);
            }
            that._ReceiveReceiptItemEntity.SetFieldValue("InnerItem", that._CheqeDaryaftiItem);
 
            that._CheqeDaryaftiBindableEntity = that._CheqeDaryaftiItem.ToBindableEntity();

            that._CheqeComboBox.InitDataBinding(that._CheqeDaryaftiBindableEntity);
            that.AmountTextBox.InitDataBinding(that._CheqeDaryaftiBindableEntity);
            that._CeqeDateTimeControl.InitDataBinding(that._CheqeDaryaftiBindableEntity);
            that._CheqeNumberTextBox.InitDataBinding(that._CheqeDaryaftiBindableEntity);
             
            if (!ValueIsEmpty(that._SettlementTotalAmount)) {
                if (that._SettlementTotalAmount > 0)
                    that.AmountTextBox.SetText(that._SettlementTotalAmount);
                setTimeout(function () {
                    that._QuickSettlementForm.RefeshAmountLabel(that.AmountTextBox.GetValue(), 'Cheqe');
                }, 100);
            }

            if (that._CheqeDaryaftiItem != null && that._CheqeDaryaftiItem.ChangeStatus != "Add")
                that._QuickSettlementForm.RefeshAmountLabel(that.AmountTextBox.GetValue(), 'Cheqe');

            that.AddButton.bind("Click", function (e) { that.AddButton_Click(e); });
            that.RemoveButton.bind("Click", function (e) { that.RemoveButton_Click(e); });
            that.AmountTextBox.bind("KeyPressed", function (e) { that.AmountTextBox_KeyPressed(e); });
            that.AmountTextBox.bind("LostFocus", function (e) { that.AmountTextBox_LostFocus(e); });
        },

        AmountTextBox_KeyPressed: function (e) {
            var that = this;

            var keyTextbox = e.Key;
            if (keyTextbox == "Enter") {
                setTimeout(function () {
                    that._QuickSettlementForm.RefeshAmountLabel(that.AmountTextBox.GetValue(), 'Cheqe');
                }, 100);
            }
        },

        AmountTextBox_LostFocus: function (e) {
            var that = this;

            setTimeout(function () {
                that._QuickSettlementForm.RefeshAmountLabel(that.AmountTextBox.GetValue(), 'Cheqe');
            }, 100);
        },

        RemoveButton_Click:function(){
            var that = this;

            that._ReceiveReceiptItemEntity.ChangeStatus = "Delete";

            //that._QuickSettlementForm.RefeshAmountLabel(0, 'Cheqe');

            that._QuickSettlementForm.RemoveItemControl(that);

            that._QuickSettlementForm.RefeshAmountLabel(that.AmountTextBox.GetValue(), 'Cheqe');
        },

        AddButton_Click: function(){
            var that = this;

            that._QuickSettlementForm.CreateNewQuickSettlement_Cheqe();

            that.AddButton.SetVisible(false);
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "rp.QuickSettlement_Cheqe";
    FormClass.BaseType = afw.BasePanel;


    rp.QuickSettlement_Cheqe = FormClass;
})();
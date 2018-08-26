(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return rp.ReceivedPosEditForm;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            if (ValueIsEmpty(options.Entity))
                throw "Entity is not set.";

            that._FinancialYearID = cmn.GetUserActiveFinancialYearID();

            that._BindableEntity = options.Entity.ToBindableEntity();

            that._ParentEntity = that.GetContainerWindow()._BindableEntity;

            that.InitDataBinding(that._BindableEntity);

            that._BindableEntity.bind("change", function (e) { that._BindableEntity_change(e); });

            that._SetPreviewImage("DocImage");

            that._PayerFieldControl = that.FindControl("PayerFieldControl");
            that._PayerFieldControl.bind("ValueChanged", function (e) { that._PayerFieldControl_ValueChanged(e); });
            that._Payer_AutoComplete = that._PayerFieldControl.FindControl("InnerControl").GetAutoComplete();
            //that._Payer_AutoComplete.Focus();

            that._BankAccountFieldControl = that.FindControl("BankAccountFieldControl");
            that._BankAccountFieldControl.bind("ValueChanged", function (e) { that._BankAccountFieldControl_ValueChanged(e); });

            that._BankAccountsEntityList = afw.uiApi.FetchEntityList("cmn.BankAccount");

            that._AmountFieldControl = that.FindControl("AmountFieldControl");
            that._AmountFieldControl_InnerControl = that._AmountFieldControl.FindControl("InnerControl");
            that._AmountFieldControl_InnerControl.bind("TextChanged", function (e) { that._AmountFieldControl_InnerControl_TextChanged(e); });

            if (that._ParentEntity.GetEntity().ChangeStatus == "Modify")
                that.GetContainerWindow().bind("Opened", function () { that._SetDebtorAccountLookupControlValue(); });
        },

        _PayerFieldControl_ValueChanged: function (e) {
            var that = this;

            if (!ValueIsEmpty(that._PayerFieldControl.GetValue()))
                that._ParentEntity.set("Creditor_Person", that._PayerFieldControl.GetValue());

            //that._RefreshDescription();
        },

        _BankAccountFieldControl_ValueChanged: function (e) {
            var that = this;

            if (!ValueIsEmpty(that._BankAccountFieldControl.GetValue()))
                that._SetDebtorAccountLookupControlValue();

            //that._RefreshDescription();
        },

        _SetDebtorAccountLookupControlValue: function () {
            var that = this;

            var bankAccount = $.grep(that._BankAccountsEntityList.Entities, function (o) {
                return o.GetFieldValue("ID").toLowerCase() == that._BankAccountFieldControl.GetValue();
            });

            if (bankAccount.length != 0) {
                var bankAccountAccSetting = afw.uiApi.FetchEntity("cmn.BankAccountAccSetting",
                    String.Format("BankAccount = '{0}' and FinancialYear = '{1}'", bankAccount[0].GetFieldValue("ID"), that._FinancialYearID));

                if (!ValueIsEmpty(bankAccountAccSetting)) {
                    if (!ValueIsEmpty(bankAccountAccSetting.GetFieldValue("AccountInCoding")))
                        that._ParentEntity.set("DebtorAccount", bankAccountAccSetting.GetFieldValue("AccountInCoding"));
                    else {
                        afw.ErrorDialog.Show("حساب در کدینگ در حساب بانکی تعیین نشده است");
                        that._BankAccountFieldControl.SetValue(null);
                    }
                }
                else {
                    afw.ErrorDialog.Show("برای حساب بانکی تنظیمات حسابداری تعیین نشده است");
                    that._BankAccountFieldControl.SetValue(null);
                }
            }
        },

        _AmountFieldControl_InnerControl_TextChanged: function (e) {
            var that = this;

            //that._RefreshDescription();
        },

        _RefreshDescription: function () {
            var that = this;

            //var shomareHavale = that._ShomareHavaleFieldControl.FindControl("InnerControl").GetText();
            var payerName = that._PayerFieldControl.FindControl("InnerControl").GetAutoComplete().GetText();
            var bankAccountNumber = that._BankAccountFieldControl.FindControl("InnerControl").GetDropDownList().GetText();
            var amount = that._AmountFieldControl_InnerControl.GetText();

            var desc = String.Format("طی حواله {0} ، واریز به {2} ، به مبلغ {3} ", payerName, bankAccountNumber, amount);

            that._DescriptionTextBox.SetValue(desc);
        },

        _BindableEntity_change: function (e) {
            var that = this;

            if (e.field == "DocImage")
                that._SetPreviewImage("DocImage");
        },

        GetBindableEntity: function () {
            var that = this;

            return that._BindableEntity;
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        },

        _SetPreviewImage: function (fieldName) {
            var that = this;

            var imageFileID = that._BindableEntity.get(fieldName);

            if (imageFileID == null)
                that.FindControl(fieldName + "PreviewPanel").SetBackgroundImage(null);
            else {
                try {
                    that.FindControl(fieldName + "PreviewPanel").SetBackgroundImage(
                        String.Format("ServerStoredFile({0})", imageFileID));
                }
                catch (ex) {
                    afw.ErrorDialog.Show(ex);
                }
            }
        },

        SetFocus: function () {
            var that = this;

            if (that._PayerFieldControl.GetValue() == null)
                that._Payer_AutoComplete.Focus();
        },

        SetPayer: function (payerID) {
            var that = this;

            that._PayerFieldControl.SetValue(payerID);
        },

        SetPayerReadonly: function () {
            var that = this;

            if (!that._PayerFieldControl.GetReadOnly())
                that._PayerFieldControl.SetReadOnly(true);
        },

        SetPersonFilter: function (filter) {
            var that = this;

            that._PayerFieldControl.FindControl("InnerControl").SetBaseFilterExpression(filter);
        },

        SetBindableEntityFieldsToNull: function () {
            var that = this;

            that._BindableEntity.set("BankAccount", null);
            //that._BindableEntity.set("DocImage", null);
            //that._BindableEntity.set("Amount", null);

            //that._RefreshDescription();
        }

    });

    //Static Members:

    FormClass.TypeName = "rp.ReceivedPosEditForm";
    FormClass.BaseType = afw.BasePanel;


    rp.ReceivedPosEditForm = FormClass;
})();
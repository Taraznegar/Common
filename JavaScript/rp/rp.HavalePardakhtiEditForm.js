(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return rp.HavalePardakhtiEditForm;
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

            that._ShomareHavaleFieldControl = that.FindControl("ShomareHavaleFieldControl");
            that._ShomareHavaleFieldControl_InnerControl = that._ShomareHavaleFieldControl.FindControl("InnerControl");
            that._ShomareHavaleFieldControl_InnerControl.bind("TextChanged", function (e) { that._ShomareHavaleFieldControl_InnerControl_TextChanged(e); });

            that._PayeeFieldControl = that.FindControl("PayeeFieldControl");
            that._PayeeFieldControl.bind("ValueChanged", function (e) { that._PayeeFieldControl_ValueChanged(e); });
            that._Payee_AutoComplete = that._PayeeFieldControl.FindControl("InnerControl").GetAutoComplete();
            //that._Payee_AutoComplete.Focus();

            that._BankAccountFieldControl = that.FindControl("BankAccountFieldControl");
            that._BankAccountFieldControl.bind("ValueChanged", function (e) { that._BankAccountFieldControl_ValueChanged(e); });

            that._BankAccountsEntityList = afw.uiApi.FetchEntityList("cmn.BankAccount");

            that._AmountFieldControl = that.FindControl("AmountFieldControl");
            that._AmountFieldControl_InnerControl = that._AmountFieldControl.FindControl("InnerControl");
            that._AmountFieldControl_InnerControl.bind("TextChanged", function (e) { that._AmountFieldControl_InnerControl_TextChanged(e); });

            that._SharheHavaleTextBox = that.FindControl("SharheHavaleTextBox");

            if (that._ParentEntity.GetEntity().ChangeStatus == "Modify")
                that.GetContainerWindow().bind("Opened", function () { that._SetCreditorAccountLookupControlValue(); });
        },

        _ShomareHavaleFieldControl_InnerControl_TextChanged: function (e) {
            var that = this;

            that._RefreshDescription();
        },

        _PayeeFieldControl_ValueChanged: function (e) {
            var that = this;

            if (!ValueIsEmpty(that._PayeeFieldControl.GetValue()))
                that._ParentEntity.set("Debtor_Person", that._PayeeFieldControl.GetValue());

            that._RefreshDescription();
        },

        _BankAccountFieldControl_ValueChanged: function (e) {
            var that = this;

            if (!ValueIsEmpty(that._BankAccountFieldControl.GetValue()))
                that._SetCreditorAccountLookupControlValue();

            that._RefreshDescription();
        },


        _SetCreditorAccountLookupControlValue: function () {
            var that = this;

            var bankAccount = $.grep(that._BankAccountsEntityList.Entities, function (o) {
                return o.GetFieldValue("ID").toLowerCase() == that._BankAccountFieldControl.GetValue();
            });

            if (bankAccount.length != 0) {
                var bankAccountAccSetting = afw.uiApi.FetchEntity("cmn.BankAccountAccSetting",
                    String.Format("BankAccount = '{0}' and FinancialYear = '{1}'", bankAccount[0].GetFieldValue("ID"), that._FinancialYearID));

                if (!ValueIsEmpty(bankAccountAccSetting)) {
                    if (!ValueIsEmpty(bankAccountAccSetting.GetFieldValue("AccountInCoding")))
                        that._ParentEntity.set("CreditorAccount", bankAccountAccSetting.GetFieldValue("AccountInCoding"));
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

            that._RefreshDescription();
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

        _RefreshDescription: function () {
            var that = this;

            var shomareHavale = that._ShomareHavaleFieldControl.FindControl("InnerControl").GetText();
            var payeeName = that._PayeeFieldControl.FindControl("InnerControl").GetAutoComplete().GetText();
            var bankAccountNumber = that._BankAccountFieldControl.FindControl("InnerControl").GetDropDownList().GetText();
            var amount = that._AmountFieldControl_InnerControl.GetText();

            var desc = String.Format("حواله پرداختی به شماره {0}، دریافت کننده {1}، شماره حساب {2}، مبلغ {3}",
                                    shomareHavale, payeeName, bankAccountNumber, amount);

            that._SharheHavaleTextBox.SetValue(desc);
        },

        SetFocus: function () {
            var that = this;

            if (that._PayeeFieldControl.GetValue() == null)
                that._Payee_AutoComplete.Focus();
            else
                that._ShomareHavaleFieldControl_InnerControl.Focus();

        },

        SetPayee: function (payeeID) {
            var that = this;

            that._PayeeFieldControl.SetValue(payeeID);
        },

        SetPayeeReadonly: function () {
            var that = this;

            if (!that._PayeeFieldControl.GetReadOnly())
                that._PayeeFieldControl.SetReadOnly(true);
        },

        SetPersonFilter: function (filter) {
            var that = this;

            that._PayeeFieldControl.FindControl("InnerControl").SetBaseFilterExpression(filter);
        },

        SetBindableEntityFieldsToNull: function () {
            var that = this;

            that._BindableEntity.set("BankAccount", null);
            //that._BindableEntity.set("DocImage", null);
            //that._BindableEntity.set("Amount", null);
            //that._BindableEntity.set("ShomareHavale", null);

            that._RefreshDescription();
        }
    });

    //Static Members:

    FormClass.TypeName = "rp.HavalePardakhtiEditForm";
    FormClass.BaseType = afw.BasePanel;


    rp.HavalePardakhtiEditForm = FormClass;
})();
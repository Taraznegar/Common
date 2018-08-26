(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return rp.PaidChequeEditForm;
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

            that._PayeeFieldControl = that.FindControl("PayeeFieldControl");
            that._PayeeFieldControl.bind("ValueChanged", function (e) { that._PayeeFieldControl_ValueChanged(e); });
            that._Payee_AutoComplete = that._PayeeFieldControl.FindControl("InnerControl").GetAutoComplete();
            that._Payee_AutoComplete.bind("KeyPressed", function (e) { that._Control_KeyPressed(e); });
            //that._Payee_AutoComplete.Focus();

            that._ChequeNumberFieldControl = that.FindControl("ChequeNumberFieldControl");
            that._ChequeNumberFieldControl_InnerControl = that._ChequeNumberFieldControl.FindControl("InnerControl");
            that._ChequeNumberFieldControl_InnerControl.bind("TextChanged", function (e) { that._ChequeNumberFieldControl_InnerControl_TextChanged(e); });
            that._ChequeNumberFieldControl_InnerControl.bind("KeyPressed", function (e) { that._Control_KeyPressed(e); });

            that._BankAccountFieldControl = that.FindControl("BankAccountFieldControl");
            that._BankAccountFieldControl.bind("ValueChanged", function (e) { that._BankAccountFieldControl_ValueChanged(e); });
            that._BankAccountFieldControl_InnerControl = that._BankAccountFieldControl.FindControl("InnerControl");
            that._BankAccountFieldControl_InnerControl.GetDropDownList().bind("KeyPressed", function (e) { that._Control_KeyPressed(e); });

            that._BankAccountsEntityList = afw.uiApi.FetchEntityList("cmn.BankAccount");

            that._DueDateFieldControl = that.FindControl("DueDateFieldControl");
            that._DueDateFieldControl.bind("ValueChanged", function (e) { that._DueDateFieldControl_ValueChanged(e); });
            that._DueDateFieldControl_InnerControl = that._DueDateFieldControl.FindControl("InnerControl");
            that._DueDateFieldControl_InnerControl.bind("KeyPressed", function (e) { that._Control_KeyPressed(e); });

            that._AmountFieldControl = that.FindControl("AmountFieldControl");
            that._AmountFieldControl_InnerControl = that._AmountFieldControl.FindControl("InnerControl");
            that._AmountFieldControl_InnerControl.bind("TextChanged", function (e) { that._AmountFieldControl_InnerControl_TextChanged(e); });
            that._AmountFieldControl_InnerControl.bind("KeyPressed", function (e) { that._Control_KeyPressed(e); });

            that._ChequeDescriptionTextBox = that.FindControl("ChequeDescriptionTextBox");

            if (that._ParentEntity.GetEntity().ChangeStatus == "Modify")
                that.GetContainerWindow().bind("Opened", function () { that._SetCreditorAccountLookupControlValue(); });
        },

        _ChequeNumberFieldControl_InnerControl_TextChanged: function (e) {
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
                    if (!ValueIsEmpty(bankAccountAccSetting.GetFieldValue("HesabeAsnadePardakhtani")))
                        that._ParentEntity.set("CreditorAccount", bankAccountAccSetting.GetFieldValue("HesabeAsnadePardakhtani"));
                    else {
                        afw.ErrorDialog.Show("حساب اسناد پرداختنی در حساب بانکی تعیین نشده است");
                        that._BankAccountFieldControl.SetValue(null);
                    }
                }
                else {
                    afw.ErrorDialog.Show("برای حساب بانکی تنظیمات حسابداری تعیین نشده است");
                    that._BankAccountFieldControl.SetValue(null);
                }
            }
        },

        _DueDateFieldControl_ValueChanged: function (e) {
            var that = this;

            that._RefreshDescription();
        },

        _AmountFieldControl_InnerControl_TextChanged: function (e) {
            var that = this;

            that._RefreshDescription();
        },

        _Control_KeyPressed: function (e) {
            var that = this;

            if (e.Key == "Enter") {

                if (e.Sender == that._Payee_AutoComplete)
                    that._ChequeNumberFieldControl_InnerControl.Focus();

                else if (e.Sender == that._ChequeNumberFieldControl_InnerControl)
                    that._BankAccountFieldControl_InnerControl.Focus();

                else if (e.Sender == that._BankAccountFieldControl_InnerControl.GetDropDownList())
                    that._DueDateFieldControl_InnerControl.Focus();

                else if (e.Sender == that._DueDateFieldControl_InnerControl)
                    that._AmountFieldControl_InnerControl.Focus();

                else if (e.Sender == that._AmountFieldControl_InnerControl)
                    that.GetContainerWindow().SaveAndNew();

            }
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

            var chequeNumber = that._ChequeNumberFieldControl.FindControl("InnerControl").GetText();
            var payeeName = that._PayeeFieldControl.FindControl("InnerControl").GetAutoComplete().GetText();
            var dueDate = that._DueDateFieldControl.GetValue();
            if (ValueIsEmpty(dueDate)) {
                dueDate = " ";
            }
            else
                dueDate = afw.DateTimeHelper.GregorianToJalali(dueDate);

            var bankAccountNumber = that._BankAccountFieldControl.FindControl("InnerControl").GetDropDownList().GetText();
            var amount = that._AmountFieldControl.FindControl("InnerControl").GetText();

            var desc = String.Format("چک پرداختی به شماره {0}، دریافت کننده {1}، تاریخ چک {2}، حساب بانکی {3}، مبلغ {4}",
                                    chequeNumber, payeeName, dueDate, bankAccountNumber, amount);

            that._ChequeDescriptionTextBox.SetValue(desc);
        },

        SetFocus: function () {
            var that = this;

            if (that._PayeeFieldControl.GetValue() == null)
                that._Payee_AutoComplete.Focus();
            else
                that._ChequeNumberFieldControl_InnerControl.Focus();
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

            //that._BindableEntity.set("ChequeNumber", null);
            that._BindableEntity.set("BankAccount", null);
            //that._BindableEntity.set("Amount", null);
            //that._BindableEntity.set("DueDate", null);
            //that._BindableEntity.set("DocImage", null);

            that._RefreshDescription();
        }
    });

    //Static Members:

    FormClass.TypeName = "rp.PaidChequeEditForm";
    FormClass.BaseType = afw.BasePanel;


    rp.PaidChequeEditForm = FormClass;
})();
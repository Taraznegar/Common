(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return rp.NaghdePardakhtiEditForm;
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
            //that._Payee_AutoComplete.Focus();

            that._CashFieldControl = that.FindControl("CashFieldControl");
            that._CashFieldControl_DropDownList = that._CashFieldControl.FindControl("InnerControl").GetDropDownList();
            that._CashFieldControl.bind("ValueChanged", function (e) { that._CashFieldControl_ValueChanged(e); });

            that._CashesEntityList = afw.uiApi.FetchEntityList("rp.Cash");

            that._AmountFieldControl = that.FindControl("AmountFieldControl");
            that._AmountFieldControl_InnerControl = that._AmountFieldControl.FindControl("InnerControl");
            that._AmountFieldControl_InnerControl.bind("TextChanged", function (e) { that._AmountFieldControl_InnerControl_TextChanged(e); });

            that._SharheNaghdTextBox = that.FindControl("SharheNaghdTextBox");

            if (that._ParentEntity.GetEntity().ChangeStatus == "Modify")
                that.GetContainerWindow().bind("Opened", function () { that._SetCreditorAccountLookupControlValue(); });
        },

        _PayeeFieldControl_ValueChanged: function (e) {
            var that = this;

            if (!ValueIsEmpty(that._PayeeFieldControl.GetValue()))
                that._ParentEntity.set("Debtor_Person", that._PayeeFieldControl.GetValue());

            that._RefreshDescription();
        },

        _CashFieldControl_ValueChanged: function (e) {
            var that = this;

            if (!ValueIsEmpty(that._CashFieldControl.GetValue()))
                that._SetCreditorAccountLookupControlValue();

            that._RefreshDescription();
        },

        _SetCreditorAccountLookupControlValue: function () {
            var that = this;

            var cash = $.grep(that._CashesEntityList.Entities, function (o) {
                return o.GetFieldValue("ID").toLowerCase() == that._CashFieldControl.GetValue();
            });

            if (cash.length != 0) {
                var cashAccSetting = afw.uiApi.FetchEntity("rp.CashAccSetting",
                    String.Format("Cash = '{0}' and FinancialYear = '{1}'", cash[0].GetFieldValue("ID"), that._FinancialYearID));

                if (!ValueIsEmpty(cashAccSetting)) {
                    if (!ValueIsEmpty(cashAccSetting.GetFieldValue("AccountInCoding"))) {
                        that._ParentEntity.set("CreditorAccount", cashAccSetting.GetFieldValue("AccountInCoding"));
                        that._ParentEntity.set("Creditor_Person", cashAccSetting.GetFieldValue("CashOwnerPerson"));
                    }
                    else {
                        afw.ErrorDialog.Show("حساب در کدینگ در حساب بانکی تعیین نشده است");
                        that._CashFieldControl.SetValue(null);
                    }
                }
                else {
                    afw.ErrorDialog.Show("برای صندوق تنظیمات حسابداری تعیین نشده است");
                    that._CashFieldControl.SetValue(null);
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

            var payeeName = that._PayeeFieldControl.FindControl("InnerControl").GetAutoComplete().GetText();
            var cashTitle = that._CashFieldControl.FindControl("InnerControl").GetDropDownList().GetText();
            var amount = that._AmountFieldControl.FindControl("InnerControl").GetText();

            var desc = String.Format("وجه نقد پرداختی، دریافت کننده {0}، صندوق {1}، مبلغ {2}",
                                     payeeName, cashTitle, amount);

            that._SharheNaghdTextBox.SetValue(desc);
        },

        SetFocus: function () {
            var that = this;

            if (that._PayeeFieldControl.GetValue() == null)
                that._Payee_AutoComplete.Focus();
            else
                that._CashFieldControl_DropDownList.Focus();
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

            that._BindableEntity.set("Cash", null);
            //that._BindableEntity.set("DocImage", null);
            //that._BindableEntity.set("Amount", null);

            that._RefreshDescription();
        }
    });

    //Static Members:

    FormClass.TypeName = "rp.NaghdePardakhtiEditForm";
    FormClass.BaseType = afw.BasePanel;


    rp.NaghdePardakhtiEditForm = FormClass;
})();
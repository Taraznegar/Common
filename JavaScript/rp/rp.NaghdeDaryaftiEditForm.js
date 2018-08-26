(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return rp.NaghdeDaryaftiEditForm;
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

            that._CashesEntityList = afw.uiApi.FetchEntityList("rp.Cash");

            that._CashFieldControl = that.FindControl("CashFieldControl");
            that._CashFieldControl_DropDownList = that._CashFieldControl.FindControl("InnerControl").GetDropDownList();
            that._CashFieldControl.bind("ValueChanged", function (e) { that._CashFieldControl_ValueChanged(e); });

            that._AmountFieldControl = that.FindControl("AmountFieldControl");
            that._AmountFieldControl_InnerControl = that._AmountFieldControl.FindControl("InnerControl");
            that._AmountFieldControl_InnerControl.bind("TextChanged", function (e) { that._AmountFieldControl_InnerControl_TextChanged(e); });

            that._DescriptionTextBox = that.FindControl("DescriptionTextBox");

            if (that._ParentEntity.GetEntity().ChangeStatus == "Modify")
                that.GetContainerWindow().bind("Opened", function () { that._SetDebtorAccountLookupControlValue(); });
        },

        _PayerFieldControl_ValueChanged: function (e) {
            var that = this;

            if (!ValueIsEmpty(that._PayerFieldControl.GetValue()))
                that._ParentEntity.set("Creditor_Person", that._PayerFieldControl.GetValue());

            that._RefreshDescription();
        },

        _CashFieldControl_ValueChanged: function (e) {
            var that = this;

            if (!ValueIsEmpty(that._CashFieldControl.GetValue()))
                that._SetDebtorAccountLookupControlValue();

            that._RefreshDescription();
        },

        _SetDebtorAccountLookupControlValue: function () {
            var that = this;

            var cash = $.grep(that._CashesEntityList.Entities, function (o) {
                return o.GetFieldValue("ID").toLowerCase() == that._CashFieldControl.GetValue();
            });

            if (cash.length != 0) {
                var cashAccSetting = afw.uiApi.FetchEntity("rp.CashAccSetting",
                    String.Format("Cash = '{0}' and FinancialYear = '{1}'", cash[0].GetFieldValue("ID"), that._FinancialYearID));

                if (!ValueIsEmpty(cashAccSetting)) {
                    if (!ValueIsEmpty(cashAccSetting.GetFieldValue("AccountInCoding"))) {
                        that._ParentEntity.set("DebtorAccount", cashAccSetting.GetFieldValue("AccountInCoding"));
                        that._ParentEntity.set("Debtor_Person", cashAccSetting.GetFieldValue("CashOwnerPerson"));
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

            var payerName = that._PayerFieldControl.FindControl("InnerControl").GetAutoComplete().GetText();
            var cashTitle = that._CashFieldControl.FindControl("InnerControl").GetDropDownList().GetText();
            var amount = that._AmountFieldControl.FindControl("InnerControl").GetText();

            var desc = String.Format("وجه نقد دریافتی، پرداخت کننده {0}، صندوق {1}، مبلغ {2}",
                                     payerName, cashTitle, amount);

            that._DescriptionTextBox.SetValue(desc);
        },

        SetFocus: function () {
            var that = this;

            if (that._PayerFieldControl.GetValue() == null)
                that._Payer_AutoComplete.Focus();
            else
                that._CashFieldControl_DropDownList.Focus();
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

            that._BindableEntity.set("Cash", null);
            //that._BindableEntity.set("DocImage", null);
            //that._BindableEntity.set("Amount", null);

            that._RefreshDescription();
        }

    });

    //Static Members:

    FormClass.TypeName = "rp.NaghdeDaryaftiEditForm";
    FormClass.BaseType = afw.BasePanel;


    rp.NaghdeDaryaftiEditForm = FormClass;
})();
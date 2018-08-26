(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return rp.FinancialOpKindAccSettingEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._UserActiveFinancialYearID = cmn.GetUserActiveFinancialYearID();

            that._AccountsDockPanel = that.FindControl("AccountsDockPanel");
            that._FinancialYearFieldControl = that.FindControl("FinancialYearFieldControl");
            that._DebtorAccountFieldControl = that.FindControl("DebtorAccountFieldControl");
            that._DebtorAccountLookupControl = that._DebtorAccountFieldControl.FindControl("InnerControl");
            that._CreditorAccountFieldControl = that.FindControl("CreditorAccountFieldControl");
            that._CreditorAccountLookupControl = that._CreditorAccountFieldControl.FindControl("InnerControl");
            that._FinancialYearFieldControl = that.FindControl("FinancialYearFieldControl").FindControl("InnerControl");

            that._DebtorAccountLookupControl.SetShowRequiredStar(true);
            that._CreditorAccountLookupControl.SetShowRequiredStar(true);
            that._FinancialYearFieldControl.BindEvent("ValueChanged",
                function (e) { that._FinancialYearFieldControl_ValueChanged(e); });

            that._DebtorAccountFieldControl.bind("ValueChanged", function (e) { that._DebtorAccountFieldControl_ValueChanged(e); });
            that._DebtorAccountLookupControl.bind("OpeningLookup", function (e) { that._DebtorAccountLookupControl_OpeningLookup(e); });
            that._CreditorAccountFieldControl.bind("ValueChanged", function (e) { that._CreditorAccountFieldControl_ValueChanged(e); });
            that._CreditorAccountLookupControl.bind("OpeningLookup", function (e) { that._CreditorAccountLookupControl_OpeningLookup(e); });

            that._ParentEntity = options.ParentEntity;
            that._IsDebtorAccount = true;
            that._IsCreditorAccount = true;

            if (that._ParentEntity.FieldExists("ReceiveDocType") && !ValueIsEmpty(that._ParentEntity.GetFieldValue("ReceiveDocType"))) {
                var receiveDocType = afw.uiApi.FetchEntityByID("rp.ReceiveType", that._ParentEntity.GetFieldValue("ReceiveDocType"));

                if (ValueIsIn(receiveDocType.GetFieldValue("Name"), ["Havale", "Pos", "Naghd"])) {
                    that._AccountsDockPanel.SetPaneSizeSetting(1, 1);
                    that._BindableEntity.set("DebtorAccount", null);
                    that._IsDebtorAccount = false;
                }
            }
            else if (that._ParentEntity.FieldExists("PayDocType") && !ValueIsEmpty(that._ParentEntity.GetFieldValue("PayDocType"))) {
                var payDocType = afw.uiApi.FetchEntityByID("rp.PayType", that._ParentEntity.GetFieldValue("PayDocType"));

                if (ValueIsIn(payDocType.GetFieldValue("Name"), ["Havale", "Naghd", "ChekeZemanat", "Cheque"])) {
                    that._AccountsDockPanel.SetPaneSizeSetting(2, 1);
                    that._BindableEntity.set("CreditorAccount", null);
                    that._IsCreditorAccount = false;
                }
            }

            if (that._FormMode == "New")
                that._FinancialYearFieldControl.SetValue(that._UserActiveFinancialYearID);
            else {
                that._DebtorAccountLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._BindableEntity.get("FinancialYear")));
                that._CreditorAccountLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._BindableEntity.get("FinancialYear")));
            }
        },

        _FinancialYearFieldControl_ValueChanged: function (e) {
            var that = this;

            that._DebtorAccountLookupControl.SetValue(null);
            that._CreditorAccountLookupControl.SetValue(null);

            if (that._FinancialYearFieldControl.GetValue() != null) {
                that._DebtorAccountLookupControl.SetBaseFilterExpression(String.Format("FinancialYear = '{0}'", that._FinancialYearFieldControl.GetValue()));
                that._CreditorAccountLookupControl.SetBaseFilterExpression(String.Format("FinancialYear = '{0}'", that._FinancialYearFieldControl.GetValue()));
            }
            else {
                that._DebtorAccountLookupControl.SetBaseFilterExpression(String.Format("FinancialYear = '{0}'", that._UserActiveFinancialYearID));
                that._CreditorAccountLookupControl.SetBaseFilterExpression(String.Format("FinancialYear = '{0}'", that._UserActiveFinancialYearID));
            }
        },

        _DebtorAccountFieldControl_ValueChanged: function (e) {
            var that = this;

            if (that._DebtorAccountFieldControl.GetValue() == null)
                return;

            if (that._ParentEntity.FieldExists("ReceiveDocType") && !ValueIsEmpty(that._ParentEntity.GetFieldValue("ReceiveDocType"))) {
                if (!ValueIsEmpty(that._DebtorAccountFieldControl.GetValue()))
                    if (acc.AccountHasFloat(that._DebtorAccountFieldControl.GetValue(), null)) {
                        afw.ErrorDialog.Show("امکان انتخاب حساب بدهکار دارای شناور در عملیات دریافت وجود ندارد");
                        setTimeout(function () {
                            that._DebtorAccountFieldControl.SetValue(null);
                        }, 500);
                    }
            }
            else if (that._ParentEntity.FieldExists("PayDocType") && !ValueIsEmpty(that._ParentEntity.GetFieldValue("PayDocType"))) {
                if (!ValueIsEmpty(that._DebtorAccountFieldControl.GetValue()))
                    if (!acc.AccountHasFloat(that._DebtorAccountFieldControl.GetValue(), "Person")) {
                        afw.ErrorDialog.Show("حساب بدهکار انتخاب شده باید دارای شناور شخص باشد");
                        setTimeout(function () {
                            that._DebtorAccountFieldControl.SetValue(null);
                        }, 500);
                    }
            }
        },

        _DebtorAccountLookupControl_OpeningLookup: function (e) {
            var that = this;

            e.Sender.SetLookupDataListControlCustomOptions({ FinancialYear: that._FinancialYearFieldControl.GetValue() });
        },

        _CreditorAccountFieldControl_ValueChanged: function (e) {
            var that = this;

            if (that._CreditorAccountFieldControl.GetValue() == null)
                return;

            if (that._ParentEntity.FieldExists("ReceiveDocType") && !ValueIsEmpty(that._ParentEntity.GetFieldValue("ReceiveDocType"))) {
                if (!ValueIsEmpty(that._CreditorAccountFieldControl.GetValue()))
                    if (!acc.AccountHasFloat(that._CreditorAccountFieldControl.GetValue(), "Person")) {
                        afw.ErrorDialog.Show("حساب بستانکار انتخاب شده باید دارای شناور شخص باشد");
                        setTimeout(function () {
                            that._CreditorAccountFieldControl.SetValue(null);
                        }, 500);
                    }
            }
            else if (that._ParentEntity.FieldExists("PayDocType") && !ValueIsEmpty(that._ParentEntity.GetFieldValue("PayDocType"))) {
                if (!ValueIsEmpty(that._CreditorAccountFieldControl.GetValue()))
                    if (!acc.AccountHasFloat(that._CreditorAccountFieldControl.GetValue(), null)) {
                        afw.ErrorDialog.Show("امکان انتخاب حساب بستانکار دارای شناور در عملیات پرداخت وجود ندارد");
                        setTimeout(function () {
                            that._CreditorAccountFieldControl.SetValue(null);
                        }, 500);
                    }
            }
        },

        _CreditorAccountLookupControl_OpeningLookup: function (e) {
            var that = this;

            e.Sender.SetLookupDataListControlCustomOptions({ FinancialYear: that._FinancialYearFieldControl.GetValue() });
        },

        _OnOpening: function () {
            var that = this;

            afw.EntityWindowBase.fn._OnOpening.call(that);
        },

        _OnOpened: function () {
            var that = this;

            afw.EntityWindowBase.fn._OnOpened.call(that);
        },

        _OnClosed: function () {
            var that = this;

            afw.EntityWindowBase.fn._OnClosed.call(that);
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            afw.EntityWindowBase.fn._OnToolbarButtonClicked.call(that, buttonKey);
        },

        _AdjustForm: function () {
            var that = this;

            afw.EntityWindowBase.fn._AdjustForm.call(that);
        },

        _ValidateForm: function () {
            var that = this;

            if (!afw.EntityWindowBase.fn._ValidateForm.call(that))
                return false;

            if (ValueIsEmpty(that._BindableEntity.get("DebtorAccount")) && that._IsDebtorAccount) {
                afw.MessageDialog.Show("مقدار فیلد حساب بدهکار را وارد نکرده اید.");
                return false;
            }

            if (ValueIsEmpty(that._BindableEntity.get("CreditorAccount")) && that._IsCreditorAccount) {
                afw.MessageDialog.Show("مقدار فیلد حساب بستانکار را وارد نکرده اید.");
                return false;
            }

            return true;
        },

        _Save: function () {
            var that = this;

            var saved = afw.EntityWindowBase.fn._Save.call(that);

            return saved;
        }
    });

    //Static Members:

    FormClass.TypeName = "rp.FinancialOpKindAccSettingEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    rp.FinancialOpKindAccSettingEditForm = FormClass;
})();
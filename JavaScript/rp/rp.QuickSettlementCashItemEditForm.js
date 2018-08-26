(function () {
    var objectEvents = afw.EntityWindowBase.Events.concat([]);

    var FormClass = afw.EntityWindowBase.extend({
        events: objectEvents,

        GetType: function () {
            return rp.QuickSettlementCashItemEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._FinancialYearID = cmn.GetUserActiveFinancialYearID();

            that._FinancialOpKindFieldControl = that.FindControl("FinancialOpKindFieldControl");
            that._FinancialOpKindLookupControl = that._FinancialOpKindFieldControl.FindControl("InnerControl");
            //بخاطر نبودن اطلاعات کافی برای اجباری کردن فیلد نوع عملیات مالی، در فرم این فیلد اجباری شده است
            that._FinancialOpKindLookupControl.SetShowRequiredStar(true);
            that._FinancialOpKindLookupControl.SetBaseFilterExpression(
                String.Format("ReceiveOrPay = '{0}' and ReceiveDocType in (select ID from rp_ReceiveTypes where Name = 'Naghd') and IsActive = 1",
                    afw.OptionSetHelper.GetOptionSetItemID("rp.ReceiveOrPay.Receive")));
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

            if (that._FinancialOpKindLookupControl.GetValue() == null) {
                afw.ErrorDialog.Show("نوع عملیات مالی تعیین نشده است.");
                return false;
            }

            var financialOpKindAccSetting = afw.uiApi.FetchEntity("rp.FinancialOpKindAccSetting",
                String.Format("FinancialOpKind = '{0}' and FinancialYear = '{1}'", that._FinancialOpKindLookupControl.GetValue(), that._FinancialYearID));
            if (financialOpKindAccSetting == null) {
                afw.ErrorDialog.Show("تنظیمات حسابداری برای نوع عملیات مالی در سال مالی جاری تعیین نشده است.");
                return false;
            }

            if (ValueIsEmpty(financialOpKindAccSetting.GetFieldValue("CreditorAccount"))) {
                afw.ErrorDialog.Show("مقدار حساب بستانکار در تنظیمات حسابداری برای این عملیات مالی تعیین نشده است.");
                return false;
            }

            var floatAccountsNames = acc.GetAccountFloatNames(financialOpKindAccSetting.GetFieldValue("CreditorAccount"));
            if (!ValueIsIn("Person", floatAccountsNames)) {
                afw.ErrorDialog.Show("حساب بستانکارانتخاب شده برای نوع عملیات مالی باید دارای شناور شخص باشد.");
                return false;
            }

            if (floatAccountsNames.length != 1) {
                afw.ErrorDialog.Show("حساب بستانکارانتخاب شده برای نوع عملیات مالی فقط باید دارای شناور شخص باشد.");
                return false;
            }

            return true;
        },

        _Save: function () {
            var that = this;

            var saved = afw.EntityWindowBase.fn._Save.call(that);

            return saved;
        },

        _OnPreviewKeyUp: function (e) {
            var that = this;

            afw.EntityWindowBase.fn._OnPreviewKeyUp.call(that, e);
        },

        _DoDestroy: function () {
            var that = this;

            afw.EntityWindowBase.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "rp.QuickSettlementCashItemEditForm";
    FormClass.BaseType = afw.EntityWindowBase;
    FormClass.Events = objectEvents;

    rp.QuickSettlementCashItemEditForm = FormClass;
})();

(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return rp.CashAccSettingEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._MainDockPanel = that.FindControl("MainDockPanel");
            that._FinancialYearFieldControl = that.FindControl("FinancialYearFieldControl");
            that._FinancialYearLookupControl = that._FinancialYearFieldControl.FindControl("InnerControl");
            that._FloatAccountsPanel = that.FindControl("FloatAccountsPanel");
            that._AccountInCodingFieldControl = that.FindControl("AccountInCodingFieldControl");
            that._AccountInCodingLookupControl = that._AccountInCodingFieldControl.FindControl("InnerControl");
            that._AccountInCodingLookupControl.SetShowRequiredStar(true);
            that._AccountInCodingLookupControl.SetHasEntityViewButton(false);
            that._AccountInCodingFieldControl.bind("ValueChanged", function (e) { that._AccountInCodingFieldControl_ValueChanged(e); });
            that._AccountInCodingLookupControl.bind("OpeningLookup", function (e) { that._AccountInCodingLookupControl_OpeningLookup(e); });
            that._FinancialYearLookupControl.bind("ValueChanged", function (e) { that._FinancialYearLookupControl_ValueChanged(e); })

            that._FloatAccountsSelectionControl = afw.uiApi.CreateSavedFormByName(
                that._FloatAccountsPanel, "acc.FloatAccountsSelectionControl",
                {
                    BindableEntity: that._BindableEntity,
                    PersonFieldName: "CashOwnerPerson",
                    CostCenterFieldName: null,
                    ProjectFieldName: null,
                    ForeignCurrencyFieldName: null,
                    Visible: false,
                    RightPadding: 1,
                    LabelWidth: 110
                });

            that._AdjustFloatAccountsSelectionControl(that._BindableEntity.get("AccountInCoding"));
        },

        _AdjustFloatAccountsSelectionControl: function (accountID) {
            var that = this;

            that._FloatAccountsSelectionControl.SetAccount(accountID);

            if (!ValueIsEmpty(accountID) && acc.AccountHasFloat(accountID)) {
                that._FloatAccountsPanel.SetVisible(true);

                if (that._FormMode == "New")
                    that._FloatAccountsPanel.SetFillParent(true);

                that._MainDockPanel.SetPaneSizeSetting(3, 70);
                that._FloatAccountsSelectionControl.SetVisible(true);
                that._FloatAccountsSelectionControl.SetFillParent(true);
            }
            else {
                that._MainDockPanel.SetPaneSizeSetting(3, 1);
                that._FloatAccountsPanel.SetVisible(false);
                that._FloatAccountsPanel.SetFillParent(false);
                that._FloatAccountsSelectionControl.SetVisible(false);
                that._FloatAccountsSelectionControl.SetFillParent(false);
            }
        },

        _AccountInCodingFieldControl_ValueChanged: function (e) {
            var that = this;

            if (!ValueIsEmpty(that._AccountInCodingFieldControl.GetValue()))
                if (!acc.AccountHasFloat(that._AccountInCodingFieldControl.GetValue(), "Person")) {
                    that._AccountInCodingFieldControl.SetValue(null);
                    afw.ErrorDialog.Show("حساب انتخاب شده حتما باید دارای شناور شخص باشد");
                }
                else
                    that._AdjustFloatAccountsSelectionControl(that._AccountInCodingFieldControl.GetValue());


            that._AdjustForm();
        },

        _FinancialYearLookupControl_ValueChanged: function (e) {
            var that = this;

            that._AccountInCodingLookupControl.SetValue(null);
        },

        _AccountInCodingLookupControl_OpeningLookup: function (e) {
            var that = this;

            if (!ValueIsEmpty(that._FinancialYearFieldControl.GetValue()))
                e.Sender.SetLookupDataListControlCustomOptions({ FinancialYear: that._FinancialYearFieldControl.GetValue() });
            else
                e.Sender.SetLookupDataListControlCustomOptions({ FinancialYear: null });
        },

        _OnOpening: function () {
            var that = this;

            afw.EntityWindowBase.fn._OnOpening.call(that);
        },

        _OnOpened: function () {
            var that = this;

            afw.EntityWindowBase.fn._OnOpened.call(that);

            if (!ValueIsEmpty(that._AccountInCodingFieldControl.GetValue()))
                if (!acc.AccountHasFloat(that._AccountInCodingFieldControl.GetValue(), "Person")) {
                    that._AccountInCodingFieldControl.SetValue(null);
                    afw.ErrorDialog.Show("حساب انتخاب شده حتما باید دارای شناور شخص باشد");
                }
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

            if (ValueIsEmpty(that._AccountInCodingFieldControl.GetValue()))
                that._MainDockPanel.SetPaneSizeSetting(3, 1);

            //if (that._FormMode == "Edit" && that._BindableEntity.get("AccountInCoding") != null && that._BindableEntity.get("CashOwnerPerson") != null) {
            //    that._AccountInCodingFieldControl.SetReadOnly(true);

            //    if (!ValueIsEmpty(that._FloatAccountsSelectionControl.FindControl("CashOwnerPersonLookupControl")) &&
            //        that._BindableEntity.get("CashOwnerPerson") == null)
            //        that._FloatAccountsSelectionControl.SetEnabled(true);
            //    else
            //        that._FloatAccountsSelectionControl.SetEnabled(false);
            //}
        },

        _ValidateForm: function () {
            var that = this;

            if (ValueIsEmpty(that._AccountInCodingFieldControl.GetValue())) {
                afw.MessageDialog.Show("مقدار فیلد حساب کدینگ را وارد نکرده اید.");
                return false;
            }

            if (!that._FloatAccountsSelectionControl.ValidateControl())
                return false;

            if (!afw.EntityWindowBase.fn._ValidateForm.call(that))
                return false;

            return true;
        },

        _Save: function () {
            var that = this;

            var saved = afw.EntityWindowBase.fn._Save.call(that);

            return saved;
        }
    });

    //Static Members:

    FormClass.TypeName = "rp.CashAccSettingEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    rp.CashAccSettingEditForm = FormClass;
})();
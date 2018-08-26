(function () {
    var objectEvents = afw.EntityWindowBase.Events.concat([]);

    var FormClass = afw.EntityWindowBase.extend({
        events: objectEvents,

        GetType: function () {
            return cmn.DiscountAccSettingEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._UserActiveFinancialYearID = cmn.GetUserActiveFinancialYearID();

            that._FinancialYearFieldControl = that.FindControl("FinancialYearFieldControl");
            that._DebtorAccountFieldControl = that.FindControl("DebtorAccountFieldControl");
            that._DebtorAccountLookupControl = that._DebtorAccountFieldControl.FindControl("InnerControl");
            that._DebtorAccountLookupControl.SetHasEntityViewButton(false);

            that._CreditorAccountFieldControl = that.FindControl("CreditorAccountFieldControl");
            that._CreditorAccountLookupControl = that._CreditorAccountFieldControl.FindControl("InnerControl");
            that._CreditorAccountLookupControl.SetHasEntityViewButton(false);

            that._DebtorAccountLookupControl.bind("OpeningLookup", function (e) { that._DebtorAccountLookupControl_OpeningLookup(e); });
            that._CreditorAccountLookupControl.bind("OpeningLookup", function (e) { that._CreditorAccountLookupControl_OpeningLookup(e); });
            that._FinancialYearFieldControl.bind("ValueChanged", function (e) { that._FinancialYearFieldControl_ValueChanged(e); });

            if (that._FormMode == "New")
                that._FinancialYearFieldControl.SetValue(that._UserActiveFinancialYearID);
            else {
                that._DebtorAccountLookupControl.SetBaseFilterExpression(String.Format("FinancialYear = '{0}'", that._BindableEntity.get("FinancialYear")));
                that._CreditorAccountLookupControl.SetBaseFilterExpression(String.Format("FinancialYear = '{0}'", that._BindableEntity.get("FinancialYear")));
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

        _DebtorAccountLookupControl_OpeningLookup: function (e) {
            var that = this;

            e.Sender.SetLookupDataListControlCustomOptions({ FinancialYear: that._FinancialYearFieldControl.GetValue() });
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

    FormClass.TypeName = "cmn.DiscountAccSettingEditForm";
    FormClass.BaseType = afw.EntityWindowBase;
    FormClass.Events = objectEvents;

    cmn.DiscountAccSettingEditForm = FormClass;
})();

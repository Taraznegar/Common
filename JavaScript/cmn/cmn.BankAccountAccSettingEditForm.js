(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return cmn.BankAccountAccSettingEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._UserActiveFinancialYearID = cmn.GetUserActiveFinancialYearID();

            that._ParentEntity = options.ParentEntity;

            that._FinancialYearFieldControl = that.FindControl("FinancialYearFieldControl");
            that._FinancialYearLookupControl = that._FinancialYearFieldControl.FindControl("InnerControl");

            that._AccountInCodingFieldControl = that.FindControl("AccountInCodingFieldControl");
            that._AccountInCodingLookupControl = that._AccountInCodingFieldControl.FindControl("InnerControl");
            that._HesabeAsnadeDarJaryaneVosoolFieldControl = that.FindControl("HesabeAsnadeDarJaryaneVosoolFieldControl");
            that._HesabeAsnadeDarJaryaneVosoolLookupControl = that._HesabeAsnadeDarJaryaneVosoolFieldControl.FindControl("InnerControl");
            that._HesabeAsnadePardakhtaniFieldControl = that.FindControl("HesabeAsnadePardakhtaniFieldControl");
            that._HesabeAsnadePardakhtaniLookupControl = that._HesabeAsnadePardakhtaniFieldControl.FindControl("InnerControl");
            that._HesabeCheqeZemanatFieldControl = that.FindControl("HesabeCheqeZemanatFieldControl");
            that._HesabeCheqeZemanatLookupControl = that._HesabeCheqeZemanatFieldControl.FindControl("InnerControl");

            that._AccountInCodingLookupControl.bind("OpeningLookup", function (e) { that._AccountsLookupControl_OpeningLookup(e); });
            that._HesabeAsnadeDarJaryaneVosoolLookupControl.bind("OpeningLookup", function (e) { that._AccountsLookupControl_OpeningLookup(e); });
            that._HesabeAsnadePardakhtaniLookupControl.bind("OpeningLookup", function (e) { that._AccountsLookupControl_OpeningLookup(e); });
            that._HesabeCheqeZemanatLookupControl.bind("OpeningLookup", function (e) { that._AccountsLookupControl_OpeningLookup(e); });

            that._AccountInCodingLookupControl.bind("ValueChanged", function (e) { that._AccountsLookupControl_ValueChanged(e); });
            that._HesabeAsnadeDarJaryaneVosoolLookupControl.bind("ValueChanged", function (e) { that._AccountsLookupControl_ValueChanged(e); });
            that._HesabeAsnadePardakhtaniLookupControl.bind("ValueChanged", function (e) { that._AccountsLookupControl_ValueChanged(e); });
            that._HesabeCheqeZemanatLookupControl.bind("ValueChanged", function (e) { that._AccountsLookupControl_ValueChanged(e); });

            that._FinancialYearLookupControl.bind("ValueChanged", function (e) { that._FinancialYearLookupControl_OpeningLookup(e); });

            if (that._FormMode == "New")
                that._FinancialYearFieldControl.SetValue(that._UserActiveFinancialYearID);
            else {
                that._AccountInCodingLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._BindableEntity.get("FinancialYear")));
                that._HesabeAsnadeDarJaryaneVosoolLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._BindableEntity.get("FinancialYear")));
                that._HesabeAsnadePardakhtaniLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._BindableEntity.get("FinancialYear")));
                that._HesabeCheqeZemanatLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._BindableEntity.get("FinancialYear")));
            }
        },

        _AccountsLookupControl_OpeningLookup: function (e) {
            var that = this;

            e.Sender.SetLookupDataListControlCustomOptions({ FinancialYear: that._FinancialYearFieldControl.GetValue() });

            e.Sender.SetLookupDataListControlCustomOptions({ AccountName: 'Tafsili' });
        },

        _AccountsLookupControl_ValueChanged: function (e) {
            var that = this;

            var accountsLookupControl = e.Sender;
            var accountID = accountsLookupControl.GetValue();
            if (!ValueIsEmpty(accountID)) {
                if (acc.AccountHasFloat(accountID)) {
                    accountsLookupControl.SetValue(null);
                    afw.ErrorDialog.Show("حساب انتخاب شده نباید دارای شناور باشد");
                }
            }
        },

        _FinancialYearLookupControl_OpeningLookup: function (e) {
            var that = this;

            that._AccountInCodingLookupControl.SetValue(null);
            that._HesabeAsnadeDarJaryaneVosoolLookupControl.SetValue(null);
            that._HesabeAsnadePardakhtaniLookupControl.SetValue(null);
            that._HesabeCheqeZemanatLookupControl.SetValue(null);

            if (that._FinancialYearFieldControl.GetValue() != null) {
                that._AccountInCodingLookupControl.SetBaseFilterExpression(String.Format("FinancialYear = '{0}'", that._FinancialYearFieldControl.GetValue()));
                that._HesabeAsnadeDarJaryaneVosoolLookupControl.SetBaseFilterExpression(String.Format("FinancialYear = '{0}'", that._FinancialYearFieldControl.GetValue()));
                that._HesabeAsnadePardakhtaniLookupControl.SetBaseFilterExpression(String.Format("FinancialYear = '{0}'", that._FinancialYearFieldControl.GetValue()));
                that._HesabeCheqeZemanatLookupControl.SetBaseFilterExpression(String.Format("FinancialYear = '{0}'", that._FinancialYearFieldControl.GetValue()));
            }
            else {
                that._AccountInCodingLookupControl.SetBaseFilterExpression(String.Format("FinancialYear = '{0}'", that._UserActiveFinancialYearID));
                that._HesabeAsnadeDarJaryaneVosoolLookupControl.SetBaseFilterExpression(String.Format("FinancialYear = '{0}'", that._UserActiveFinancialYearID));
                that._HesabeAsnadePardakhtaniLookupControl.SetBaseFilterExpression(String.Format("FinancialYear = '{0}'", that._UserActiveFinancialYearID));
                that._HesabeCheqeZemanatLookupControl.SetBaseFilterExpression(String.Format("FinancialYear = '{0}'", that._UserActiveFinancialYearID));
            }
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
        }
    });

    //Static Members:

    FormClass.TypeName = "cmn.BankAccountAccSettingEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    cmn.BankAccountAccSettingEditForm = FormClass;
})();
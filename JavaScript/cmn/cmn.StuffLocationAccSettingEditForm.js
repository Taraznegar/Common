(function () {
    var objectEvents = afw.EntityWindowBase.Events.concat([]);

    var FormClass = afw.EntityWindowBase.extend({
        events: objectEvents,

        GetType: function () {
            return cmn.StuffLocationAccSettingEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._UserActiveFinancialYearID = cmn.GetUserActiveFinancialYearID();

            that._FinancialYearFieldControl = that.FindControl("FinancialYearFieldControl");
            that._AccountFieldControl = that.FindControl("AccountFieldControl");
            that._AccountLookupControl = that._AccountFieldControl.FindControl("InnerControl");
            that._AccountLookupControl.SetHasEntityViewButton(false);
            that._AccountLookupControl.bind("OpeningLookup", function (e) { that._AccountLookupControl_OpeningLookup(e); });

            that._FinancialYearFieldControl.bind("ValueChanged", function (e) { that._FinancialYearFieldControl_ValueChanged(e); });

            if (that._FormMode == "New")
                that._FinancialYearFieldControl.SetValue(that._UserActiveFinancialYearID);
            else {
                that._AccountLookupControl.SetBaseFilterExpression(String.Format("FinancialYear = '{0}'", that._BindableEntity.get("FinancialYear")));
            }
        },

        _FinancialYearFieldControl_ValueChanged: function (e) {
            var that = this;

            that._AccountLookupControl.SetValue(null);

            if (that._FinancialYearFieldControl.GetValue() != null)
                that._AccountLookupControl.SetBaseFilterExpression(String.Format("FinancialYear = '{0}'", that._FinancialYearFieldControl.GetValue()));
            else
                that._AccountLookupControl.SetBaseFilterExpression(String.Format("FinancialYear = '{0}'", that._UserActiveFinancialYearID));
        },

        _AccountLookupControl_OpeningLookup: function (e) {
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

    FormClass.TypeName = "cmn.StuffLocationAccSettingEditForm";
    FormClass.BaseType = afw.EntityWindowBase;
    FormClass.Events = objectEvents;

    cmn.StuffLocationAccSettingEditForm = FormClass;
})();
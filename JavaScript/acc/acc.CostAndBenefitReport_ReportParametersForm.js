(function () {
    var FormClass = afw.ReportParametersWindowBase.extend({
        GetType: function () {
            return acc.CostAndBenefitReport_ReportParametersForm;
        },

        init: function (options) {
            var that = this;

            afw.ReportParametersWindowBase.fn.init.call(that, options);

            that._FromDateFieldControl = that.FindControl("FromDateFieldControl");
            that._ToDateFieldControl = that.FindControl("ToDateFieldControl");

            var financialYearEntity = afw.uiApi.FetchEntity("cmn.FinancialYear", "IsCurrentYear = 1");
            var financialYearID = financialYearEntity.GetFieldValue("ID"); 
            var startDate = financialYearEntity.GetFieldValue("StartDate");
            var endDate = financialYearEntity.GetFieldValue("EndDate");

            that._FromDateFieldControl.SetValue(startDate);
            that._ToDateFieldControl.SetValue(endDate);
            that._BindableEntity.set("FinancialYear", financialYearID);
        },

        _OnOpened: function (sender, e) {
            var that = this;

            afw.ReportParametersWindowBase.fn._OnOpened.call(that);
        },

        _OnClosed: function () {
            var that = this;

            afw.ReportParametersWindowBase.fn._OnClosed.call(that);
        },

        _ValidateForm: function () {
            var that = this;

            return afw.ReportParametersWindowBase.fn._ValidateForm.call(that);
        },

        _RunReport: function () {
            var that = this;

            afw.ReportParametersWindowBase.fn._RunReport.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "acc.CostAndBenefitReport_ReportParametersForm";
    FormClass.BaseType = afw.ReportParametersWindowBase;


    acc.CostAndBenefitReport_ReportParametersForm = FormClass;
})();
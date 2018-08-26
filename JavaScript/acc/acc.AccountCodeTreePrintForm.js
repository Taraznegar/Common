(function () {
    var objectEvents = afw.Window.Events.concat([]);

    var FormClass = afw.Window.extend({
        events: objectEvents,

        GetType: function () {
            return acc.AccountCodeTreePrintForm;
        },

        init: function (options) {
            var that = this;

            afw.Window.fn.init.call(that, options);
            var formObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (formObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, formObjectData, false);

            that._FromAccountCodeLookupControl = that.FindControl("FromAccountCodeLookupControl");
            that._ToAccountCodeLookupControl = that.FindControl("ToAccountCodeLookupControl");
            var printButton = that.FindControl("PrintButton");
            that._WithFloatGroupsCheckBox = that.FindControl("WithFloatGroupsCheckBox");

            that._ActiveFinancialYearID = cmn.GetUserActiveFinancialYearID();

            that._FromAccountCodeLookupControl.SetBaseFilterExpression(String.Format("FinancialYear = '{0}'", that._ActiveFinancialYearID));
            that._ToAccountCodeLookupControl.SetBaseFilterExpression(String.Format("FinancialYear = '{0}'", that._ActiveFinancialYearID));

            that._FromAccountCodeLookupControl.bind("OpeningLookup", function (e) { that._AccountLookupControl_OpeningLookup(e); });
            that._ToAccountCodeLookupControl.bind("OpeningLookup", function (e) { that._AccountLookupControl_OpeningLookup(e); });

            printButton.BindEvent("Click", function () { that._PrintButton_Click(); });

            that._AccountGroups = afw.DataListHelper.FetchEntityListOfDataList(
                "acc.AccountGroups", null, null,null,
                "GroupCode", null, null).Entities;
        },

        _PrintButton_Click: function () {
            var that = this;

            var fromAccountAllParents = acc.GetAccountAllParentsFullCode(that._FromAccountCodeLookupControl.GetValue());
            var toAccountAllParents = acc.GetAccountAllParentsFullCode(that._ToAccountCodeLookupControl.GetValue());

            if (ValueIsEmpty(that._FromAccountCodeLookupControl.GetAutoComplete().GetText())) 
                fromAccountCodeText = "گروه حساب : " + that._AccountGroups[0].GetFieldValue("GroupTitle_Text");
            else
                fromAccountCodeText = "کد حساب : " + that._FromAccountCodeLookupControl.GetAutoComplete().GetText();

            if (ValueIsEmpty(that._ToAccountCodeLookupControl.GetAutoComplete().GetText())) 
                toAccountCodeText = "گروه حساب : " + that._AccountGroups[that._AccountGroups.length - 1].GetFieldValue("GroupTitle_Text");
            else
                toAccountCodeText = "کد حساب : " + that._ToAccountCodeLookupControl.GetAutoComplete().GetText();

            var parametrNames = [
                "FinancialYearID",
                "PrintDateTime",
                "OrganizationUnitID",
                "FromAccountCode",
                "ToAccountCode",
                "FromGroupCode",
                "ToGroupCode",
                "FromKolFullCode",
                "ToKolFullCode",
                "FromMoinFullCode",
                "ToMoinFullCode",
                "FromTafsiliFullCode",
                "ToTafsiliFullCode"
            ];

            var parametrValues = [
                ValueIsEmpty(that._ActiveFinancialYearID) ? "null" : "'" + that._ActiveFinancialYearID + "'",
                afw.DateTimeHelper.GregorianToPersian(afw.DateTimeHelper.GetServerDateTime()),
                cmn.GetOrganizationInformation().GetFieldValue("ID"),
                fromAccountCodeText,
                toAccountCodeText,
                ValueIsEmpty(fromAccountAllParents.GroupCode) ? "null" : String.Format("\'{0}\'", fromAccountAllParents.GroupCode),
                ValueIsEmpty(toAccountAllParents.GroupCode) ? "null" : String.Format("\'{0}\'", toAccountAllParents.GroupCode),
                ValueIsEmpty(fromAccountAllParents.KolFullCode) ? "null" : String.Format("\'{0}\'", fromAccountAllParents.KolFullCode),
                ValueIsEmpty(toAccountAllParents.KolFullCode) ? "null" : String.Format("\'{0}\'", toAccountAllParents.KolFullCode),
                ValueIsEmpty(fromAccountAllParents.MoinFullCode) ? "null" : String.Format("\'{0}\'", fromAccountAllParents.MoinFullCode),
                ValueIsEmpty(toAccountAllParents.MoinFullCode) ? "null" : String.Format("\'{0}\'", toAccountAllParents.MoinFullCode),
                ValueIsEmpty(fromAccountAllParents.TafsiliFullCode) ? "null" : String.Format("\'{0}\'", fromAccountAllParents.TafsiliFullCode),
                ValueIsEmpty(toAccountAllParents.TafsiliFullCode) ? "null" : String.Format("\'{0}\'", toAccountAllParents.TafsiliFullCode)
            ];

            afw.uiApi.ShowProgress(that);

            if (that._WithFloatGroupsCheckBox.GetValue()) {
                afw.ReportHelper.RunReport("acc.AccountCodeTreeWithFloatGroupsReport", parametrNames, parametrValues, null,
                    function (result) {
                        afw.uiApi.HideProgress(that);
                        that.Close();
                    });
            }
            else {
                afw.ReportHelper.RunReport("acc.AccountCodeTreeReport", parametrNames, parametrValues, null,
                    function (result) {
                        afw.uiApi.HideProgress(that);
                        that.Close();
                    });
            }

        },

        _OnOpening: function () {
            var that = this;

            afw.Window.fn._OnOpening.call(that);
        },

        _OnOpened: function () {
            var that = this;

            afw.Window.fn._OnOpened.call(that);
        },

        _OnClosed: function () {
            var that = this;

            afw.Window.fn._OnClosed.call(that);
        },

        _AccountLookupControl_OpeningLookup: function (e) {
            var that = this;

            e.Sender.SetLookupDataListControlCustomOptions({
                AccountName: 'Tafsili',
                FinancialYear: that._ActiveFinancialYearID
            });
        }
    });

    //Static Members:

    FormClass.TypeName = "acc.AccountCodeTreePrintForm";
    FormClass.BaseType = afw.Window;
    FormClass.Events = objectEvents;

    acc.AccountCodeTreePrintForm = FormClass;
})();
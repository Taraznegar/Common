(function () {
    var objectEvents = afw.Window.Events.concat([]);

    var FormClass = afw.Window.extend({
        events: objectEvents,

        GetType: function () {
            return acc.AccountAllLevelReportForm;
        },

        init: function (options) {
            var that = this;

            afw.Window.fn.init.call(that, options);
            var formObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (formObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, formObjectData, false);

            that._FromAccountCodeLookupControl = that.FindControl("FromAccountCodeLookupControl");
            that._ToAccountCodeLookupControl = that.FindControl("ToAccountCodeLookupControl");
            that._FromIssueDateControl = that.FindControl("FromIssueDateControl");
            that._ToIssueDateControl = that.FindControl("ToIssueDateControl");
            that._WithoutCodingFilterCheckBox = that.FindControl("WithoutCodingFilterCheckBox");
            var printButton = that.FindControl("PrintButton");
           
            that._ActiveFinancialYearEntity = cmn.GetUserActiveFinancialYearEntity();
            
            that._FromIssueDateControl.SetValue(that._ActiveFinancialYearEntity.GetFieldValue("StartDate"));
            that._ToIssueDateControl.SetValue(that._ActiveFinancialYearEntity.GetFieldValue("EndDate"));

            that._FromAccountCodeLookupControl.SetBaseFilterExpression(String.Format("FinancialYear = '{0}'", that._ActiveFinancialYearEntity.GetFieldValue("ID")));
            that._ToAccountCodeLookupControl.SetBaseFilterExpression(String.Format("FinancialYear = '{0}'", that._ActiveFinancialYearEntity.GetFieldValue("ID")));

            that._FromAccountCodeLookupControl.bind("OpeningLookup", function (e) { that._AccountLookupControl_OpeningLookup(e); });
            that._ToAccountCodeLookupControl.bind("OpeningLookup", function (e) { that._AccountLookupControl_OpeningLookup(e); });

            printButton.BindEvent("Click", function () { that._PrintButton_Click(); });
            that._WithoutCodingFilterCheckBox.BindEvent("CheckedChanged", function (e) { that._WithoutCodingFilterCheckBox_CheckedChanged(e); });
            that._AccountGroups = afw.DataListHelper.FetchEntityListOfDataList(
                "acc.AccountGroups", null, null,null,
                "GroupCode", null, null).Entities;
        },

        _PrintButton_Click: function () {
            var that = this;

            if (that._WithoutCodingFilterCheckBox.GetValue() == false) {
                var fromAccountAllParents = acc.GetAccountAllParentsFullCode(that._FromAccountCodeLookupControl.GetValue());
                var toAccountAllParents = acc.GetAccountAllParentsFullCode(that._ToAccountCodeLookupControl.GetValue());
            }
            else {
                var fromAccountAllParents = acc.GetAccountAllParentsFullCode(null);
                var toAccountAllParents = acc.GetAccountAllParentsFullCode(null);
            }
                
            if (ValueIsEmpty(that._FromAccountCodeLookupControl.GetAutoComplete().GetText())
                || that._WithoutCodingFilterCheckBox.GetValue() == true)
                fromAccountCodeText = "گروه حساب : " + that._AccountGroups[0].GetFieldValue("GroupTitle_Text");
            else
                fromAccountCodeText = "کد حساب : " + that._FromAccountCodeLookupControl.GetAutoComplete().GetText();

            if (ValueIsEmpty(that._ToAccountCodeLookupControl.GetAutoComplete().GetText())
                || that._WithoutCodingFilterCheckBox.GetValue() == true)
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
                "ToTafsiliFullCode",
                "FromIssueDate",
                "ToIssueDate",
            ];

            var parametrValues = [
                ValueIsEmpty(that._ActiveFinancialYearEntity.GetFieldValue("ID")) ? "null" : "'" + that._ActiveFinancialYearEntity.GetFieldValue("ID") + "'",
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
                ValueIsEmpty(toAccountAllParents.TafsiliFullCode) ? "null" : String.Format("\'{0}\'", toAccountAllParents.TafsiliFullCode),
                String.Format("\'{0}\'", that._FromIssueDateControl.GetValue()),
                String.Format("\'{0}\'",that._ToIssueDateControl.GetValue())
            ];

            afw.uiApi.ShowProgress(that);

            afw.ReportHelper.RunReport("acc.AccountAllLevelReport", parametrNames, parametrValues, null,
                function (result) {
                    afw.uiApi.HideProgress(that);
                    that.Close();
                });

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

        _WithoutCodingFilterCheckBox_CheckedChanged: function (e) {
            var that = this;

            if (that._WithoutCodingFilterCheckBox.GetValue() == true) {
                that._FromAccountCodeLookupControl.SetReadOnly(true);
                that._ToAccountCodeLookupControl.SetReadOnly(true);
            }
            else {
                that._FromAccountCodeLookupControl.SetReadOnly(false);
                that._ToAccountCodeLookupControl.SetReadOnly(false);
            }
        },

        _AccountLookupControl_OpeningLookup: function (e) {
            var that = this;

            e.Sender.SetLookupDataListControlCustomOptions({
                AccountName: 'Tafsili',
                FinancialYear: that._ActiveFinancialYearEntity.GetFieldValue("ID")
            });
        }
    });

    //Static Members:

    FormClass.TypeName = "acc.AccountAllLevelReportForm";
    FormClass.BaseType = afw.Window;
    FormClass.Events = objectEvents;

    acc.AccountAllLevelReportForm = FormClass;
})();
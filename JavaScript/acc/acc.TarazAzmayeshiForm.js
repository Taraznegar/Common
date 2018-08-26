(function () {
    var objectEvents = afw.BasePanel.Events.concat([]);

    var FormClass = afw.BasePanel.extend({
        events: objectEvents,

        GetType: function () {
            return acc.TarazAzmayeshiForm;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (designObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._NoeTarazAzmayeshiOptionSet = that.FindControl("NoeTarazAzmayeshiOptionSet");
            that._FinancialDocTypeOptionSet = that.FindControl("FinancialDocTypeOptionSet");
            that._OrganizationUnitLookup = that.FindControl("OrganizationUnitLookup");
            that._FilterOnIssueDateReferenceDocCheckBox = that.FindControl("FilterOnIssueDateReferenceDocCheckBox");
            that._FromDateTimeControl = that.FindControl("FromDateTimeControl");
            that._ToDateTimeControl = that.FindControl("ToDateTimeControl");
            that._FilterOnDocReferenceNoCheckBox = that.FindControl("FilterOnDocReferenceNoCheckBox");
            that._FromDocReferenceNoTextBox = that.FindControl("FromDocReferenceNoTextBox");
            that._ToDocReferenceNoTextBox = that.FindControl("ToDocReferenceNoTextBox");
            that._DebtorSumLabel = that.FindControl("DebtorSumLabel");
            that._CreditorSumLabel = that.FindControl("CreditorSumLabel");
            that._RemainedLabel = that.FindControl("RemainedLabel");
            that._PrintButton = that.FindControl("PrintButton");
            that._ApplyFilterButton = that.FindControl("ApplyFilterButton");
            that._DataListPanel = that.FindControl("DataListPanel");

            that._PrintButton.SetEnabled(false);
            that._PrintButton.BindEvent("Click", function (e) { that._PrintButton_Click(e); });
            that._ApplyFilterButton.BindEvent("Click", function (e) { that._ApplyFilterButton_Click(e); });
            that._FilterOnIssueDateReferenceDocCheckBox.bind("CheckedChanged", function (e) {
                that._FilterOnIssueDateReferenceDocCheckBox_CheckedChanged(e);});
            that._FilterOnDocReferenceNoCheckBox.bind("CheckedChanged", function (e) {
                that._FilterOnDocReferenceNoCheckBox_CheckedChanged(e); });

            that._FilterOnIssueDateReferenceDocCheckBox.BindEvent("ValueChanged", function (e) { that._DestroyDataList(e); });
            that._FilterOnDocReferenceNoCheckBox.BindEvent("ValueChanged", function (e) { that._DestroyDataList(e); });
            that._FromDateTimeControl.BindEvent("ValueChanged", function (e) { that._DestroyDataList(e); });
            that._ToDateTimeControl.BindEvent("ValueChanged", function (e) { that._DestroyDataList(e); });
            that._FromDocReferenceNoTextBox.BindEvent("ValueChanged", function (e) { that._DestroyDataList(e); });
            that._ToDocReferenceNoTextBox.BindEvent("ValueChanged", function (e) { that._DestroyDataList(e); });
            that._NoeTarazAzmayeshiOptionSet.BindEvent("ValueChanged", function (e) { that._DestroyDataList(e); });
            that._FinancialDocTypeOptionSet.BindEvent("ValueChanged", function (e) { that._DestroyDataList(e); });
            that._OrganizationUnitLookup.BindEvent("ValueChanged", function (e) { that._DestroyDataList(e); });

            that._ActiveFinancialYearEntity = cmn.GetUserActiveFinancialYearEntity();
            that._FromDateTimeControl.SetValue(that._ActiveFinancialYearEntity.GetFieldValue("StartDate"));
            that._ToDateTimeControl.SetValue(that._ActiveFinancialYearEntity.GetFieldValue("EndDate"));
            that._TarazAzmayeshiGridView = null;

        },

        _PrintButton_Click: function (e) {
            var that = this;

            var organizationName = cmn.GetOrganizationInformation().GetFieldValue("Name");

            var fromDate = "'" + that._FromDateTimeControl.GetValue() + "'";
            var toDate = "'" + that._ToDateTimeControl.GetValue() + "'";

            var fromDocReferenceNo = that._FromDocReferenceNoTextBox.GetValue();
            fromDocReferenceNo = ValueIsEmpty(fromDocReferenceNo) ? "null" : String.Format("'{0}'", fromDocReferenceNo);

            var toDocReferenceNo = that._ToDocReferenceNoTextBox.GetValue();
            toDocReferenceNo = ValueIsEmpty(toDocReferenceNo) ? "null" : String.Format("'{0}'", toDocReferenceNo);

            var noeTarazAzmayeshi = that._NoeTarazAzmayeshiOptionSet.GetValue();
            noeTarazAzmayeshi = ValueIsEmpty(noeTarazAzmayeshi) ? "null" : String.Format("'{0}'", noeTarazAzmayeshi);

            var noeTarazAzmayeshiName = afw.OptionSetHelper.GetOptionSetItemName (that._NoeTarazAzmayeshiOptionSet.GetValue());               

            var financialYear = that._ActiveFinancialYearEntity.GetFieldValue("ID");
            financialYear = ValueIsEmpty(financialYear) ? "null" : String.Format("'{0}'", financialYear);

            var financialDocType = that._FinancialDocTypeOptionSet.GetValue();
            financialDocType = ValueIsEmpty(financialDocType) ? "null" : String.Format("'{0}'", financialDocType);

            var organizationUnit = that._OrganizationUnitLookup.GetValue();
            organizationUnit = ValueIsEmpty(organizationUnit) ? "null" : String.Format("'{0}'", organizationUnit);

            var fromDate_Persian = afw.DateTimeHelper.GregorianToJalali(that._FromDateTimeControl.GetValue()).toString();
            var toDate_Persian = afw.DateTimeHelper.GregorianToJalali(that._ToDateTimeControl.GetValue()).toString();
            var reportDate = afw.DateTimeHelper.GregorianToJalali(afw.DateTimeHelper.GetServerDateTime());
            /*
            var filterExpression = that._DataListControl._GetTotalFilterExpression();
            filterExpression = ValueIsEmpty(filterExpression) ? "null" :
                String.Format("N'{0}'", filterExpression.ReplaceAll("'", "''"));
                */
            var sortExpression = that._DataListControl.GetSortExpression();
            sortExpression = ValueIsEmpty(sortExpression) ? "null" : String.Format("'{0}'", sortExpression);

            afw.uiApi.ShowProgress(that);

            if (noeTarazAzmayeshiName == "TwoColumns") {
                afw.ReportHelper.RunReport("acc.TarazAzmayeshiTwoColumnsReport",
                  ["NoeTarazAzmayeshi", "FromDate", "ToDate", "FromDocReferenceNo", "ToDocReferenceNo", "FinancialYear", "FinancialDocType",
                   "OrganizationUnit", "FilterExpression", "SortExpression", "FromDate_Persian", "ToDate_Persian", "ReportDate", "OrganizationName"],
                  [noeTarazAzmayeshi, fromDate, toDate, fromDocReferenceNo, toDocReferenceNo, financialYear, financialDocType,
                      organizationUnit, "null", sortExpression, fromDate_Persian, toDate_Persian, reportDate, organizationName],
                  null,
                  function (result) {
                      afw.uiApi.HideProgress(that);
                  });
            }
            else if (noeTarazAzmayeshiName == "FourColumns") {
                afw.ReportHelper.RunReport("acc.TarazAzmayeshiFourColumnsReport",
                 ["NoeTarazAzmayeshi", "FromDate", "ToDate", "FromDocReferenceNo", "ToDocReferenceNo", "FinancialYear", "FinancialDocType",
                  "OrganizationUnit", "FilterExpression", "SortExpression", "FromDate_Persian", "ToDate_Persian", "ReportDate", "OrganizationName"],
                 [noeTarazAzmayeshi, fromDate, toDate, fromDocReferenceNo, toDocReferenceNo, financialYear, financialDocType,
                     organizationUnit, "null", sortExpression, fromDate_Persian, toDate_Persian, reportDate, organizationName],
                 null,
                 function (result) {
                     afw.uiApi.HideProgress(that);
                 });
            }
           

        },

        _ApplyFilterButton_Click: function (e) {
            var that = this;

            if (ValueIsEmpty(that._NoeTarazAzmayeshiOptionSet.GetValue())) {
                afw.ErrorDialog.Show('نوع تراز را انتخاب نمایید.');
                return;
            }

            that._CreateDataList();

            that._ApplyNoeTarazAzmayeshiToDataListColumns();
        },

        _FilterOnIssueDateReferenceDocCheckBox_CheckedChanged: function (sender, e) {
            var that = this;

            if (that._FilterOnIssueDateReferenceDocCheckBox.GetValue() == true) {
                that._FilterOnDocReferenceNoCheckBox.SetValue(!that._FilterOnIssueDateReferenceDocCheckBox.GetValue());
                that._FromDocReferenceNoTextBox.SetValue(null);
                that._FromDocReferenceNoTextBox.SetReadOnly(true);
                that._ToDocReferenceNoTextBox.SetValue(null);
                that._ToDocReferenceNoTextBox.SetReadOnly(true);

                that._FromDateTimeControl.SetValue(that._ActiveFinancialYearEntity.GetFieldValue("StartDate"));
                that._FromDateTimeControl.SetReadOnly(false);
                that._ToDateTimeControl.SetValue(that._ActiveFinancialYearEntity.GetFieldValue("EndDate"));
                that._ToDateTimeControl.SetReadOnly(false);
            }
        },

        _FilterOnDocReferenceNoCheckBox_CheckedChanged: function (sender, e) {
            var that = this;

            if (that._FilterOnDocReferenceNoCheckBox.GetValue() == true) {
                that._FilterOnIssueDateReferenceDocCheckBox.SetValue(!that._FilterOnDocReferenceNoCheckBox.GetValue());
                that._FromDateTimeControl.SetValue(that._ActiveFinancialYearEntity.GetFieldValue("StartDate"));
                that._FromDateTimeControl.SetReadOnly(true);
                that._ToDateTimeControl.SetValue(that._ActiveFinancialYearEntity.GetFieldValue("EndDate"));
                that._ToDateTimeControl.SetReadOnly(true);

                that._FromDocReferenceNoTextBox.SetValue(null);
                that._FromDocReferenceNoTextBox.SetReadOnly(false);
                that._ToDocReferenceNoTextBox.SetValue(null);
                that._ToDocReferenceNoTextBox.SetReadOnly(false);
            }
        },

        _DestroyDataList: function () {
            var that = this;
            var tarazAzmayeshiList = that._DataListPanel.FindControl("TarazAzmayeshiList");

            if (tarazAzmayeshiList != null)
                tarazAzmayeshiList.Destroy();

            that._DebtorSumLabel.SetText("");
            that._CreditorSumLabel.SetText("");
            that._RemainedLabel.SetText("");
        },

        _CreateDataList: function () {
            var that = this;

            that._DestroyDataList();

            that._DataListControl = afw.uiApi.CreateDataListControl("acc.TarazAzmayeshiList", {
                Name: 'TarazAzmayeshiList',
                ParentControl: that._DataListPanel,
                FillParent: true,
                ParameterNames: ["NoeTarazAzmayeshi", "FromDate", "ToDate", "FromDocNo", "ToDocNo",
                    "FinancialYear", "FinancialDocType", "OrganizationUnit"],
                ParameterValues: [that._NoeTarazAzmayeshiOptionSet.GetValue(),
                    that._FromDateTimeControl.GetValue(), that._ToDateTimeControl.GetValue(),
                    that._FromDocReferenceNoTextBox.GetValue(), that._ToDocReferenceNoTextBox.GetValue(),
                    that._ActiveFinancialYearEntity.GetFieldValue("ID"),
                    that._FinancialDocTypeOptionSet.GetValue(), that._OrganizationUnitLookup.GetValue()]
            });

            that._DataListControl.GetQuickSearchTextBox().SetVisible(false);                
            var quickSearchDockPanel = that.FindControl(that.GetName() + "_QuickSearchDockPanel");

            that._TarazAzmayeshiGridView = that._DataListControl.GetEntitiesGridView();

            that._DataListControl.bind("DataLoaded", function (e) { that._DataListControl_DataLoaded(e); });
        },

        _DataListControl_DataLoaded: function (e) {
            var that = this;

            var loadedData = that._TarazAzmayeshiGridView.GetDataSource()._data;
            that._SetSummaryFields(loadedData);

            if (loadedData.length > 0)
                that._PrintButton.SetEnabled(true);
            else
                that._PrintButton.SetEnabled(false);
        },

        _SetSummaryFields: function (dataSource) {
            var that = this;

            var levelTitle = "";

            if (dataSource.length > 0 && dataSource[0].DebtorAmountSum != null) {
                that._DebtorSumLabel.SetText("جمع بدهکار : " + afw.BaseUtils.FormatNumber(dataSource[0].DebtorAmountSum));
                that._CreditorSumLabel.SetText("جمع بستانکار : " + afw.BaseUtils.FormatNumber(dataSource[0].CreditorAmountSum));
                var reminded = dataSource[0].DebtorAmountSum - dataSource[0].CreditorAmountSum

                if (reminded > 0)
                    that._RemainedLabel.SetText("مانده : " + afw.BaseUtils.FormatNumber(reminded) + " بد ");
                else if (reminded < 0)
                    that._RemainedLabel.SetText("مانده : (" + afw.BaseUtils.FormatNumber(reminded * -1) + ") بس ");
                else if (reminded == 0)
                    that._RemainedLabel.SetText("مانده : 0");
            }
            else {
                that._DebtorSumLabel.SetText("جمع بدهکار : ");
                that._CreditorSumLabel.SetText("جمع بستانکار : ");
                that._RemainedLabel.SetText("مانده : ");
            }
        },

        _ApplyNoeTarazAzmayeshiToDataListColumns: function(){
            var that = this;

            var noeTarazAzmayeshi = afw.OptionSetHelper.GetOptionSetItemName (that._NoeTarazAzmayeshiOptionSet.GetValue());
               
            if (noeTarazAzmayeshi == "TwoColumns") {
                that._TarazAzmayeshiGridView.SetColumnVisible("CreditorAmount", false);
                that._TarazAzmayeshiGridView.SetColumnVisible("DebtorAmount", false);
            }
            else if (noeTarazAzmayeshi == "FourColumns") { }
            else if (noeTarazAzmayeshi == "SixColumns") { }
            else if (noeTarazAzmayeshi == "EightColumns") { }
        },

        _OnPreviewKeyUp: function (e) {
            var that = this;

            afw.BasePanel.fn._OnPreviewKeyUp.call(that, e);
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "acc.TarazAzmayeshiForm";
    FormClass.BaseType = afw.BasePanel;
    FormClass.Events = objectEvents;

    acc.TarazAzmayeshiForm = FormClass;
})();
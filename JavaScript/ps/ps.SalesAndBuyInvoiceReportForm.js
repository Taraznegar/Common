(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return ps.SalesAndBuyInvoiceReportForm;
        },

        init: function (options) {
            var that = this;

            that._IsInit = true;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (designObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._Mode = null;

            that._KindDropDownList = that.FindControl("KindDropDownList");
            that._FinancialDocTypeOptionSetControl = that.FindControl("FinancialDocTypeOptionSetControl");
            that._OrganizationUnitLookup = that.FindControl("OrganizationUnitLookup");
            that._FromDateTimeControl = that.FindControl("FromDateTimeControl");
            that._ToDateTimeControl = that.FindControl("ToDateTimeControl");
            that._PersonLookupControl = that.FindControl("PersonLookupControl");
            that._Person_AutoComplete = that._PersonLookupControl.GetAutoComplete();
            that._GridPanel = that.FindControl("GridPanel");
            that._PrintButton = that.FindControl("PrintButton");
            that._TajmiiPrintButton = that.FindControl("TajmiiPrintButton");
            that._ShowButton = that.FindControl("ShowButton");
            that._FinalAmountLabel = that.FindControl("FinalAmountLabel");
            that._TaxLabel1 = that.FindControl("TaxLabel1");
            that._AfterDiscountAmountLabel = that.FindControl("AfterDiscountAmountLabel");
            that._DiscountLabel = that.FindControl("DiscountLabel");
            that._TotalStuffAndServicesPriceLabel = that.FindControl("TotalStuffAndServicesPriceLabel");
            that._RefreshButton = that.FindControl("RefreshButton");

            that._HideShowFilterControlDockPanel = that.FindControl("HideShowFilterControlDockPanel");
            that._HideShowFilterControlDockPanel.SetMouseCursor("pointer");
            that._HideShowFilterControlDockPanel.bind("Click", function (e) { that._HideShowFilterControlDockPanel_Click(e); });
            that._FilterControlVisible = true;

            that._DataListControl = new afw.DataListControl({
                ParentControl: that._GridPanel,
                Name: "SalesAndPurchasesReports",
                DataListFullName: "ps.SalesAndPurchasesReports",
                FillParent: true,
                LoadDataOnInit: false
            });

            that._FinancialYearEntity = cmn.GetUserActiveFinancialYearEntity();
            if (that._FinancialYearEntity != null) {
                that._FromDateTimeControl.SetValue(that._FinancialYearEntity.GetFieldValue("StartDate"));
                that._ToDateTimeControl.SetValue(that._FinancialYearEntity.GetFieldValue("EndDate"));
            }

            that._KindDropDownList.bind("ValueChanged", function (e) { that._KindDropDownList_ValueChanged(e); });
            that._FinancialDocTypeOptionSetControl.bind("ValueChanged", function (e) { that._FilterControl_ValueChanged(e); });
            that._OrganizationUnitLookup.bind("ValueChanged", function (e) { that._FilterControl_ValueChanged(e); });
            that._FromDateTimeControl.bind("ValueChanged", function (e) { that._FilterControl_ValueChanged(e); });
            that._ToDateTimeControl.bind("ValueChanged", function (e) { that._FilterControl_ValueChanged(e); });
            that._PersonLookupControl.bind("ValueChanged", function (e) { that._FilterControl_ValueChanged(e); });
            that._PrintButton.bind("Click", function (e) { that._PrintButton_Click(e); });
            that._TajmiiPrintButton.bind("Click", function (e) { that._TajmiiPrintButton_Click(e); });
            that._ShowButton.bind("Click", function (e) { that._ShowButton_Click(e); });
            that._RefreshButton.bind("Click", function (e) { that._RefreshButton_Click(e); });

            var salesAndInvoice = [{ ID: "Sale", Title: "فروش" },
                                   { ID: "Buy", Title: "خرید" },
                                   { ID: "ReturnFromSale", Title: "فاکتور برگشت از فروش" },
                                   { ID: "ReturnFromBuy", Title: "فاکتور برگشت از خرید" }
            ];

            that._KindDropDownList.SetItemsDataSource(salesAndInvoice);
            that._KindDropDownList.SetValue(salesAndInvoice[0].ID);

            that._IsInit = false;
            that._ApplyFilters(that._GetControlsFilter());
        },

        _RefreshButton_Click: function (e) {
            var that = this;

            ps.ShowSalesAndBuyInvoiceReportForm();
        },

        _ShowButton_Click: function (e) {
            var that = this;

            if (that._IsInit)
                return;
            else
                that._ApplyFilters(that._GetControlsFilter());
        },

        _PrintButton_Click: function (e) {
            var that = this;

            that._PrintReport("SalesAndBuyInvoicesReport");
        },

        _TajmiiPrintButton_Click: function (e) {
            var that = this;

            that._PrintReport("GozaresheFactoreTajmii");
        },

        _CalculateTotalAmounts: function () {
            var that = this;

            var totalAmountsEntity = afw.uiApi.CallServerMethodSync("ps.GetSalesAndBuyInvoiceReportFormTotalAmounts",
                [that._DataListControl.GetBaseFilterExpression()]);

            if (!ValueIsEmpty(totalAmountsEntity)) {
                that._FinalAmountLabel.SetText(afw.BaseUtils.FormatNumber(totalAmountsEntity.GetFieldValue("FinalAmountSum")));
                that._TaxLabel1.SetText(afw.BaseUtils.FormatNumber(totalAmountsEntity.GetFieldValue("TotalTaxAndTollSum")));
                that._AfterDiscountAmountLabel.SetText(afw.BaseUtils.FormatNumber(totalAmountsEntity.GetFieldValue("StuffAndServicesTotalAmountAfterDiscountSum")));
                that._DiscountLabel.SetText(afw.BaseUtils.FormatNumber(totalAmountsEntity.GetFieldValue("GeneralDiscountSum")));
                that._TotalStuffAndServicesPriceLabel.SetText(afw.BaseUtils.FormatNumber(totalAmountsEntity.GetFieldValue("TotalStuffAndServicesPriceSum")));
            }
            else {
                that._FinalAmountLabel.SetText(0);
                that._TaxLabel1.SetText(0);
                that._AfterDiscountAmountLabel.SetText(0);
                that._DiscountLabel.SetText(0);
                that._TotalStuffAndServicesPriceLabel.SetText(0);
            }

        },

        _KindDropDownList_ValueChanged: function (e) {
            var that = this;

            if (ValueIsEmpty(e.Sender.GetValue())) {
                that._ClearFormData();
                return;
            }

            that._Mode = e.Sender.GetValue();
            if (that._IsInit)
                return;
            else
                that._ApplyFilters(that._GetControlsFilter());
        },

        _FilterControl_ValueChanged: function (e) {
            var that = this;

            if (that._IsInit)
                return;
            else
                that._ApplyFilters(that._GetControlsFilter());
        },

        _PrintReport: function (reportName) {
            var that = this;

            var financialDocType = that._FinancialDocTypeOptionSetControl.GetValue();
            var organizationUnitID = that._OrganizationUnitLookup.GetValue();

            var financialDocType_Name = "اصلی/ پیش نویس";
            if (!ValueIsEmpty(financialDocType))
                financialDocType_Name = afw.OptionSetHelper.GetOptionSetItemName(financialDocType) == "Main" ? "اصلی" : "پیش نویس";

            var organizationUnit_Name = "همه";
            if (!ValueIsEmpty(organizationUnitID))
                organizationUnit_Name = that._OrganizationUnitLookup.GetDropDownList().GetText();

            var person = that._PersonLookupControl.GetValue();
            var financialYear = "'" + that._FinancialYearEntity.GetFieldValue("ID") + "'";
            var fromDate = "'" + that._FromDateTimeControl.GetValue() + "'";
            var toDate = "'" + that._ToDateTimeControl.GetValue("ID") + "'";
            var mode = that._Mode;

            var fromDateHeader = afw.DateTimeHelper.GregorianToJalali(that._FromDateTimeControl.GetValue()).toString();
            var toDateHeader = afw.DateTimeHelper.GregorianToJalali(that._ToDateTimeControl.GetValue()).toString();

            var today = afw.DateTimeHelper.GregorianToJalali(afw.DateTimeHelper.GetServerDateTime());
            var timeAndDateArray = today.split(" ", 3);

            var personName = that._Person_AutoComplete.GetText();

            if (!ValueIsEmpty(personName))
                personName = "طرف حساب : " + personName + "";

            person = ValueIsEmpty(person) ? "null" : "'" + person + "'";
            mode = ValueIsEmpty(mode) ? "null" : "'" + mode + "'";
            financialDocType = ValueIsEmpty(financialDocType) ? "null" : "'" + financialDocType + "'";
            organizationUnitID = ValueIsEmpty(organizationUnitID) ? "null" : "'" + organizationUnitID + "'";

            var invoiceType_Text = "همه";
            if (mode == "'Sale'")
                invoiceType_Text = "فروش";
            else if (mode == "'Buy'")
                invoiceType_Text = "خرید";
            else if (mode == "'ReturnFromSale'")
                invoiceType_Text = "برگشت از فروش";
            else if (mode == "'ReturnFromBuy'")
                invoiceType_Text = "برگشت از خرید";

            afw.uiApi.ShowProgress(that);
            afw.ReportHelper.RunReport("ps." + reportName,
                 ["FromDate", "ToDate", "FinancialYear", "Person", "PersonName", "FromDateHeader",
                     "ToDateHeader", "ReportDate", "ReportTime", "InvoiceType", "InvoiceType_Text",
                     "FinancialDocType", "FinancialDocType_Text", "OrganizationUnit", "OrganizationUnit_Name"],
                 [fromDate, toDate, financialYear, person, personName,
                     fromDateHeader, toDateHeader, timeAndDateArray[0], timeAndDateArray[1], mode, invoiceType_Text,
                     financialDocType, financialDocType_Name, organizationUnitID, organizationUnit_Name],
                 null,
                 function (result) {
                     afw.uiApi.HideProgress(that);
                 });
        },

        _ApplyFilters: function (filter) {
            var that = this;

            that._DataListControl.SetBaseFilterExpression(filter);
            that._DataListControl.LoadData();
            that._CalculateTotalAmounts();
        },

        _GetControlsFilter: function () {
            var that = this;

            var filter = " 1=1 ";

            var financialDocType = that._FinancialDocTypeOptionSetControl.GetValue();
            var organizationUnitID = that._OrganizationUnitLookup.GetValue();
            var fromDate = that._FromDateTimeControl.GetValue();
            var toDate = that._ToDateTimeControl.GetValue();
            var personID = that._PersonLookupControl.GetValue();
            var invoiceType = that._KindDropDownList.GetValue();
            var financialYear = that._FinancialYearEntity.GetFieldValue("ID");

            if (!ValueIsEmpty(fromDate))
                filter += " and " + String.Format("IssueDate >= '{0}'", fromDate);

            if (!ValueIsEmpty(toDate))
                filter += " and " + String.Format("IssueDate <= '{0}'", toDate);

            if (!ValueIsEmpty(personID))
                filter += " and " + String.Format("PersonID = '{0}'", personID);

            if (!ValueIsEmpty(invoiceType))
                filter += " and " + String.Format("InvoiceType = '{0}'", invoiceType);
            else
                return "1 = 2"

            if (!ValueIsEmpty(financialYear))
                filter += " and " + String.Format("FinancialYear = '{0}'", financialYear);

            if (!ValueIsEmpty(financialDocType))
                filter += " and " + String.Format("FinancialDocTypeID = '{0}'", financialDocType);

            if (!ValueIsEmpty(organizationUnitID))
                filter += " and " + String.Format("OrganizationUnitID = '{0}'", organizationUnitID);

            return filter;
        },

        _ClearFormData: function (e) {
            var that = this;

            that._DataListControl.SetBaseFilterExpression("1 = 2");
            that._DataListControl.LoadData();

            that._FinalAmountLabel.SetText(0);
            that._TaxLabel1.SetText(0);
            that._AfterDiscountAmountLabel.SetText(0);
            that._DiscountLabel.SetText(0);
            that._TotalStuffAndServicesPriceLabel.SetText(0);
        },

        _HideShowFilterControlDockPanel_Click: function (e) {
            var that = this;

            var filterControlDockPanel = that.FindControl("FilterControlDockPanel");

            if (that._FilterControlVisible) {
                that._FilterControlVisible = false;
                filterControlDockPanel.SetPaneSizeSetting(0, 1);
                filterControlDockPanel.SetPaneSizeSetting(1, 1);
                filterControlDockPanel.SetPaneSizeSetting(2, 1);
                filterControlDockPanel.SetPaneSizeSetting(3, 1);
                that.FindControl("MainDockPanel").SetPaneSizeSetting(0, 25);
                that.FindControl("HideShowFilterControlImagePanel").SetBackgroundImage("resource(cmn.ArrowPointToDown)");
            }
            else {
                that._FilterControlVisible = true;
                filterControlDockPanel.SetPaneSizeSetting(0, 45);
                filterControlDockPanel.SetPaneSizeSetting(1, 45);
                filterControlDockPanel.SetPaneSizeSetting(2, 47);
                filterControlDockPanel.SetPaneSizeSetting(3, 45);
                that.FindControl("MainDockPanel").SetPaneSizeSetting(0, 215);
                that.FindControl("HideShowFilterControlImagePanel").SetBackgroundImage("resource(cmn.ArrowPointToUp)");
            }
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "ps.SalesAndBuyInvoiceReportForm";
    FormClass.BaseType = afw.BasePanel;


    ps.SalesAndBuyInvoiceReportForm = FormClass;
})();
(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return acc.ShenavarhaReportForm;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (designObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._ShenavarhaDataList = null;

            that._FromDateTimeControl = that.FindControl("FromDateTimeControl");
            that._ToDateTimeControl = that.FindControl("ToDateTimeControl");
            that._FinancialDocTypeOptionSet = that.FindControl("FinancialDocTypeOptionSet");
            that._OrganizationUnitComboBox = that.FindControl("OrganizationUnitComboBox");
            that._PersonLookupControl = that.FindControl("PersonLookupControl");
            that._CostCenterLookupControl = that.FindControl("CostCenterLookupControl");
            that._ProjectLookupControl = that.FindControl("ProjectLookupControl");
            that._ForeignCurrencyLookupControl = that.FindControl("ForeignCurrencyLookupControl");
            that._ShowButton = that.FindControl("ShowButton");
            that._PrintButton = that.FindControl("PrintButton");
            that._GridPanel = that.FindControl("GridPanel");
            that._MainDockPanel = that.FindControl("MainDockPanel");
            that._AccountLookupControl = that.FindControl("AccountLookupControl");
            that._OpenDocButton = that.FindControl("OpenDocButton");
            that._OpenRefButton = that.FindControl("OpenRefButton");
            that._RefreshImageButton = that.FindControl("RefreshImageButton");
            that._DebtorAmountSumLabel = that.FindControl("DebtorAmountSumLabel");
            that._CreditorAmountSumLabel = that.FindControl("CreditorAmountSumLabel");
            that._ReminingAmounSumtLabel = that.FindControl("ReminingAmounSumtLabel");

            var organizationUnitDataSource = cmn.GetUserOrganizationUnitsDataSourceData();
            that._OrganizationUnitComboBox.SetItemsDataSource(organizationUnitDataSource);

            that._PersonLookupControl.SetBaseFilterExpression("FinancialAccountCode is not null");

            that._ShowButton.bind("Click", function (e) { that._ShowButton_Click(e); });
            that._PrintButton.bind("Click", function (e) { that._PrintButton_Click(e); });
            that._OpenDocButton.bind("Click", function (e) { that._OpenDocButton_Click(e); });
            that._OpenRefButton.bind("Click", function (e) { that._OpenRefButton_Click(e); });
            that._RefreshImageButton.bind("Click", function (e) { that._RefreshImageButton_Click(e); });
            that._OrganizationUnitComboBox.bind("ValueChanged", function (e) { that._Control_ValueChanged(e); });
            that._FinancialDocTypeOptionSet.bind("ValueChanged", function (e) { that._Control_ValueChanged(e); });
            that._FromDateTimeControl.bind("ValueChanged", function (e) { that._Control_ValueChanged(e); });
            that._ToDateTimeControl.bind("ValueChanged", function (e) { that._Control_ValueChanged(e); });
            that._PersonLookupControl.bind("ValueChanged", function (e) { that._LookupControl_ValueChanged(e); });
            that._CostCenterLookupControl.bind("ValueChanged", function (e) { that._LookupControl_ValueChanged(e); });
            that._ProjectLookupControl.bind("ValueChanged", function (e) { that._LookupControl_ValueChanged(e); });
            that._ForeignCurrencyLookupControl.bind("ValueChanged", function (e) { that._LookupControl_ValueChanged(e); });
            that._AccountLookupControl.bind("ValueChanged", function (e) { that._LookupControl_ValueChanged(e); });
            that._AccountLookupControl.bind("OpeningLookup", function (e) { that._AccountLookupControl_OpeningLookup(e); });

            that._ActiveFinancialYearEntity = cmn.GetUserActiveFinancialYearEntity();
            var activeFinancialYearID = that._ActiveFinancialYearEntity.GetFieldValue("ID");

            that._AccountLookupControl.SetBaseFilterExpression(String.Format("FinancialYear = '{0}'", activeFinancialYearID));
            
            if (that._ActiveFinancialYearEntity != null) {
                that._FromDateTimeControl.SetValue(that._ActiveFinancialYearEntity.GetFieldValue("StartDate"));
                that._ToDateTimeControl.SetValue(that._ActiveFinancialYearEntity.GetFieldValue("EndDate"));
            }

            if ("FromDate" in options && !ValueIsEmpty(options.FromDate))
                that._FromDateTimeControl.SetValue(options.FromDate);
            if ("ToDate" in options && !ValueIsEmpty(options.ToDate))
                that._ToDateTimeControl.SetValue(options.ToDate);
            if ("OrganizationUnit" in options && !ValueIsEmpty(options.OrganizationUnit))
                that._OrganizationUnitComboBox.SetValue(options.OrganizationUnit);
            if ("FinancialDocType" in options && !ValueIsEmpty(options.FinancialDocType))
                that._FinancialDocTypeOptionSet.SetValue(options.FinancialDocType);

            if (options.Shenavars != null || options.Account != null)
                that._InitParameterValues(options.Shenavars, options.ShenavarsType, options.Account);
            
            that._PersonAutoComplete = that._PersonLookupControl.GetAutoComplete();
            that._CostCenterAutoComplete = that._CostCenterLookupControl.GetAutoComplete();
            that._ProjectAutoComplete = that._ProjectLookupControl.GetAutoComplete();
            that._ForeignCurrencyAutoComplete = that._ForeignCurrencyLookupControl.GetAutoComplete();
            that._AccountAutoComplete = that._AccountLookupControl.GetAutoComplete();
        },

        _RefreshImageButton_Click: function (e) {
            var that = this;

            acc.ShowShenavarhaReportForm();
        },

        _ShenavarhaDataList_LoadingData: function (e) {
            var that = this;

            if (!that._RequiredParametersAreSet())
                throw "پارامتر های گزارش مقدار دهی نشده اند.";
        },

        _ShenavarhaDataList_DataLoaded: function (e) {
            var that = this;

            that._SetAmountsSumLabel(that._GridView.GetDataSource()._data);
        },

        _SetAmountsSumLabel: function (dataSource) {
            var that = this;

            if (dataSource.length > 0) {
                if (dataSource[0].DebtorAmountSum != null && dataSource[0].CreditorAmountSum != null) {
                    that._DebtorAmountSumLabel.SetText(afw.BaseUtils.FormatNumber(dataSource[0].DebtorAmountSum));
                    that._CreditorAmountSumLabel.SetText(afw.BaseUtils.FormatNumber(dataSource[0].CreditorAmountSum));
                    that._ReminingAmounSumtLabel.SetText(afw.BaseUtils.FormatNumber(dataSource[0].RemainingAmountSum));
                }
            }
            else {
                that._DebtorAmountSumLabel.SetText("");
                that._CreditorAmountSumLabel.SetText("");
                that._ReminingAmounSumtLabel.SetText("");
            }
        },

        _OpenDocButton_Click: function (e) {
            var that = this;

            if (that._GridView != null) {
                var selectedEntity = that._GridView.GetSelectedRows();

                if (selectedEntity.length > 0) {
                    var accDocEntity = afw.uiApi.FetchEntity("acc.AccDoc", String.Format("ID = '{0}'", selectedEntity[0].DataItem.AccDoc));

                    if (cmn.OpenWindowExists())
                        afw.EntityHelper.OpenEntityFormInWindow(accDocEntity, "acc.AccDocEditForm", "Edit", {
                            Title: "سند حسابداری"
                        });
                    else
                        afw.EntityHelper.OpenEntityFormInMdiContainer(accDocEntity, "acc.AccDocEditForm", "Edit", {
                            Title: "سند حسابداری"
                        });                    
                }
                else
                    afw.ErrorDialog.Show('ابتدا یک سطر انتخاب کنید.');

            }
        },

        _OpenRefButton_Click: function (e) {
            var that = this;

            if (that._GridView != null) {
                var selectedEntity = that._GridView.GetSelectedRows();
                if (selectedEntity.length > 0) {
                    if (selectedEntity[0].DataItem.RefNumber != 0) {

                        var selectedEntity = that._GridView.GetSelectedRows();

                        if (selectedEntity.length > 0) {
                            if (selectedEntity[0].DataItem.RefType == 'فاکتور فروش') {
                                var selectedntity = afw.uiApi.FetchEntity("ps.SalesInvoice", String.Format("ID = '{0}'", selectedEntity[0].DataItem.SalesInvoice));

                                if (cmn.OpenWindowExists())
                                    afw.EntityHelper.OpenEntityFormInWindow(selectedntity, "ps.SalesInvoiceEditForm", "Edit");
                                else
                                    afw.EntityHelper.OpenEntityFormInMdiContainer(selectedntity, "ps.SalesInvoiceEditForm", "Edit");
                            }
                        }
                        else
                            afw.ErrorDialog.Show('ابتدا یک سطر انتخاب کنید.');
                    }
                    else
                        afw.ErrorDialog.Show('این رکورد مرجع ندارد .');
                }
                else
                    afw.ErrorDialog.Show('ابتدا یک سطر انتخاب کنید.');
            }
        },

        _LookupControl_ValueChanged: function (e) {
            var that = this;

            e.Sender.SetHasEntityViewButton(false);
            that._CreateDataList();
        },

        _ShowButton_Click: function (e) {
            var that = this;

            that._CreateDataList();
        },

        _PrintButton_Click: function (e) {
            var that = this;

            that._PrintReport();
        },

        _PrintReport: function () {
            var that = this;

            if (!that._RequiredParametersAreSet())
                afw.ErrorDialog.Show("پارامتر های گزارش مقدار دهی نشده اند.");

            var parametersArray = that._GetParameters();

            var zeroUniqueidentifierValue = "00000000-0000-0000-0000-000000000000"
            var fromDateHeader = afw.DateTimeHelper.GregorianToJalali(parametersArray[0]).toString();
            var toDateHeader = afw.DateTimeHelper.GregorianToJalali(parametersArray[1]).toString();
            var today = afw.DateTimeHelper.GregorianToJalali(afw.DateTimeHelper.GetServerDateTime());
            var timeAndDateArray = today.split(" ", 3);

            var framDate = "'" + parametersArray[0] + "'";
            if (parametersArray[0] == null)
                framDate = "null";

            var toDate = "'" + parametersArray[1] + "'";
            if (parametersArray[1] == null)
                toDate = "null";

            var financialYear = "'" + parametersArray[2] + "'";
            if (parametersArray[2] == null)
                financialYear = "null";

            var financialDocType = "'" + parametersArray[3] + "'";
            if (parametersArray[3] == null)
                financialDocType = "null";

            var organizationUnit = "'" + parametersArray[4] + "'";
            if (parametersArray[4] == null)
                organizationUnit = "null";

            var person = "'" + parametersArray[5] + "'";
            if (parametersArray[5] == null)
                person = "null";

            var costCenter = "'" + parametersArray[6] + "'";
            if (parametersArray[6] == null)
                costCenter = "null";

            var project = "'" + parametersArray[7] + "'";
            if (parametersArray[7] == null)
                project = "null";

            var foreignCurrency = "'" + parametersArray[8] + "'";
            if (parametersArray[8] == null)
                foreignCurrency = "null";

            var account = "'" + parametersArray[9] + "'";
            if (parametersArray[9] == null)
                account = "null";

            var filterExpression = that._ShenavarhaDataList._GetTotalFilterExpression();
            filterExpression = ValueIsEmpty(filterExpression) ? "null" :
                String.Format("N'{0}'", filterExpression.ReplaceAll("'", "''"));
            
            var filterExpression_Text = "";
            if (!ValueIsEmpty(that._ShenavarhaDataList.GetQuickSearchTextBox().GetValue()))
                filterExpression_Text = "فیلتر در جستجو سریع : " + that._ShenavarhaDataList.GetQuickSearchTextBox().GetValue();

            var sortExpression = that._ShenavarhaDataList.GetSortExpression();
            sortExpression = ValueIsEmpty(sortExpression) ? "null" : String.Format("'{0}'", sortExpression);

            var personName = that._PersonAutoComplete.GetText();
            var costCenterName = that._CostCenterAutoComplete.GetText();
            var projectName = that._ProjectAutoComplete.GetText();
            var foreignCurrencyName = that._ForeignCurrencyAutoComplete.GetText();
            var accountName = that._AccountAutoComplete.GetText();

            afw.uiApi.ShowProgress(that);
            afw.ReportHelper.RunReport("acc.ShenavarhaReports",
                ["FromDate", "ToDate", "FinancialYear", "FinancialDocType", "OrganizationUnit", "Person", "CostCenter", "Project", "ForeignCurrency", "AccountCoding", "FromDateHeader",
                    "ToDateHeader", "ReportTime", "ReportDate", "PersonName", "CostCenterName", "ProjectName", "ForeignCurrencyName", "AccountName", "FilterExpression", "SortExpression", "StartRecordNumber", "MaxRecords", "FilterExpression_Text"],
                [framDate, toDate, financialYear, financialDocType, organizationUnit, person, costCenter, project, foreignCurrency, account, fromDateHeader, toDateHeader, timeAndDateArray[1], timeAndDateArray[0],
                    personName, costCenterName, projectName, foreignCurrencyName, accountName, filterExpression, sortExpression, "null", "null", filterExpression_Text],
                { ShowResultInWindow : that.ParentControl.GetName() == "ShenavarhaReportWindow" ? true : false },
                function (result) {
                    afw.uiApi.HideProgress(that);
                });
        },

        _CreateDataList: function () {
            var that = this;

            var parameters = that._GetParameters();

            var gridView = that._GridPanel.FindControl("ShenavarhaDataList");
            if (gridView != null)
                gridView.Destroy();

            that._ShenavarhaDataList = afw.uiApi.CreateDataListControl("acc.ShenavarhaDataList", {
                Name: 'ShenavarhaDataList',
                ParentControl: that._GridPanel,
                FillParent: true,
                Sortable: false,
                ParameterNames: ["FromDate", "ToDate", "FinancialYear", "FinancialDocType", "OrganizationUnit", "Person",
                                 "CostCenter", "Project", "ForeignCurrency", "Account"],
                ParameterValues: parameters,
                LoadDataOnInit: that._RequiredParametersAreSet()
            });

            that._GridView = that._ShenavarhaDataList.GetEntitiesGridView();

            that._GridView.bind("RowDoubleClick", function (e) { that._GridView_RowDoubleClick(e); });

            that._ShenavarhaDataList.bind("LoadingData", function (e) { that._ShenavarhaDataList_LoadingData(e); });
            that._ShenavarhaDataList.bind("DataLoaded", function (e) { that._ShenavarhaDataList_DataLoaded(e); });
        },

        _GridView_RowDoubleClick: function (e) {
            var that = this;

            var accDocEntity = afw.uiApi.FetchEntity("acc.AccDoc", String.Format("ID = '{0}'", e.Sender.GetSelectedRows()[0].DataItem.AccDoc));

            if (cmn.OpenWindowExists())
                afw.EntityHelper.OpenEntityFormInWindow(accDocEntity, "acc.AccDocEditForm", "Edit", {
                    Title: "سند حسابداری"
                });
            else
                afw.EntityHelper.OpenEntityFormInMdiContainer(accDocEntity, "acc.AccDocEditForm", "Edit", {
                    Title: "سند حسابداری"
                });
        },

        _GetParameters: function () {
            var that = this;

            var fromDate = that._FromDateTimeControl.GetValue();
            var toDate = that._ToDateTimeControl.GetValue();
            var financialYearID = that._ActiveFinancialYearEntity.GetFieldValue("ID");
            var financialDocType = null;
            var organizationUnit = null;
            var person = null;
            var costCenter = null;
            var project = null;
            var foreignCurrency = null;
            var account = null;

            if (that._FinancialDocTypeOptionSet.GetValue() != null)
                financialDocType = that._FinancialDocTypeOptionSet.GetValue();
            
            if (that._OrganizationUnitComboBox.GetValue() != null)
                organizationUnit = that._OrganizationUnitComboBox.GetValue();

            if (that._PersonLookupControl.GetValue() != null)
                person = that._PersonLookupControl.GetValue();

            if (that._CostCenterLookupControl.GetValue() != null)
                costCenter = that._CostCenterLookupControl.GetValue();

            if (that._ProjectLookupControl.GetValue() != null)
                project = that._ProjectLookupControl.GetValue();

            if (that._ForeignCurrencyLookupControl.GetValue() != null)
                foreignCurrency = that._ForeignCurrencyLookupControl.GetValue();

            if (that._AccountLookupControl.GetValue() != null)
                account = that._AccountLookupControl.GetValue();

            return [fromDate, toDate, financialYearID, financialDocType, organizationUnit, person, costCenter, project, foreignCurrency, account];
        },

        _Control_ValueChanged: function (e) {
            var that = this;

            if (e.Sender._Value != null) {
                that._CreateDataList();
            }
        },

        _InitParameterValues: function (shenavars, shenavarsType, account) {
            var that = this;

            if ( shenavars != null) {
                for (var i = 0; i < shenavars.length; i++) {
                    if (shenavarsType[i] == 'Shenavar_Person')
                        that._PersonLookupControl.SetValue(shenavars[i]);
                    else if (shenavarsType[i] == 'Shenavar_CostCenter')
                        that._CostCenterLookupControl.SetValue(shenavars[i]);
                    else if (shenavarsType[i] == 'Shenavar_Project')
                        that._ProjectLookupControl.SetValue(shenavars[i]);
                    else if (shenavarsType[i] == 'Shenavar_ForeignCurrency')
                        that._ForeignCurrencyLookupControl.SetValue(shenavars[i]);
                }
            }

            if (account != null) {                 
                that._AccountLookupControl.SetValue(account);
            }

            that._CreateDataList();
        },

        _RequiredParametersAreSet: function () {
            var that = this;

            if (that._PersonLookupControl.GetValue() == null
                && that._CostCenterLookupControl.GetValue() == null
                && that._ProjectLookupControl.GetValue() == null
                && that._ForeignCurrencyLookupControl.GetValue() == null)
                return false;
            else
                return true;
        },
        
        _AccountLookupControl_OpeningLookup: function (e) {
            var that = this;

            e.Sender.SetLookupDataListControlCustomOptions({
                AccountName: 'Tafsili',
                FinancialYear: that._ActiveFinancialYearEntity.GetFieldValue("ID")
            });
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "acc.ShenavarhaReportForm";
    FormClass.BaseType = afw.BasePanel;


    acc.ShenavarhaReportForm = FormClass;
})();
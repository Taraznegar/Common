(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return acc.DafaterForm;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._DafaterDataListControl = null;

            that._FilterControlDockPanel = that.FindControl("FilterControlDockPanel");
            that._DateCheckBox = that.FindControl("DateCheckBox");
            that._DocCheckBox = that.FindControl("DocCheckBox");
            //that._PreviousYearsCheckBox = that.FindControl("PreviousYearsCheckBox");
            that._SeparationCheckBox = that.FindControl("SeparationCheckBox");
            that._SeparationLabel = that.FindControl("SeparationLabel");

            that._FromDateTimeControl = that.FindControl("FromDateTimeControl");
            that._ToDateTimeControl = that.FindControl("ToDateTimeControl");
            that._FromDocRefNoTextBox = that.FindControl("FromDocTextBox");
            that._ToDocRefNoTextBox = that.FindControl("ToDocTextBox");

            that._HideShowFilterControlDockPanel = that.FindControl("HideShowFilterControlDockPanel");
            that._HideShowFilterControlDockPanel.SetMouseCursor("pointer");

            that._FinancialDocTypeOptionSetControl = that.FindControl("FinancialDocTypeOptionSetControl");
            that._OrganizationUnitComboBox = that.FindControl("OrganizationUnitComboBox");

            var organizationUnitDataSource = cmn.GetUserOrganizationUnitsDataSourceData();
            that._OrganizationUnitComboBox.SetItemsDataSource(organizationUnitDataSource);

            var activeOrgUnitID = cmn.GetUserActiveOrganizationUnitIDs();
            if (activeOrgUnitID.length == 1) {
                that._OrganizationUnitComboBox.SetValue(activeOrgUnitID[0]);
            }

            that._AccountLookupControl = that.FindControl("AccountLookupControl");
            that._AccountLookupControl.BindEvent("OpeningLookup", function (e) { that._AccountLookupControl_OpeningLookup(e); });
            that._AccountLookupControl.BindEvent("ValueChanged", function (e) { that._AccountLookupControl_ValueChanged(); });
            that.FindControl("AccountDockPanel").Panes[2].SetSizeSetting(1);
            that.FindControl("AccountDockPanel").Panes[3].SetSizeSetting(1);

            that._AccountLevelOptionSetControl = that.FindControl("AccountLevelOptionSetControl");
            that._AccountLevelOptionSetControl.BindEvent("ValueChanged", function (e) { that._AccountLevelOptionSetControl_ValueChanged(); });

            that._FloatAccountsPanel = that.FindControl("FloatAccountsPanel");
            that._FloatAccountPaneIndexInMainDocPanel = 1;
            that._SetFloatAccountPaneVisible(false);

            that._FloatAccountsSelectionControl = afw.uiApi.CreateSavedControl("acc.FloatAccountsSelectionControl", {
                ParentControl: that._FloatAccountsPanel,
                Name: "FloatAccountsSelectionControl",
                BindableEntity: null,
                PersonFieldName: "Person",
                CostCenterFieldName: "CostCenter",
                ProjectFieldName: "Project",
                //ForeignCurrencyFieldName: "ForeignCurrency",
                Visible: false
            });

            that._AdjustFloatAccountsSelectionControl();

            that._PrintButton = that.FindControl("PrintButton");
            that._PrintButton.SetEnabled(false);

            that._OpenDocButton = that.FindControl("OpenDocButton");
            that._ApplyFilterButton = that.FindControl("ApplyFilterButton");

            that._DateCheckBox.SetValue(true);
            that._DateCheckBox.BindEvent("CheckedChanged", function (e) { that._DateCheckBox_CheckedChanged(e); });
            that._DocCheckBox.BindEvent("CheckedChanged", function (e) { that._DocCheckBox_CheckedChanged(e); });
            /*
            that._FromDateTimeControl.BindEvent("ValueChanged", function (e) { that._FromDateTimeControl_ValueChanged(e); });
            that._ToDateTimeControl.BindEvent("ValueChanged", function (e) { that._ToDateTimeControl_ValueChanged(e); });
            */
            that._ToDateTimeControl.BindEvent("ValueChanged", function (e) {
                that._DestroyDafaterDataList();
                that._SetAmountsSumLabel(null);
            });
            that._FromDateTimeControl.BindEvent("ValueChanged", function (e) {
                that._DestroyDafaterDataList();
                that._SetAmountsSumLabel(null);
            });
            that._DateCheckBox.BindEvent("ValueChanged", function (e) {
                that._DestroyDafaterDataList();
                that._SetAmountsSumLabel(null);
            });
            that._DocCheckBox.BindEvent("ValueChanged", function (e) {
                that._DestroyDafaterDataList();
                that._SetAmountsSumLabel(null);
            });
            that._FromDocRefNoTextBox.BindEvent("ValueChanged", function (e) {
                that._DestroyDafaterDataList();
                that._SetAmountsSumLabel(null);
            });
            that._ToDocRefNoTextBox.BindEvent("ValueChanged", function (e) {
                that._DestroyDafaterDataList();
                that._SetAmountsSumLabel(null);
            });
            that._FinancialDocTypeOptionSetControl.BindEvent("ValueChanged", function (e) {
                that._DestroyDafaterDataList();
                that._SetAmountsSumLabel(null);
            });
            that._OrganizationUnitComboBox.BindEvent("ValueChanged", function (e) {
                that._DestroyDafaterDataList();
                that._SetAmountsSumLabel(null);
            });
            that._SeparationCheckBox.BindEvent("ValueChanged", function (e) {
                that._DestroyDafaterDataList();
                that._SetAmountsSumLabel(null);
            });

            that._PrintButton.BindEvent("Click", function (e) { that._PrintButton_Click(e); });
            that._OpenDocButton.BindEvent("Click", function (e) { that._OpenDocButton_Click(e); });
            that._ApplyFilterButton.BindEvent("Click", function (e) { that._ApplyFilterButton_Click(e); });
            that._HideShowFilterControlDockPanel.BindEvent("Click", function (e) { that._HideShowFilterControlDockPanel_Click(e); });

            that._FilterControlVisible = true;
            that._AdjustFilterControl(true);

            that._FinancialYearEntity = cmn.GetUserActiveFinancialYearEntity();
            that._FromDateTimeControl.SetValue(that._FinancialYearEntity.GetFieldValue("StartDate"));
            that._ToDateTimeControl.SetValue(that._FinancialYearEntity.GetFieldValue("EndDate"));

            if (!ValueIsEmpty(options.FromDate))
                that._FromDateTimeControl.SetValue(options.FromDate);

            if (!ValueIsEmpty(options.ToDate))
                that._ToDateTimeControl.SetValue(options.ToDate);

            if (!ValueIsEmpty(options.FromDocReferenceNo) || !ValueIsEmpty(options.ToDocReferenceNo))
                that._DocCheckBox.SetValue(true);

            if (!ValueIsEmpty(options.FromDocReferenceNo))
                that._FromDocRefNoTextBox.SetValue(options.FromDocReferenceNo);

            if (!ValueIsEmpty(options.ToDocReferenceNo))
                that._ToDocRefNoTextBox.SetValue(options.ToDocReferenceNo);

            if ("FinancialDocType" in options)
                that._FinancialDocTypeOptionSetControl.SetValue(options.FinancialDocType);

            if ("OrganizationUnit" in options)
                that._OrganizationUnitComboBox.SetValue(options.OrganizationUnit);

            if (!ValueIsEmpty(options.Shenavar) || !ValueIsEmpty(options.Account)) {
                that._ShenavarType = options.ShenavarType;
                that._ShenavarID = options.Shenavar;
                that._Account = options.Account;
                that._AccountLevelName = options.AccountsReviewMode;
                that._ShenavarName = options.ShenavarName;

                that._SetAccount();

                if (!ValueIsEmpty(that._AccountLookupControl.GetValue())) {
                    that._FloatAccountsSelectionControl.SetAccount(that._AccountLookupControl.GetValue());
                    that._SetSelectedAccountFloatAccountsControl();

                    if (!ValueIsEmpty(that._ShenavarID) && !ValueIsEmpty(that._ShenavarType)) {
                        if (that._ShenavarType == 'Person') {
                            if (!ValueIsEmpty(that._PersonLookup))
                                that._PersonLookup.SetValue(that._ShenavarID);
                        }
                        else if (that._ShenavarType == 'CostCenter') {
                            if (!ValueIsEmpty(that._CostCenterLookup))
                                that._CostCenterLookup.SetValue(that._ShenavarID);
                        }
                        else if (that._ShenavarType == 'Project') {
                            if (!ValueIsEmpty(that._ProjectLookup))
                                that._ProjectLookup.SetValue(that._ShenavarID);
                        }
                    }
                }
            }

            that._CreateDafaterDataList();
        },

        _SetSelectedAccountFloatAccountsControl: function () {
            var that = this;

            that._PersonLookup = that._FloatAccountsSelectionControl.FindControl("PersonLookupControl");
            that._CostCenterLookup = that._FloatAccountsSelectionControl.FindControl("CostCenterLookupControl");
            that._ProjectLookup = that._FloatAccountsSelectionControl.FindControl("ProjectLookupControl");

            if (!ValueIsEmpty(that._PersonLookup))
                that._PersonLookup.BindEvent("ValueChanged", function (e) { that._FloatAccountsLookup_ValueChanged(e); });
            if (!ValueIsEmpty(that._CostCenterLookup))
                that._CostCenterLookup.BindEvent("ValueChanged", function (e) { that._FloatAccountsLookup_ValueChanged(e); });
            if (!ValueIsEmpty(that._ProjectLookup))
                that._ProjectLookup.BindEvent("ValueChanged", function (e) { that._FloatAccountsLookup_ValueChanged(e); });
        },

        _AdjustFloatAccountsSelectionControl: function () {
            var that = this;

            that._FloatAccountsPanel.SetVisible(false);

            var accountID = that._AccountLookupControl.GetValue();
            that._FloatAccountsSelectionControl.SetAccount(accountID);
            that._SetSelectedAccountFloatAccountsControl();

            if (!ValueIsEmpty(accountID) && acc.AccountHasFloat(accountID)) {
                var lastFloatControl = that._FloatAccountsSelectionControl.GetLastFloatControl();

                that._SetFloatAccountPaneVisible(true);
                that._FloatAccountsPanel.SetVisible(true);
                that._FloatAccountsSelectionControl.SetVisible(true);
                that._FloatAccountsSelectionControl.SetFillParent(true);
            }
            else {
                that._SetFloatAccountPaneVisible(false);
                that._FloatAccountsPanel.SetVisible(false);
                that._FloatAccountsPanel.SetFillParent(false);
                that._FloatAccountsSelectionControl.SetVisible(false);
                that._FloatAccountsSelectionControl.SetFillParent(false);
            }
        },

        _SetFloatAccountPaneVisible: function (visible) {
            var that = this;

            if (visible && that._FilterControlVisible) {
                that._FilterControlDockPanel.Panes[that._FloatAccountPaneIndexInMainDocPanel].SetSizeSetting(67);
                that.FindControl("MainDockPanel").Panes[0].SetSizeSetting(260);
            }
            else {
                that._FilterControlDockPanel.Panes[that._FloatAccountPaneIndexInMainDocPanel].SetSizeSetting(1);

                if (that._FilterControlVisible)
                    that.FindControl("MainDockPanel").Panes[0].SetSizeSetting(194);
            }
        },
        /*
        _FromDateTimeControl_ValueChanged: function (e) {
            var that = this;

            if(ValueIsEmpty(that._FromDateTimeControl.GetValue()))
                that._FromDateTimeControl.SetValue(that._FinancialYearEntity.GetFieldValue("StartDate"));
            else if (that._FromDateTimeControl.GetValue() < that._FinancialYearEntity.GetFieldValue("StartDate").split(' ')[0])
                that._FromDateTimeControl.SetValue(that._FinancialYearEntity.GetFieldValue("StartDate"));       
        },

        _ToDateTimeControl_ValueChanged: function (e) {
            var that = this;

            if (ValueIsEmpty(that._ToDateTimeControl.GetValue()))
                that._ToDateTimeControl.SetValue(that._FinancialYearEntity.GetFieldValue("EndDate"));
            else if (that._ToDateTimeControl.GetValue() > that._FinancialYearEntity.GetFieldValue("EndDate").split(' ')[0])
                that._ToDateTimeControl.SetValue(that._FinancialYearEntity.GetFieldValue("EndDate"));          
        },
        */
        _CreateDafaterDataList: function () {
            var that = this;


            var fromDate = null;
            var toDate = null;
            var fromDocNo = null;
            var toDocNo = null;
            var financialYear = that._FinancialYearEntity.GetFieldValue("ID");
            var refAccount = null;
            var financialDocType = null;
            var betafkik = 0;
            var organizationUnit = that._OrganizationUnitComboBox.GetValue();

            if (that._SeparationCheckBox.GetValue())
                betafkik = 1;

            if (ValueIsEmpty(that._ShenavarID)) {
                that._ShenavarID = null;
                that._ShenavarType = null;
            }

            var isFilterDate = that._DateCheckBox.GetValue();
            if (isFilterDate) {
                fromDate = that._FromDateTimeControl.GetValue();
                toDate = that._ToDateTimeControl.GetValue();
            }
            else {
                if (ValueIsEmpty(that._FinancialDocTypeOptionSetControl.GetValue())) {
                    afw.ErrorDialog.Show("نوع سند مالی انتخاب نشده است.");
                    return;
                }

                fromDocNo = that._FromDocRefNoTextBox.GetValue();
                toDocNo = that._ToDocRefNoTextBox.GetValue();
            }

            if (!ValueIsEmpty(that._FinancialDocTypeOptionSetControl.GetValue()))
                financialDocType = that._FinancialDocTypeOptionSetControl.GetValue();

            if (that._AccountLookupControl.GetValue() != null)
                refAccount = that._AccountLookupControl.GetValue();

            that._DestroyDafaterDataList();

            that._DafaterDataListControl = afw.uiApi.CreateDataListControl("acc.DafaterDataList", {
                Name: 'DafaterDataList',
                ParentControl: that.FindControl("MainDockPanel").Panes[1],
                FillParent: true,
                Sortable: false,
                ParameterNames: ["RefAccount", "FinancialYear", "FinancialDocType", "OrganizationUnit", "FromDate", "ToDate", "FromDocNo", "ToDocNo",
                    "ShenavarType", "Shenavar", "BeTafkik", "FilterExpression", "SortExpression", "StartRecordNumber", "MaxRecords"],
                ParameterValues: [refAccount, financialYear, financialDocType, organizationUnit, fromDate, toDate,
                    fromDocNo, toDocNo, that._ShenavarType, that._ShenavarID, betafkik]
            });

            that._DafaterGridView = that._DafaterDataListControl.GetEntitiesGridView();

            that._SetFinancialDocTypeColumnVisible();

            that._DafaterDataListControl.BindEvent("DataLoaded", function (e) { that._DafaterDataListControl_DataLoaded(e); });
            that._DafaterGridView.BindEvent("RowDoubleClick", function (e) { that._DafaterGridView_RowDoubleClick(e); });
        },

        _DafaterDataListControl_DataLoaded: function (e) {
            var that = this;

            that._SetAmountsSumLabel(that._DafaterGridView.GetDataSource()._data);
        },

        _DestroyDafaterDataList: function () {
            var that = this;

            var dataList = that.FindControl("DafaterDataList");
            if (dataList != null)
                dataList.Destroy();
        },

        _SetAmountsSumLabel: function (dataSource) {
            var that = this;

            if (!ValueIsEmpty(dataSource) && dataSource.length > 0) {
                if (dataSource[0].DebtorAmountSum != null && dataSource[0].CreditorAmountSum != null) {
                    that.FindControl("DebtorAmountSumLabel").SetText(afw.BaseUtils.FormatNumber(dataSource[0].DebtorAmountSum));
                    that.FindControl("CreditorAmountSumLabel").SetText(afw.BaseUtils.FormatNumber(dataSource[0].CreditorAmountSum));

                    var reminigAmount = dataSource[0].DebtorAmountSum - dataSource[0].CreditorAmountSum;
                    var reminigAmountText = "";

                    if (reminigAmount < 0) {
                        reminigAmount = reminigAmount * -1;
                        reminigAmountText = "( " + afw.BaseUtils.FormatNumber(reminigAmount) + " ) بس ";
                    }
                    else
                        reminigAmountText = afw.BaseUtils.FormatNumber(reminigAmount) + " بد ";

                    that.FindControl("ReminingAmounLabel").SetText(reminigAmountText);
                }
            }
            else {
                that.FindControl("DebtorAmountSumLabel").SetText("");
                that.FindControl("CreditorAmountSumLabel").SetText("");
                that.FindControl("ReminingAmounLabel").SetText("");
            }
        },

        _DafaterGridView_RowDoubleClick: function (e) {
            var that = this;

            that.OpenDoc();
        },

        OpenDoc: function () {
            var that = this;
            var selectedEntities = that._DafaterGridView.GetSelectedRows();
            if (selectedEntities == 0) {
                afw.ErrorDialog.Show("ابتدا یک سطر را انتخاب نمایید.");
            }
            else {
                var accDocID = selectedEntities[0].DataItem["AccDocID"];
                var accDocEntity = afw.uiApi.FetchEntity("acc.AccDoc", String.Format("ID = '{0}'", accDocID));

                if (cmn.OpenWindowExists())
                    afw.EntityHelper.OpenEntityFormInWindow(accDocEntity, "acc.AccDocEditForm", "Edit");
                else
                    afw.EntityHelper.OpenEntityFormInMdiContainer(accDocEntity, "acc.AccDocEditForm", "Edit");
               
                //accDocWindow.BindEvent("Close", function (e) { that._AccDocWindowWindows_Close(e); });
            }
        },

        _PrintButton_Click: function (e) {
            var that = this;

            var organizationUnit = that._OrganizationUnitComboBox.GetValue();
            var reportDate = afw.DateTimeHelper.GetServerPersianDateTime().split(' ')[0];
            var fromDate_Persian = afw.DateTimeHelper.GregorianToJalali(that._FromDateTimeControl.GetValue());
            var toDate_Persian = afw.DateTimeHelper.GregorianToJalali(that._ToDateTimeControl.GetValue());

            var fromDate = null;
            var toDate = null;
            var fromDocNo = null;
            var toDocNo = null;
            var financialYear = that._FinancialYearEntity.GetFieldValue("ID");
            var refAccount = null;
            var accuontName = null;
            var noeDaftar = null;
            var headerShenvarType = '';
            var financialDocType = null;
            var betafkik = "0";

            if (that._SeparationCheckBox.GetValue())
                betafkik = "1";

            if (ValueIsEmpty(that._ShenavarID)) {
                that._ShenavarID = null;
                that._ShenavarType = null;
                that._ShenavarName = null;
            }

            if (that._AccountLookupControl.GetValue() != null) {
                refAccount = that._AccountLookupControl.GetValue();
                accuontName = that._AccountLookupControl.GetAutoComplete().GetText();
                noeDaftar = afw.OptionSetHelper.GetOptionSetItemTitle(that._AccountLevelOptionSetControl.GetValue());
            }

            if (!ValueIsEmpty(that._FinancialDocTypeOptionSetControl.GetValue()))
                financialDocType = that._FinancialDocTypeOptionSetControl.GetValue();

            var isFilterDate = that._DateCheckBox.GetValue();
            if (isFilterDate) {
                fromDate = that._FromDateTimeControl.GetValue();
                toDate = that._ToDateTimeControl.GetValue();
            }
            else {
                if (ValueIsEmpty(that._FinancialDocTypeOptionSetControl.GetValue())) {
                    afw.ErrorDialog.Show("وضعیت مالی سند انتخاب نشده است.");
                    return;
                }

                fromDocNo = that._FromDocRefNoTextBox.GetValue();
                toDocNo = that._ToDocRefNoTextBox.GetValue();
            }

            if (that._ShenavarType == 'Person') {
                headerShenvarType = 'شخص :';
                that._ShenavarName = that._PersonLookup.FindControl("AutoComplete").GetText();
            }
            else if (that._ShenavarType == 'CostCenter') {
                headerShenvarType = 'مرکز هزینه :';
                that._ShenavarName = that._CostCenterLookup.FindControl("AutoComplete").GetText();
            }
            else if (that._ShenavarType == 'Project') {
                headerShenvarType = 'پروژه :';
                that._ShenavarName = that._ProjectLookup.FindControl("AutoComplete").GetText();
            }

            financialYear = ValueIsEmpty(financialYear) ? "null" : String.Format('{0}', financialYear);
            financialDocType = ValueIsEmpty(financialDocType) ? "null" : String.Format("'{0}'", financialDocType);
            organizationUnit = ValueIsEmpty(organizationUnit) ? "null" : String.Format("'{0}'", organizationUnit);
            refAccount = ValueIsEmpty(refAccount) ? "null" : String.Format('{0}', refAccount);
            var shenavarID = ValueIsEmpty(that._ShenavarID) ? "null" : String.Format("'{0}'", that._ShenavarID);
            var shenavarType = ValueIsEmpty(that._ShenavarType) ? "null" : String.Format("'{0}'", that._ShenavarType);
            that._ShenavarName = ValueIsEmpty(that._ShenavarName) ? '' : String.Format("'{0}'", that._ShenavarName);
            fromDocNo = ValueIsEmpty(fromDocNo) ? "null" : String.Format("'{0}'", fromDocNo);
            toDocNo = ValueIsEmpty(toDocNo) ? "null" : String.Format("'{0}'", toDocNo);

            var filterExpression = that._DafaterDataListControl._GetTotalFilterExpression();

            filterExpression = ValueIsEmpty(filterExpression) ? "null" :
                String.Format("N'{0}'", filterExpression.ReplaceAll("'", "''"));

            var filterExpression_Text = "";
            if (!ValueIsEmpty(that._DafaterDataListControl.GetQuickSearchTextBox().GetValue()))
                filterExpression_Text = "متن در جستجو سریع : " + that._DafaterDataListControl.GetQuickSearchTextBox().GetValue();

            var sortExpression = that._DafaterDataListControl.GetSortExpression();
            sortExpression = ValueIsEmpty(sortExpression) ? "null" : String.Format("'{0}'", sortExpression);

            afw.uiApi.ShowProgress(that);
            afw.ReportHelper.RunReport("acc.DafaterReport",
                ["ReportDate", "FromDate_Persian", "ToDate_Persian", "NoeDaftar", "FromDate", "ToDate", "FromDocNo", "ToDocNo", "AccountID",
                     "FinancialYear", "FinancialDocType", "OrganizationUnit", "BeTafkik", "ShenavarID", "ShenavarType", "AccountName", "NoeDaftar", "ShenavarName",
                     "HeaderShenvarType", "FilterExpression", "FilterExpression_Text", "SortExpression", "StartRecordNumber", "MaxRecords"],
                [reportDate, fromDate_Persian, toDate_Persian, "", fromDate, toDate, fromDocNo, toDocNo, refAccount,
                    financialYear, financialDocType, organizationUnit, betafkik, shenavarID, shenavarType, accuontName,
                    noeDaftar, that._ShenavarName, headerShenvarType, filterExpression, filterExpression_Text, sortExpression, "null", "null"],
                null,
                function (result) {
                    afw.uiApi.HideProgress(that);
                });
        },

        _OpenDocButton_Click: function (e) {
            var that = this;

            that.OpenDoc();
        },

        _ApplyFilterButton_Click: function (e) {
            var that = this;

            that._CreateDafaterDataList();
        },

        _DateCheckBox_CheckedChanged: function (sender, e) {
            var that = this;

            if (that._DateCheckBox.GetValue() == true) {
                that._DocCheckBox.SetValue(!that._DateCheckBox.GetValue());
                that._FromDocRefNoTextBox.SetValue(null);
                that._FromDocRefNoTextBox.SetReadOnly(true);
                that._ToDocRefNoTextBox.SetValue(null);
                that._ToDocRefNoTextBox.SetReadOnly(true);

                that._FromDateTimeControl.SetValue(that._FinancialYearEntity.GetFieldValue("StartDate"));
                that._FromDateTimeControl.SetReadOnly(false);
                that._ToDateTimeControl.SetValue(that._FinancialYearEntity.GetFieldValue("EndDate"));
                that._ToDateTimeControl.SetReadOnly(false);
            }

        },

        _DocCheckBox_CheckedChanged: function (sender, e) {
            var that = this;

            if (that._DocCheckBox.GetValue() == true) {
                that._DateCheckBox.SetValue(!that._DocCheckBox.GetValue());
                that._FromDateTimeControl.SetValue(that._FinancialYearEntity.GetFieldValue("StartDate"));
                that._FromDateTimeControl.SetReadOnly(true);
                that._ToDateTimeControl.SetValue(that._FinancialYearEntity.GetFieldValue("EndDate"));
                that._ToDateTimeControl.SetReadOnly(true);

                that._FromDocRefNoTextBox.SetValue(null);
                that._FromDocRefNoTextBox.SetReadOnly(false);
                that._ToDocRefNoTextBox.SetValue(null);
                that._ToDocRefNoTextBox.SetReadOnly(false);


            }
        },

        _AccountLookupControl_OpeningLookup: function (e) {
            var that = this;

            if (!ValueIsEmpty(that._AccountLevelName))
                e.Sender.SetLookupDataListControlCustomOptions({
                    AccountName: that._AccountLevelName,
                    FinancialYear: that._FinancialYearEntity.GetFieldValue("ID")
                });
        },

        _AccountLookupControl_ValueChanged: function () {
            var that = this;

            that._FloatAccountsSelectionControl.SetAccount(that._AccountLookupControl.GetValue());
            that._SetSelectedAccountFloatAccountsControl();
            that._AdjustFloatAccountsSelectionControl();

            if (ValueIsEmpty(that._AccountLookupControl.GetValue()))
                that._PrintButton.SetEnabled(false);
            else
                that._PrintButton.SetEnabled(true);

            that._DestroyDafaterDataList();
            that._SetAmountsSumLabel(null);
        },

        _AccountLevelOptionSetControl_ValueChanged: function () {
            var that = this;

            if (ValueIsEmpty(that._AccountLevelOptionSetControl.GetValue())) {
                that._AccountLevelName = null;
                that.FindControl("AccountDockPanel").Panes[2].SetSizeSetting(1);
                that.FindControl("AccountDockPanel").Panes[3].SetSizeSetting(1);
            }
            else {
                that._AccountLevelName = afw.OptionSetHelper.GetOptionSetItemName(that._AccountLevelOptionSetControl.GetValue());
                that.FindControl("AccountDockPanel").Panes[2].SetSizeSetting(45);
                that.FindControl("AccountDockPanel").Panes[3].SetSizeSetting("fill");
            }

            that._AccountLookupControl.SetValue(null);

            if (that._AccountLevelName == "Tafsili")
                that._SeparationCheckBox.SetValue(true);
            else
                that._SeparationCheckBox.SetValue(false);

            that._DestroyDafaterDataList();
            that._SetAmountsSumLabel(null);
        },

        _FloatAccountsLookup_ValueChanged: function (e) {
            var that = this;

            if (ValueIsEmpty(e.Sender.GetValue()))
                return;

            if (e.Sender.GetName() == "PersonLookupControl") {
                if (!ValueIsEmpty(that._CostCenterLookup))
                    that._CostCenterLookup.SetValue(null);
                if (!ValueIsEmpty(that._ProjectLookup))
                    that._ProjectLookup.SetValue(null);

                that._ShenavarID = e.Sender.GetValue();
                that._ShenavarType = "Person";
            }
            else if (e.Sender.GetName() == "CostCenterLookupControl") {
                if (!ValueIsEmpty(that._PersonLookup))
                    that._PersonLookup.SetValue(null);
                if (!ValueIsEmpty(that._ProjectLookup))
                    that._ProjectLookup.SetValue(null);

                that._ShenavarID = e.Sender.GetValue();
                that._ShenavarType = "CostCenter";
            }
            else if (e.Sender.GetName() == "ProjectLookupControl") {
                if (!ValueIsEmpty(that._CostCenterLookup))
                    that._CostCenterLookup.SetValue(null);
                if (!ValueIsEmpty(that._PersonLookup))
                    that._PersonLookup.SetValue(null);

                that._ShenavarID = e.Sender.GetValue();
                that._ShenavarType = "Project";
            }

            that._DestroyDafaterDataList();
            that._SetAmountsSumLabel(null);
        },

        _SetFinancialDocTypeColumnVisible: function () {
            var that = this;

            if (!ValueIsEmpty(that._FinancialDocTypeOptionSetControl.GetValue()))
                that._DafaterGridView.SetColumnVisible("FinancialDocType_Title", false);
            else
                that._DafaterGridView.SetColumnVisible("FinancialDocType_Title", true);

        },

        _SetAccount: function () {
            var that = this;

            if (that._AccountLevelName == "Kol")
                that._AccountLevelOptionSetControl.SetValue(
                    afw.OptionSetHelper.GetOptionSetItemID("acc.AccountLevel.Kol"));
            else if (that._AccountLevelName == "Moin")
                that._AccountLevelOptionSetControl.SetValue(
                    afw.OptionSetHelper.GetOptionSetItemID("acc.AccountLevel.Moin"));
            if (that._AccountLevelName == "Tafsili")
                that._AccountLevelOptionSetControl.SetValue(
                    afw.OptionSetHelper.GetOptionSetItemID("acc.AccountLevel.Tafsili"));

            that._AccountLookupControl.SetValue(that._Account);
        },

        _HideShowFilterControlDockPanel_Click: function (e) {
            var that = this;

            if (that._FilterControlVisible)
                that._AdjustFilterControl(false);
            else
                that._AdjustFilterControl(true);
        },

        _AdjustFilterControl: function (isVisible) {
            var that = this;

            if (isVisible) {
                that._FilterControlVisible = true;
                that._FilterControlDockPanel.SetPaneSizeSetting(0, 70);
                that._FilterControlDockPanel.SetPaneSizeSetting(2, 100);

                var accountID = that._AccountLookupControl.GetValue();
                if (!ValueIsEmpty(accountID) && acc.AccountHasFloat(accountID)) {
                    that._FilterControlDockPanel.SetPaneSizeSetting(1, 67);
                    that.FindControl("MainDockPanel").SetPaneSizeSetting(0, 260);
                }
                else {
                    that._FilterControlDockPanel.SetPaneSizeSetting(1, 1);
                    that.FindControl("MainDockPanel").SetPaneSizeSetting(0, 194);
                }

                that.FindControl("HideShowFilterControlImagePanel").SetBackgroundImage("resource(cmn.ArrowPointToUp)");
            }
            else {
                that._FilterControlVisible = false;
                that._FilterControlDockPanel.SetPaneSizeSetting(0, 1);
                that._FilterControlDockPanel.SetPaneSizeSetting(1, 1);
                that._FilterControlDockPanel.SetPaneSizeSetting(2, 1);
                that.FindControl("MainDockPanel").SetPaneSizeSetting(0, 24);
                that.FindControl("HideShowFilterControlImagePanel").SetBackgroundImage("resource(cmn.ArrowPointToDown)");
            }
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "acc.DafaterForm";
    FormClass.BaseType = afw.BasePanel;


    acc.DafaterForm = FormClass;
})();
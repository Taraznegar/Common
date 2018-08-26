(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return rp.PayReportForm;
        },

        init: function (options) {
            var that = this;

            that._IsInit = true;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._StatusOptionSetControl = that.FindControl("StatusOptionSetControl");
            that._ReceiptBeginDateControl = that.FindControl("ReceiptBeginDateControl");
            that._ReceiptEndDateControl = that.FindControl("ReceiptEndDateControl");
            that._BankAccountLookupControl = that.FindControl("BankAccountLookupControl");
            that._BankAccountLookupControl_DropDownList = that._BankAccountLookupControl.GetDropDownList();
            that._DueBeginDateControl = that.FindControl("DueBeginDateControl");
            that._DueEndDateControl = that.FindControl("DueEndDateControl");
            that._ApplyFilterButton = that.FindControl("ApplyFilterButton");
            that._PrintButton = that.FindControl("PrintButton");
            that._PayTypeLookupControl = that.FindControl("PayTypeLookupControl");
            that._ReceiptBeginNumberTextBox = that.FindControl("ReceiptBeginNumberTextBox");
            that._ReceiptEndNumberTextBox = that.FindControl("ReceiptEndNumberTextBox");
            that._FromDocReferenceNoTextBox = that.FindControl("FromDocReferenceNoTextBox");
            that._ToDocReferenceNoTextBox = that.FindControl("ToDocReferenceNoTextBox");
            that._PersonLookupControl = that.FindControl("PersonLookupControl");            
            that._PayReportGridPanel = that.FindControl("PayReportGridPanel");
            that._AmountTextBox = that.FindControl("AmountTextBox");
            that._ItemNumberTextBox = that.FindControl("ItemNumberTextBox");
            that._FinancialDocTypeOptionSetControl = that.FindControl("FinancialDocTypeOptionSetControl");

            that._AmountLabel = that.FindControl("AmountLabel");

            that._ApplyFilterButton.bind("Click", function (e) { that._ApplyFilterButton_Click(e); });
            that._PrintButton.bind("Click", function (e) { that._PrintButton_Click(e); });
            that._PayTypeLookupControl.bind("ValueChanged", function (e) { that._PayTypeLookupControl_ValueChanged(e); });
            
            that._StatusOptionSetControl.bind("ValueChanged", function (e) { that._DestroyDataList(); });
            that._ReceiptBeginDateControl.bind("ValueChanged", function (e) { that._DestroyDataList(); });
            that._ReceiptEndDateControl.bind("ValueChanged", function (e) { that._DestroyDataList(); });
            that._BankAccountLookupControl.bind("ValueChanged", function (e) { that._DestroyDataList(); });
            that._DueBeginDateControl.bind("ValueChanged", function (e) { that._DestroyDataList(); });
            that._DueEndDateControl.bind("ValueChanged", function (e) { that._DestroyDataList(); });
            that._PersonLookupControl.bind("ValueChanged", function (e) { that._DestroyDataList(); });
            that._ReceiptBeginNumberTextBox.bind("ValueChanged", function (e) { that._DestroyDataList(); });
            that._ReceiptEndNumberTextBox.bind("ValueChanged", function (e) { that._DestroyDataList(); });
            that._FromDocReferenceNoTextBox.bind("ValueChanged", function (e) { that._DestroyDataList(); });
            that._ToDocReferenceNoTextBox.bind("ValueChanged", function (e) { that._DestroyDataList(); });
            that._AmountTextBox.bind("ValueChanged", function (e) { that._DestroyDataList(); });
            that._ItemNumberTextBox.bind("ValueChanged", function (e) { that._DestroyDataList(); });
            that._FinancialDocTypeOptionSetControl.bind("ValueChanged", function (e) { that._DestroyDataList(); });

            that._FinancialYearEntity = cmn.GetUserActiveFinancialYearEntity();

            var defaultPayTypeID = rp.GetPayTypeID("Cheque");
            that._PayTypeLookupControl.SetValue(defaultPayTypeID);

            that._ReceiptBeginDateControl.SetValue(that._FinancialYearEntity.GetFieldValue("StartDate"));
            that._ReceiptEndDateControl.SetValue(that._FinancialYearEntity.GetFieldValue("EndDate"));

            that._PersonLookupControl.SetBaseFilterExpression(String.Format(
                "not exists ( "+
                    "select 1 "+ 
                    "from cmn_PersonRoleRelations PersonRoleRelation "+
	                "    inner join cmn_PersonRoles PersonRole on PersonRoleRelation.PersonRole = PersonRole.ID "+
                    "where Person = InnerQuery.ID and "+
	                "    PersonRole.Name = 'ConnectedPerson') "));

            that._IsInit = false;
            that._ApplyFilters();
        },

        _PayTypeLookupControl_ValueChanged: function (e) {
            var that = this;

            that._AdjustForm();
            that._SetDueDates();
        },

        _SetDueDates: function () {
            var that = this;

            var payTypeName = that._GetPayTypeName();
            if (payTypeName == "Cheque" || payTypeName == "ChekeZemanat") {
                that._DueBeginDateControl.SetValue(that._FinancialYearEntity.GetFieldValue("StartDate"));
                that._DueEndDateControl.SetValue(that._FinancialYearEntity.GetFieldValue("EndDate"));
            }
            else {
                that._DueBeginDateControl.SetValue(null);
                that._DueEndDateControl.SetValue(null);
            }
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        },

        GetFilterControlsFilterExpression: function () {
            var that = this;

            var filterExpression = "";
            that._FilterText_Column1 = "";
            that._FilterText_Column2 = "";

            var rowCount = 1;

            var payTypeID = that._PayTypeLookupControl.GetValue();
            var receiptBeginDate = that._ReceiptBeginDateControl.GetValue();
            var receiptEndDate = that._ReceiptEndDateControl.GetValue();
            var personID = that._PersonLookupControl.GetValue();
            var receiptBeginNumber = that._ReceiptBeginNumberTextBox.GetValue();
            var receiptEndNumber = that._ReceiptEndNumberTextBox.GetValue();
            var amountTextBox = that._AmountTextBox.GetValue();
            var ItemNumberTextBox = that._ItemNumberTextBox.GetValue();

            if (!ValueIsEmpty(payTypeID)) {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";

                filterExpression += String.Format(" PayType = '{0}'", payTypeID);

                that._FilterText_Column1 += String.Format(" نوع پرداخت: {0}      ",
                    that._PayTypeLookupControl.GetDropDownList().GetText());
            }
            else
                that._FilterText_Column1 += " نوع پرداخت: همه        ";


            var payTypeName = that._GetPayTypeName();

            if (payTypeName == "Cheque") {
                var statusID = that._StatusOptionSetControl.GetValue();

                if (!ValueIsEmpty(statusID)) {
                    if (!ValueIsEmpty(filterExpression))
                        filterExpression += " and ";

                    filterExpression += String.Format("ChequeStatus = '{0}'", statusID);

                    that._FilterText_Column1 += String.Format(" وضعیت: {0} \n",
                        afw.OptionSetHelper.GetOptionSetItemTitle(statusID));
                }
                else
                    that._FilterText_Column1 += "وضعیت: همه \n";
            }
            else
                that._FilterText_Column1 += "\n";

            rowCount++;

            if (payTypeName == "Cheque" || payTypeName == "ChekeZemanat" || payTypeName == "Havale") {
                var bankAccountID = that._BankAccountLookupControl.GetValue();

                if (!ValueIsEmpty(bankAccountID)) {
                    if (!ValueIsEmpty(filterExpression))
                        filterExpression += " and ";

                    filterExpression += String.Format("BankAccount = '{0}'", bankAccountID);

                    that._FilterText_Column1 += String.Format(" حساب بانکی: {0} \n",
                        that._BankAccountLookupControl.GetDropDownList().GetText());
                    rowCount++;
                }
            }

            if (!ValueIsEmpty(receiptBeginDate)) {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";

                filterExpression += String.Format("PayReceipt_Date >= '{0}'", receiptBeginDate);
            }

            if (!ValueIsEmpty(receiptEndDate)) {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";

                filterExpression += String.Format("PayReceipt_Date <= '{0}'", receiptEndDate);
            }

            if (!ValueIsEmpty(receiptBeginDate) || !ValueIsEmpty(receiptEndDate)) {
                that._FilterText_Column1 += String.Format(" تاریخ رسید{0} \n",
                    that._GetPersianTextFromToValues(afw.DateTimeHelper.GregorianToJalali(receiptBeginDate), afw.DateTimeHelper.GregorianToJalali(receiptEndDate)));
                rowCount++;
            }

            if (payTypeName == "Cheque" || payTypeName == "ChekeZemanat") {
                var dueBeginDate = that._DueBeginDateControl.GetValue();
                var dueEndDate = that._DueEndDateControl.GetValue();

                if (!ValueIsEmpty(dueBeginDate)) {
                    if (!ValueIsEmpty(filterExpression))
                        filterExpression += " and ";

                    filterExpression += String.Format("DueDate >= '{0}'", dueBeginDate);
                }

                if (!ValueIsEmpty(dueEndDate)) {
                    if (!ValueIsEmpty(filterExpression))
                        filterExpression += " and ";

                    filterExpression += String.Format("DueDate <= '{0}'", dueEndDate);
                }

                if (!ValueIsEmpty(receiptBeginDate) || !ValueIsEmpty(receiptEndDate)) {
                    that._FilterText_Column1 += String.Format(" تاریخ سررسید{0} \n",
                        that._GetPersianTextFromToValues(afw.DateTimeHelper.GregorianToJalali(dueBeginDate), afw.DateTimeHelper.GregorianToJalali(dueEndDate)));
                    rowCount++;
                }


            }

            if (!ValueIsEmpty(receiptBeginNumber)) {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";

                filterExpression += String.Format("cast(PayReceipt_Number as int) >= {0}", receiptBeginNumber);
            }

            if (!ValueIsEmpty(receiptEndNumber)) {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";

                filterExpression += String.Format("cast(PayReceipt_Number as int) <= {0}", receiptEndNumber);
            }

            if (!ValueIsEmpty(receiptBeginNumber) || !ValueIsEmpty(receiptEndNumber)) {
                that._FilterText_Column1 += String.Format(" شماره رسید{0} \n",
                    that._GetPersianTextFromToValues(receiptBeginNumber, receiptEndNumber));
                rowCount++;
            }

            if (!ValueIsEmpty(that._FromDocReferenceNoTextBox.GetValue())) {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";

                filterExpression += String.Format("cast(AccDoc_No as int) >= {0}", that._FromDocReferenceNoTextBox.GetValue());
            }

            if (!ValueIsEmpty(that._ToDocReferenceNoTextBox.GetValue())) {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";

                filterExpression += String.Format("cast(AccDoc_No as int) <= {0}", that._ToDocReferenceNoTextBox.GetValue());
            }

            if (!ValueIsEmpty(that._ToDocReferenceNoTextBox.GetValue()) || !ValueIsEmpty(that._FromDocReferenceNoTextBox.GetValue())) {
                if (rowCount > 5)
                    that._FilterText_Column2 += String.Format(" شماره سند مرجع{0} \n",
                    that._GetPersianTextFromToValues(that._FromDocReferenceNoTextBox.GetValue(), that._ToDocReferenceNoTextBox.GetValue()));
                else
                    that._FilterText_Column1 += String.Format(" شماره سند مرجع{0} \n",
                        that._GetPersianTextFromToValues(that._FromDocReferenceNoTextBox.GetValue(), that._ToDocReferenceNoTextBox.GetValue()));
                rowCount++;
            }

            if (that.FindControl("SecondDockPanel").Panes[2].GetSizeSetting() != 1) {
                if (!ValueIsEmpty(amountTextBox)) {
                    if (!ValueIsEmpty(filterExpression))
                        filterExpression += " and ";

                    filterExpression += String.Format("cast(Amount as int) like '%{0}%'", amountTextBox);

                    if (rowCount > 5)
                        that._FilterText_Column2 += String.Format(" مبلغ شامل {0}        ", amountTextBox);
                    else
                        that._FilterText_Column1 += String.Format(" مبلغ شامل {0}        ", amountTextBox);
                }

                if (!ValueIsEmpty(ItemNumberTextBox)) {
                    if (!ValueIsEmpty(filterExpression))
                        filterExpression += " and ";

                    filterExpression += String.Format("cast(ItemNo as int) like '%{0}%'", ItemNumberTextBox);

                    if (rowCount > 5)
                        that._FilterText_Column2 += String.Format(" {0} شامل {1} \n",
                            that.FindControl("ItemNumberLabel").GetText(), ItemNumberTextBox);
                    else
                        that._FilterText_Column1 += String.Format(" {0} شامل {1} \n",
                            that.FindControl("ItemNumberLabel").GetText(), ItemNumberTextBox);

                    rowCount++;
                }
                else if (!ValueIsEmpty(amountTextBox)) {
                    that._FilterText_Column1 += "\n";
                    rowCount++;
                }
            }

            if (!ValueIsEmpty(personID)) {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";

                filterExpression += String.Format("Payee = '{0}'", personID);

                if (rowCount > 5)
                    that._FilterText_Column2 += String.Format(" شخص: {0} \n",
                        that._PersonLookupControl.FindControl("AutoComplete").GetText());
                else
                    that._FilterText_Column1 += String.Format(" شخص: {0} \n",
                        that._PersonLookupControl.FindControl("AutoComplete").GetText());
            }

            if (!ValueIsEmpty(that._FinancialDocTypeOptionSetControl.GetValue())) {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";

                filterExpression += String.Format("FinancialDocType = '{0}'", that._FinancialDocTypeOptionSetControl.GetValue());
            }

            if (!ValueIsEmpty(that._DataListControl.GetQuickSearchTextBox().GetValue())) {
                if (rowCount > 5)
                    that._FilterText_Column2 += String.Format(" متن جستجو سریع: {0} \n",
                        that._DataListControl.GetQuickSearchTextBox().GetValue());
                else
                    that._FilterText_Column1 += String.Format(" متن جستجو سریع: {0} \n",
                        that._DataListControl.GetQuickSearchTextBox().GetValue());
            }

            return filterExpression;
        },

        _ApplyFilters: function () {
            var that = this;

            if (that._PayReportGridPanel.FindControl("DataListControl") == null)
                that._CreateDataList();

            that._DataListControl.LoadData();
            that.CaclulateSummaryFields(that._DataListControl._GetTotalFilterExpression());
            
        },

        CaclulateSummaryFields: function (filterExpression) {
            var that = this;

            afw.uiApi.CallServerMethodAsync("rp.GetPayReportSummaryFields", [filterExpression],
                function (result) {
                    if (that._IsDestroying)
                        return;

                    afw.uiApi.HideProgress(that);
                    if (result.HasError)
                        afw.ErrorDialog.Show(result.ErrorMessage);
                    else {
                        var amountSum = afw.BaseUtils.FormatNumber(result.Value.GetFieldValue("AmountSum"));
                        that._AmountLabel.SetText(String.Format("مجموع پرداختی :  {0} ریال", ValueIsEmpty(amountSum) ? 0 : amountSum));
                    }
                });
        },

        _ApplyFilterButton_Click: function () {
            var that = this;

            that._ApplyFilters();
        },

        _PrintButton_Click: function () {
            var that = this;

            var reportDate_Persian = afw.DateTimeHelper.GetServerPersianDateTime().split(' ')[0];            
            var organizationName = cmn.GetOrganizationInformation().GetFieldValue("Name");

            that._FilterText_Column1 = "";
            that._FilterText_Column2 = "";
            var filterExpression = that._DataListControl._GetTotalFilterExpression();

            afw.uiApi.ShowProgress(that);
            afw.ReportHelper.RunReport("rp.PayReport",
                ["ReportDate", "OrganizationName", "FilterExpression", "FilterText_Column1", "FilterText_Column2"],
                [reportDate_Persian, organizationName, filterExpression, that._FilterText_Column1, that._FilterText_Column2],
                null,
                function (result) {
                    afw.uiApi.HideProgress(that);
                });
        },

        _GetPayTypeName: function () {
            var that = this;

            var payTypeID = that._PayTypeLookupControl.GetValue();

            if (payTypeID == null)
                return null;
            else
                return rp.GetPayTypeName(payTypeID);
        },

        _AdjustForm: function () {            
            var that = this;

            that.FindControl("StatusDockPanel").SetVisible(false);
            that.FindControl("DueDateDockPanel").SetVisible(false);
            that.FindControl("BankAccountDockPanel").SetVisible(false);
            that.FindControl("SecondDockPanel").Panes[2].SetSizeSetting(1);

            var payTypeName = that._GetPayTypeName();

            if (payTypeName == "Cheque") {
                that.FindControl("StatusDockPanel").SetVisible(true);
                that.FindControl("BankAccountDockPanel").SetVisible(true);
                that.FindControl("DueDateDockPanel").SetVisible(true);
                that.FindControl("SecondDockPanel").Panes[2].SetSizeSetting(330);
                that.FindControl("ItemNumberLabel").SetText("شماره چک");
            }
            else if (payTypeName == "Havale") {
                that.FindControl("SecondDockPanel").Panes[2].SetSizeSetting(330);
                that.FindControl("ItemNumberLabel").SetText("شماره حواله");
                that.FindControl("BankAccountDockPanel").SetVisible(true);
            }
            else if (payTypeName == "ChekeZemanat") {
                that.FindControl("SecondDockPanel").Panes[2].SetSizeSetting(330);
                that.FindControl("ItemNumberLabel").SetText("شماره چک");
                that.FindControl("DueDateDockPanel").SetVisible(true);
            }
        },

        _CreateDataList: function () {
            var that = this;

            that._DataListControl = afw.uiApi.CreateDataListControl("rp.PayReportList", {
                Name: 'DataListControl',
                ParentControl: that._PayReportGridPanel,
                FillParent: true,
                LoadDataOnInit: false,
                PayReportForm : that
            });

        },

        _DestroyDataList: function () {
            var that = this;

            var datalist = that._PayReportGridPanel.FindControl("DataListControl");
            if (datalist != null)
                datalist.Destroy();

            that._AmountLabel.SetText("مجموع پرداختی :  0 ریال");
        },

        _GetPersianTextFromToValues: function (fromText, toText) {
            var that = this;

            var result = "";
            if (!ValueIsEmpty(fromText))
                result += " از " + fromText;

            if (!ValueIsEmpty(toText))
                result += " تا " + toText;

            return result;
        }
    });

    //Static Members:

    FormClass.TypeName = "rp.PayReportForm";
    FormClass.BaseType = afw.BasePanel;

    rp.PayReportForm = FormClass;
})();
(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return acc.AccDocItemFilteringControl;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (designObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._IsInSettingFilter = false;

            that._BeforeField1 = "DocNo";
            that._BeforeField2 = "IssueDate";
            that._BeforeField3 = "FinancialGroup";
            that._BeforeField4 = "CreatorUser";

            //that._NowDateTime = DateTimeHelper.GetServerDateTime().split(' ')[0];
            that._FinancialGroups = afw.DataListHelper.FetchEntityListOfDataList("cmn.FinancialGroupList").ToDataSourceData();
            that._FinancialGroups.splice(0, 0, { ID: "All", Title: "همه" });

            that._SystemUsers = afw.DataListHelper.FetchEntityListOfDataList("afw.SystemUsers").ToDataSourceData();
            that._SystemUsers.splice(0, 0, { ID: "All", DisplayName: "همه" });

            that._DocKinds = afw.DataListHelper.FetchEntityListOfDataList("acc.DocKinds").ToDataSourceData();
            that._DocKinds.splice(0, 0, { ID: "All", Title: "همه" });

            that._IsDocNo = false;
            that._IsIssueDate = false;
            that._IsDebtorAmount = false;
            that._IsCreditorAmount = false;
            that._IsKolCode = false;
            that._IsMoinCode = false;
            that._IsTafsiliCode = false;
            that._IsKolName = false;
            that._IsMoinName = false;
            that._IsTafsiliName = false;
            that._IsAccDocItemDes = false;
            that._IsFinancialGroup = false;
            that._IsCreatorUser = false;
            that._IsPerson = false;
            that._IsCostCenter = false;
            that._IsProject = false;
            that._IsForeignCurrency = false;
            that._IsFinancialAccountCode = false;
            that._IsDocKind = false;

            that._ItemDockPanel = that.FindControl("ItemDockPanel");

            that._SetFieldValueAndVisible(options);

            that._FillFilteingComboBox(); 
        },

        _SetFieldValueAndVisible: function (options) {
            var that = this;

            var panIndex = 0;

            if ("DocNo" in options) {
                that._DocNo = options.DocNo;
                that._EnableField("DocNo", panIndex);
                panIndex = panIndex + 1; 
            }
            else {
                that._DocNo = ""; 
            }

            if ("IssueDate" in options) {
                that._IssueDate = options.IssueDate;
                that._EnableField("IssueDate", panIndex);
                panIndex = panIndex + 1;
            }
            else {
                that._IssueDate = ""; 
            }

            if ("DebtorAmount" in options) {
                that._DebtorAmount = options.DebtorAmount;
                that._EnableField("DebtorAmount", panIndex);
                panIndex = panIndex + 1;
            }
            else {
                that._DebtorAmount = ""; 
            }

            if ("CreditorAmount" in options) {
                that._CreditorAmount = options.CreditorAmount;
                that._EnableField("CreditorAmount", panIndex);
                panIndex = panIndex + 1;
            }
            else {
                that._CreditorAmount = ""; 
            }

            if ("KolCode" in options) {
                that._KolCode = options.KolCode;
                that._EnableField("KolCode", panIndex);
                panIndex = panIndex + 1;
            }
            else {
                that._KolCode = ""; 
            }

            if ("MoinCode" in options) {
                that._MoinCode = options.MoinCode;
                that._EnableField("MoinCode", panIndex);
                panIndex = panIndex + 1;
            }
            else {
                that._MoinCode = ""; 
            }

            if ("TafsiliCode" in options) {
                that._TafsiliCode = options.TafsiliCode;
                that._EnableField("TafsiliCode", panIndex);
                panIndex = panIndex + 1;
            }
            else {
                that._TafsiliCode = ""; 
            }

            if ("KolName" in options) {
                that._KolName = options.KolName;
                that._EnableField("KolName", panIndex);
                panIndex = panIndex + 1;
            }
            else {
                that._KolName = ""; 
            }

            if ("MoinName" in options) {
                that._MoinName = options.MoinName;
                that._EnableField("MoinName", panIndex);
                panIndex = panIndex + 1;
            }
            else {
                that._MoinName = ""; 
            }

            if ("TafsiliName" in options) {
                that._TafsiliName = options.TafsiliName;
                that._EnableField("TafsiliName", panIndex);
                panIndex = panIndex + 1;
            }
            else {
                that._TafsiliName = ""; 
            }

            if ("AccDocItemDes" in options) {
                that._AccDocItemDes = options.AccDocItemDes;
                that._EnableField("AccDocItemDes", panIndex);
                panIndex = panIndex + 1;
            }
            else {
                that._AccDocItemDes = ""; 
            }

            if ("FinancialGroup" in options) {
                that._FinancialGroup = options.FinancialGroup;
                that._EnableField("FinancialGroup", panIndex);
                panIndex = panIndex + 1;
            }
            else {
                that._FinancialGroup = ""; 
            }

            if ("CreatorUser" in options) {
                that._CreatorUser = options.CreatorUser;
                that._EnableField("CreatorUser", panIndex);
                panIndex = panIndex + 1;
            }
            else {
                that._CreatorUser = ""; 
            }

            if ("Person" in options) {
                that._Person = options.Person;
                that._EnableField("Person", panIndex);
                panIndex = panIndex + 1;
            }
            else {
                that._Person = ""; 
            }

            if ("CostCenter" in options) {
                that._CostCenter = options.CostCenter;
                that._EnableField("CostCenter", panIndex);
                panIndex = panIndex + 1;
            }
            else {
                that._CostCenter = ""; 
            }

            if ("Project" in options) {
                that._Project = options.Project;
                that._EnableField("Project", panIndex);
                panIndex = panIndex + 1;
            }
            else {
                that._Project = ""; 
            }

            if ("ForeignCurrency" in options) {
                that._ForeignCurrency = options.ForeignCurrency;
                that._EnableField("ForeignCurrency", panIndex);
                panIndex = panIndex + 1;
            }
            else {
                that._ForeignCurrency = ""; 
            }

            if ("FinancialAccountCode" in options) {
                that._FinancialAccountCode = options.FinancialAccountCode;
                that._EnableField("FinancialAccountCode", panIndex);
                panIndex = panIndex + 1;
            }
            else {
                that._FinancialAccountCode = "";
            }

            if ("DocKind" in options) {
                that._DocKind = options.DocKind;
                that._EnableField("DocKind", panIndex);
                panIndex = panIndex + 1;
            }
            else {
                that._DocKind = "";
            }
        },

        _FillFilteingComboBox: function () {
            var that = this;

            that._Field1FilterComboBox = that.FindControl("Field1FilterComboBox");
            that._Field2FilterComboBox = that.FindControl("Field2FilterComboBox");
            that._Field3FilterComboBox = that.FindControl("Field3FilterComboBox");
            that._Field4FilterComboBox = that.FindControl("Field4FilterComboBox");

            var fields = [
                { ID: "DocNo", Title: "سند" },
                { ID: "IssueDate", Title: "تاریخ" },
                { ID: "DebtorAmount", Title: "بدهکار" },
                { ID: "CreditorAmount", Title: "بستانکار" },
                { ID: "KolCode", Title: "کد کل" },
                { ID: "MoinCode", Title: "کد معین" },
                { ID: "TafsiliCode", Title: "کد تفصیلی" },
                { ID: "KolName", Title: "شرح کل" },
                { ID: "MoinName", Title: "شرح معین" },
                { ID: "TafsiliName", Title: "شرح تفصیلی" },
                { ID: "AccDocItemDes", Title: "شرح آیتم سند" },
                { ID: "FinancialGroup", Title: "گروه مالی" },
                { ID: "CreatorUser", Title: "کاربر ایجاد کننده" },
                { ID: "Person", Title: "شخص" },
                { ID: "CostCenter", Title: "مرکز هزینه" },
                { ID: "Project", Title: "پروژه" },
                { ID: "ForeignCurrency", Title: "ارزی" },
                { ID: "FinancialAccountCode", Title: "کد حساب شخص" },
                { ID: "DocKind", Title: "نوع سند" }];

            that._Field1FilterComboBox.SetItemsDataSource(fields);
            that._Field2FilterComboBox.SetItemsDataSource(fields);
            that._Field3FilterComboBox.SetItemsDataSource(fields);
            that._Field4FilterComboBox.SetItemsDataSource(fields);

            that._Field1FilterComboBox.SetValue("DocNo");
            that._Field2FilterComboBox.SetValue("IssueDate");
            that._Field3FilterComboBox.SetValue("FinancialGroup");
            that._Field4FilterComboBox.SetValue("CreatorUser");

            that._Field1FilterComboBox.bind("ValueChanged", function (e) { that._Field1FilterComboBox_ValueChanged(e); });
            that._Field2FilterComboBox.bind("ValueChanged", function (e) { that._Field2FilterComboBox_ValueChanged(e); });
            that._Field3FilterComboBox.bind("ValueChanged", function (e) { that._Field3FilterComboBox_ValueChanged(e); });
            that._Field4FilterComboBox.bind("ValueChanged", function (e) { that._Field4FilterComboBox_ValueChanged(e); });
        },
         
        _Field1FilterComboBox_ValueChanged: function (e) {
            var that = this;

            if (!ValueIsEmpty(that._Field1FilterComboBox.GetValue())) {
                var fieldValue = that._Field1FilterComboBox.GetValue();
                that._DisableField(that._BeforeField1, 0);
                that._EnableField(fieldValue, 0);
                that._BeforeField1 = fieldValue;
            }
            else {
                that._DisableField(that._BeforeField1, 0);
            }
        },

        _Field2FilterComboBox_ValueChanged: function (e) {
            var that = this;

            if (!ValueIsEmpty(that._Field2FilterComboBox.GetValue())) {
                var fieldValue = that._Field2FilterComboBox.GetValue();
                that._DisableField(that._BeforeField2, 1); 
                that._EnableField(fieldValue, 1);
                that._BeforeField2 = fieldValue;
            }
            else {
                that._DisableField(that._BeforeField2, 1);
            }
        },

        _Field3FilterComboBox_ValueChanged: function (e) {
            var that = this;

            if (!ValueIsEmpty(that._Field3FilterComboBox.GetValue())) {
                var fieldValue = that._Field3FilterComboBox.GetValue();
                that._DisableField(that._BeforeField3, 2); 
                that._EnableField(fieldValue, 2);
                that._BeforeField3 = fieldValue;
            }
            else {
                that._DisableField(that._BeforeField3, 2);
            }
        },

        _Field4FilterComboBox_ValueChanged: function (e) {
            var that = this;

            if (!ValueIsEmpty(that._Field4FilterComboBox.GetValue())) {
                var fieldValue = that._Field4FilterComboBox.GetValue();
                that._DisableField(that._BeforeField4, 3); 
                that._EnableField(fieldValue, 3);
                that._BeforeField4 = fieldValue;
            }
            else {
                that._DisableField(that._BeforeField4, 3);
            }
        },

        _EnableField: function (fieldName, panIndex) {
            var that = this;
             
            if (fieldName == "DocNo") {
                that._IsDocNo = true; 
                that._CreateNumericTextBox(panIndex, "DocNoTextBox");

                that._DocNoTextBox = that.FindControl("DocNoTextBox");
                that._DocNoTextBox.bind("ValueChanged", function (e) { that._OnFilterChanged(); });
            }
            else if (fieldName == "IssueDate") {
                that._IsIssueDate = true; 
                that._CreateDateTimeControl(panIndex, "IssueDateControl", "Date");

                that._IssueDateControl = that.FindControl("IssueDateControl");
                that._IssueDateControl.bind("ValueChanged", function (e) { that._OnFilterChanged(); });
            }
            else if (fieldName == "DebtorAmount") {
                that._IsDebtorAmount = true;
                that._CreateNumericTextBox(panIndex, "DebtorAmountTextBox");

                that._DebtorAmountTextBox = that.FindControl("DebtorAmountTextBox");
                that._DebtorAmountTextBox.bind("ValueChanged", function (e) { that._OnFilterChanged(); });
            }
            else if (fieldName == "CreditorAmount") {
                that._IsCreditorAmount = true; 
                that._CreateNumericTextBox(panIndex, "CreditorAmountTextBox");

                that._CreditorAmountTextBox = that.FindControl("CreditorAmountTextBox");
                that._CreditorAmountTextBox.bind("ValueChanged", function (e) { that._OnFilterChanged(); });
            }
            else if (fieldName == "KolCode") {
                that._IsKolCode = true; 
                that._CreateNumericTextBox(panIndex, "KolCodeTextBox");

                that._KolCodeTextBox = that.FindControl("KolCodeTextBox");
                that._KolCodeTextBox.bind("ValueChanged", function (e) { that._OnFilterChanged(); });
            }
            else if (fieldName == "MoinCode") {
                that._IsMoinCode = true; 
                that._CreateNumericTextBox(panIndex, "MoinCodeTextBox");

                that._MoinCodeTextBox = that.FindControl("MoinCodeTextBox");
                that._MoinCodeTextBox.bind("ValueChanged", function (e) { that._OnFilterChanged(); });
            }
            else if (fieldName == "TafsiliCode") {
                that._IsTafsiliCode = true; 
                that._CreateNumericTextBox(panIndex, "TafsiliCodeTextBox");

                that._TafsiliCodeTextBox = that.FindControl("TafsiliCodeTextBox");
                that._TafsiliCodeTextBox.bind("ValueChanged", function (e) { that._OnFilterChanged(); });
            }
            else if (fieldName == "KolName") {
                that._IsKolName = true; 
                that._CreateTextBox(panIndex, "KolNameTextBox");

                that._KolNameTextBox = that.FindControl("KolNameTextBox");
                that._KolNameTextBox.bind("ValueChanged", function (e) { that._OnFilterChanged(); });
            }
            else if (fieldName == "MoinName") {
                that._IsMoinName = true; 
                that._CreateTextBox(panIndex, "MoinNameTextBox");

                that._MoinNameTextBox = that.FindControl("MoinNameTextBox");
                that._MoinNameTextBox.bind("ValueChanged", function (e) { that._OnFilterChanged(); });
            }
            else if (fieldName == "TafsiliName") {
                that._IsTafsiliName = true; 
                that._CreateTextBox(panIndex, "TafsiliNameTextBox");

                that._TafsiliNameTextBox = that.FindControl("TafsiliNameTextBox");
                that._TafsiliNameTextBox.bind("ValueChanged", function (e) { that._OnFilterChanged(); });
            }
            else if (fieldName == "AccDocItemDes") {
                that._IsAccDocItemDes = true; 
                that._CreateTextBox(panIndex, "AccDocItemDesTextBox");

                that._AccDocItemDesTextBox = that.FindControl("AccDocItemDesTextBox");
                that._AccDocItemDesTextBox.bind("ValueChanged", function (e) { that._OnFilterChanged(); });
            }
            else if (fieldName == "FinancialGroup") {
                that._IsFinancialGroup = true; 
                that._CreateComboBox(panIndex, "FinancialGroupComboBox", "Title", "ID");

                that._FinancialGroupComboBox = that.FindControl("FinancialGroupComboBox");
                that._FinancialGroupComboBox.SetItemsDataSource(that._FinancialGroups);
                that._FinancialGroupComboBox.SetValue(that._FinancialGroups[0].ID);
                that._FinancialGroupComboBox.bind("ValueChanged", function (e) { that._OnFilterChanged(); });
            }
            else if (fieldName == "CreatorUser") {
                that._IsCreatorUser = true; 
                that._CreateComboBox(panIndex, "SystemUserComboBox", "DisplayName", "ID");

                that._SystemUserComboBox = that.FindControl("SystemUserComboBox");
                that._SystemUserComboBox.SetItemsDataSource(that._SystemUsers);
                that._SystemUserComboBox.SetValue(that._SystemUsers[0].ID);
                that._SystemUserComboBox.bind("ValueChanged", function (e) { that._OnFilterChanged(); });
            }
            else if (fieldName == "Person") {
                that._IsPerson = true; 
                that._CreateLookupControl(panIndex, "PersonLookupControl", "cmn.Persons", "FullName");

                that._PersonLookupControl = that.FindControl("PersonLookupControl");
                that._PersonLookupControl.bind("ValueChanged", function (e) { that._OnFilterChanged(); });
            }
            else if (fieldName == "CostCenter") {
                that._IsCostCenter = true; 
                that._CreateLookupControl(panIndex, "CostCenterLookupControl", "cmn.CostCenters", "Name");

                that._CostCenterLookupControl = that.FindControl("CostCenterLookupControl");
                that._CostCenterLookupControl.bind("ValueChanged", function (e) { that._OnFilterChanged(); });
            }
            else if (fieldName == "Project") {
                that._IsProject = true; 
                that._CreateLookupControl(panIndex, "ProjectLookupControl", "cmn.Projects", "Name");

                that._ProjectLookupControl = that.FindControl("ProjectLookupControl");
                that._ProjectLookupControl.bind("ValueChanged", function (e) { that._OnFilterChanged(); });
            }
            else if (fieldName == "ForeignCurrency") {
                that._IsForeignCurrency = true; 
                that._CreateLookupControl(panIndex, "ForeignCurrencyLookupControl", "cmn.ForeignCurrencies", "Name");

                that._ForeignCurrencyLookupControl = that.FindControl("ForeignCurrencyLookupControl");
                that._ForeignCurrencyLookupControl.bind("ValueChanged", function (e) { that._OnFilterChanged(); });
            }
            else if (fieldName == "FinancialAccountCode") {
                that._IsFinancialAccountCode = true;
                that._CreateNumericTextBox(panIndex, "FinancialAccountCodeTextBox");

                that._FinancialAccountCodeTextBox = that.FindControl("FinancialAccountCodeTextBox");
                that._FinancialAccountCodeTextBox.bind("ValueChanged", function (e) { that._OnFilterChanged(); });
            }
            else if (fieldName == "DocKind") {
                that._IsDocKind = true;
                that._CreateComboBox(panIndex, "DocKindComboBox", "Title", "ID");

                that._DocKindComboBox = that.FindControl("DocKindComboBox");
                that._DocKindComboBox.SetItemsDataSource(that._DocKinds);
                that._DocKindComboBox.SetValue(that._DocKinds[0].ID);
                that._DocKindComboBox.bind("ValueChanged", function (e) { that._OnFilterChanged(); });
            }

        },

        _DisableField: function (fieldName, panIndex) {
            var that = this;
 

            if (fieldName == "DocNo") {
                that._IsDocNo = false;
                that.DestroyPaneItem(panIndex);
            }
            else if (fieldName == "IssueDate") {
                that._IsIssueDate = false;
                that.DestroyPaneItem(panIndex);
            }
            else if (fieldName == "DebtorAmount") {
                that._IsDebtorAmount = false;
                that.DestroyPaneItem(panIndex);
            }
            else if (fieldName == "CreditorAmount") {
                that._IsCreditorAmount = false;
                that.DestroyPaneItem(panIndex);
            }
            else if (fieldName == "KolCode") {
                that._IsKolCode = false;
                that.DestroyPaneItem(panIndex);
            }
            else if (fieldName == "MoinCode") {
                that._IsMoinCode = false;
                that.DestroyPaneItem(panIndex);
            }
            else if (fieldName == "TafsiliCode") {
                that._IsTafsiliCode = false;
                that.DestroyPaneItem(panIndex);
            }
            else if (fieldName == "KolName") {
                that._IsKolName = false;
                that.DestroyPaneItem(panIndex);
            }
            else if (fieldName == "MoinName") {
                that._IsMoinName = false;
                that.DestroyPaneItem(panIndex);
            }
            else if (fieldName == "TafsiliName") {
                that._IsTafsiliName = false;
                that.DestroyPaneItem(panIndex);
            }
            else if (fieldName == "AccDocItemDes") {
                that._IsAccDocItemDes = false;
                that.DestroyPaneItem(panIndex);
            }
            else if (fieldName == "FinancialGroup") {
                that._IsFinancialGroup = false;
                that.DestroyPaneItem(panIndex);
            }
            else if (fieldName == "CreatorUser") {
                that._IsCreatorUser = false;
                that.DestroyPaneItem(panIndex);
            }
            else if (fieldName == "Person") {
                that._IsPerson = false;
                that.DestroyPaneItem(panIndex);
            }
            else if (fieldName == "CostCenter") {
                that._IsCostCenter = false;
                that.DestroyPaneItem(panIndex);
            }
            else if (fieldName == "Project") {
                that._IsProject = false;
                that.DestroyPaneItem(panIndex);
            }
            else if (fieldName == "ForeignCurrency") {
                that._IsForeignCurrency = false;
                that.DestroyPaneItem(panIndex);
            }
            else if (fieldName == "FinancialAccountCode") {
                that._IsFinancialAccountCode = false;
                that.DestroyPaneItem(panIndex);
            }
            else if (fieldName == "DocKind") {
                that._IsDocKind = false;
                that.DestroyPaneItem(panIndex);
            }
        },

        DestroyPaneItem: function (panIndex) {
            var that = this;

            if (that._ItemDockPanel.Panes[panIndex].HasChildControls) {
                that._ItemDockPanel.Panes[panIndex].ChildControls[0].Destroy();
            }
        },

        SetFilters: function (filterNameValues) {
            var that = this;

            that._IsInSettingFilter = true;

            try {
                if (that._IsDocNo == true) {
                    if ("DocNo" in filterNameValues) {
                        that._DocNoTextBox.SetValue(filterNameValues.DocNo);
                    }
                }
                else if (that._IsIssueDate == true) {
                    if ("IssueDate" in filterNameValues) {
                        that._IssueDateControl.SetValue(filterNameValues.IssueDate);
                    }
                }
                else if (that._IsDebtorAmount == true) {
                    if ("DebtorAmount" in filterNameValues) {
                        that._DebtorAmountTextBox.SetValue(filterNameValues.DebtorAmount);
                    }
                }
                else if (that._IsCreditorAmount == true) {
                    if ("CreditorAmount" in filterNameValues) {
                        that._CreditorAmountTextBox.SetValue(filterNameValues.CreditorAmount);
                    }
                }
                else if (that._IsKolCode == true) {
                    if ("KolCode" in filterNameValues) {
                        that._KolCodeTextBox.SetValue(filterNameValues.KolCode);
                    }
                }
                else if (that._IsMoinCode == true) {
                    if ("MoinCode" in filterNameValues) {
                        that._MoinCodeTextBox.SetValue(filterNameValues.MoinCode);
                    }
                }
                else if (that._IsTafsiliCode == true) {
                    if ("TafsiliCode" in filterNameValues) {
                        that._TafsiliCodeTextBox.SetValue(filterNameValues.TafsiliCode);
                    }
                }
                else if (that._IsKolName == true) {
                    if ("KolName" in filterNameValues) {
                        that._KolNameTextBox.SetValue(filterNameValues.KolName);
                    }
                }
                else if (that._IsMoinName == true) {
                    if ("MoinName" in filterNameValues) {
                        that._MoinNameTextBox.SetValue(filterNameValues.MoinName);
                    }
                }
                else if (that._IsTafsiliName == true) {
                    if ("TafsiliName" in filterNameValues) {
                        that._TafsiliNameTextBox.SetValue(filterNameValues.TafsiliName);
                    }
                }
                else if (that._IsAccDocItemDes == true) {
                    if ("AccDocItemDes" in filterNameValues) {
                        that._AccDocItemDesTextBox.SetValue(filterNameValues.AccDocItemDes);
                    }
                }
                else if (that._IsFinancialGroup == true) {
                    if ("FinancialGroup" in filterNameValues) {
                        that._FinancialGroupComboBox.SetValue(filterNameValues.FinancialGroup);
                    }
                }
                else if (that._IsCreatorUser == true) {
                    if ("CreatorUser" in filterNameValues) {
                        that._SystemUserComboBox.SetValue(filterNameValues.CreatorUser);
                    }
                }
                else if (that._IsPerson == true) {
                    if ("Person" in filterNameValues) {
                        that._PersonLookupControl.SetValue(filterNameValues.Person);
                    }
                }
                else if (that._IsCostCenter == true) {
                    if ("CostCenter" in filterNameValues) {
                        that._CostCenterLookupControl.SetValue(filterNameValues.CostCenter);
                    }
                }
                else if (that._IsProject == true) {
                    if ("Project" in filterNameValues) {
                        that._ProjectLookupControl.SetValue(filterNameValues.Project);
                    }
                }
                else if (that._IsForeignCurrency == true) {
                    if ("ForeignCurrency" in filterNameValues) {
                        that._ForeignCurrencyLookupControl.SetValue(filterNameValues.ForeignCurrency);
                    }
                }
                else if (that._IsFinancialAccountCode == true) {
                    if ("FinancialAccountCode" in filterNameValues) {
                        that._FinancialAccountCodeTextBox.SetValue(filterNameValues.FinancialAccountCode);
                    }
                }
                else if (that._IsDocKind == true) {
                    if ("DocKind" in filterNameValues) {
                        that._DocKindComboBox.SetValue(filterNameValues.DocKind);
                    }
                }
            }
            finally {
                that._IsInSettingFilter = false;
            }

            that._OnFilterChanged();
        },

        _OnFilterChanged: function () {
            var that = this;

            if (that._IsInSettingFilter)
                return;

            that._IsInSettingFilter = true;

            try {
                if (that._events != null)
                    that.trigger("FilterChanged", { Sender: that });
            }
            finally {
                that._IsInSettingFilter = false;
            }
        },

        GetFilterExpression: function () {
            var that = this;

            var filterExpression = "";
             
            var docNo = null, issueDate = null, debtorAmount = null, creditorAmount = null, kolCode = null, moinCode = null, tafsiliCode = null,
                kolName = null, moinName = null, tafsiliName = null, accDocItemDes = null, financialGroup = null, creatorUserID = null,
                person = null, costCenter = null, project = null, foreignCurrency = null, financialAccountCode = null, docKind = null;
              
            if (that._IsDocNo)
                docNo = that._DocNoTextBox.GetValue();
            if (that._IsIssueDate)
                issueDate = that._IssueDateControl.GetValue();
            if (that._IsDebtorAmount)
                debtorAmount = that._DebtorAmountTextBox.GetValue();
            if (that._IsCreditorAmount)
                creditorAmount = that._CreditorAmountTextBox.GetValue();
            if (that._IsKolCode)
                kolCode = that._KolCodeTextBox.GetValue();
            if (that._IsMoinCode)
                moinCode = that._MoinCodeTextBox.GetValue();
            if (that._IsTafsiliCode)
                tafsiliCode = that._TafsiliCodeTextBox.GetValue();
            if (that._IsKolName)
                kolName = that._KolNameTextBox.GetValue();
            if (that._IsMoinName)
                moinName = that._MoinNameTextBox.GetValue();
            if (that._IsTafsiliName)
                tafsiliName = that._TafsiliNameTextBox.GetValue();
            if (that._IsAccDocItemDes)
                accDocItemDes = that._AccDocItemDesTextBox.GetValue();
            if (that._IsFinancialGroup)
                financialGroup = that._FinancialGroupComboBox.GetValue();
            if (that._IsCreatorUser)
                creatorUserID = that._SystemUserComboBox.GetValue();
            if (that._IsPerson)
                person = that._PersonLookupControl.GetValue();
            if (that._IsCostCenter)
                costCenter = that._CostCenterLookupControl.GetValue();
            if (that._IsProject)
                project = that._ProjectLookupControl.GetValue();
            if (that._IsForeignCurrency)
                foreignCurrency = that._ForeignCurrencyLookupControl.GetValue();
            if (that._IsFinancialAccountCode)
                financialAccountCode = that._FinancialAccountCodeTextBox.GetValue();
            if (that._IsDocKind)
                docKind = that._DocKindComboBox.GetValue();

            if (!ValueIsEmpty(docNo)) {
                filterExpression += String.Format(" and DocNo = {0}", docNo);
            }
            if (!ValueIsEmpty(issueDate)) {
                filterExpression += String.Format(" and IssueDate = '{0}'", issueDate);
            }
            if (!ValueIsEmpty(debtorAmount)) {
                filterExpression += String.Format(" and DebtorAmount = {0}", debtorAmount);
            }
            if (!ValueIsEmpty(creditorAmount)) {
                filterExpression += String.Format(" and CreditorAmount = {0}", creditorAmount);
            }
            if (!ValueIsEmpty(kolCode)) {
                filterExpression += String.Format(" and KolCode like N'%{0}%'", kolCode);
            }
            if (!ValueIsEmpty(moinCode)) {
                filterExpression += String.Format(" and MoinCode like N'%{0}%'", moinCode);
            }
            if (!ValueIsEmpty(tafsiliCode)) {
                filterExpression += String.Format(" and TafsiliCode like N'%{0}%'", tafsiliCode);
            }
            if (!ValueIsEmpty(kolName)) {
                filterExpression += String.Format(" and KolName like N'%{0}%'", kolName);
            }
            if (!ValueIsEmpty(moinName)) {
                filterExpression += String.Format(" and MoinName like N'%{0}%'", moinName);
            }
            if (!ValueIsEmpty(tafsiliName)) {
                filterExpression += String.Format(" and TafsiliName like N'%{0}%'", tafsiliName);
            }
            if (!ValueIsEmpty(accDocItemDes)) {
                filterExpression += String.Format(" and AccDocItemDes like N'%{0}%'", accDocItemDes);
            }
            if (!ValueIsEmpty(financialGroup) && financialGroup != "All") {
                filterExpression += String.Format(" and FinancialGroup = '{0}'", financialGroup);
            }
            if (!ValueIsEmpty(creatorUserID) && creatorUserID != "All") {
                filterExpression += String.Format(" and CreatorUser = '{0}'", creatorUserID);
            }
            if (!ValueIsEmpty(person)) {
                filterExpression += String.Format(" and Person = '{0}'", person);
            }
            if (!ValueIsEmpty(costCenter)) {
                filterExpression += String.Format(" and CostCenter = '{0}'", costCenter);
            }
            if (!ValueIsEmpty(project)) {
                filterExpression += String.Format(" and Project = '{0}'", project);
            }
            if (!ValueIsEmpty(foreignCurrency)) {
                filterExpression += String.Format(" and ForeignCurrency = '{0}'", foreignCurrency);
            }
            if (!ValueIsEmpty(financialAccountCode)) {
                filterExpression += String.Format(" and FinancialAccountCode = '{0}'", financialAccountCode);
            }
            if (!ValueIsEmpty(docKind) && docKind != "All") {
                filterExpression += String.Format(" and DocKind = '{0}'", docKind);
            }

            return filterExpression;
        },

        _CreateDateTimeControl: function (panIndex, controlName, mode) {
            var that = this;

            that._IssueDateControl = new afw.DateTimeControl({
                ParentControl: that._ItemDockPanel.Panes[panIndex],
                Name: controlName,
                FillParent: true,
                Visible: true,
                LabelVisible: false,
                Mode: mode
            });
        },

        _CreateTextBox: function (panIndex, controlName) {
            var that = this;

            var textBox = new afw.TextBox({
                ParentControl: that._ItemDockPanel.Panes[panIndex],
                Name: controlName,
                FillParent: true,
                Visible: true,
                LabelVisible: false,
                Multiline: false
            });
        },

        _CreateNumericTextBox: function (panIndex, controlName) {
            var that = this;

            var textBox = new afw.NumericTextBox({
                ParentControl: that._ItemDockPanel.Panes[panIndex],
                Name: controlName,
                FillParent: true,
                Visible: true,
                LabelVisible: false,
                Multiline: false
            });
        },

        _CreateComboBox: function (panIndex, controlName, dataTextField, dataValueField) {
            var that = this;

            var comboBox = new afw.ComboBox({
                ParentControl: that._ItemDockPanel.Panes[panIndex],
                Name: controlName,
                FillParent: true,
                Visible: true,
                LabelVisible: false,
                DataTextField: dataTextField,
                DataValueField: dataValueField
            });
        },

        _CreateLookupControl: function (panIndex, controlName, dataListFullName, entityCaptionFieldName) {
            var that = this;

            var lookupControl = new afw.SingleEntityLookupControl({
                ParentControl: that._ItemDockPanel.Panes[panIndex],
                Name: controlName,
                FillParent: true,
                Visible: true,
                LabelVisible: false,
                ControlType: "Advanced",
                DataListFullName: dataListFullName,
                EntityCaptionFieldName: entityCaptionFieldName,
                BaseFilterExpression: "",
                HasEntityViewButton: false,
                HasEntityBrowseButton: false
            });
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        }
         
    });

    //Static Members:

    FormClass.TypeName = "acc.AccDocItemFilteringControl";
    FormClass.BaseType = afw.BasePanel;


    acc.AccDocItemFilteringControl = FormClass;
})();
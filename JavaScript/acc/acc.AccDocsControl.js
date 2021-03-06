(function () {
    var typeName = "acc.AccDocsControl";
    var baseType = afw.DataListControl;
    var events = afw.DataListControl.Events.concat([]);

    var AccDocsControl = baseType.extend({
        events: events,

        GetType: function () {
            return acc.AccDocsControl;
        },

        init: function (options) {
            var that = this;

            if (ValueIsEmpty(options.BaseFilterExpression))
                options.BaseFilterExpression = "";

            options.LoadDataOnInit = false;
            that._FinancialYearID = cmn.GetUserActiveFinancialYearID();
            cmn.InitFinancialOpList(options, that._FinancialYearID);
            that._Mode = options.Mode;

            if (ValueIsEmpty(that._Mode))
                that._Mode = "DocsList";

            if (!ValueIsIn(that._Mode, ["DocsList", "GhateiNemodaneAsnadeAsli", "GhateiNemodaneAsnadePishnevis",
                    "MovaghatNemodaneAsnadeAsli", "MovaghatNemodaneAsnadePishnevis", "DocsChecking", "AccDocsTransfer"]))
                throw "Invalid Mode!";

            if (ValueIsIn(that._Mode, ["GhateiNemodaneAsnadeAsli", "GhateiNemodaneAsnadePishnevis"])) {
                if (!ValueIsEmpty(options.BaseFilterExpression))
                    options.BaseFilterExpression += " and ";

                options.BaseFilterExpression += String.Format("(DocStatus <> '{0}' and FinancialDocType = '{1}')",
                    afw.OptionSetHelper.GetOptionSetItemID("acc.DocStatus.Final"),
                    that._Mode == "GhateiNemodaneAsnadeAsli" ?
                        afw.OptionSetHelper.GetOptionSetItemID("cmn.FinancialDocType.Main") :
                        afw.OptionSetHelper.GetOptionSetItemID("cmn.FinancialDocType.Draft"));

                options.DefaultSortExpression = "IssueDate, DocNo";
                options.Sortable = false;
            }

            if (ValueIsIn(that._Mode, ["MovaghatNemodaneAsnadeAsli", "MovaghatNemodaneAsnadePishnevis"])) {
                if (!ValueIsEmpty(options.BaseFilterExpression))
                    options.BaseFilterExpression += " and ";

                options.BaseFilterExpression += String.Format("(DocStatus = '{0}' and FinancialDocType = '{1}')",
                    afw.OptionSetHelper.GetOptionSetItemID("acc.DocStatus.Final"),
                    that._Mode == "MovaghatNemodaneAsnadeAsli" ?
                        afw.OptionSetHelper.GetOptionSetItemID("cmn.FinancialDocType.Main") :
                        afw.OptionSetHelper.GetOptionSetItemID("cmn.FinancialDocType.Draft"));

                options.DefaultSortExpression = "IssueDate, DocNo";
                options.Sortable = false;
            }

            if (ValueIsIn(that._Mode, ["AccDocsTransfer"])) {
                if (!ValueIsEmpty(options.BaseFilterExpression))
                    options.BaseFilterExpression += " and ";

                options.BaseFilterExpression += String.Format("(DocStatus = '{0}' and FinancialDocType = '{1}')",
                    afw.OptionSetHelper.GetOptionSetItemID("acc.DocStatus.Final"),
                    afw.OptionSetHelper.GetOptionSetItemID("cmn.FinancialDocType.Main"));

                options.DefaultSortExpression = "IssueDate, DocNo";
                options.Sortable = false;

                options.VisibleColumns = ["IssueDate_Persian", "DocNo", "FinalNumber", "Description", "BalanceAmount", "DocKind_Text",
                    "DocStatus_Text", "FinancialDocType_Text", "IsActive_Text", "IsAutoGenerated", "DisplayName",
                    "IsAtachedFile", "CreationTime_Persian", "IsTransferred_Text", "TransferDatabase_Title"];
            }

            options.DataListFullName = "acc.AccDocs";
            afw.DataListControl.fn.init.call(that, options);

            if (that.GetContainerWindow() != null)
                that._EntityFormContainerType = "Window";
            else
                that._EntityFormContainerType = "MdiContainer";

            that._QuickSearchDockPanel = that.FindControl(that.GetName() + "_QuickSearchDockPanel");

            var createFilterControlInQuickSearchDockPanel =
                that._Mode != "DocsList" && that._Mode != "DocsChecking" && that._Mode != "AccDocsTransfer";

            var displayLastDocReferenceNo = that._Mode == "DocsList";

            if (createFilterControlInQuickSearchDockPanel) {
                that._VDockPanel.SetPaneSizeSetting(2, 50);

                that._QuickSearchDockPanel.SetPaneSizeSetting(0, 300);
                that._QuickSearchDockPanel.AppendPane();
                that._QuickSearchDockPanel.SetPaneSizeSetting(1, "fill");

                if (displayLastDocReferenceNo) {
                    that._QuickSearchDockPanel.AppendPane();
                    that._QuickSearchDockPanel.SetPaneSizeSetting(2, 250);
                }
            }
            else {
                that._VDockPanel.InsertPane(2, { Size: 90 }, true);

                if (displayLastDocReferenceNo) {
                    that._QuickSearchDockPanel.AppendPane();
                    that._QuickSearchDockPanel.SetPaneSizeSetting(1, 250);
                }
            }

            if (that._Mode == "DocsList" || that._Mode == "DocsChecking") {
                var activeFinancialYearStartDate = null;
                var activeFinancialYearEndDate = null;
                var activeFinancialYearEntity = cmn.GetUserActiveFinancialYearEntity();

                if (activeFinancialYearEntity != null) {
                    activeFinancialYearStartDate = activeFinancialYearEntity.GetFieldValue("StartDate");
                    activeFinancialYearEndDate = activeFinancialYearEntity.GetFieldValue("EndDate");
                }

                that._CreateAdvancedFilterControl(
                     [
                        {
                            FieldName: "IssueDate",
                            Title: "از تاریخ صدور",
                            ControlType: "Date",
                            CompareOperator: ">=",
                            DefaultValue: activeFinancialYearStartDate,
                            IsFixed: true
                        },
                        {
                            FieldName: "IssueDate",
                            Title: "تا تاریخ صدور",
                            ControlType: "Date",
                            CompareOperator: "<=",
                            DefaultValue: activeFinancialYearEndDate,
                            IsFixed: true
                        },
                        {
                            FieldName: "DocNo",
                            Title: "شماره مرجع",
                            ControlType: "Numeric"
                        },
                        {
                            FieldName: "FinalNumber",
                            Title: "شماره قطعی",
                            ControlType: "Numeric"
                        },
                        {
                            FieldName: "BalanceAmount",
                            Title: "مبلغ بالانس",
                            ControlType: "Numeric",
                            CompareOperator: "like"
                        },
                        {
                            FieldName: "FinancialDocType",
                            Title: "نوع سند مالی",
                            ControlType: "OptionSet",
                            OptionSetFullName: "cmn.FinancialDocType",
                            OptionSetValueDataMember: "Name"
                        },
                        {
                            FieldName: "DocStatus",
                            Title: "وضعیت سند",
                            ControlType: "OptionSet",
                            OptionSetFullName: "acc.DocStatus",
                            OptionSetValueDataMember: "Name"
                        },
                        {
                            FieldName: "BalanceStatus",
                            Title: "وضعیت بالانس",
                            ControlType: "OptionSet",
                            OptionSetFullName: "acc.BalanceStatus",
                            OptionSetValueDataMember: "Name"
                        },
                        {
                            FieldName: "DocKind",
                            Title: "نوع سند",
                            ControlType: "Lookup",
                            LookupDataListFullName: "acc.DocKinds",
                            LookupEntityCaptionFieldName: "Title",
                            LookupControlType: "Simple"
                        },
                        {
                            FieldName: "OrganizationUnit",
                            Title: "واحد سازمانی",
                            ControlType: "Lookup",
                            LookupDataListFullName: "cmn.OrganizationInformationList",
                            LookupEntityCaptionFieldName: "Name",
                            LookupControlType: "Simple"
                        },
                        {
                            FieldName: "CreatorUser",
                            Title: "نام کاربر",
                            ControlType: "Lookup",
                            LookupDataListFullName: "afw.SystemUsers",
                            LookupEntityCaptionFieldName: "DisplayName",
                            LookupControlType: "Advanced"
                        },
                        {
                            FieldName: "IssueDate",
                            Title: "تاریخ صدور",
                            ControlType: "Date"
                        },
                        {
                            FieldName: "Description",
                            Title: "توضیحات",
                            ControlType: "TextBox",
                            CompareOperator: "like"
                        },
                        {
                            FieldName: "IsActive",
                            Title: "وضعیت فعال",
                            ControlType: "ComboBox",
                            ComboBoxItems: [
                                { ID: "", Title: " " },
                                { ID: "1", Title: "بلی" },
                                { ID: "0", Title: "خیر" }],
                            ComboBoxDataTextField: "Title",
                            ComboBoxDataValueField: "ID",
                        },
                        {
                            FieldName: "IsAutoGenerated",
                            Title: "تولید اتوماتیک",
                            ControlType: "ComboBox",
                            ComboBoxItems: [
                                { ID: "", Title: " " },
                                { ID: "اتوماتیک", Title: "اتوماتیک" },
                                { ID: " ", Title: "غیر اتوماتیک" }],
                            ComboBoxDataTextField: "Title",
                            ComboBoxDataValueField: "ID",
                        },
                        {
                            FieldName: "CreationTime",
                            Title: "از تاریخ ایجاد",
                            ControlType: "Date",
                            CompareOperator: ">="
                        },
                        {
                            FieldName: "CreationTime",
                            Title: "تا تاریخ ایجاد",
                            ControlType: "Date",
                            CompareOperator: "<="
                        }]);

                if (that._Mode == "DocsList")
                    that._DocNoLastTextBox = new afw.Label({
                        ParentControl: that._QuickSearchDockPanel.Panes[1],
                        Name: "DocNoLastTextBox",
                        Text: "شماره مرجع آخرین سند: ",
                        Visible: true
                    });
            }
            else if (ValueIsIn(that._Mode, ["MovaghatNemodaneAsnadeAsli", "MovaghatNemodaneAsnadePishnevis"])) {
                that._HideQuickSearchTextBox();

                that._FilterControl = afw.uiApi.CreateSavedFormByName(
                    that._QuickSearchDockPanel.Panes[1],
                    "acc.GhateiYaMovaghatNemodaneAsnadFormFilterControl",
                    {
                        Name: "FilteringControl",
                        FromDateFieldName: "IssueDate",
                        FromDocNoFieldName: "DocNo"
                    });

                that._FilterControl.bind("FilterChanged", function (e) { that._FilterControl_FilterChanged(e); });
            }
            else if (ValueIsIn(that._Mode, ["GhateiNemodaneAsnadeAsli", "GhateiNemodaneAsnadePishnevis"])) {
                that._HideQuickSearchTextBox();

                that._FilterControl = afw.uiApi.CreateSavedFormByName(
                    that._QuickSearchDockPanel.Panes[1],
                    "acc.GhateiYaMovaghatNemodaneAsnadFormFilterControl",
                    {
                        Name: "FilteringControl",
                        ToDateFieldName: "IssueDate",
                        ToDocNoFieldName: "DocNo"
                    });

                that._FilterControl.bind("FilterChanged", function (e) { that._FilterControl_FilterChanged(e); });
            }

            if (ValueIsIn(that._Mode, ["AccDocsTransfer"])) {
                that._VDockPanel.SetPaneSizeSetting(2, 50);

                that._FilterControl = afw.uiApi.CreateSavedFormByName(
                    that._VDockPanel.Panes[2],
                    "acc.GhateiYaMovaghatNemodaneAsnadFormFilterControl",
                    {
                        Name: "FilteringControl",
                        ToDateFieldName: "IssueDate",
                        ToDocNoFieldName: "DocNo",
                        IsTransferredFieldName: "IsTransferred",
                        TransferDatabaseFielName: "TransferDatabase"
                    });

                that._FilterControl.bind("FilterChanged", function (e) { that._FilterControl_FilterChanged(e); });
            }

            that._EntitiesGridView = that.GetEntitiesGridView();
            that._EntitiesGridView.bind("SelectedRowsChanged", function (e) { that._EntitiesGridView_SelectedRowsChanged(e); });

            that._QuickSearchTextBox.bind("TextChanged", function (e) { that._QuickSearchTextBox_TextChanged(e); })

            that.LoadData();
        },

        _CreateToolbar: function () {
            var that = this;

            afw.DataListControl.fn._CreateToolbar.call(that);

            that._Toolbar = that.FindControl(that.GetName() + "_Toolbar");

            if (that._Mode == "DocsList") {
                that._Toolbar.AddButton("Print", "چاپ سند", { Image: "resource(cmn.PrintToolbarIcon)" });
                that._Toolbar.AddButton("AtachedFiles", "فایل های پیوست", { Image: "resource(cmn.FileAttachmentIcon1)" });
                that._Toolbar.AddButton("CopyAccDoc", "کپی سند", { Image: "resource(cmn.Copy)" });
            }
            else if (that._Mode == "GhateiNemodaneAsnadeAsli" || that._Mode == "GhateiNemodaneAsnadePishnevis") {
                that._Toolbar.AddButton("GhateiNemodaneAsnad", "قطعی نمودن تا سند انتخاب شده", { BackgroundColor: "#43C35E", TextColor: "#FFFFFF" });
                that._Toolbar.SetButtonEnabled("GhateiNemodaneAsnad", false);
                that._Toolbar.RemoveButton("New");
                that._Toolbar.RemoveButton("Edit");
                that._Toolbar.RemoveButton("Delete");
            }
            else if (that._Mode == "MovaghatNemodaneAsnadeAsli" || that._Mode == "MovaghatNemodaneAsnadePishnevis") {
                that._Toolbar.AddButton("MovaghatNemodaneAsnad", "موقت نمودن از سند انتخاب شده", { BackgroundColor: "#43C35E", TextColor: "#FFFFFF" });
                that._Toolbar.SetButtonEnabled("MovaghatNemodaneAsnad", false);
                that._Toolbar.RemoveButton("New");
                that._Toolbar.RemoveButton("Edit");
                that._Toolbar.RemoveButton("Delete");
            }
            else if (that._Mode == "DocsChecking") {
                that._Toolbar.RemoveButton("New");
                that._Toolbar.RemoveButton("Delete");
                that.Toolbar.RemoveButton("ExportToExcel");
            }
            else if (that._Mode == "AccDocsTransfer") {
                that._Toolbar.AddButton("ExportBasicInformation", "انتقال اطلاعات پایه", { BackgroundColor: "#43C35E", TextColor: "#FFFFFF" });
                that._Toolbar.AddButton("AccDocsTransfer", "انتقال تا سند انتخاب شده", { BackgroundColor: "#43C35E", TextColor: "#FFFFFF" });
                that._Toolbar.SetButtonEnabled("AccDocsTransfer", true);
                that._Toolbar.RemoveButton("New");
                that._Toolbar.RemoveButton("Edit");
                that._Toolbar.RemoveButton("Delete");
            }
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            try {
                if (buttonKey == "New") {
                    if (that._FinancialYearID != null)
                        afw.DataListControl.fn._OnToolbarButtonClicked.call(that, buttonKey);
                    else
                        afw.ErrorDialog.Show("سال مالی تعریف نشده است.");
                }
                else if (buttonKey == "Print") {
                    that._OpenPrintPopup();
                }
                else if (buttonKey == "AtachedFiles") {
                    var selectedEntities = that._EntitiesGridView.GetSelectedRows();
                    if (selectedEntities.length <= 0)
                        return;

                    var selectedItemID = selectedEntities[0].DataItem.ID;

                    var accDocAtachedFilesWindow = new afw.Window({
                        Name: "AtachedFilesWindow",
                        Title: "فایل های پیوست",
                        Modal: true,
                        Width: 800,
                        Height: 700
                    });

                    var accDocAtachedFilesControl = afw.uiApi.CreateDataListControl("acc.AccDocAtachedFiles",
                            {
                                ParentControl: accDocAtachedFilesWindow,
                                BaseFilterExpression: String.Format("AccDoc = '{0}'", selectedItemID),
                                FillParent: true,
                                AccDocID: selectedItemID
                            });
                    accDocAtachedFilesWindow.Center();
                    accDocAtachedFilesWindow.Open();
                }
                else if (buttonKey == "GhateiNemodaneAsnad") {
                    var selectedEntities = that._EntitiesGridView.GetSelectedRows();
                    if (selectedEntities.length != 0) {
                        var docNo = selectedEntities[0].DataItem["DocNo"].toString();
                        var financialYearID = selectedEntities[0].DataItem["FinancialYear"];
                        var financialDocTypeID = selectedEntities[0].DataItem["FinancialDocType"];
                        var toIssueDate = selectedEntities[0].DataItem["IssueDate"].substring(0, 10);

                        afw.uiApi.ShowProgress(that);
                        afw.uiApi.CallServerMethodAsync("acc.FinalizeDocs", [financialYearID, financialDocTypeID, toIssueDate, docNo],
                            function (result) {
                                if (that._IsDestroying)
                                    return;

                                afw.uiApi.HideProgress(that);
                                if (result.HasError)
                                    afw.ErrorDialog.Show(result.ErrorMessage);
                                else {
                                    afw.MessageDialog.Show("قطعی نمودن اسناد با موفقیت انجام شد.");
                                    that.LoadData();
                                }
                            });
                    }
                }
                else if (buttonKey == "MovaghatNemodaneAsnad") {
                    var selectedEntities = that._EntitiesGridView.GetSelectedRows();
                    if (selectedEntities.length != 0) {
                        var docNo = selectedEntities[0].DataItem["DocNo"].toString();
                        var financialYearID = selectedEntities[0].DataItem["FinancialYear"];
                        var financialDocTypeID = selectedEntities[0].DataItem["FinancialDocType"];
                        var toIssueDate = selectedEntities[0].DataItem["IssueDate"].substring(0, 10);

                        afw.uiApi.ShowProgress(that);
                        afw.uiApi.CallServerMethodAsync("acc.MakeDocsTemporary", [financialYearID, financialDocTypeID, toIssueDate, docNo],
                            function (result) {
                                if (that._IsDestroying)
                                    return;

                                afw.uiApi.HideProgress(that);
                                if (result.HasError)
                                    afw.ErrorDialog.Show(result.ErrorMessage);
                                else {
                                    afw.MessageDialog.Show("موقت نمودن اسناد با موفقیت انجام شد.");
                                    that.LoadData();
                                }
                            });
                    }
                }
                else if (buttonKey == "AccDocsTransfer") {
                    var selectedEntities = that._EntitiesGridView.GetSelectedRows();
                    if (selectedEntities.length == 0) {
                        afw.ErrorDialog.Show("آخرین سند را برای انتقال انتخاب کنید.");
                        return;
                    }

                    var transferDatabaseComboBox = that._FilterControl.FindControl("TransferDatabaseComboBox");
                    if (!ValueIsEmpty(transferDatabaseComboBox) && transferDatabaseComboBox.GetValue() == null) {
                        afw.ErrorDialog.Show("بانک اطلاعاتی مقصد را انتخاب کنید.");
                        return;
                    }

                    var docNo = selectedEntities[0].DataItem["DocNo"].toString();
                    var financialYearID = selectedEntities[0].DataItem["FinancialYear"];
                    var financialDocTypeID = selectedEntities[0].DataItem["FinancialDocType"];
                    var toIssueDate = selectedEntities[0].DataItem["IssueDate"].substring(0, 10);
                    var transferDatabaseID = transferDatabaseComboBox.GetValue();

                    afw.uiApi.ShowProgress(that);
                    afw.uiApi.CallServerMethodAsync("acc.TransferAccDocs", [financialYearID, financialDocTypeID, toIssueDate, docNo, transferDatabaseID],
                        function (result) {
                            if (that._IsDestroying)
                                return;

                            afw.uiApi.HideProgress(that);
                            if (result.HasError)
                                afw.ErrorDialog.Show(result.ErrorMessage);
                            else {
                                afw.MessageDialog.Show("انتقال اسناد با موفقیت انجام شد.");
                                that.LoadData();
                            }
                        });
                }
                else if (buttonKey == "ExportBasicInformation") {
                    afw.uiApi.ShowProgress(that);
                    afw.uiApi.CallServerMethodAsync("cmn.ExportBasicInformation", [],
                        function (result) {
                            if (that._IsDestroying)
                                return;

                            afw.uiApi.HideProgress(that);
                            if (result.HasError)
                                afw.ErrorDialog.Show(result.ErrorMessage);
                            else {
                                afw.MessageDialog.Show("انتقال اطلاعات پایه با موفقیت انجام شد.");
                                that.LoadData();
                            }
                        });
                }
                else if (buttonKey == "CopyAccDoc") {
                    that._CopyAccDoc();
                }
                else
                    afw.DataListControl.fn._OnToolbarButtonClicked.call(that, buttonKey);
            }
            catch (ex) {
                afw.ErrorDialog.Show(ex);
            }
        },

        _OpenPrintPopup: function (e) {
            var that = this;

            that._PrintPopup = new afw.Popup({ Name: "WarningsPopup", Width: 470, Height: 115 });
            var popupContentForm = afw.uiApi.CreateSavedFormByName(that._PrintPopup, "acc.AccDocPrintFormatForm", { FillParent: true });

            that._AccDocPrintTypeOptionSetControl = popupContentForm.FindControl("AccDocPrintTypeOptionSetControl");
            that._AccDocPrintTypeOptionSetControl.bind("ValueChanged", function (e) { that._AccDocPrintTypeOptionSetControl_ValueChanged(e); });

            that._PrintPopup.SetAnchor(that._Toolbar, "bottom right", "top right");

            that._PrintPopup.Open();
        },

        _AccDocPrintTypeOptionSetControl_ValueChanged: function (e) {
            var that = this;

            that._PrintPopup.Close();
            that._PrintPopup = null;

            var selectedEntities = that._EntitiesGridView.GetSelectedRows();
            if (selectedEntities.length == 0) {
                afw.ErrorDialog.Show("ابتدا یک ردیف را انتخاب نمایید.");
                return;
            }

            var accDocPrinTypeName = afw.OptionSetHelper.GetOptionSetItemName(that._AccDocPrintTypeOptionSetControl.GetValue());

            var docNo = selectedEntities[0].DataItem["DocNo"];
            docNo = docNo.toString();

            var financialDocType = selectedEntities[0].DataItem["FinancialDocType"];
            var balanceAmount = selectedEntities[0].DataItem["BalanceAmount"];
            var balanceAmountWords = afw.NumberHelper.NumberToPersianWords(balanceAmount) + " ريال";

            var organizationUnitID = selectedEntities[0].DataItem["OrganizationUnit"];

            var parametrNames = ["FromDocReferenceNo", "ToDocReferenceNo", "BalanceAmountWords", "OrganizationUnitID", "FinancialYear", "FinancialDocType"];
            var parametrValues = [docNo, docNo, balanceAmountWords, organizationUnitID, that._FinancialYearID, financialDocType];

            if (accDocPrinTypeName == "OfficialWithFloat") {
                afw.uiApi.ShowProgress(that);
                afw.ReportHelper.RunReport("acc.AccDocOfficialWithFloatReport", parametrNames, parametrValues, null,
                function (result) {
                    afw.uiApi.HideProgress(that);
                    if (result.HasError)
                        afw.ErrorDialog.Show(result.ErrorMessage);
                });
            }
            else if (accDocPrinTypeName == "OffcialWithDetailAndFloat") {
                afw.uiApi.ShowProgress(that);
                afw.ReportHelper.RunReport("acc.AccDocOfficialWithDetailAndFloatReport", parametrNames, parametrValues, null,
                    function (result) {
                        afw.uiApi.HideProgress(that);
                        if (result.HasError)
                            afw.ErrorDialog.Show(result.ErrorMessage);
                    });
            }
            else if (accDocPrinTypeName == "AccDocPrintWithOutFloat") {
                afw.uiApi.ShowProgress(that);
                afw.ReportHelper.RunReport("acc.AccDocPrintWithOutFloatReport", parametrNames, parametrValues, null,
                    function (result) {
                        afw.uiApi.HideProgress(that);
                        if (result.HasError)
                            afw.ErrorDialog.Show(result.ErrorMessage);
                    });
            }
        },

        _FilterControl_FilterChanged: function (e) {
            var that = this;

            if (that._FilterControl != null) {
                if (that._Toolbar.ButtonExists("AccDocsTransfer")) {
                    var transferStatusComboBox = that._FilterControl.FindControl("TransferStatusComboBox");
                    if (transferStatusComboBox != null && transferStatusComboBox.GetValue() == "NotTransferredDocs")
                        that._Toolbar.SetButtonEnabled("AccDocsTransfer", true);
                    else
                        that._Toolbar.SetButtonEnabled("AccDocsTransfer", false);

                    var transferDatabaseComboBox = that._FilterControl.FindControl("TransferDatabaseComboBox");
                    if (ValueIsEmpty(transferDatabaseComboBox)) {
                        var transferDatabasesEntityList = afw.uiApi.FetchEntityList("cmn.TransferDatabase").ToDataSourceData();
                        if (transferDatabasesEntityList.length != 0)
                            transferDatabaseComboBox.SetValue(transferDatabasesEntityList[0].ID);
                    }
                }
            }

            that.LoadData();
        },

        _GetTotalFilterExpression: function () {
            var that = this;

            var filterExpression = afw.DataListControl.fn._GetTotalFilterExpression.call(that);

            var filterControl_FilterExpression = that._FilterControl.GetFilterExpression();

            if (!ValueIsEmpty(that._FilterControl) && !ValueIsEmpty(filterControl_FilterExpression)) {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";

                filterExpression += filterControl_FilterExpression;
            }

            return filterExpression;
        },

        _LoadData: function () {
            var that = this;

            afw.DataListControl.fn._LoadData.call(that);

            var lastDocNo = afw.uiApi.CallServerMethodSync("cmn.GetFieldMaxIntValue",
                    ["DocNo", "acc_AccDocs", String.Format("FinancialYear = '{0}'", that._FinancialYearID)]);

            if (that._Mode == "DocsList")
                that._DocNoLastTextBox.SetText("شماره مرجع آخرین سند: " + lastDocNo);
        },

        _OnLoadingData: function () {
            var that = this;

            afw.DataListControl.fn._OnLoadingData.call(that);
        },

        _ShowEntityWindow: function (entity, formMode) {
            var that = this;

            return afw.DataListControl.fn._ShowEntityWindow.call(that, entity, formMode);
        },

        _OnEntityWindowOpened: function (entityWindow) {
            var that = this;

            afw.DataListControl.fn._OnEntityWindowOpened.call(that, entityWindow);
        },

        _EntitiesGridView_RowDoubleClick: function (e) {
            var that = this;

            afw.DataListControl.fn._EntitiesGridView_RowDoubleClick.call(that, e);
        },

        _EntitiesGridView_RowKeyPressed: function (e) {
            var that = this;

            if (e.Key == "Enter")
                afw.DataListControl.fn._EntitiesGridView_RowDoubleClick.call(that, e)
            else
                afw.DataListControl.fn._EntitiesGridView_RowKeyPressed.call(that, e);
        },

        _EntitiesGridView_SelectedRowsChanged: function (e) {
            var that = this;

            if (ValueIsIn(that._Mode, ["GhateiNemodaneAsnadeAsli", "GhateiNemodaneAsnadePishnevis"])) {
                var selectedEntities = that._EntitiesGridView.GetSelectedRows();
                if (selectedEntities.length != 0)
                    that._Toolbar.SetButtonEnabled("GhateiNemodaneAsnad", true);
                else
                    that._Toolbar.SetButtonEnabled("GhateiNemodaneAsnad", false);
            }

            if (ValueIsIn(that._Mode, ["MovaghatNemodaneAsnadeAsli", "MovaghatNemodaneAsnadePishnevis"])) {
                var selectedEntities = that._EntitiesGridView.GetSelectedRows();
                if (selectedEntities.length != 0)
                    that._Toolbar.SetButtonEnabled("MovaghatNemodaneAsnad", true);
                else
                    that._Toolbar.SetButtonEnabled("MovaghatNemodaneAsnad", false);
            }
        },

        _CopyAccDoc: function () {
            var that = this;

            var selectedEntities = that._EntitiesGridView.GetSelectedRows();
            if (selectedEntities.length == 0) {
                afw.ErrorDialog.Show("یکی از اسناد را برای کپی انتخاب نمایید.");
                return;
            }

            var docStatus_NotCheckedID = afw.OptionSetHelper.GetOptionSetItemID("acc.DocStatus.NotChecked");
            var composeDocKind = afw.uiApi.FetchEntity("acc.DocKind", "Name = 'ComposeDoc'");

            if (selectedEntities[0].DataItem["DocStatus"] == docStatus_NotCheckedID) {
                afw.ErrorDialog.Show("امکان کپی از سند با وضعیت 'تنظیم نشده' وجود ندارد.");
                return;
            }

            if (selectedEntities[0].DataItem["DocKind"] != composeDocKind.GetFieldValue("ID")) {
                afw.ErrorDialog.Show("امکان کپی فقط از سند مرکب وجود دارد.");
                return;
            }

            var docCopyAdditionalInfoForm = afw.uiApi.OpenSavedFormWindow("acc.DocCopyAdditionalInfoForm", {
                Name: "DocCopyAdditionalInfoForm",
                Modal: true,
                Title: "ایجاد کپی از سند شماره " + selectedEntities[0].DataItem["DocNo"],
                RefAccDocDataItem: selectedEntities[0].DataItem
            });

            docCopyAdditionalInfoForm.Center();
        },

        _HideQuickSearchTextBox: function () {
            var that = this;

            that._QuickSearchDockPanel.SetPaneSizeSetting(0, 1);
            that._QuickSearchTextBox.SetVisible(false);
        },

        _QuickSearchTextBox_TextChanged: function (e) {
            var that = this;

            if (that._Mode == "AccDocsTransfer") {
                if (!ValueIsEmpty(that._QuickSearchTextBox.GetValue())) {
                    that._Toolbar.SetButtonEnabled("AccDocsTransfer", false);
                    that._Toolbar.SetButtonEnabled("ExportBasicInformation", false);
                }
                else {
                    that._Toolbar.SetButtonEnabled("AccDocsTransfer", true);
                    that._Toolbar.SetButtonEnabled("ExportBasicInformation", true);
                }
            }

            afw.DataListControl.fn._QuickSearchTextBox_TextChanged.call(that);
        },

        _CreateAdvancedFilterControl: function (columnsFilterInfo) {
            var that = this;

            that._FilterControl = afw.uiApi.CreateSavedFormByName(
                that._VDockPanel.Panes[2],
                "cmn.DataListAdvancedFilterControl",
                {
                    ColumnsFilterInfo: columnsFilterInfo
                });

            that._FilterControl.bind("FilterChanged", function (e) { that._FilterControl_FilterChanged(e); });
        }
    });

    //Static Members:

    AccDocsControl.TypeName = typeName;
    AccDocsControl.BaseType = baseType;
    AccDocsControl.Events = events;


    acc.AccDocsControl = AccDocsControl;
})();
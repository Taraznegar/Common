(function () {
    var typeName = "ps.SalesProformaInvoicesControl";
    var baseType = afw.DataListControl;
    var events = afw.DataListControl.Events.concat([]);

    var SalesProformaInvoicesControl = baseType.extend({
        events: events,

        GetType: function () {
            return ps.SalesProformaInvoicesControl;
        },

        init: function (options) {
            var that = this;

            options.LoadDataOnInit = false;
            options.DataListFullName = "ps.SalesProformaInvoices";

            that._ActiveFinancialYearID = cmn.GetUserActiveFinancialYearID();
            cmn.InitFinancialOpList(options, that._ActiveFinancialYearID);

            that._Mode = options.Mode;

            if ("OnlyShowLastEditions" in options && options.OnlyShowLastEditions == false)
                that._OnlyShowLastEditions = false;
            else
                that._OnlyShowLastEditions = true;//by default, just show last editions 

            var customerID = null;
            if ("CustomerID" in options)
                customerID = options.CustomerID;

            if ("CustomOptions" in options && options.CustomOptions != null) {
                var customOptions = options.CustomOptions;

                if ("Mode" in customOptions)
                    that._Mode = customOptions.Mode;

                if ("OnlyShowLastEditions" in customOptions)
                    that._OnlyShowLastEditions = customOptions.OnlyShowLastEditions;

                if ("CustomerID" in customOptions)
                    customerID = customOptions.CustomerID;
            }

            if (!ValueIsIn(that._Mode, ["SalesProformaInvoice", "SalesProformaInvoiceLookup",
                "AmaniSalesProformaInvoice", "AmaniSalesProformaInvoiceLookup"]))
                throw "Invalid Mode!";

            that._IsAmaniMode = ValueIsIn(that._Mode, ["AmaniSalesProformaInvoice", "AmaniSalesProformaInvoiceLookup"]);

            var workflowStages = [];
            var workflowStagesIDs = "";
            if (that._IsAmaniMode)
                workflowStages = cmn.GetWorkflowStagesByFormName("AmaniProformaInvoice");
            else
                workflowStages = cmn.GetWorkflowStagesByFormName("SalesProformaInvoice");

            for (var i = 0; i < workflowStages.length; i++)
                workflowStagesIDs += "'" + workflowStages[i].GetFieldValue("ID") + "'";

            if (workflowStagesIDs != "")
                workflowStagesIDs = workflowStagesIDs.Replace("''", "','");

            if (!ValueIsEmpty(options.BaseFilterExpression))
                options.BaseFilterExpression += " and ";
            options.BaseFilterExpression += String.Format("IsAmani = {0}", that._IsAmaniMode ? 1 : 0);

            afw.DataListControl.fn.init.call(that, options);

            if (that._Mode.EndsWith("Lookup")) {
                //Hide datalist toolBar
                that._VDockPanel.Panes[0].SetSizeSetting(1, 0);
            }

            var activeFinancialYearStartDate = null;
            var activeFinancialYearEndDate = null;
            var activeFinancialYearEntity = cmn.GetUserActiveFinancialYearEntity();
            if (activeFinancialYearEntity != null) {
                activeFinancialYearStartDate = activeFinancialYearEntity.GetFieldValue("StartDate");
                activeFinancialYearEndDate = activeFinancialYearEntity.GetFieldValue("EndDate");
            }

            that._EntitiesGridView.bind("SelectedRowsChanged", function (e) { that._EntitiesGridView_SelectedRowsChanged(e); });

            that._VDockPanel.InsertPane(2, { Size: 100 }, true);

            var columnsFilterInfos = [
                {
                    FieldName: "Customer",
                    Title: "مشتری",
                    ControlType: "Lookup",
                    LookupDataListFullName: "cmn.Persons",
                    LookupEntityCaptionFieldName: "FullName",
                    LookupControlType: "Advanced",
                    DefaultValue: customerID,
                    IsFixed: true
                },
                {
                    FieldName: "IssueDate",
                    Title: "از تاریخ صدور",
                    ControlType: "Date",
                    CompareOperator: ">="
                },
                {
                    FieldName: "IssueDate",
                    Title: "تا تاریخ صدور",
                    ControlType: "Date",
                    CompareOperator: "<="
                },
                {
                    FieldName: "FinalAmount",
                    Title: "مبلغ نهایی",
                    ControlType: "Numeric",
                    CompareOperator: "like"
                },
                {
                    FieldName: "CreatedInvoice_Number",
                    Title: "شماره فاکتور",
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
                    FieldName: "CreatorUser",
                    Title: "کاربر ایجاد کننده",
                    ControlType: "Lookup",
                    LookupDataListFullName: "afw.SystemUsers",
                    LookupEntityCaptionFieldName: "DisplayName",
                    LookupControlType: "Advanced"
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
                    FieldName: "InvoiceNumber",
                    Title: "شماره پیش فاکتور",
                    ControlType: "TextBox",
                    CompareOperator: "like"
                },
                {
                    FieldName: "SalesCase",
                    Title: "پرونده فروش",
                    ControlType: "Lookup",
                    LookupDataListFullName: "crm.SalesCases",
                    LookupEntityCaptionFieldName: "Title",
                    LookupControlType: "Advanced"
                },
                {
                    FieldName: "ValidityDate",
                    Title: "از تاریخ اعتبار",
                    ControlType: "Date",
                    CompareOperator: ">=",
                    DefaultValue: activeFinancialYearStartDate
                },
                {
                    FieldName: "ValidityDate",
                    Title: "تا تاریخ اعتبار",
                    ControlType: "Date",
                    CompareOperator: "<=",
                    DefaultValue: activeFinancialYearEndDate
                },
                {
                    FieldName: "ValidityDays",
                    Title: "اعتبار(روز)",
                    ControlType: "Numeric",
                    CompareOperator: "like"
                },
                {
                    FieldName: "PayConditions",
                    Title: "شرایط پرداخت",
                    ControlType: "ComboBox",
                    ComboBoxItems: [
                        { ID: "", Title: " " },
                        { ID: "دارد", Title: "دارد" },
                        { ID: " ", Title: "ندارد" }],
                    ComboBoxDataTextField: "Title",
                    ComboBoxDataValueField: "ID"
                },
                {
                    FieldName: "RequestNumber",
                    Title: "شماره درخواست",
                    ControlType: "Numeric",
                    CompareOperator: "like"
                },
                {
                    FieldName: "HavaleIssuingStatus",
                    Title: "وضعیت صدور حواله",
                    ControlType: "OptionSet",
                    OptionSetFullName: "cmn.HavaleIssuingStatus",
                    OptionSetValueDataMember: "Name"
                },
                {
                    FieldName: "WorkflowStage",
                    Title: "وضعیت پیش فاکتور",
                    ControlType: "Lookup",
                    LookupDataListFullName: "cmn.WorkflowStages",
                    LookupEntityCaptionFieldName: "StageTitle",
                    LookupControlType: "Simple",
                    BaseFilterExpression: workflowStagesIDs == "" ? "" : String.Format("ID in ({0})", workflowStagesIDs)
                }];

            that._FilterControl = afw.uiApi.CreateSavedFormByName(
                that._VDockPanel.Panes[2],
                "cmn.DataListAdvancedFilterControl", {
                    ColumnsFilterInfo: columnsFilterInfos
                });
            that._FilterControl.bind("FilterChanged", function (e) { that._FilterControl_FilterChanged(e); });

            that.LoadData();

            that._PrintPopup = null;
            that._InvoiceConversionPopup = null;

            if (that.GetContainerWindow() != null)
                that._EntityFormContainerType = "Window";
            else
                that._EntityFormContainerType = "MdiContainer";
        },

        _OpenPrintPopup: function (e) {
            var that = this;

            //if (that._PrintPopup == null) {گزینه ای انتخاب نشود دوباره چاپ کلیک کنیم پیغام خطا میدهد
            that._PrintPopup = new afw.Popup({ Name: "WarningsPopup", Width: 470, Height: 115 });
            var popupContentForm = afw.uiApi.CreateSavedFormByName(that._PrintPopup, "ps.InvoicePrintFormatPopupForm",
                { FillParent: true });
            var printFormatLookupControl = popupContentForm.FindControl("PrintFormatLookupControl");
            printFormatLookupControl.bind("ValueChanged", function (e) { that._PrintFormatLookupControl_ValueChanged(e); });
            that._PrintPopup.SetAnchor(that._Toolbar, "bottom right", "top right");
            //}

            that._PrintPopup.Open();
        },

        _CreateToolbar: function () {
            var that = this;

            afw.DataListControl.fn._CreateToolbar.call(that);

            that._Toolbar = that.FindControl(that.GetName() + "_Toolbar");

            //برای ترتیب چیدمان تولبار ابتدا بعضی از دکمه ها را حذف کرده و دوباره اضافه می کنیم

            that._Toolbar.RemoveButton("Edit");
            that._Toolbar.RemoveButton("Delete");
            that._Toolbar.RemoveButton("Reload");

            that._Toolbar.AddButton("CreateNewVersion", "ایجاد نسخه جدید", { Image: "resource(cmn.Add)" });

            if (that._OnlyShowLastEditions) {
                that._Toolbar.AddButton("Delete", "حذف", { Image: "resource(afw.ToolbarRedCross16)" });
                that._Toolbar.AddButton("Reload", "", { Image: "resource(afw.RefreshIcon20)" });
                that._Toolbar.AddButton("ShowAllEditions", "نمایش کلیه ویرایش ها", { Image: "resource(cmn.EditIcon)" });
                that._Toolbar.AddButton("PrintHavale", "چاپ درخواست حواله", { Image: "resource(cmn.PrintToolbarIcon)" });
                that._Toolbar.AddButton("ConvertToInvoice", "تبدیل به فاکتور", { Image: "resource(ps.Invoice)" });
                that._Toolbar.AddButton("ShowCustomer", "مشاهده مشتری", { Image: "resource(cmn.Add)" });
                that._Toolbar.SetButtonEnabled("ShowCustomer", false);
                //that._Toolbar.AddButton("VosolMotalebat", "وصول مطالبات");
            }
            else {
                that._Toolbar.RemoveButton("New");
                that._Toolbar.AddButton("Reload", "", { Image: "resource(afw.RefreshIcon20)" });
            }

            that._Toolbar.AddButton("Print", "چاپ", { Image: "resource(cmn.PrintToolbarIcon)" });
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            var selectedEntities = that._EntitiesGridView.GetSelectedRows();
            var workflowStage = null;

            if (ValueIsIn(buttonKey, ["CreateNewVersion", "ShowAllEditions", "Print", "VosolMotalebat", "ConvertToInvoice", "PrintHavale"])) {
                if (selectedEntities.length == 0) {
                    afw.ErrorDialog.Show("ابتدا یک پیش فاکتور را انتخاب نمایید.");
                    return;
                }

                if (cmn.IsMegaModavem()) {
                    var workflowStageID = selectedEntities[0].DataItem["WorkflowStage"];
                    if (workflowStageID != null)
                        workflowStage = cmn.GetWorkflowStageByID(workflowStageID);
                }
            }

            if (ValueIsIn(buttonKey, ["New", "CreateNewVersion"])) {
                var isExistConfig = afw.uiApi.EntityExists("ps.Config");
                if (!isExistConfig) {
                    afw.ErrorDialog.Show("تنظیمات خرید و فروش، اعمال نشده است .");
                    return;
                }
            }

            if (buttonKey == "New") {
                if (that._ActiveFinancialYearID == null) {
                    afw.ErrorDialog.Show("سال مالی فعال نشده است.");
                    return;
                }

                var entity = afw.uiApi.CreateNewEntity("ps.SalesInvoice");
                entity.SetFieldValue("IsProforma", true);

                that._OpenEntityForm(entity, "New");              
            }
            else if (buttonKey == "CreateNewVersion") {
                var isInvoice = afw.uiApi.CallServerMethodSync("ps.IsConvertedToInvoice", [selectedEntities[0].DataItem["InternalNumber1"],
                    selectedEntities[0].DataItem["IsAmani"], selectedEntities[0].DataItem["OrganizationUnit"]]);
                if (isInvoice == true) {
                    afw.ErrorDialog.Show("این پیش فاکتور به فاکتور تبدیل شده است و امکان ایجاد نسخه جدید وجود ندارد.");
                    return;
                }

                if (workflowStage != null
                    && ValueIsIn(workflowStage.GetFieldValue("LatinName"), ["FinalApproved", "ApprovedByCustomer"])) {
                    afw.ErrorDialog.Show("امکان صدور نسخه جدید از پیش فاکتوری که در وضعیت تایید نهایی یا تایید مشتری می باشد وجود ندارد.");
                    return;
                }

                that._CreateProformaCopy();
            }
            else if (buttonKey == "ShowAllEditions") {
                that._ShowProformaEditions();
            }
            else if (buttonKey == "Print") {
                that._OpenPrintPopup();
            }
            else if (buttonKey == "PrintHavale") {
                that._PrintHavale();
            }
            else if (buttonKey == "VosolMotalebat") {
                that._ShowVosolMotalebat();
            }
            else if (buttonKey == "ConvertToInvoice") {

                var isInvoice = afw.uiApi.CallServerMethodSync("ps.IsConvertedToInvoice", [selectedEntities[0].DataItem["InternalNumber1"],
                    selectedEntities[0].DataItem["IsAmani"], selectedEntities[0].DataItem["OrganizationUnit"]]);
                if (isInvoice == true) {
                    afw.ErrorDialog.Show("این پیش فاکتور به فاکتور تبدیل شده است.");
                    return;
                }

                if (workflowStage != null
                    && workflowStage.GetFieldValue("LatinName") != "FinalApproved") {
                    afw.ErrorDialog.Show("تنها پیش فاکتور در وضعیت تایید نهایی را میتوان به فاکتور تبدیل کرد.");
                    return;
                }

                that._CreateInvoiceConversionPopup();
            }
            else if (buttonKey == "ShowCustomer") {
                var customerFullName = null;
                if (selectedEntities.length != 0)
                    customerFullName = selectedEntities[0].DataItem["Customer_FullName"];

                cmn.ShowPersonsListForm(customerFullName);
            }
            else
                afw.DataListControl.fn._OnToolbarButtonClicked.call(that, buttonKey);
        },

        _PrintFormatLookupControl_ValueChanged: function (e) {
            var that = this;

            var printFormatID = e.Sender.GetValue();
            var foundPrintFormatNames = $.grep(ps.GetInvoicePrintFormatsEntityList().Entities,
                function (o) { return o.GetFieldValue("ID").toLowerCase() == printFormatID.toLowerCase(); });
            var printFormatName = foundPrintFormatNames[0].GetFieldValue("Name");

            that._PrintPopup.Close();
            that._PrintPopup = null;

            that._PrintProforma(printFormatName);
        },

        _InvoiceConversionPopup_OkButton_Click: function (e) {
            var that = this;

            that._ConvertToInvoice();

        },

        _InvoiceConversionPopup_CancelButton_Click: function (e) {
            var that = this;

            that._InvoiceConversionPopup.Close();
            that._InvoiceConversionPopup = null;
        },

        _FilterControl_FilterChanged: function (e) {
            var that = this;

            that.LoadData();
        },

        _GetTotalFilterExpression: function () {
            var that = this;

            var filterExpression = afw.DataListControl.fn._GetTotalFilterExpression.call(that);

            if (!ValueIsEmpty(filterExpression))
                filterExpression += " and ";

            filterExpression += cmn.GetUserActiveOrganizationUnitsFilterExpression();

            if (that._OnlyShowLastEditions == true) {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";

                filterExpression += "IsLastEdition = 1";
            }

            var filter = that._FilterControl.GetFilterExpression();

            if (!ValueIsEmpty(filter)) {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";

                filterExpression += filter;
            }

            return filterExpression;
        },

        _LoadData: function () {
            var that = this;

            if (that._FilterControl == null)
                return;

            afw.DataListControl.fn._LoadData.call(that);
        },

        _OnLoadingData: function () {
            var that = this;

            afw.DataListControl.fn._OnLoadingData.call(that);
        },

        _OpenEntityForm: function (entity, formMode, options) {
            var that = this;

            if (ValueIsEmpty(options))
                options = {};

            options.IsAmani = that._IsAmaniMode;
            return afw.DataListControl.fn._OpenEntityForm.call(that, entity, formMode, options);
        },

        _ShowEntityWindow: function (entity, formMode, options) {
            var that = this;

            if (ValueIsEmpty(options))
                options = {};

            options.IsAmani = that._IsAmaniMode;

            return afw.DataListControl.fn._ShowEntityWindow.call(that, entity, formMode, options);
        },

        _OnEntityWindowOpened: function (entityWindow) {
            var that = this;

            afw.DataListControl.fn._OnEntityWindowOpened.call(that, entityWindow);
        },

        _EntitiesGridView_RowDoubleClick: function (e) {
            var that = this;

            afw.DataListControl.fn._EntitiesGridView_RowDoubleClick.call(that, e);
        },

        _EntitiesGridView_SelectedRowsChanged: function (e) {
            var that = this;

            var selectedEntities = that._EntitiesGridView.GetSelectedRows();
            if (selectedEntities.length != 0) {
                if (that._Toolbar.ButtonExists("ShowCustomer"))
                    that._Toolbar.SetButtonEnabled("ShowCustomer", true);
            }
            else {
                if (that._Toolbar.ButtonExists("ShowCustomer"))
                    that._Toolbar.SetButtonEnabled("ShowCustomer", false);
            }

            if (that._PreviewIsEnabled) {
                if (e.SelectedRows.length != 0)
                    that._ShowPreviewPanel();
                else
                    that._HidePreviewPanel();
            }
        },

        _CreateProformaCopy: function () {
            var that = this;

            var selectedEntities = that._EntitiesGridView.GetSelectedRows();

            afw.uiApi.ShowProgress(that);
            afw.uiApi.AsyncFetchEntityByID("ps.SalesInvoice", selectedEntities[0].DataItem["ID"], ["StuffAndServiceItems", "PayPlanItems"],
                function (result) {
                    afw.uiApi.HideProgress(that);
                    if (result.HasError) {
                        afw.Application.HandleError(result.ErrorMessage);
                        return;
                    }

                    var sourceProformaID = result.Value.GetFieldValue("ID");

                    var newProforma = result.Value;
                    newProforma.SetFieldValue("ID", GenerateGuid());
                    newProforma.SetFieldValue("SourceProforma", sourceProformaID);

                    if (that._Mode == "SalesProformaInvoice")
                        newProforma.SetFieldValue("WorkflowStage", cmn.TryGetFirstWorkflowStageID("SalesProformaInvoice"));
                    else
                        newProforma.SetFieldValue("WorkflowStage", cmn.TryGetFirstWorkflowStageID("AmaniProformaInvoice"));

                    newProforma.SetFieldValue("HavaleIssuingStatus", afw.OptionSetHelper.GetOptionSetItemID("cmn.HavaleIssuingStatus.HavaleNashodeh"));
                    newProforma.SetFieldValue("InvoiceNumber", null);
                    newProforma.SetFieldValue("InternalNumber2", null);
                    newProforma.SetFieldValue("IsAmani", that._IsAmaniMode);
                    newProforma.ChangeStatus = "Add";

                    //stuffAndServiceItems
                    var stuffAndServiceItems = newProforma.GetFieldValue("StuffAndServiceItems").Entities;
                    stuffAndServiceItems.sort(function (o1, o2) {
                        return o1.GetFieldValue("RowNumber") - o2.GetFieldValue("RowNumber");
                    });

                    for (var i = 0; i < stuffAndServiceItems.length; i++) {
                        stuffAndServiceItems[i].SetFieldValue("ID", GenerateGuid());
                        stuffAndServiceItems[i].SetFieldValue("SalesInvoice", newProforma.GetFieldValue("ID"));
                        stuffAndServiceItems[i].ChangeStatus = "Add";
                    }

                    //payPlanItems
                    var payPlanItems = newProforma.GetFieldValue("PayPlanItems").Entities;
                    payPlanItems.sort(function (o1, o2) {
                        return o1.GetFieldValue("RowNumber") - o2.GetFieldValue("RowNumber");
                    });

                    for (var i = 0; i < payPlanItems.length; i++) {
                        payPlanItems[i].SetFieldValue("ID", GenerateGuid());
                        payPlanItems[i].SetFieldValue("SalesInvoice", newProforma.GetFieldValue("ID"));
                        payPlanItems[i].ChangeStatus = "Add";
                    }

                    var createNewEdition = true;

                    var entityForm = that._OpenEntityForm(newProforma,"New", {
                            CreateNewEdition: createNewEdition
                    });

                    if (entityForm == null) {
                        afw.Application.HandleError("Could not create Entity form.");
                        return;
                    }
                });

        },

        _ConvertToInvoice: function () {
            var that = this;

            var selectedEntities = that._EntitiesGridView.GetSelectedRows();
            var proformaID = selectedEntities[0].DataItem["ID"];
            var invoiceConversionPopupForm = that._InvoiceConversionPopup.FindControl("InvoiceConversionPopupForm");
            var invoiceNumber = invoiceConversionPopupForm.FindControl("InvoiceNumberTextBox").GetValue();
            var issueDate = invoiceConversionPopupForm.FindControl("DateControl").GetValue();
            var requestNumber = invoiceConversionPopupForm.FindControl("RequestNumberTextBox").GetValue();

            afw.uiApi.ShowProgress(that);
            afw.uiApi.CallServerMethodAsync("ps.CreateInvoiceFromProforma2",
                [proformaID, invoiceNumber, issueDate, requestNumber, that._ActiveFinancialYearID],
                function (result) {
                    afw.uiApi.HideProgress(that);
                    if (result.HasError) {
                        var invoiceConversionPopup_ErrorDialog = afw.ErrorDialog.Show(result.ErrorMessage);
                        invoiceConversionPopup_ErrorDialog.bind("Close", function (e) { that._InvoiceConversionPopup_ErrorDialog_Close(); });
                    }
                    else {
                        that._OnLoadingData();
                        afw.MessageDialog.Show("فاکتور با موفقیت ثبت شد.");
                        that._InvoiceConversionPopup.Close();
                        that._InvoiceConversionPopup = null;
                    }
                });

        },

        _InvoiceConversionPopup_ErrorDialog_Close: function () {
            var that = this;

            if (that._InvoiceConversionPopup == null || that._InvoiceConversionPopup.IsDestroying)
                that._CreateInvoiceConversionPopup();
            else if (!that._InvoiceConversionPopup.IsOpen())
                that._InvoiceConversionPopup.Open();
        },

        _ShowProformaEditions: function () {
            var that = this;

            var selectedEntities = that._EntitiesGridView.GetSelectedRows();
            var internalNumber1 = selectedEntities[0].DataItem["InternalNumber1"];


            var editionsWindow = new afw.Window({
                Name: "ProformaEditionsWindow",
                Title: "ویرایش های پیش فاکتور",
                Modal: true,
            });

            var dataListControl = afw.uiApi.CreateDataListControl("ps.SalesProformaInvoices",
                {
                    ParentControl: editionsWindow,
                    OnlyShowLastEditions: false,
                    BaseFilterExpression: String.Format("InternalNumber1 = {0}", internalNumber1),
                    FillParent: true,
                    Mode: that._Mode
                });

            editionsWindow.Maximize();
            editionsWindow.Open();
        },

        _PrintProforma: function (printFormatName) {
            var that = this;

            var selectedEntities = that._EntitiesGridView.GetSelectedRows();
            if (selectedEntities.length == 0) {
                afw.ErrorDialog.Show("ابتدا یک ردیف را انتخاب نمایید.");
                return;
            }

            var proformaID = selectedEntities[0].DataItem["ID"];
            var proforma = afw.uiApi.FetchEntityByID("ps.SalesInvoice", proformaID);

            var invoiceTitle = "پیش فاکتور فروش و خدمات";

            if (that._Mode == "AmaniSalesProformaInvoice")
                invoiceTitle = "پیش فاکتور امانی";

            var invoiceID = proforma.GetFieldValue("ID");
            var organizationParentName = "";
            var organizationName = "";
            var orgLogoImagePath = "";
            var organizationFullAddress = "";
            var finalAmount = proforma.GetFieldValue("FinalAmount");
            var finalAmountWords = afw.NumberHelper.NumberToPersianWords(finalAmount) + " ريال";
            var taxTitle = "";
            var organizationWebSite = "";

            var orgUnit = cmn.GetOrganizationUnitByID(selectedEntities[0].DataItem["OrganizationUnit"]);

            organizationName = orgUnit.GetFieldValue("Name");

            if (!cmn.IsMegaModavem())
                organizationParentName = cmn.GetOrganizationInformation().GetFieldValue("Name");

            var officialType = afw.uiApi.CallServerMethodSync("ps.GetSalesInvoiceFinancialDocTypeName", [invoiceID]);
            if (officialType == "Main") {
                taxTitle = ":مالیات ارزش افزوده";
                organizationParentName = cmn.GetOrganizationInformation().GetFieldValue("Name");

                organizationFullAddress = " ";
                if (!ValueIsEmpty(orgUnit.GetFieldValue("FullAddress")))
                    organizationFullAddress += " آدرس:" + orgUnit.GetFieldValue("FullAddress") + " ";
                if (!ValueIsEmpty(orgUnit.GetFieldValue("PhoneNumber")))
                    organizationFullAddress += "تلفن" + orgUnit.GetFieldValue("PhoneNumber") + " ";
                if (!ValueIsEmpty(orgUnit.GetFieldValue("Fax")))
                    organizationFullAddress += "فکس" + orgUnit.GetFieldValue("Fax") + " ";
                if (!ValueIsEmpty(orgUnit.GetFieldValue("PostCode")))
                    organizationFullAddress += "کدپستی" + orgUnit.GetFieldValue("PostCode") + " ";
                if (!ValueIsEmpty(orgUnit.GetFieldValue("WebSite")))
                    organizationWebSite = orgUnit.GetFieldValue("WebSite");
            }

            var parameterNames = ["TaxTitle", "PrintFormat", "InvoiceID", "OrganizationParentName", "InvoiceTitle",
                "OrganizationAddress", "FinalAmountWords", "OrgLogoImagePath", "OrganizationWebSite", "OrganizationName"];
            var parameterValues = [taxTitle, printFormatName, invoiceID, organizationParentName, invoiceTitle,
                organizationFullAddress, finalAmountWords, orgLogoImagePath, organizationWebSite, organizationName];

            afw.uiApi.ShowProgress(that);
            if (printFormatName == "TakhfifBaSharhTarkibi" || printFormatName == "BedoneTakhfifBaSharhTarkibi") {
                afw.ReportHelper.RunReport("ps.SalesInvoice2", parameterNames, parameterValues, null,
                    function (result) {
                        afw.uiApi.HideProgress(that);
                        if (result.HasError)
                            afw.ErrorDialog.Show(result.ErrorMessage);
                        else {
                            var returnValue = result.Value;
                        }
                    });
            }
            else if (printFormatName == "Personalization") {
                var headerTextColumns = ps.GetSaleInvoiceDynamicFieldsHeaderTextColumns(proforma);
                invoiceTitle = "پیش فاکتور فروش";

                afw.ReportHelper.RunReport("ps.PersonalizationInvoiceReport",
                    ["InvoiceID", "OrganizationParentName", "InvoiceTitle", "OrganizationAddress", "FinalAmountWords",
                        "OrgLogoImagePath", "OrganizationWebSite", "OrganizationName", "HeaderTextColumn1", "HeaderTextColumn2"],
                    [invoiceID, organizationParentName, invoiceTitle, organizationFullAddress, finalAmountWords, orgLogoImagePath,
                        organizationWebSite, organizationName, headerTextColumns.HeaderTextColumn1, headerTextColumns.HeaderTextColumn2], null,
                    function (result) {
                        afw.uiApi.HideProgress(that);
                        if (result.HasError)
                            afw.ErrorDialog.Show(result.ErrorMessage);
                        else {
                            var returnValue = result.Value;
                        }
                    });
            }
            else {
                afw.ReportHelper.RunReport("ps.SalesInvoice1", parameterNames, parameterValues, null,
                    function (result) {
                        afw.uiApi.HideProgress(that);
                        if (result.HasError)
                            afw.ErrorDialog.Show(result.ErrorMessage);
                        else {
                            var returnValue = result.Value;
                        }
                    });
            }
        },

        _PrintOfficialProforma: function () {
            var that = this;

            var selectedEntities = that._EntitiesGridView.GetSelectedRows();
            if (selectedEntities.length == 0) {
                afw.ErrorDialog.Show("ابتدا یک ردیف را انتخاب نمایید.");
                return;
            }

            var orgUnitID = selectedEntities[0].DataItem["OrganizationUnit"];

            var proformaID = selectedEntities[0].DataItem["ID"];

            var proforma = afw.uiApi.FetchEntityByID("ps.SalesInvoice", proformaID);

            var invoiceTitle = "پیش فاکتور";
            var invoiceID = proforma.GetFieldValue("ID");
            var finalAmount = proforma.GetFieldValue("FinalAmount");
            var finalAmountWords = afw.NumberHelper.NumberToPersianWords(finalAmount) + " ريال";

            var parametrNames = ["InvoiceID", "InvoiceTitle", "FinalAmountWords", "OrganizationInformationID"];
            var parametrValues = [invoiceID, invoiceTitle, finalAmountWords, orgUnitID];

            afw.uiApi.ShowProgress(that);
            afw.ReportHelper.RunReport("ps.SalesInvoiceOfficial", parameterNames, parameterValues, null,
                function (result) {
                    afw.uiApi.HideProgress(that);
                    if (result.HasError)
                        afw.ErrorDialog.Show(result.ErrorMessage);
                    else {
                        var returnValue = result.Value;
                    }
                });
        },

        _PrintHavale: function () {
            var that = this;

            var selectedEntities = that._EntitiesGridView.GetSelectedRows();
            var invoiceID = selectedEntities[0].DataItem["ID"];
            var reportTitle = "درخواست حواله"

            if (that._Mode == "AmaniSalesProformaInvoice")
                reportTitle = "درخواست کالای امانی";

            var parameterNames = ["InvoiceID", "ReportTitle"];
            var parameterValues = [invoiceID, reportTitle];

            afw.uiApi.ShowProgress(that);
            afw.ReportHelper.RunReport("ps.HavaleFactorForoosh", parameterNames, parameterValues, null,
                function (result) {
                    afw.uiApi.HideProgress(that);
                    if (result.HasError) {
                        afw.ErrorDialog.Show(result.ErrorMessage);
                    } else {
                        var returnValue = result.Value;
                    }
                });
        },

        _ShowVosolMotalebat: function () {
            var that = this;

            var selectedEntities = that._EntitiesGridView.GetSelectedRows();
            var proformaID = selectedEntities[0].DataItem["ID"];
            var dateToday = afw.DateTimeHelper.GetServerDateTime();
            var tarikh7RozBad = afw.DateTimeHelper.AddDays(dateToday, 7);

            var paymentPoolReceptionWindow = afw.uiApi.OpenSavedFormWindow("ps.SaleInvoiceVosolMotalebatEditForm", { Name: "SaleInvoiceVosolMotalebatEditForm", Modal: true, ProformaID: proformaID, DateToday: dateToday, Tarikh7RozBad: tarikh7RozBad });
            paymentPoolReceptionWindow.SetTitle("وصول مطالبات");
            paymentPoolReceptionWindow.Center();
            paymentPoolReceptionWindow.bind("Opened",
               function (e) {
                   e.Sender.Center();
               });
        },

        _CreateInvoiceConversionPopup: function () {
            var that = this;

            var selectedEntities = that._EntitiesGridView.GetSelectedRows();
            var proformaID = selectedEntities[0].DataItem["ID"];
            var proformaEntity = afw.uiApi.FetchEntityByID("ps.SalesInvoice", proformaID);
            var requestNumber = selectedEntities[0].DataItem["RequestNumber"];
            var organizationUnit = selectedEntities[0].DataItem["OrganizationUnit"];

            that._InvoiceConversionPopup = new afw.Popup({ Name: "WarningsPopup", Width: 900, Height: 130 });

            var popupContentForm = afw.uiApi.CreateSavedFormByName(
                that._InvoiceConversionPopup, "ps.InvoiceConversionPopupForm",
                {
                    Name: "InvoiceConversionPopupForm",
                    ProformaEntity: proformaEntity,
                    FillParent: true,
                    IsAmaniMode: that._IsAmaniMode
                });

            that._DateControl = popupContentForm.FindControl("DateControl");
            that._RequestNumberTextBox = popupContentForm.FindControl("RequestNumberTextBox");

            that._NowDateTime = afw.uiApi.CallServerMethodSync("core.GetServerDateTime");
            var nowDateTimeSplited = that._NowDateTime.split(' ');
            that._DateControl.SetValue(nowDateTimeSplited[0]);

            that._RequestNumberTextBox.SetValue(requestNumber);

            popupContentForm.FindControl("OkButton").bind("Click", function (e) { that._InvoiceConversionPopup_OkButton_Click(e); });
            popupContentForm.FindControl("CancelButton").bind("Click", function (e) { that._InvoiceConversionPopup_CancelButton_Click(e); });

            that._InvoiceConversionPopup.SetAnchor(that._Toolbar, "bottom right", "top right");

            that._InvoiceConversionPopup.Open();
        },

        SetCustomerFilter: function (CustomerID) {
            var that = this;

            that._FilterControl.SetColumnFilterValue("Customer", CustomerID);
        }
    });

    //Static Members:

    SalesProformaInvoicesControl.TypeName = typeName;
    SalesProformaInvoicesControl.BaseType = baseType;
    SalesProformaInvoicesControl.Events = events;


    ps.SalesProformaInvoicesControl = SalesProformaInvoicesControl;
})();
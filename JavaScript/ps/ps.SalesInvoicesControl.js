(function () {
    var typeName = "ps.SalesInvoicesControl";
    var baseType = afw.DataListControl;
    var events = afw.DataListControl.Events.concat([]);

    var SalesInvoicesControl = baseType.extend({
        events: events,

        GetType: function () {
            return ps.SalesInvoicesControl;
        },

        init: function (options) {
            var that = this;

            that._ActiveFinancialYearID = null;
            var disableActiveFinancialYearFilter = false;

            options.LoadDataOnInit = false;
            that._Mode = options.Mode;

            if ("CustomOptions" in options && options.CustomOptions != null) {
                var customOptions = options.CustomOptions;

                if ("DisableActiveFinancialYearFilter" in customOptions && customOptions.DisableActiveFinancialYearFilter)
                    disableActiveFinancialYearFilter = true;

                if ("Mode" in customOptions)
                    that._Mode = customOptions.Mode;
            }

            if (!disableActiveFinancialYearFilter) {
                that._ActiveFinancialYearID = cmn.GetUserActiveFinancialYearID();
                cmn.InitFinancialOpList(options, that._ActiveFinancialYearID);
            }

            if (!ValueIsIn(that._Mode, ["SalesInvoice", "AmaniSalesInvoice"]))
                throw "Invalid Mode!";

            that._IsAmaniMode = ValueIsIn(that._Mode, ["AmaniSalesInvoice"]);

            if (!ValueIsEmpty(options.BaseFilterExpression))
                options.BaseFilterExpression += " and ";
            options.BaseFilterExpression += String.Format("IsAmani = {0}", that._IsAmaniMode ? 1 : 0);

            options.DataListFullName = "ps.SalesInvoices";
            afw.DataListControl.fn.init.call(that, options);

            if (that._IsAmaniMode)
                that.SetColumnVisible("StageTitle", false);

            var activeFinancialYearStartDate = null;
            var activeFinancialYearEndDate = null;
            var activeFinancialYearEntity = cmn.GetUserActiveFinancialYearEntity();
            if (activeFinancialYearEntity != null) {
                activeFinancialYearStartDate = activeFinancialYearEntity.GetFieldValue("StartDate");
                activeFinancialYearEndDate = activeFinancialYearEntity.GetFieldValue("EndDate");
            }

            that._VDockPanel.InsertPane(2, { Size: 100 }, true);

            that._FilterControl = afw.uiApi.CreateSavedFormByName(
                that._VDockPanel.Panes[2],
                "cmn.DataListAdvancedFilterControl", {
                    ColumnsFilterInfo: [
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
                            FieldName: "Customer",
                            Title: "مشتری",
                            ControlType: "Lookup",
                            LookupDataListFullName: "cmn.Persons",
                            LookupEntityCaptionFieldName: "FullName",
                            LookupControlType: "Advanced"
                        },
                        {
                            FieldName: "FinalAmount",
                            Title: "مبلغ نهایی",
                            ControlType: "Numeric",
                            CompareOperator: "like"
                        },
                        {
                            FieldName: "InvoiceNumber",
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
                            FieldName: "SourceProforma_CreatorUser",
                            Title: "ایجاد کننده پیش فاکتور",
                            ControlType: "Lookup",
                            LookupDataListFullName: "afw.SystemUsers",
                            LookupEntityCaptionFieldName: "DisplayName",
                            LookupControlType: "Advanced"
                        },
                        {
                            FieldName: "SourceProforma_InvoiceNumber",
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
                            FieldName: "OrganizationUnit",
                            Title: "واحد سازمانی",
                            ControlType: "Lookup",
                            LookupDataListFullName: "cmn.OrganizationInformationList",
                            LookupEntityCaptionFieldName: "Name",
                            LookupControlType: "Simple"
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
                            FieldName: "AccDoc_ReferenceNo",
                            Title: "شماره مرجع سند حسابداری",
                            ControlType: "Numeric",
                            CompareOperator: "like"
                        },
                        {
                            FieldName: "AccDoc_FinalNumber",
                            Title: "شماره قطعی سند حسابداری",
                            ControlType: "Numeric",
                            CompareOperator: "like"
                        },
                        {
                            FieldName: "RequestNumber",
                            Title: "شماره درخواست",
                            ControlType: "Numeric",
                            CompareOperator: "like"
                        }]
                });
            that._FilterControl.bind("FilterChanged", function (e) { that._FilterControl_FilterChanged(e); });

            that.LoadData();

            if (that.GetContainerWindow() != null)
                that._EntityFormContainerType = "Window";
            else
                that._EntityFormContainerType = "MdiContainer";
        },

        _CreateToolbar: function () {
            var that = this;

            afw.DataListControl.fn._CreateToolbar.call(that);

            that._Toolbar = that.FindControl(that.GetName() + "_Toolbar");
            that._Toolbar.AddButton("PrintRasmi", "فاکتور نوع یک", { Image: "resource(ps.Invoice)" });
            that._Toolbar.AddButton("PrintGheirRasmi", "فاکتور نوع دو", { Image: "resource(ps.Invoice)" });
            that._Toolbar.AddButton("StuffBarCodePrint", "چاپ بارکد کالا", { Image: "resource(cmn.Barcode)" });
            
            if (that._Mode == "SalesInvoice")
                that._Toolbar.AddButton("SalesInvoiceCancellation", "ابطال فاکتور");
            //that._Toolbar.AddButton("ReturnFromSales", "برگشتی");
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;


            if (buttonKey == "New") {
                if (that._ActiveFinancialYearID == null) {
                    afw.ErrorDialog.Show("سال مالی جاری تعیین نشده است.");
                    return
                }
            }

            if (ValueIsIn(buttonKey, ["PrintRasmi", "PrintGheirRasmi", "StuffBarCodePrint", "SalesInvoiceCancellation"])) {
                var selectedEntities = that._EntitiesGridView.GetSelectedRows();
                if (selectedEntities.length == 0) {
                    afw.ErrorDialog.Show("ابتدا یک سطر را انتخاب نمایید.");
                    return;
                }

                var financialGroupID = selectedEntities[0].DataItem["FinancialGroup"];
                var financialGroupEntity = afw.uiApi.FetchEntity("cmn.FinancialGroup", String.Format("ID = '{0}'", financialGroupID));

                if (financialGroupEntity == null) {
                    afw.ErrorDialog.Show("ابتدا گروه مالی را برای سطر انتخاب شده ثبت کنید.");
                    return;
                }

                var officialPrintTypeID = financialGroupEntity.GetFieldValue("OfficialPrintType");
                var inOfficialPrintTypeID = financialGroupEntity.GetFieldValue("InOfficialPrintType");
                var financialDocType = financialGroupEntity.GetFieldValue("FinancialDocType");

                var orgUnitID = selectedEntities[0].DataItem["OrganizationUnit"];
                var orgUnit = cmn.GetOrganizationUnitByID(orgUnitID);

                that._OfficialPrintType = afw.OptionSetHelper.GetOptionSetItemName(officialPrintTypeID);
                that._InOfficialPrintType = afw.OptionSetHelper.GetOptionSetItemName(inOfficialPrintTypeID);
                that._FinancialDocType = afw.OptionSetHelper.GetOptionSetItemName(financialDocType);

                if (buttonKey == "PrintRasmi" && that._FinancialDocType == "Draft") {
                    afw.ErrorDialog.Show("برای چاپ این فاکتور باید از فاکتور نوع دو استفاده کنید");
                    return;
                }

                if (buttonKey == "PrintGheirRasmi" && that._FinancialDocType == "Main") {
                    afw.ErrorDialog.Show("برای چاپ این فاکتور باید از فاکتور نوع یک استفاده کنید");
                    return;
                }

                if (buttonKey == "PrintRasmi" && that._FinancialDocType == "Main") {

                    var customer = selectedEntities[0].DataItem["Customer"];

                    var personEntity = afw.uiApi.FetchEntityByID("cmn.Person", customer);
                    var opthionSetItem = afw.uiApi.FetchEntityByID("afw.OptionSetItem", personEntity.GetFieldValue("PersonType"));

                    var message = "";
                    //if (ValueIsEmpty(personEntity.GetFieldValue("CodeMelli")) && opthionSetItem.GetFieldValue("Name") == "Haghighi")
                    //    afw.ErrorDialog.Show("لطفا برای این شخض کد ملی را پر کنید سپس اقدام به چاپ نمایید");
                    if (ValueIsEmpty(personEntity.GetFieldValue("NationalID")) && opthionSetItem.GetFieldValue("Name") != "Haghighi")
                        message += "شناسه ملی" + "\r\n";
                    if (ValueIsEmpty(personEntity.GetFieldValue("PostalCode")))
                        message += "کد پستی" + "\r\n";
                    if (ValueIsEmpty(personEntity.GetFieldValue("CodeEghtesadi")) && opthionSetItem.GetFieldValue("Name") != "Haghighi")
                        message += "کد اقتصادی" + "\r\n";
                    if (ValueIsEmpty(personEntity.GetFieldValue("Address1")))
                        message += "آدرس" + "\r\n";

                    if (message != "") {
                        afw.ErrorDialog.Show("لطفا برای این شخص/شرکت \r\n" + message + "را پر کنید سپس اقدام به چاپ نمایید");
                        return;
                    }

                    var invoiceID = selectedEntities[0].DataItem["ID"];
                    var invoiceTitle = "فاکتور فروش";

                    if (that._Mode == "AmaniSalesInvoice")
                        invoiceTitle = "فاکتور فروش امانی";

                    var finalAmount = selectedEntities[0].DataItem["FinalAmount"];
                    var finalAmountWords = afw.NumberHelper.NumberToPersianWords(finalAmount) + " ريال";

                    var parametrNames = ["InvoiceID", "InvoiceTitle", "FinalAmountWords", "OrganizationInformationID"];
                    var parametrValues = [invoiceID, invoiceTitle, finalAmountWords, orgUnitID];

                    if (that._OfficialPrintType == "OfficialInvoiceLandscape") {
                        afw.uiApi.ShowProgress(that);
                        afw.ReportHelper.RunReport(
                            orgUnit.GetFieldValue("LatinName") == "Sales" ? "ps.SalesInvoiceOfficialLandscape" : "ps.ServiceInvoiceOfficialLandscape",
                            parametrNames, parametrValues, null,
                        function (result) {
                            afw.uiApi.HideProgress(that);
                            if (result.HasError) {
                                afw.ErrorDialog.Show(result.ErrorMessage);
                                return;
                            }

                            var returnValue = result.Value;
                        });
                    }
                    else if (that._OfficialPrintType == "OfficialInvoice") {
                        afw.uiApi.ShowProgress(that);
                        afw.ReportHelper.RunReport(
                            orgUnit.GetFieldValue("LatinName") == "Sales" ? "ps.SalesInvoiceOfficial" : "ps.ServiceInvoiceOfficial",
                            parametrNames, parametrValues, null,
                        function (result) {
                            afw.uiApi.HideProgress(that);
                            if (result.HasError) {
                                afw.ErrorDialog.Show(result.ErrorMessage);
                                return;
                            }

                            var returnValue = result.Value;
                        });
                    }
                    else if (that._OfficialPrintType == "OfficialInvoiceLandscapeTypeTwo") {
                        afw.uiApi.ShowProgress(that);
                        afw.ReportHelper.RunReport(
                            orgUnit.GetFieldValue("LatinName") == "Sales" ? "ps.SalesInvoiceOfficialLandscapeTypeTwo" : "ps.ServiceInvoiceOfficialLandscapeTypeTwo",
                            parametrNames, parametrValues, null,
                        function (result) {
                            afw.uiApi.HideProgress(that);
                            if (result.HasError) {
                                afw.ErrorDialog.Show(result.ErrorMessage);
                                return;
                            }

                            var returnValue = result.Value;
                        });
                    }
                }
                if (buttonKey == "PrintGheirRasmi" && that._FinancialDocType == "Draft") {
                    var proformaID = selectedEntities[0].DataItem["ID"];
                    var proforma = afw.uiApi.FetchEntityByID("ps.SalesInvoice", proformaID);

                    var printFormatName = "TakhfifBaSharhTarkibi";
                    var invoiceTitle = "صورتحساب";
                    var invoiceID = proforma.GetFieldValue("ID");
                    var finalAmount = proforma.GetFieldValue("FinalAmount");
                    var finalAmountWords = afw.NumberHelper.NumberToPersianWords(finalAmount) + " ريال";

                    var parameterNames = ["TaxTitle", "PrintFormat", "InvoiceID", "OrganizationName",
                        "InvoiceTitle", "OrganizationAddress", "FinalAmountWords", "OrgLogoImagePath"];
                    var parameterValues = [null, printFormatName, invoiceID, null, invoiceTitle, null, finalAmountWords, null];

                    if (that._InOfficialPrintType == "InOfficialInvoice") {
                        afw.uiApi.ShowProgress(that);
                        if (cmn.IsMegaModavem() == true) {
                            afw.ReportHelper.RunReport("ps.SalesInvoice2", parameterNames, parameterValues, null,
                                function (result) {
                                    afw.uiApi.HideProgress(that);
                                    if (result.HasError) {
                                        afw.ErrorDialog.Show(result.ErrorMessage);
                                        return;
                                    }

                                    var returnValue = result.Value;
                                });
                        }
                        else {
                            var orgUnit = cmn.GetOrganizationUnitByID(selectedEntities[0].DataItem["OrganizationUnit"]);
                            var headerTextColumns = ps.GetSaleInvoiceDynamicFieldsHeaderTextColumns(proforma);
                            var invoiceTitle = "فاکتور فروش"
                            organizationParentName = cmn.GetOrganizationInformation().GetFieldValue("Name");

                            afw.ReportHelper.RunReport("ps.PersonalizationInvoiceReport",
                                ["InvoiceID", "OrganizationParentName", "InvoiceTitle", "OrganizationAddress", "FinalAmountWords",
                                    "OrgLogoImagePath", "OrganizationWebSite", "OrganizationName", "HeaderTextColumn1", "HeaderTextColumn2"],
                                [invoiceID, organizationParentName, invoiceTitle, "", finalAmountWords, "",
                                    "", orgUnit.GetFieldValue("Name"), headerTextColumns.HeaderTextColumn1, headerTextColumns.HeaderTextColumn2], null,
                                function (result) {
                                    afw.uiApi.HideProgress(that);
                                    if (result.HasError)
                                        afw.ErrorDialog.Show(result.ErrorMessage);
                                    else {
                                        var returnValue = result.Value;
                                    }
                                });
                        }
                    }
                    else if (that._InOfficialPrintType == "InOfficialInvoiceLandscape") {
                        afw.ErrorDialog.Show("گزارش مورد نظر در حال بروزرسانی می باشد");
                        return;
                    }
                    else if (that._InOfficialPrintType == "InOfficialFactorBill") {
                        parameterValues[4] = "صورت حساب";

                        afw.uiApi.ShowProgress(that);
                        afw.ReportHelper.RunReport("ps.SalesInvoiceBill", parameterNames, parameterValues, null,
                            function (result) {
                                afw.uiApi.HideProgress(that);
                                if (result.HasError) {
                                    afw.ErrorDialog.Show(result.ErrorMessage);
                                    return;
                                }

                                var returnValue = result.Value;
                            });
                    }
                }

                if (buttonKey == "StuffBarCodePrint") {
                    var invoiceID = selectedEntities[0].DataItem["ID"];
                    var parameterNames = ["InvoiceID", "InvoiceType"];
                    var parameterValues = [invoiceID, "SalesInvoice"];

                    afw.uiApi.ShowProgress(that);

                    afw.ReportHelper.RunReport("cmn.InvoicesStuffBarCodePrint", parameterNames, parameterValues, null,
                        function (result) {
                            afw.uiApi.HideProgress(that);
                            if (result.HasError) {
                                afw.ErrorDialog.Show(result.ErrorMessage);
                                return;
                            }

                            var returnValue = result.Value;
                        });
                }

                if (buttonKey == "SalesInvoiceCancellation") {
                    var confirmDialog = afw.ConfirmDialog.Show("آیا با ابطال فاکتور موافقید؟");
                    confirmDialog.bind("Close", function () {
                        if (confirmDialog.GetDialogResult() == "Yes") {
                            afw.uiApi.CallServerMethodAsync("ps.DeleteSalesInvoiceAndCreateCanceledSalesInvoiceInfo", [selectedEntities[0].DataItem["ID"]],
                                function (result) {
                                    if (that._IsDestroying)
                                        return;

                                    afw.uiApi.HideProgress(that);
                                    if (result.HasError) {
                                        afw.ErrorDialog.Show(result.ErrorMessage);
                                        return;
                                    }

                                    afw.MessageDialog.Show("ابطال فاکتور با موفقیت انجام شد.");
                                    that.LoadData();
                                });
                        }
                    });
                }
            }
            else
                afw.DataListControl.fn._OnToolbarButtonClicked.call(that, buttonKey);
        },

        _OnCreatingColumn: function (columnInfo) {
            var that = this;

            if (that._Mode != null && that._Mode.Contains("Amani") && columnInfo.FieldName == "InvoiceNumber")
                columnInfo.Title = "شماره";
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

            if (!ValueIsEmpty(that._FilterControl.GetFilterExpression())) {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";

                filterExpression += that._FilterControl.GetFilterExpression();
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
        }
    });

    //Static Members:

    SalesInvoicesControl.TypeName = typeName;
    SalesInvoicesControl.BaseType = baseType;
    SalesInvoicesControl.Events = events;


    ps.SalesInvoicesControl = SalesInvoicesControl;
})();

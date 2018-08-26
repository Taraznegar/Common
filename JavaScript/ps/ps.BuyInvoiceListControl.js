(function () {
    var typeName = "ps.BuyInvoiceListControl";
    var baseType = afw.DataListControl;
    var events = afw.DataListControl.Events.concat([]);

    var BuyInvoiceListControl = baseType.extend({
        events: events,

        GetType: function () {
            return ps.BuyInvoiceListControl;
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

            options.DataListFullName = "ps.BuyInvoiceList";
            afw.DataListControl.fn.init.call(that, options);

            if (!ValueIsEmpty(that._Mode) && that._Mode.EndsWith("Lookup")) {
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
                            FieldName: "Seller",
                            Title: "فروشنده",
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
                            FieldName: "Description",
                            Title: "توضیحات",
                            ControlType: "TextBox",
                            CompareOperator: "like"
                        },
                        {
                            FieldName: "TotalDiscount",
                            Title: "تخفیف کلی",
                            ControlType: "Numeric",
                            CompareOperator: "like"
                        },
                        {
                            FieldName: "StuffAndServicesTotalAmountAfterDiscount",
                            Title: "مبلغ کل پس از تخفیف",
                            ControlType: "Numeric",
                            CompareOperator: "like"
                        }]
                });
            that._FilterControl.bind("FilterChanged", function (e) { that._FilterControl_FilterChanged(e); });

            if (that.GetContainerWindow() != null)
                that._EntityFormContainerType = "Window";
            else
                that._EntityFormContainerType = "MdiContainer";

            that.LoadData();
        },

        _CreateToolbar: function () {
            var that = this;

            afw.DataListControl.fn._CreateToolbar.call(that);

            that._Toolbar = that.FindControl(that.GetName() + "_Toolbar");
            that._Toolbar.AddButton("StuffBarCodePrint", "چاپ بارکد کالا", { Image: "resource(cmn.Barcode)" });
            that._Toolbar.AddButton("ClearFilters", "پاک کردن فیلترها", { Image: "resource(cmn.Clear)" });
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            var selectedEntities = that._EntitiesGridView.GetSelectedRows();

            if (ValueIsIn(buttonKey, ["Edit"/*, "ShowAllEditions", "Print", "VosolMotalebat", "TabdilBeFactor"*/])) {
                if (selectedEntities.length == 0) {
                    afw.ErrorDialog.Show("ابتدا یک فاکتور را انتخاب نمایید.");
                    return;
                }
            }

            if (buttonKey == "New") {
                if (that._ActiveFinancialYearID != null)
                    afw.DataListControl.fn._OnToolbarButtonClicked.call(that, buttonKey);
                else {
                    afw.ErrorDialog.Show("سال مالی فعال تعیین نشده است.");
                    return;
                }
            }
            else if (buttonKey == "StuffBarCodePrint") {
                var selectedEntities = that._EntitiesGridView.GetSelectedRows();
                if (selectedEntities.length == 0) {
                    afw.ErrorDialog.Show("ابتدا یک ردیف را انتخاب نمایید.");
                    return;
                }
                else {
                    var invoiceID = selectedEntities[0].DataItem["ID"];
                    var parameterNames = ["InvoiceID", "InvoiceType"];
                    var parameterValues = [invoiceID, "BuyInvoice"];

                    afw.uiApi.ShowProgress(that);

                    afw.ReportHelper.RunReport("cmn.InvoicesStuffBarCodePrint", parameterNames, parameterValues, null,
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
            else if (buttonKey == "ClearFilters") {
                that._QuickSearchTextBox = that.FindControl(that.GetName() + "_QuickSearchTextBox");
                that._QuickSearchTextBox.SetValue("");
                that._FilterControl.ResetFilters();
            }
            else
                afw.DataListControl.fn._OnToolbarButtonClicked.call(that, buttonKey);
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

        _ShowEntityWindow: function (entity, formMode, options) {
            var that = this;

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

    BuyInvoiceListControl.TypeName = typeName;
    BuyInvoiceListControl.BaseType = baseType;
    BuyInvoiceListControl.Events = events;


    ps.BuyInvoiceListControl = BuyInvoiceListControl;
})();
(function () {
    var typeName = "ps.InvoiceDetailedReportControl";
    var baseType = afw.DataListControl;
    var events = afw.DataListControl.Events.concat([]);

    var InvoiceDetailedReportControl = baseType.extend({
        events: events,

        GetType: function () {
            return ps.InvoiceDetailedReportControl;
        },

        init: function (options) {
            var that = this;

            options.LoadDataOnInit = false;

            that._FinancialYearID = cmn.GetUserActiveFinancialYearID();
            cmn.InitFinancialOpList(options, that._FinancialYearID);

            options.DataListFullName = "ps.InvoiceDetailedReport";
            afw.DataListControl.fn.init.call(that, options);

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
                            Title: "از تاریخ ثبت",
                            ControlType: "Date",
                            CompareOperator: ">=",
                            DefaultValue: activeFinancialYearStartDate,
                            IsFixed: true
                        },
                        {
                            FieldName: "IssueDate",
                            Title: "تا تاریخ ثبت",
                            ControlType: "Date",
                            CompareOperator: "<=",
                            DefaultValue: activeFinancialYearEndDate,
                            IsFixed: true
                        },
                       {
                           FieldName: "DocKind_Name",
                           Title: "نوع فاکتور",
                           ControlType: "ComboBox",
                           ComboBoxItems: [
                                { ID: "", Title: "" },
                                { ID: "SalesInvoice", Title: "فروش" },
                                { ID: "BuyInvoice", Title: "خرید" },
                                { ID: "ReturnFromSalesInvoice", Title: "برگشت از فروش" },
                                { ID: "ReturnFromBuyInvoice", Title: "برگشت از خرید" }],
                           ComboBoxDataTextField: "Title",
                           ComboBoxDataValueField: "ID",
                           IsFixed: true
                       },
                        {
                           FieldName: "IssueDate",
                           Title: "تاریخ صدور",
                           ControlType: "Date"
                       },
                       {
                           FieldName: "SourceProforma_CreatorUser_ID",
                           Title: "صادرکننده پیش فاکتور",
                           ControlType: "Lookup",
                           LookupDataListFullName: "sia.SystemUsersList",
                           LookupEntityCaptionFieldName: "UserName_Text",
                           LookupControlType: "Advanced"
                       },
                       {
                           FieldName: "CreatorUser_ID",
                           Title: "صادرکننده",
                           ControlType: "Lookup",
                           LookupDataListFullName: "sia.SystemUsersList",
                           LookupEntityCaptionFieldName: "UserName_Text",
                           LookupControlType: "Advanced"
                       },
                       {
                           FieldName: "CustomerOrSeller_ID",
                           Title: "خریدار یا فروشنده",
                           ControlType: "Lookup",
                           LookupDataListFullName: "cmn.Persons",
                           LookupEntityCaptionFieldName: "FullName",
                           LookupControlType: "Advanced"
                       },
                       {
                           FieldName: "CityID",
                           Title: "شهر",
                           ControlType: "Lookup",
                           LookupDataListFullName: "cmn.Cities",
                           LookupEntityCaptionFieldName: "Name",
                           LookupControlType: "Advanced"
                       },
                       {
                           FieldName: "StateID",
                           Title: "استان",
                           ControlType: "Lookup",
                           LookupDataListFullName: "cmn.States",
                           LookupEntityCaptionFieldName: "Name",
                           LookupControlType: "Advanced"
                       },
                       {
                           FieldName: "TechnicalName",
                           Title: "نام فنی",
                           ControlType: "TextBox",
                           CompareOperator: "like"
                       },
                       {
                           FieldName: "StuffDef_ID",
                           Title: "کالا",
                           ControlType: "Lookup",
                           LookupDataListFullName: "cmn.StuffDefs",
                           LookupEntityCaptionFieldName: "Name",
                           LookupControlType: "Advanced"
                       },
                       {
                           FieldName: "Custom_CodeAnbar",
                           Title: "ردیف انبار",
                           ControlType: "TextBox",
                           CompareOperator: "like"
                       },
                       {
                           FieldName: "Custom_CodeHesabdari",
                           Title: "کد حسابداری",
                           ControlType: "TextBox",
                           CompareOperator: "like"
                       },
                       {
                           FieldName: "Quantity",
                           Title: "تعداد",
                           ControlType: "Numeric"
                       },
                       {
                           FieldName: "UnitPrice",
                           Title: "فی",
                           ControlType: "Numeric"
                       },
                       {
                           FieldName: "TotalPrice",
                           Title: "قیمت کل",
                           ControlType: "Numeric"
                       },
                       {
                           FieldName: "InvoiceNumber",
                           Title: "شماره فاکتور",
                           ControlType: "Numeric"
                       },
                       {
                           FieldName: "RequestNumber",
                           Title: "شماره درخواست",
                           ControlType: "Numeric"
                       },
                       {
                           FieldName: "Custom_TavanKva",
                           Title: "توان",
                           ControlType: "Numeric"
                       },
                       {
                           FieldName: "Custom_Esteghrar",
                           Title: "استقرار",
                           ControlType: "TextBox",
                           CompareOperator: "like"
                       },
                       {
                           FieldName: "Custom_Phase",
                           Title: "فاز",
                           ControlType: "Numeric"
                       },
                       {
                           FieldName: "Model",
                           Title: "مدل",
                           ControlType: "TextBox",
                           CompareOperator: "like"
                       },
                       {
                           FieldName: "Brand",
                           Title: "برند",
                           ControlType: "TextBox",
                           CompareOperator: "like"
                       },
                       {
                           FieldName: "Custom_Battery",
                           Title: "محدودیت باطری",
                           ControlType: "TextBox",
                           CompareOperator: "like"
                       },
                       {
                           FieldName: "MainCategoryID",
                           Title: "گروه اصلی کالا",
                           filtersFieldControlName: "MainCategoryTitleLookup",
                           ControlType: "Lookup",
                           LookupDataListFullName: "cmn.StuffMainCategories",
                           LookupEntityCaptionFieldName: "Title",
                           LookupControlType: "Advanced"
                       },
                       {
                           FieldName: "SubCategoryID",
                           Title: "گروه فرعی کالا",
                           ControlType: "Lookup",
                           LookupDataListFullName: "cmn.StuffSubCategories",
                           LookupEntityCaptionFieldName: "Title",
                           LookupControlType: "Advanced"
                       }]
                });
            that._FilterControl.bind("FilterChanged", function (e) { that._FilterControl_FilterChanged(e); });
            
            that._VDockPanel.AppendPane();
            that._VDockPanel.SetPaneSizeSetting(that._VDockPanel.Panes.length - 1, 45);

            that._FooterControl = afw.uiApi.CreateSavedFormByName(
                that._VDockPanel.Panes[that._VDockPanel.Panes.length-1],
                "ps.InvoiceDetailedReportForm_Footer");

            that.SetRowDoubleClickHandler(function (e) { });
            that._SetFooterLables();

            that.LoadData();
        },

        _FilterControl_FilterChanged: function (e) {
            var that = this;

            that._SetFooterLables();
            that.LoadData();
        },

        _GetTotalFilterExpression: function () {
            var that = this;

            var filterExpression = afw.DataListControl.fn._GetTotalFilterExpression.call(that);
            var filter = that._FilterControl.GetFilterExpression();
            if (!ValueIsEmpty(filter)) {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";

                filterExpression += filter;
            }

            if (!filterExpression.includes("DocKind_Name"))
                return "1 = 2"

            return filterExpression;
        },

        _CreateToolbar: function () {
            var that = this;

            afw.DataListControl.fn._CreateToolbar.call(that);
            that._ToolBar = that.FindControl(that.GetName() + "_ToolBar");
            },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            afw.DataListControl.fn._OnToolbarButtonClicked.call(that, buttonKey);            
        },

        _SetFooterLables: function () {
            var that = this;
            
            var filterExpression = that._GetTotalFilterExpression();

            afw.uiApi.CallServerMethodAsync("ps.GetInvoiceDetailedReportSummaryData", [filterExpression],
                        function (result) {
                            if (that._IsDestroying)
                                return;

                            if (result.HasError)
                                afw.ErrorDialog.Show(result.ErrorMessage);
                            else {
                                that._FooterControl.FindControl("TotalInvoicesStuffQuantityLabel").SetText(afw.BaseUtils.FormatNumber(result.Value.GetFieldValue("TotalInvoicesStuffQuantity")));
                                that._FooterControl.FindControl("TotalPriceSumLabel").SetText(afw.BaseUtils.FormatNumber(result.Value.GetFieldValue("TotalPriceSum")));
                                that._FooterControl.FindControl("TotalPriceAfterDiscountSumLabel").SetText(afw.BaseUtils.FormatNumber(result.Value.GetFieldValue("TotalPriceAfterDiscountSum")));
                                that._FooterControl.FindControl("TaxAndTollSumLabel").SetText(afw.BaseUtils.FormatNumber(result.Value.GetFieldValue("TaxAndTollSum")));
                            }
                        });
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

    InvoiceDetailedReportControl.TypeName = typeName;
    InvoiceDetailedReportControl.BaseType = baseType;
    InvoiceDetailedReportControl.Events = events;


    ps.InvoiceDetailedReportControl = InvoiceDetailedReportControl;
})();
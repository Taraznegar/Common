(function () {
    var typeName = "ps.ReturnFromBuyListControl";
    var baseType = afw.DataListControl;
    var events = afw.DataListControl.Events.concat([]);

    var ReturnFromBuyListControl = baseType.extend({
        events: events,

        GetType: function () {
            return ps.ReturnFromBuyListControl;
        },

        init: function (options) {
            var that = this;

            that._Mode = options.Mode;

            that._ActiveFinancialYearID = cmn.GetUserActiveFinancialYearID();
            cmn.InitFinancialOpList(options, that._ActiveFinancialYearID);
            
            options.LoadDataOnInit = false;

            if ("CustomOptions" in options && options.CustomOptions != null) {
                var customOptions = options.CustomOptions;

                if ("Mode" in customOptions)
                    that._Mode = customOptions.Mode;
            }

            options.DataListFullName = "ps.ReturnFromBuyList";
            afw.DataListControl.fn.init.call(that, options);

            if (!ValueIsEmpty(that._Mode) && that._Mode.EndsWith("Lookup")) {
                //Hide datalist toolBar
                that._VDockPanel.Panes[0].SetSizeSetting(1, 0);
            }

            that._VDockPanel.InsertPane(2, { Size: 100 }, true);

            var activeFinancialYearStartDate = null;
            var activeFinancialYearEndDate = null;
            var activeFinancialYearEntity = cmn.GetUserActiveFinancialYearEntity();
            if (activeFinancialYearEntity != null) {
                activeFinancialYearStartDate = activeFinancialYearEntity.GetFieldValue("StartDate");
                activeFinancialYearEndDate = activeFinancialYearEntity.GetFieldValue("EndDate");
            }

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
                            FieldName: "ReturnFromBuyNumber",
                            Title: "شماره برگشت از خرید",
                            ControlType: "Numeric"
                        },
                        {
                            FieldName: "InvoiceNumber",
                            Title: "شماره فاکتور",
                            ControlType: "Numeric"
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
                            FieldName: "FinancialDocType",
                            Title: "نوع سند مالی",
                            ControlType: "OptionSet",
                            OptionSetFullName: "cmn.FinancialDocType",
                            OptionSetValueDataMember: "Name"
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
                            FieldName: "FinalAmount",
                            Title: "مبلغ نهایی",
                            ControlType: "Numeric",
                            CompareOperator: "like"
                        },
                        {
                            FieldName: "TotalTaxAndToll",
                            Title: "عوارض و مالیات",
                            ControlType: "Numeric",
                            CompareOperator: "like"
                        },
                        {
                            FieldName: "TotalDiscount",
                            Title: "تخفیف",
                            ControlType: "Numeric",
                            CompareOperator: "like"
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
                            FieldName: "CreatorUser",
                            Title: "کاربر ایجاد کننده",
                            ControlType: "Lookup",
                            LookupDataListFullName: "afw.SystemUsers",
                            LookupEntityCaptionFieldName: "DisplayName",
                            LookupControlType: "Advanced"
                        },

                    ]
                });
            that._FilterControl.bind("FilterChanged", function (e) { that._FilterControl_FilterChanged(e); });

            that.LoadData();
        },

        _CreateToolbar: function () {
            var that = this;

            afw.DataListControl.fn._CreateToolbar.call(that);
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            if (buttonKey == "New") {
                if (that._ActiveFinancialYearID == null) {
                    afw.ErrorDialog.Show("سال مالی فعال تعیین نشده است.");
                    return;
                }
            }

            afw.DataListControl.fn._OnToolbarButtonClicked.call(that, buttonKey);
        },

        _FilterControl_FilterChanged: function (e) {
            var that = this;

            that.LoadData();
        },

        _GetTotalFilterExpression: function () {
            var that = this;

            var filterExpression = afw.DataListControl.fn._GetTotalFilterExpression.call(that);

            if (that._FilterControl == null)
                return filterExpression;
            else if (!ValueIsEmpty(that._FilterControl.GetFilterExpression())) {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";

                filterExpression += that._FilterControl.GetFilterExpression();
            }

            return filterExpression;
        },

        _LoadData: function () {
            var that = this;

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

    ReturnFromBuyListControl.TypeName = typeName;
    ReturnFromBuyListControl.BaseType = baseType;
    ReturnFromBuyListControl.Events = events;


    ps.ReturnFromBuyListControl = ReturnFromBuyListControl;
})();

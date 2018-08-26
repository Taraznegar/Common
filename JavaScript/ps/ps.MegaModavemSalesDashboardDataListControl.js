(function () {
    var typeName = "ps.MegaModavemSalesDashboardDataListControl";
    var baseType = afw.DataListControl;
    var objectEvents = afw.DataListControl.Events.concat([]);

    var MegaModavemSalesDashboardDataListControl = baseType.extend({
        events: objectEvents,

        GetType: function () {
            return ps.MegaModavemSalesDashboardDataListControl;
        },

        init: function (options) {
            var that = this;

            options.LoadDataOnInit = false;
            options.DataListFullName = "ps.MegaModavemSalesDashboardDataList";
            afw.DataListControl.fn.init.call(that, options);

            if ("DashBoardForm" in options)
                that._DashBoardForm = options.DashBoardForm;
            /*
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
                        }]
                });

            that._FilterControl.bind("FilterChanged", function (e) { that._FilterControl_FilterChanged(e); });

            that.LoadData();
            */
        },
        
        _GetTotalFilterExpression: function () {
            var that = this;

            var filterExpression = afw.DataListControl.fn._GetTotalFilterExpression.call(that);

            if (!ValueIsEmpty(that._DashBoardForm)) {
                var filter = that._DashBoardForm.GetFilterExpression();

                if (!ValueIsEmpty(filter)) {
                    if (!ValueIsEmpty(filterExpression))
                        filterExpression += " and ";

                    filterExpression += filter;
                }
            }
            /*
            if (!ValueIsEmpty(that._FilterControl)) {
                var filter = that._FilterControl.GetFilterExpression();

                if (!ValueIsEmpty(filter)) {
                    if (!ValueIsEmpty(filterExpression))
                        filterExpression += " and ";

                    filterExpression += filter;
                }
            }
            */

            return filterExpression;
        },

        _LoadData: function () {
            var that = this;

            afw.DataListControl.fn._LoadData.call(that); 
        },

        _FilterControl_FilterChanged: function (e) {
            var that = this;

            that.LoadData();
        },

        _OnCreatingColumn: function (columnInfo) {
        },

        _CreateToolbar: function () {
            var that = this;

            afw.DataListControl.fn._CreateToolbar.call(that);
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            afw.DataListControl.fn._OnToolbarButtonClicked.call(that, buttonKey);
        },

        _OnLoadingData: function () {
            var that = this;

            afw.DataListControl.fn._OnLoadingData.call(that);
        },

        _OnDataLoaded: function () {
            var that = this;

            afw.DataListControl.fn._OnDataLoaded.call(that);
        },

        _ShowEntityWindow: function (entity, formMode, options) {
            var that = this;

            return afw.DataListControl.fn._ShowEntityWindow.call(that, entity, formMode, options);
        },

        _OnEntityWindowOpened: function (entityWindow) {
            var that = this;

            afw.DataListControl.fn._OnEntityWindowOpened.call(that, entityWindow);
        },

        _OnEntityWindowClosed: function (entityWindow) {
            var that = this;

            afw.DataListControl.fn._OnEntityWindowClosed.call(that, entityWindow);
        },

        _EntitiesGridView_RowDoubleClick: function (e) {
            var that = this;

            afw.DataListControl.fn._EntitiesGridView_RowDoubleClick.call(that, e);
        },

        _OnPreviewKeyUp: function (e) {
            var that = this;

            afw.DataListControl.fn._OnPreviewKeyUp.call(that, e);
        },

        _DoDestroy: function () {
            var that = this;

            afw.DataListControl.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    MegaModavemSalesDashboardDataListControl.TypeName = typeName;
    MegaModavemSalesDashboardDataListControl.BaseType = baseType;
    MegaModavemSalesDashboardDataListControl.Events = objectEvents;


    ps.MegaModavemSalesDashboardDataListControl = MegaModavemSalesDashboardDataListControl;
})();

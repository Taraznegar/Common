(function () {
    var typeName = "ps.CanceledSalesInvoiceInfosControl";
    var baseType = afw.DataListControl;
    var objectEvents = afw.DataListControl.Events.concat([]);

    var CanceledSalesInvoiceInfosControl = baseType.extend({
        events: objectEvents,

        GetType: function () {
            return ps.CanceledSalesInvoiceInfosControl;
        },

        init: function (options) {
            var that = this;

            var activeFinancialYearID = cmn.GetUserActiveFinancialYearID();
            cmn.InitFinancialOpList(options, activeFinancialYearID);

            options.LoadDataOnInit = false;

            options.DataListFullName = "ps.CanceledSalesInvoiceInfos";
            afw.DataListControl.fn.init.call(that, options);

            that._VDockPanel.InsertPane(2, { Size: 100 }, true);

            that._FilterControl = afw.uiApi.CreateSavedFormByName(
                that._VDockPanel.Panes[2],
                "cmn.DataListAdvancedFilterControl", {
                    ColumnsFilterInfo: [                       
                        {
                            FieldName: "InvoiceNumber",
                            Title: "شماره فاکتور",
                            ControlType: "Numeric",
                            IsFixed: true
                        },
                        {
                            FieldName: "FinancialYear",
                            Title: "سال مالی",
                            ControlType: "Lookup",
                            LookupDataListFullName: "cmn.FinancialYears",
                            LookupEntityCaptionFieldName: "YearNo",
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
                            FieldName: "FinancialDocType",
                            Title: "نوع سند مالی",
                            ControlType: "OptionSet",
                            OptionSetFullName: "cmn.FinancialDocType",
                            OptionSetValueDataMember: "Name"
                        }]
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

        _GetTotalFilterExpression: function () {
            var that = this;

            var filterExpression = afw.DataListControl.fn._GetTotalFilterExpression.call(that);

            if (!ValueIsEmpty(that._FilterControl.GetFilterExpression())) {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";

                filterExpression += that._FilterControl.GetFilterExpression();
            }

            return filterExpression;
        },

        _FilterControl_FilterChanged: function (e) {
            var that = this;

            that.LoadData();
        },

    });

    //Static Members:

    CanceledSalesInvoiceInfosControl.TypeName = typeName;
    CanceledSalesInvoiceInfosControl.BaseType = baseType;
    CanceledSalesInvoiceInfosControl.Events = objectEvents;


    ps.CanceledSalesInvoiceInfosControl = CanceledSalesInvoiceInfosControl;
})();


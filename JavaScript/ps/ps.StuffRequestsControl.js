(function () {
    var typeName = "ps.StuffRequestsControl";
    var baseType = afw.DataListControl;
    var events = afw.DataListControl.Events.concat([]);

    var StuffRequestsControl = baseType.extend({
        events: events,

        GetType: function () {
            return ps.StuffRequestsControl;
        },

        init: function (options) {
            var that = this;

            that._FinancialYearID = cmn.GetUserActiveFinancialYearID();
            cmn.InitFinancialOpList(options, that._FinancialYearID);

            options.LoadDataOnInit = false;
            options.DataListFullName = "ps.StuffRequests";
            afw.DataListControl.fn.init.call(that, options);

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
                            FieldName: "StuffRequestNumber",
                            Title: "شماره درخواست",
                            ControlType: "Numeric"
                        },
                        {
                            FieldName: "OrganizationUnit",
                            Title: "نوع درخواست",
                            ControlType: "Lookup",
                            LookupDataListFullName: "ps.RequestTypeList",
                            LookupEntityCaptionFieldName: "Title",
                            LookupControlType: "Simple"
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
                        }
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
                if (that._FinancialYearID != null)
                    afw.DataListControl.fn._OnToolbarButtonClicked.call(that, buttonKey);
                else {
                    afw.ErrorDialog.Show("سال مالی تعریف نشده است.");
                }
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

            var filter = afw.DataListControl.fn._GetTotalFilterExpression.call(that);

            var filterExpression = that._FilterControl.GetFilterExpression();
            if (that._FilterControl != null && !ValueIsEmpty(filterExpression)) {
                if (!ValueIsEmpty(filter))
                    filter += " and ";
                filter += filterExpression;
            }

            return filter;
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

    StuffRequestsControl.TypeName = typeName;
    StuffRequestsControl.BaseType = baseType;
    StuffRequestsControl.Events = events;


    ps.StuffRequestsControl = StuffRequestsControl;
})();

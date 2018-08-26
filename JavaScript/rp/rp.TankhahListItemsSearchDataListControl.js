(function () {
    var typeName = "rp.TankhahListItemsSearchDataListControl";
    var baseType = afw.DataListControl;
    var objectEvents = afw.DataListControl.Events.concat([]);

    var TankhahListItemsSearchDataListControl = baseType.extend({
        events: objectEvents,

        GetType: function () {
            return rp.TankhahListItemsSearchDataListControl;
        },

        init: function (options) {
            var that = this;

            options.LoadDataOnInit = false;

            that._FinancialYearID = cmn.GetUserActiveFinancialYearID();
            cmn.InitFinancialOpList(options, that._FinancialYearID);

            options.DataListFullName = "rp.TankhahListItemsSearchDataList";
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
                            FieldName: "TankhahItemRegisterDate",
                            Title: "از تاریخ پرداخت",
                            ControlType: "Date",
                            CompareOperator: ">=",
                            DefaultValue: activeFinancialYearStartDate,
                            IsFixed : true
                        },
                        {
                            FieldName: "TankhahItemRegisterDate",
                            Title: "تا تاریخ پرداخت",
                            ControlType: "Date",
                            CompareOperator: "<=",
                            DefaultValue: activeFinancialYearEndDate,
                            IsFixed: true
                        },
                        {
                            FieldName: "DocNo",
                            Title: "شماره سند",
                            ControlType: "Numeric",
                            CompareOperator: "like"
                        },
                        {
                            FieldName: "TankhahGardanID",
                            Title: "تنخواه گردان",
                            ControlType: "Lookup",
                            LookupDataListFullName: "rp.TankhahGardanList",
                            LookupEntityCaptionFieldName: "Description",
                            LookupControlType: "Simple"
                        },
                        {
                            FieldName: "FinancialGroup",
                            Title: "گروه مالی",
                            ControlType: "Lookup",
                            LookupDataListFullName: "cmn.FinancialGroupList",
                            LookupEntityCaptionFieldName: "Title",
                            LookupControlType: "Simple"
                        },
                        {
                            FieldName: "TankhahItemRegisterDate",
                            Title: "تاریخ پرداخت",
                            ControlType: "Date",                            
                        },
                        {
                            FieldName: "TankhahIssueDate",
                            Title: "تاریخ ثبت تنخواه",
                            ControlType: "Date",                           
                        },
                        {
                            FieldName: "TankhahNo",
                            Title: "شماره تنخواه",
                            ControlType: "Numeric",
                            CompareOperator: "like"
                        },
                        {
                            FieldName: "Amount",
                            Title: "مبلغ",
                            ControlType: "Numeric",
                            CompareOperator: "like"
                        },
                        {
                            FieldName: "TankhahItemDescription",
                            Title: "شرح",
                            ControlType: "TextBox",
                            CompareOperator: "like"
                        },
                        {
                            FieldName: "TankhahDescription",
                            Title: "شرح تنخواه",
                            ControlType: "TextBox",
                            CompareOperator:"like"
                        },                        
                        {
                            FieldName: "TankhahTypeID",
                            Title: "نوع تنخواه",
                            ControlType: "ComboBox",
                            ControlType: "Lookup",
                            LookupDataListFullName: "rp.TankhahTypesList",
                            LookupEntityCaptionFieldName: "Title",
                            LookupControlType: "Simple"
                        },
                        {
                            FieldName: "TankhahPersonID",
                            Title: "شخص تنخواه گردان",
                            ControlType: "Lookup",
                            LookupDataListFullName: "cmn.Persons",
                            LookupEntityCaptionFieldName: "FullName",
                            LookupControlType: "Advanced",                            
                        },
                        {
                            FieldName: "TankhahItemPersonID",
                            Title: "طرف حساب",
                            ControlType: "Lookup",
                            LookupDataListFullName: "cmn.Persons",
                            LookupEntityCaptionFieldName: "FullName",
                            LookupControlType: "Advanced",
                        },
                        {
                            FieldName: "CostCenter",
                            Title: "مرکز هزینه",
                            ControlType: "Lookup",
                            LookupDataListFullName: "cmn.CostCenters",
                            LookupEntityCaptionFieldName: "Name",
                            LookupControlType: "Simple"
                        },
                        {
                            FieldName: "Project",
                            Title: "پروژه",
                            ControlType: "Lookup",
                            LookupDataListFullName: "cmn.Projects",
                            LookupEntityCaptionFieldName: "Name",
                            LookupControlType: "Advanced",
                        },
                        {
                            FieldName: "OrganizationUnit",
                            Title: "واحد سازمانی",
                            ControlType: "Lookup",
                            LookupDataListFullName: "cmn.OrganizationInformationList",
                            LookupEntityCaptionFieldName: "Name",
                            LookupControlType: "Simple",
                        },
                        {
                            FieldName: "TankhahDef",
                            Title: "طرف حساب تنخواه",
                            ControlType: "Lookup",
                            LookupDataListFullName: "rp.TankhahDefList",
                            LookupEntityCaptionFieldName: "TankhahDefTitle",
                            LookupControlType: "Simple",
                        }
                        
                    ]
                });

            that._FilterControl.bind("FilterChanged", function (e) { that._FilterControl_FilterChanged(e); });
            that.LoadData();
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
            filterExpression += String.Format("FinancialYear = '{0}' ", that._FinancialYearID);

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

        _CreateToolbar: function () {
            var that = this;

            afw.DataListControl.fn._CreateToolbar.call(that);
            that._ToolBar = that.FindControl(that.GetName() + "_ToolBar");
            that._ToolBar.AddButton("ClearFilters", "پاک کردن فیلترها", { Image: "resource(cmn.Clear)" });
            if (that._ToolBar.ButtonExists("New"))
                that._ToolBar.RemoveButton("New");
            if (that._ToolBar.ButtonExists("Reload"))
                that._ToolBar.RemoveButton("Reload");
            if (that._ToolBar.ButtonExists("Delete"))
                that._ToolBar.RemoveButton("Delete");
            if (that._ToolBar.ButtonExists("Edit"))
                that._ToolBar.RemoveButton("Edit");
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            afw.DataListControl.fn._OnToolbarButtonClicked.call(that, buttonKey);
            if (buttonKey == "ClearFilters") {
                that._QuickSearchTextBox = that.FindControl(that.GetName() + "_QuickSearchTextBox");
                that._QuickSearchTextBox.SetValue("");
                that._FilterControl.ResetFilters();
            }
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    TankhahListItemsSearchDataListControl.TypeName = typeName;
    TankhahListItemsSearchDataListControl.BaseType = baseType;
    TankhahListItemsSearchDataListControl.Events = objectEvents;


    rp.TankhahListItemsSearchDataListControl = TankhahListItemsSearchDataListControl;
})();

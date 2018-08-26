(function () {
    var typeName = "acc.AccDocItemsControl";
    var baseType = afw.DataListControl;
    var events = afw.DataListControl.Events.concat([]);

    var AccDocItemsControl = baseType.extend({
        events: events,

        GetType: function () {
            return acc.AccDocItemsControl;
        },

        init: function (options) {
            var that = this;

            options.DataListFullName = "acc.AccDocItems";
            options.LoadDataOnInit = false;
            afw.DataListControl.fn.init.call(that, options);

            that._VDockPanel.InsertPane(2, { Size: 90 }, true);

            var activeFinancialYearStartDate = null;
            var activeFinancialYearEndDate = null;
            var activeFinancialYearEntity = cmn.GetUserActiveFinancialYearEntity();
            if (activeFinancialYearEntity != null) {
                activeFinancialYearStartDate = activeFinancialYearEntity.GetFieldValue("StartDate");
                activeFinancialYearEndDate = activeFinancialYearEntity.GetFieldValue("EndDate");
            }

            that._FilterControl = afw.uiApi.CreateSavedFormByName(
                that._VDockPanel.Panes[2],
                "cmn.DataListAdvancedFilterControl",
                {
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
                            FieldName: "DocNo",
                            Title: "شماره مرجع",
                            ControlType: "Numeric"
                        },
                        {
                            FieldName: "FinancialDocType",
                            Title: "نوع سند مالی",
                            ControlType: "OptionSet",
                            OptionSetFullName: "cmn.FinancialDocType",
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
                            FieldName: "CreatorUser",
                            Title: "کاربر",
                            ControlType: "Lookup",
                            LookupDataListFullName: "afw.SystemUsers",
                            LookupEntityCaptionFieldName: "DisplayName",
                            LookupControlType: "Advanced"
                        },
                        {
                            FieldName: "Person",
                            Title: "شخص",
                            ControlType: "Lookup",
                            LookupDataListFullName: "cmn.Persons",
                            LookupEntityCaptionFieldName: "FullName",
                            LookupControlType: "Advanced"
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
                            FieldName: "ForeignCurrency",
                            Title: "ارزی",
                            ControlType: "Lookup",
                            LookupDataListFullName: "cmn.ForeignCurrencyBriefLookupList",
                            LookupEntityCaptionFieldName: "Name",
                            LookupControlType: "Simple"
                        },
                        {
                            FieldName: "Project",
                            Title: "پروژه",
                            ControlType: "Lookup",
                            LookupDataListFullName: "cmn.Projects",
                            LookupEntityCaptionFieldName: "Name",
                            LookupControlType: "Advanced"
                        },
                        {
                            FieldName: "IssueDate",
                            Title: "تاریخ صدور",
                            ControlType: "Date"
                        },
                        {
                            FieldName: "DebtorAmount",
                            Title: "بدهکار",
                            ControlType: "Numeric",
                            CompareOperator: "like"
                        },
                        {
                            FieldName: "CreditorAmount",
                            Title: "بستانکار",
                            ControlType: "Numeric",
                            CompareOperator: "like"
                        },
                        {
                            FieldName: "KolCode",
                            Title: "کد کل",
                            ControlType: "Numeric"
                        },
                        {
                            FieldName: "AccDocItemDes",
                            Title: "توضیحات آیتم سند",
                            ControlType: "TextBox",
                            CompareOperator: "like"
                        },
                        {
                            FieldName: "KolName",
                            Title: "شرح کل",
                            ControlType: "TextBox",
                            CompareOperator: "like"
                        },
                        {
                            FieldName: "TafsiliName",
                            Title: "شرح تفصیلی",
                            ControlType: "TextBox",
                            CompareOperator: "like"
                        },
                        {
                            FieldName: "TafsiliCode",
                            Title: "کد تفصیلی",
                            ControlType: "Numeric",
                            CompareOperator: "like"
                        },
                        {
                            FieldName: "MoinCode",
                            Title: "کد معین",
                            ControlType: "Numeric",
                            CompareOperator: "like"
                        },
                        {
                            FieldName: "MoinName",
                            Title: "شرح معین",
                            ControlType: "TextBox",
                            CompareOperator: "like"
                        },
                        {
                            FieldName: "FinancialAccountCode",
                            Title: "کد حساب شخص",
                            ControlType: "Numeric",
                            CompareOperator: "like"
                        },
                        {
                            FieldName: "AccDocIsActive",
                            Title: "فعال بودن سند",
                            ControlType: "ComboBox",
                            ComboBoxItems: [
                                { ID: "", Title: " " },
                                { ID: "1", Title: "بلی" },
                                { ID: "0", Title: "خیر" }],
                            ComboBoxDataTextField: "Title",
                            ComboBoxDataValueField: "ID",
                        },
                        {
                            FieldName: "AccDocItemIsActive",
                            Title: "فعال بودن آیتم سند",
                            ControlType: "ComboBox",
                            ComboBoxItems: [
                                { ID: "", Title: " " },
                                { ID: "1", Title: "بلی" },
                                { ID: "0", Title: "خیر" }],
                            ComboBoxDataTextField: "Title",
                            ComboBoxDataValueField: "ID",
                        }
                    ]
                });

            that._FilterControl.bind("FilterChanged", function (e) { that._FilterControl_FilterChanged(e); });
            that.LoadData();
        },

        _CreateToolbar: function () {
            var that = this;

            afw.DataListControl.fn._CreateToolbar.call(that);

            that._Toolbar = that.FindControl(that.GetName() + "_Toolbar");
            that._Toolbar.RemoveButton("New");
            that._Toolbar.RemoveButton("Edit");
            that._Toolbar.RemoveButton("Delete");

            that._Toolbar.AddButton("AccDocInput", "ورود به سند", { Image: "resource(cmn.Document)" });
            },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            if (buttonKey == "AccDocInput") {
                var selectedEntities = that._EntitiesGridView.GetSelectedRows();
                if (selectedEntities.length == 0) {
                    afw.ErrorDialog.Show("ابتدا یک سطر را انتخاب نمایید.");
                }
                else {
                    var accDocID = selectedEntities[0].DataItem["AccDoc"];
                    var accDocEntity = afw.uiApi.FetchEntity("acc.AccDoc", String.Format("ID = '{0}'", accDocID));

                    if (cmn.OpenWindowExists())
                        afw.EntityHelper.OpenEntityFormInWindow(accDocEntity, "acc.AccDocEditForm", "Edit", {
                            Title: "سند حسابداری"
                        });
                    else
                        afw.EntityHelper.OpenEntityFormInMdiContainer(accDocEntity, "acc.AccDocEditForm", "Edit", {
                            Title: "سند حسابداری"
                        });
                }
            }
            else
                afw.DataListControl.fn._OnToolbarButtonClicked.call(that, buttonKey);
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
        },

        _FilterControl_FilterChanged: function (e) {
            var that = this;

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

            return filterExpression;
        },

        _LoadData: function () {
            var that = this;

            if (that._FilterControl == null)
                return;

            afw.DataListControl.fn._LoadData.call(that); 
        }
    });

    //Static Members:

    AccDocItemsControl.TypeName = typeName;
    AccDocItemsControl.BaseType = baseType;
    AccDocItemsControl.Events = events;
     
    acc.AccDocItemsControl = AccDocItemsControl;
})();
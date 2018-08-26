(function () {
    var typeName = "wm.StuffsStockReportControl";
    var baseType = afw.DataListControl;
    var events = afw.DataListControl.Events.concat([]);

    var StuffsStockReportControl = baseType.extend({
        events: events,

        GetType: function () {
            return wm.StuffsStockReportControl;
        },

        init: function (options) {
            var that = this;

            var activeFinancialYearEntity = cmn.GetUserActiveFinancialYearEntity();

            options.DataListFullName = "wm.StuffsStockReport";
            afw.DataListControl.fn.init.call(that, options);

            var activeFinancialYearStartDate = null;
            var activeFinancialYearEndDate = null;
            if (activeFinancialYearEntity != null) {
                activeFinancialYearStartDate = activeFinancialYearEntity.GetFieldValue("StartDate");
                activeFinancialYearEndDate = activeFinancialYearEntity.GetFieldValue("EndDate");
            }

            that._QuickSearchDockPanel.AppendPane();
            that._QuickSearchDockPanel.SetPaneSizeSetting(1, 200);
            that._SeparateByBatchNumbersCheckBox = new afw.CheckBox({
                Name: "SeparateByBatchNumbersCheckBox",
                ParentControl: that._QuickSearchDockPanel.Panes[1],
                LabelVisible: true,
                LabelText: "به تفکیک شماره بچ"
            });
            that._SeparateByBatchNumbersCheckBox.SetChecked(false);
            that._SeparateByBatchNumbersCheckBox.BindEvent("CheckedChanged", function (e) { that._SeparateByBatchNumbersCheckBox_CheckedChanged(e); });

            that._QuickSearchDockPanel.AppendPane();
            that._QuickSearchDockPanel.SetPaneSizeSetting(2, 200);
            that._DisplayZeroStocksCheckBox = new afw.CheckBox({
                Name: "DisplayZeroStocksCheckBox",
                ParentControl: that._QuickSearchDockPanel.Panes[2],
                LabelVisible: true,
                LabelText: "نمایش موجودی صفر"
            });
            that._DisplayZeroStocksCheckBox.SetChecked(false);
            that._DisplayZeroStocksCheckBox.BindEvent("CheckedChanged", function (e) { that._DisplayZeroStocksCheckBox_CheckedChanged(e); });

            that.SetParameterNames(["SeparateByBatchNumbers", "DisplayZeroStocks"]);


            that._VDockPanel.InsertPane(2, { Size: 100 }, true);

            that._FilterControl = afw.uiApi.CreateSavedFormByName(
                that._VDockPanel.Panes[2],
                "cmn.DataListAdvancedFilterControl", {
                    ColumnsFilterInfo: [
                        //{
                        //    FieldName: "IssueDate",
                        //    Title: "از تاریخ صدور رسید/حواله",
                        //    ControlType: "Date",
                        //    CompareOperator: ">=",
                        //    DefaultValue: activeFinancialYearStartDate,
                        //    IsFixed: true
                        //},
                        {
                            FieldName: "IssueDate",
                            Title: "تا تاریخ",
                            ControlType: "Date",
                            CompareOperator: "<=",
                            DefaultValue: activeFinancialYearEndDate,
                            IsFixed: true
                        },
                        {
                            FieldName: "DisplayName",
                            Title: "کالا",
                            ControlType: "TextBox",
                            CompareOperator: "like"
                        },
                        {
                            FieldName: "StuffDef.Code",
                            Title: "کد",
                            ControlType: "TextBox"
                        },
                        {
                            FieldName: "StuffLocation",
                            Title: "انبار",
                            ControlType: "Lookup",
                            LookupDataListFullName: "cmn.StuffLocations",
                            LookupEntityCaptionFieldName: "Name",
                            LookupControlType: "Simple"
                        },
                        {
                            FieldName: "StuffStatus",
                            Title: "وضعیت",
                            ControlType: "Lookup",
                            LookupDataListFullName: "wm.StuffStatusList",
                            LookupEntityCaptionFieldName: "Title",
                            LookupControlType: "Simple"
                        },
                        {
                            FieldName: "BatchNumber",
                            Title: "شماره بچ",
                            ControlType: "TextBox"
                        },
                        {
                            FieldName: "Custom_CodeAnbar",
                            Title: "ردیف انبار",
                            ControlType: "TextBox"
                        },
                        {
                            FieldName: "MainCategory",
                            Title: "گروه اصلی",
                            ControlType: "Lookup",
                            LookupDataListFullName: "cmn.StuffMainCategories",
                            LookupEntityCaptionFieldName: "Title",
                            LookupControlType: "Simple"
                        },
                        {
                            FieldName: "SubCategory",
                            Title: "گروه فرعی",
                            ControlType: "Lookup",
                            LookupDataListFullName: "cmn.StuffSubCategories",
                            LookupEntityCaptionFieldName: "Title",
                            LookupControlType: "Simple"
                        },
                        {
                            FieldName: "Custom_TavanKva",
                            Title: "توان(KVA)",
                            ControlType: "Numeric",
                            CompareOperator: "like"
                        },
                        {
                            FieldName: "Custom_CodeHesabdari",
                            Title: "کد حسابداری",
                            ControlType: "TextBox"
                        },
                        {
                            FieldName: "BarCode",
                            Title: "بارکد",
                            ControlType: "TextBox"
                        }]
                });
            that._FilterControl.bind("FilterChanged", function (e) { that._FilterControl_FilterChanged(e); });

            that.LoadData();
        },

        _CreateToolbar: function () {
            var that = this;

            afw.DataListControl.fn._CreateToolbar.call(that);

            that._Toolbar = that.FindControl(that.GetName() + "_Toolbar");
            that._Toolbar.AddButton("BarCodePrint", "چاپ بارکد");
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            afw.DataListControl.fn._OnToolbarButtonClicked.call(that, buttonKey);

            if (buttonKey == "BarCodePrint") {
                that._BarCodePrint();
            }
        },

        _FilterControl_FilterChanged: function (e) {
            var that = this;

            that.LoadData();
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

        _LoadData: function () {
            var that = this;

            if (that._FilterControl == null)
                return;

            that.SetParameterValues([
                that._SeparateByBatchNumbersCheckBox.GetChecked() ? 1 : 0,
                that._DisplayZeroStocksCheckBox.GetChecked() ? 1 : 0,
            ]);

            afw.DataListControl.fn._LoadData.call(that);
        },

        _SeparateByBatchNumbersCheckBox_CheckedChanged: function (e) {
            var that = this;

            that.LoadData();
        },

        _DisplayZeroStocksCheckBox_CheckedChanged: function (e) {
            var that = this;

            that.LoadData();
        },

        _BarCodePrint: function () {
            var that = this;

            var barCodePrintWindow = afw.uiApi.OpenSavedFormWindow("cmn.BarCodePrintForm",
                {
                    Name: "PersonEditFormWindow",
                    Modal: true,
                    FormMode: "New"
                });
            barCodePrintWindow.SetTitle("چاپ بارکد");
            barCodePrintWindow.bind("Opened",
                   function (e) {
                       e.Sender.Center();
                   });

            barCodePrintWindow.bind("Close", function (e) { that._BarCodePrintWindowWindows_Close(e); });
        },

        _BarCodePrintWindowWindows_Close: function () {
            var that = this;

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

    StuffsStockReportControl.TypeName = typeName;
    StuffsStockReportControl.BaseType = baseType;
    StuffsStockReportControl.Events = events;


    wm.StuffsStockReportControl = StuffsStockReportControl;
})();
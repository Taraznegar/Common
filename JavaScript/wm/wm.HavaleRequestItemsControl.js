(function () {
    var typeName = "wm.HavaleRequestItemsControl";
    var baseType = afw.DataListControl;
    var objectEvents = afw.DataListControl.Events.concat([]);

    var HavaleRequestItemsControl = baseType.extend({
        events: objectEvents,

        GetType: function () {
            return wm.HavaleRequestItemsControl;
        },

        init: function (options) {
            var that = this;

            options.DataListFullName = "wm.HavaleRequestItems";
            afw.DataListControl.fn.init.call(that, options);

            that._VDockPanel.InsertPane(2, { Size: 100 }, true);

            that._FilterControl = afw.uiApi.CreateSavedFormByName(
                that._VDockPanel.Panes[2],
                "cmn.DataListAdvancedFilterControl", {
                    ColumnsFilterInfo: [
                        {
                            FieldName: "RequestDateTime",
                            Title: "تاریخ درخواست حواله",
                            ControlType: "Date",
                            IsFixed: true
                        },
                        {
                            FieldName: "IssueDate",
                            Title: "تاریخ صدور عملیات مرتبط",
                            ControlType: "Date",
                            IsFixed: true
                        },
                        {
                            FieldName: "ReferenceDocNumber",
                            Title: "شماره عملیات مرتبط",
                            ControlType: "TextBox",
                            CompareOperator: "like"
                        },
                        {
                            FieldName: "RequestNumber",
                            Title: "شماره درخواست",
                            ControlType: "TextBox",
                            CompareOperator: "like"
                        },
                        {
                            FieldName: "ReferenceDocTypeName",
                            Title: "نوع درخواست",
                            ControlType: "TextBox",
                            CompareOperator: "like"
                        },
                        {
                            FieldName: "StuffID",
                            Title: "کالا",
                            ControlType: "Lookup",
                            LookupDataListFullName: "cmn.Stuffs",
                            LookupEntityCaptionFieldName: "DisplayName",
                            LookupControlType: "Advanced"
                        },
                        {
                            FieldName: "Tarafhesab",
                            Title: "شخص طرف حساب",
                            ControlType: "Lookup",
                            LookupDataListFullName: "cmn.Persons",
                            LookupEntityCaptionFieldName: "FullName",
                            LookupControlType: "Advanced"
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
                            FieldName: "OrganizationUnit",
                            Title: "واحد سازمانی",
                            ControlType: "Lookup",
                            LookupDataListFullName: "cmn.OrganizationInformationList",
                            LookupEntityCaptionFieldName: "Name",
                            LookupControlType: "Simple"
                        }]
                });
            that._FilterControl.bind("FilterChanged", function (e) { that._FilterControl_FilterChanged(e); });

            that.LoadData();

            that._RefreshItemsInterval =
                setInterval(function () {
                    that.LoadData();
                }, 300000);
        },

        _OnCreatingColumn: function (columnInfo) {
        },

        _CreateToolbar: function () {
            var that = this;

            afw.DataListControl.fn._CreateToolbar.call(that);

            that._Toolbar = that.FindControl(that.GetName() + "_Toolbar");
            that._Toolbar.AddButton("HavaleIssuing", "صدور حواله");
            that._Toolbar.AddButton("PrintHavale", "چاپ درخواست حواله", { Image: "resource(cmn.PrintToolbarIcon)" });
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            afw.DataListControl.fn._OnToolbarButtonClicked.call(that, buttonKey);

            var selectedEntities = that._EntitiesGridView.GetSelectedRows();
            if (ValueIsIn(buttonKey, ["PrintHavale"])) {
                if (selectedEntities.length == 0) {
                    afw.ErrorDialog.Show("ابتدا یک حواله را انتخاب نمایید.");
                    return;
                }
            }

            if (buttonKey == "PrintHavale") {
                that._PrintHavale(selectedEntities[0].DataItem["RefDocID"]);
            }

            if (buttonKey == "HavaleIssuing") {
                var refDocName = selectedEntities[0].DataItem["RefDocName"];
                var refDocFieldName = "RefDoc_";
                if (ValueIsEmpty(refDocName)) {
                    throw "refDocName in view(wm_HavaleRequestItemsView) is invalid";
                    return;
                }

                if (refDocName == "SalesProfomaInvoice") {
                    var havaleType = afw.uiApi.FetchEntity("wm.GhabzOrHavaleType", "Name = 'SalesProfomaHavale'");
                    if (havaleType == null) {
                        afw.ErrorDialog.Show("نوع حواله پیش فاکتور فروش تعریف نشده است.");
                        return;
                    }

                    refDocFieldName += "SalesInvoice";
                }

                if (refDocName == "AmaniSalesProformaInvoice") {
                    var havaleType = afw.uiApi.FetchEntity("wm.GhabzOrHavaleType", "Name = 'AmaniSalesProfomaHavale'");
                    if (havaleType == null) {
                        afw.ErrorDialog.Show("نوع حواله پیش فاکتور امانی تعریف نشده است.");
                        return;
                    }

                    refDocFieldName += "SalesInvoice";
                }

                if (refDocName == "ReturnFromBuy") {
                    var havaleType = afw.uiApi.FetchEntity("wm.GhabzOrHavaleType", "Name = 'ReturnFromBuyHavale'");
                    if (havaleType == null) {
                        afw.ErrorDialog.Show("نوع حواله برگشت از خرید تعریف نشده است.");
                        return;
                    }

                    refDocFieldName += "ReturnFromBuy";
                }

                var havaleEntity = afw.uiApi.CreateNewEntity("wm.GhabzOrHavale");
                havaleEntity.SetFieldValue("GhabzOrHavaleType", havaleType.GetFieldValue("ID"));
                havaleEntity.SetFieldValue("ReferenceDocType", havaleType.GetFieldValue("ReferenceDocType"));
                havaleEntity.SetFieldValue(refDocFieldName, selectedEntities[0].DataItem["RefDocID"]);
                havaleEntity.SetFieldValue("FinancialDocType", selectedEntities[0].DataItem["FinancialDocType"]);
                havaleEntity.SetFieldValue("TarafHesab_Person", selectedEntities[0].DataItem["TarafHesab_Person"]);
                havaleEntity.SetFieldValue("OrganizationUnit", selectedEntities[0].DataItem["OrganizationUnit"]);

                var halaveForm = afw.EntityHelper.ShowEntityWindow(havaleEntity, "wm.GhabzOrHavaleEditForm", "New",
                    {
                        WarehouseDocTypeName: "Havale"
                    });

                halaveForm.bind("Close", function (e) { that._HavaleForm_Close(e) });
            }
        },

        _PrintHavale: function (refDocID) {
            var that = this;

            var parameterNames = ["RefDocID"];
            var parameterValues = [refDocID];

            afw.uiApi.ShowProgress(that);
            afw.ReportHelper.RunReport("wm.HavaleRequestItemsReport", parameterNames, parameterValues, null,
                function (result) {
                    afw.uiApi.HideProgress(that);
                    if (result.HasError) {
                        afw.ErrorDialog.Show(result.ErrorMessage);
                    }
                    else {
                        var returnValue = result.Value;
                    }
                });
        },

        _HavaleForm_Close: function (e) {
            var that = this;

            that._LoadData();
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

        _OnPreviewKeyUp: function (e) {
            var that = this;

            afw.DataListControl.fn._OnPreviewKeyUp.call(that, e);
        },

        _DoDestroy: function () {
            var that = this;

            afw.DataListControl.fn._DoDestroy.call(that);

            clearInterval(that._RefreshItemsInterval);
        }
    });

    //Static Members:

    HavaleRequestItemsControl.TypeName = typeName;
    HavaleRequestItemsControl.BaseType = baseType;
    HavaleRequestItemsControl.Events = objectEvents;


    wm.HavaleRequestItemsControl = HavaleRequestItemsControl;
})();
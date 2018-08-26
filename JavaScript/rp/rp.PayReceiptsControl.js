(function () {
    var typeName = "rp.PayReceiptsControl";
    var baseType = afw.DataListControl;
    var events = afw.DataListControl.Events.concat([]);

    var PayReceiptsControl = baseType.extend({
        events: events,

        GetType: function () {
            return rp.PayReceiptsControl;
        },

        init: function (options) {
            var that = this;

            that._FinancialYearID = cmn.GetUserActiveFinancialYearID();
            cmn.InitFinancialOpList(options, that._FinancialYearID);

            options.DataListFullName = "rp.PayReceipts";
            afw.DataListControl.fn.init.call(that, options);

            that._QuickSearchDockPanel = that.FindControl(that.GetName() + "_QuickSearchDockPanel");
            that._QuickSearchDockPanel.AppendPane();
            that._QuickSearchDockPanel.SetPaneSizeSetting(0, 300);
            that._QuickSearchDockPanel.SetPaneSizeSetting(1, "fill");

            that._FinancialDocTypeFilterControl = afw.uiApi.CreateSavedFormByName(
                that._QuickSearchDockPanel.Panes[1], "cmn.FilteringControl", { Name: "FinancialDocTypeFilterControl" });

            that._FinancialDocTypeFilterControl.bind("FilterChanged", function (e) { that._FinancialDocTypeFilterControl_FilterChanged(e); });

            if (that.GetContainerWindow() != null)
                that._EntityFormContainerType = "Window";
            else
                that._EntityFormContainerType = "MdiContainer";

            that._LoadData();
        },

        _CreateToolbar: function () {
            var that = this;

            afw.DataListControl.fn._CreateToolbar.call(that);

            that._Toolbar = that.FindControl(that.GetName() + "_Toolbar");
            that._Toolbar.AddButton("DocDelete", "حذف سند", { Image: "resource(cmn.Delete)" });
            that._Toolbar.AddButton("Print", "چاپ", { Image: "resource(cmn.PrintToolbarIcon)" });
            that._Toolbar.AddButton("DocOpen", "ورود به سند", { Image: "resource(cmn.Enter)" });
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            afw.DataListControl.fn._OnToolbarButtonClicked.call(that, buttonKey);

            if (!ValueIsIn(buttonKey, ["DocDelete", "Print", "DocOpen"]))
                return;

            var selectedEntities = that._EntitiesGridView.GetSelectedRows();
            if (selectedEntities.length == 0) {
                afw.ErrorDialog.Show("ابتدا یک سطر را انتخاب نمایید.");
                return;
            }

            if (buttonKey == "DocDelete" && selectedEntities[0].DataItem["AccDoc"] != null) {
                    that._DeleteAccDoc(selectedEntities[0].DataItem["ID"], selectedEntities[0].DataItem["AccDoc"]);
            }

            if (buttonKey == "Print") {
                that._Print(selectedEntities[0].DataItem["ID"], selectedEntities[0].DataItem["Payee"], selectedEntities[0].DataItem["TotalAmount"]);
            }

            if (buttonKey == "DocOpen" && selectedEntities[0].DataItem["AccDoc"] != null) {
                    that._OpenDoc(selectedEntities[0].DataItem["AccDoc"]);
            }

        },

        _FinancialDocTypeFilterControl_FilterChanged: function (e) {
            var that = this;

            that._LoadData();
        },

        _GetTotalFilterExpression: function () {
            var that = this;

            var filter = afw.DataListControl.fn._GetTotalFilterExpression.call(that);

            var filterExpression = that._FinancialDocTypeFilterControl.GetFilterExpression();
            if (that._FinancialDocTypeFilterControl != null && !ValueIsEmpty(filterExpression)) {
                if (!ValueIsEmpty(filter))
                    filter += " and ";
                filter += filterExpression;
            }

            return filter;
        },

        _LoadData: function () {
            var that = this;

            if (that._FinancialDocTypeFilterControl == null)
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
        },

        _DeleteAccDoc: function (payReceiptID, accDocID) {
            var that = this;

            if (accDocID == null) {
                afw.ErrorDialog.Show("سندی برای این رسید وجود ندارد.");
                return;
            }

            var confirmDialog = afw.ConfirmDialog.Show("آیا با حذف سند موافقید؟");
            confirmDialog.bind("Close", function () {
                if (confirmDialog.GetDialogResult() == "Yes") {
                    try {
                        afw.uiApi.CallServerMethodSync("rp.DeleteAccDoc", [accDocID, "rp.PayReceipt", "RefOp_PayReceipt", payReceiptID]);

                        afw.MessageDialog.Show("سند مورد نظر حذف گردید.");

                        that.LoadData();
                    }
                    catch (ex) {
                        afw.ErrorDialog.Show(ex);
                    }
                }
            });

        },

        _Print: function (payReceiptID, payeeID, totalAmount) {
            var that = this;

            if (payeeID == null) {
                afw.ErrorDialog.Show("رسید انتخاب شده دریافت کننده ندارد.");
                return;
            }

            var organizationName = cmn.GetOrganizationInformation().GetFieldValue("Name");
            var totalAmount_Word = afw.NumberHelper.NumberToPersianWords(totalAmount) + "  " + "ریال";

            afw.uiApi.ShowProgress(that);
            afw.ReportHelper.RunReport("rp.PayReceipt",
                ["PayReceiptID", "OrganizationName", "TotalAmount_Word"],
                [payReceiptID, organizationName, totalAmount_Word],
                null,
                function (result) {
                    afw.uiApi.HideProgress(that);
                });

        },

        _OpenDoc: function (docID) {
            var that = this;

            var accDocEntity = afw.uiApi.FetchEntityByID("acc.AccDoc", docID);

            if (cmn.OpenWindowExists())
                afw.EntityHelper.OpenEntityFormInWindow(accDocEntity, "acc.AccDocEditForm", "Edit", {
                    Title: "سند حسابداری"
                });
            else
                afw.EntityHelper.OpenEntityFormInMdiContainer(accDocEntity, "acc.AccDocEditForm", "Edit", {
                    Title: "سند حسابداری"
                });             
        }

    });

    //Static Members:

    PayReceiptsControl.TypeName = typeName;
    PayReceiptsControl.BaseType = baseType;
    PayReceiptsControl.Events = events;


    rp.PayReceiptsControl = PayReceiptsControl;
})();
(function () {
    var typeName = "rp.ReceiveReceiptsControl";
    var baseType = afw.DataListControl;
    var events = afw.DataListControl.Events.concat([]);

    var ReceiveReceiptsControl = baseType.extend({
        events: events,

        GetType: function () {
            return rp.ReceiveReceiptsControl;
        },

        init: function (options) {
            var that = this;

            that._FinancialYearID = cmn.GetUserActiveFinancialYearID();
            cmn.InitFinancialOpList(options, that._FinancialYearID);

            options.DataListFullName = "rp.ReceiveReceipts";
            afw.DataListControl.fn.init.call(that, options);

            that._QuickSearchDockPanel = that.FindControl(that.GetName() + "_QuickSearchDockPanel");
            that._QuickSearchDockPanel.AppendPane();
            that._QuickSearchDockPanel.SetPaneSizeSetting(0, 240);
            that._QuickSearchDockPanel.SetPaneSizeSetting(1, "fill");

            that._FinancialDocTypeFilterControl = afw.uiApi.CreateSavedFormByName(
                that._QuickSearchDockPanel.Panes[1], "cmn.FilteringControl", { Name: "FinancialDocTypeFilterControl" });

            that._QuickSearchDockPanel.AppendPane();

            that._ReceivedReceiptFilterControl = afw.uiApi.CreateSavedFormByName(
                that._QuickSearchDockPanel.Panes[2], "rp.ReceivedReceiptFilterControl", { Name: "ReceivedReceiptFilterControl" });

            that._FinancialDocTypeFilterControl.bind("FilterChanged", function (e) { that._FinancialDocTypeFilterControl_FilterChanged(e); });
            that._ReceivedReceiptFilterControl.bind("FilterChanged", function (e) { that._ReceivedReceiptFilterControl_FilterChanged(e); });

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
            that._Toolbar.AddButton("Tashim", "تسهیم", { Image: "resource(cmn.Share)" });
            that._Toolbar.AddButton("DocDelete", "حذف سند", { Image: "resource(cmn.Delete)" });
            that._Toolbar.AddButton("Print", "چاپ", { Image: "resource(cmn.PrintToolbarIcon)" });
            that._Toolbar.AddButton("DocOpen", "ورود به سند", { Image: "resource(cmn.Enter)" });
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            afw.DataListControl.fn._OnToolbarButtonClicked.call(that, buttonKey);

            if (!ValueIsIn(buttonKey, ["Tashim", "DocDelete", "Print", "DocOpen"]))
                return;

            var selectedEntities = that._EntitiesGridView.GetSelectedRows();
            if (selectedEntities.length == 0) {
                afw.ErrorDialog.Show("ابتدا یک سطر را انتخاب نمایید.");
                return;
            }

            if (buttonKey == "Tashim")
                that._ShowTashimEditForm(selectedEntities[0].DataItem["ID"]);

            if (buttonKey == "DocDelete" && selectedEntities[0].DataItem["AccDoc"] != null)
                that._DeleteAccDoc(selectedEntities[0].DataItem["ID"], selectedEntities[0].DataItem["AccDoc"]);

            if (buttonKey == "Print")
                that._Print(selectedEntities[0].DataItem["ID"], selectedEntities[0].DataItem["Payer"], selectedEntities[0].DataItem["TotalAmount"]);

            if (buttonKey == "DocOpen" && selectedEntities[0].DataItem["AccDoc"] != null)
                that._OpenDoc(selectedEntities[0].DataItem["AccDoc"]);

        },

        _ShowTashimEditForm: function (receiveReceiptID) {
            var that = this;

            var entitiy = afw.uiApi.CreateNewEntity("rp.Tashim");

            var paymentPoolReceptionWindow = afw.uiApi.OpenSavedFormWindow("rp.TashimEditForm",
                {
                    Name: "TashmEditForm",
                    FormMode: "New",
                    Modal: true,
                    Entity: entitiy,
                    ReceiveID: receiveReceiptID
                });
            paymentPoolReceptionWindow.SetTitle("تسهیم");
            paymentPoolReceptionWindow.Center();
            paymentPoolReceptionWindow.bind("Opened",
               function (e) {
                   e.Sender.Center();
               });

            //paymentPoolReceptionWindow.bind("Close", function (e) { that._paymentPoolReceptionWindow_Close(e); });
        },

        _DeleteAccDoc: function (receiveReceiptID, accDocID) {
            var that = this;

            if (accDocID == null) {
                afw.ErrorDialog.Show("سندی برای این رسید وجود ندارد.");
                return;
            }

            var confirmDialog = afw.ConfirmDialog.Show("آیا با حذف سند موافقید؟");
            confirmDialog.bind("Close", function () {
                if (confirmDialog.GetDialogResult() == "Yes") {
                    try {
                        afw.uiApi.CallServerMethodSync("rp.DeleteAccDoc", [accDocID, "rp.ReceiveReceipt", "RefOp_ReceiveReceipt", receiveReceiptID]);
                        afw.MessageDialog.Show("سند مورد نظر حذف گردید.");
                        that.LoadData();
                    }
                    catch (ex) {
                        afw.ErrorDialog.Show(ex);
                    }
                }
            });
        },

        _Print: function (receiveReceiptID, payerID, totalAmount) {
            var that = this;

            if (payerID == null) {
                afw.ErrorDialog.Show("رسید انتخاب شده پرداخت کننده ندارد.");
                return;
            }

            var organizationName = cmn.GetOrganizationInformation().GetFieldValue("Name");
            var totalAmount_Word = afw.NumberHelper.NumberToPersianWords(totalAmount);

            afw.uiApi.ShowProgress(that);
            afw.ReportHelper.RunReport("rp.ReceiveReceipt",
                ["ReceiveReceiptID", "OrganizationName", "TotalAmount_Word"],
                [receiveReceiptID, organizationName, totalAmount_Word],
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
        },

        _FinancialDocTypeFilterControl_FilterChanged: function (e) {
            var that = this;

            that._LoadData();
        },

        _ReceivedReceiptFilterControl_FilterChanged: function (e) {
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

            if (that._ReceivedReceiptFilterControl != null && !ValueIsEmpty(that._ReceivedReceiptFilterControl.GetFilterExpression())) {
                if (!ValueIsEmpty(filter))
                    filter += " and ";
                filter += that._ReceivedReceiptFilterControl.GetFilterExpression();
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
        }
    });

    //Static Members:

    ReceiveReceiptsControl.TypeName = typeName;
    ReceiveReceiptsControl.BaseType = baseType;
    ReceiveReceiptsControl.Events = events;


    rp.ReceiveReceiptsControl = ReceiveReceiptsControl;
})();
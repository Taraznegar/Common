(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return rp.PaidChequeHistoryCheckForm;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (designObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._StatusChangeDataListPanel = that.FindControl("StatusChangeDataListPanel");
            that._ChequeLookupControl = that.FindControl("ChequeLookupControl");
            that._ChequeLookupControl_AutoComplete = that._ChequeLookupControl.GetAutoComplete();
            that._ChequeLookupControl_ViewButton = that._ChequeLookupControl.FindControl("ViewButton");
            that._PrintButton = that.FindControl("PrintButton");
            that._DueDateLabel = that.FindControl("DueDateLabel");
            that._PayeeLabel = that.FindControl("PayeeLabel");
            that._ChequeAmountLabel = that.FindControl("ChequeAmountLabel");
            that._PayReceiptNumber = that.FindControl("PayReceiptNumber");
            that._PayReceiptDate = that.FindControl("PayReceiptDate");
            that._BankAccount = that.FindControl("BankAccount");
            that._HeaderDockPanel = that.FindControl("HeaderDockPanel");

            that._HeaderDockPanel.SetPaneSizeSetting(1, 1);

            that._StatusChangeDataListControl = afw.uiApi.CreateDataListControl("rp.PaidChequeStatusChanges", {
                ParentControl: that._StatusChangeDataListPanel,
                BaseFilterExpression: "1=2",
                Name: "StatusChangeDataListControl",
                FillParent: true
            });

            that._StatusChangeDataListControl_ToolBar = that._StatusChangeDataListControl.FindControl("StatusChangeDataListControl_ToolBar");
            that._StatusChangeDataListControl_ToolBar.RemoveButton("New");
            that._StatusChangeDataListControl_ToolBar.RemoveButton("Edit");
            that._StatusChangeDataListControl_ToolBar.RemoveButton("Delete");
            that._StatusChangeDataListControl_ToolBar.AddButton("DeleteButton", "حذف", { TextColor: "white", BackgroundColor: "#e84646" });
            //that._StatusChangeDataListControl_ToolBar.AddButton("DocDeleteButton", "حذف سند");

            that._StatusChangeDataListControl.bind("LoadingData", function () { that._StatusChangeDataListControl_LoadingData(); });
            that._PrintButton.bind("Click", function (e) { that._PrintButton_Click(e); });
            that._StatusChangeDataListControl_ToolBar.bind("ButtonClick", function (e) { that._StatusChangeDataListControl_ToolBar_ButtonClick(e); });
            that._ChequeLookupControl.bind("ValueChanged", function (e) { that._ChequeLookupControl_ValueChanged(e); });

        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        },

        _PrintButton_Click: function (e) {
            var that = this;

            var chequeNumber = that._ChequeLookupControl_AutoComplete.GetText();
            if (ValueIsEmpty(chequeNumber)) {
                afw.ErrorDialog.Show("شماره چک را وارد کنید");
            }
            else {
                var reportDate_Persian = afw.DateTimeHelper.GetServerPersianDateTime().split(" ")[0];

                afw.uiApi.ShowProgress(that);
                afw.ReportHelper.RunReport("rp.PaidChequeHistoryReport",
                    ["ReportDate", "ChequeNumber", "DueDate", "Payee_FullName"],
                    [reportDate_Persian, chequeNumber, that._DueDateLabel.GetText(),
                    that._PayeeLabel.GetText()],
                    null,
                    function (result) {
                        afw.uiApi.HideProgress(that);
                    });
            }
        },

        _ChequeLookupControl_ValueChanged: function (e) {
            var that = this;

            var chequeID = that._ChequeLookupControl.GetValue();
            if (!ValueIsEmpty(chequeID)) {
                var cheque = afw.uiApi.CallServerMethodSync("rp.GetPaidChequeInfo", [chequeID]);
                if (cheque != null) {
                    that._DueDateLabel.SetText(cheque.GetFieldValue("DueDate_Persian"));
                    that._PayeeLabel.SetText(cheque.GetFieldValue("Payee_FullName"));
                    that._ChequeAmountLabel.SetText(FormatNumber(cheque.GetFieldValue("Amount")));
                    that._PayReceiptNumber.SetText(cheque.GetFieldValue("PayReceipt_Number"));
                    that._PayReceiptDate.SetText(cheque.GetFieldValue("ReceiptDate_Persian"));
                    that._BankAccount.SetText(cheque.GetFieldValue("BankAccount_Title") + " " + cheque.GetFieldValue("BankAccount_Title"));

                    that._HeaderDockPanel.SetPaneSizeSetting(1, "fill");
                }
                else {
                    that._DueDateLabel.SetText(null);
                    that._PayeeLabel.SetText(null);
                    that._ChequeAmountLabel.SetText(null);
                    that._PayReceiptNumber.SetText(null);
                    that._PayReceiptDate.SetText(null);
                    that._BankAccount.SetText(null);

                    that._HeaderDockPanel.SetPaneSizeSetting(1, 1);
                }
            }
            else {
                that._DueDateLabel.SetText(null);
                that._PayeeLabel.SetText(null);
                that._ChequeAmountLabel.SetText(null);
                that._PayReceiptNumber.SetText(null);
                that._PayReceiptDate.SetText(null);
                that._BankAccount.SetText(null);

                that._HeaderDockPanel.SetPaneSizeSetting(1, 1);
            }

            that._ChequeLookupControl_ViewButton.SetEnabled(false);
            that._StatusChangeDataListControl.LoadData();
        },

        _StatusChangeDataListControl_LoadingData: function () {
            var that = this;

            var chequeID = that._ChequeLookupControl.GetValue();
            if (!ValueIsEmpty(chequeID)) {
                that._StatusChangeDataListControl.SetBaseFilterExpression(
                   String.Format("Cheque = '{0}'", chequeID));

            }
            else
                that._StatusChangeDataListControl.SetBaseFilterExpression("1=2");
        },

        _StatusChangeDataListControl_ToolBar_ButtonClick: function (e) {
            var that = this;

            if (!ValueIsIn(e.ButtonKey, ["DeleteButton", "DocDeleteButton"]))
                return;

            var selectedEntities = that._StatusChangeDataListControl.GetEntitiesGridView().GetSelectedRows();
            if (selectedEntities == 0) {
                afw.ErrorDialog.Show("ابتدا یک سطر را انتخاب نمایید.");
                return;
            }

            var id = selectedEntities[0].DataItem["ID"];
            var accDocID = selectedEntities[0].DataItem["AccDoc"];

            if (e.ButtonKey == "DeleteButton") {
                that._Delete(id);
            }

            if (e.ButtonKey == "DocDeleteButton") {
                that._DeleteAccDoc(id, accDocID);
            }


        },

        _DeleteAccDoc: function (id, accDocID) {
            var that = this;

            if (accDocID == null) {
                afw.ErrorDialog.Show("سندی برای این رسید وجود ندارد.");
                return;
            }

            try {

                var confirmDialog = afw.ConfirmDialog.Show("آیا با حذف سند موافقید؟");
                confirmDialog.bind("Close", function () {
                    if (confirmDialog.GetDialogResult() == "Yes") {

                        afw.uiApi.CallServerMethodSync("rp.DeleteAccDoc",
                                                [
                                                 accDocID,
                                                 "rp.PaidChequeStatusChange",
                                                 "RefOp_PaidChequeStatusChange",
                                                 id
                                                ]
                                              );

                        afw.MessageDialog.Show("سند مورد نظر حذف گردید.");
                        that._StatusChangeDataListControl.LoadData();

                    }
                });

            }
            catch (ex) {
                afw.ErrorDialog.Show(ex);
            }
        },

        _Delete: function (id) {
            var that = this;

            var confirmDialog = afw.ConfirmDialog.Show("آیا با حذف موافقید؟");
            confirmDialog.bind("Close", function () {
                if (confirmDialog.GetDialogResult() == "Yes") {

                    var selectedEntity = afw.uiApi.FetchEntity("rp.PaidChequeStatusChange", String.Format("ID = '{0}'", id))

                    try {
                        afw.uiApi.DeleteEntity(selectedEntity);
                        that._StatusChangeDataListControl.LoadData();
                    }
                    catch (ex) {
                        afw.ErrorDialog.Show(ex.message);
                    }
                }
            });

        }

    });

    //Static Members:

    FormClass.TypeName = "rp.PaidChequeHistoryCheckForm";
    FormClass.BaseType = afw.BasePanel;


    rp.PaidChequeHistoryCheckForm = FormClass;
})();
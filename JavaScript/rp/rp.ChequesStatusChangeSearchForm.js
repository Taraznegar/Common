(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return rp.ChequesStatusChangeSearchForm;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._FoundChequesPanel = that.FindControl("FoundChequesPanel");
            that._SelectedChequeDocPanel = that.FindControl("SelectedChequeDocPanel");
            that._FromDateTimeControl = that.FindControl("FromDateTimeControl");
            that._ToDateTimeControl = that.FindControl("ToDateTimeControl");
            that._LeftButton = that.FindControl("LeftButton");
            that._RightButton = that.FindControl("RightButton");
            that._ChangeStatusButton = that.FindControl("ChangeStatusButton");
            that._ChequeTypeOptionSetControl = that.FindControl("ChequeTypeOptionSetControl");
            that._ContainerPanelFilter = that.FindControl("ContainerPanelFilter");

            that._FoundChequesEntityList = null;
            that._SelectedChequesEntityList = afw.uiApi.CreateEntityList();
            that._FoundChequesGridView = null;
            that._SelectedChequesGridView = null;

            that._ChequeTypeOptionSetControl.bind("ValueChanged", function (e) { that._ChequeTypeOptionSetControl_ValueChanged(e); });
            var id = afw.OptionSetHelper.GetOptionSetItemID("rp.ChequeGeneralType.Received");
            that._ChequeTypeOptionSetControl.SetValue(id);

            that._FromDateTimeControl.bind("ValueChanged", function (e) { that._Control_ValueChanged(e); });
            that._ToDateTimeControl.bind("ValueChanged", function (e) { that._Control_ValueChanged(e); });
            that._FoundChequesGridView.bind("RowDoubleClick", function (e) { that._FoundChequesGridView_RowDoubleClick(e); });
            that._SelectedChequesGridView.bind("RowDoubleClick", function (e) { that._SelectedChequesGridView_RowDoubleClick(e); });
            that._LeftButton.bind("Click", function (e) { that._LeftButton_Click(e); });
            that._RightButton.bind("Click", function (e) { that._RightButton_Click(e); });
            that._ChangeStatusButton.bind("Click", function (e) { that._ChangeStatusButton_Click(e); });

            var financialYearEntity = cmn.GetUserActiveFinancialYearEntity();
            that._FromDateTimeControl.SetValue(financialYearEntity.GetFieldValue("StartDate"));
            that._ToDateTimeControl.SetValue(financialYearEntity.GetFieldValue("EndDate"));
        },

        _ChangeStatusButton_Click: function (e) {
            var that = this;

            var selectedCheques = that._SelectedChequesGridView.GetSelectedRows();
            if (selectedCheques == 0) {
                afw.ErrorDialog.Show("هیچ چکی انتخاب نشده است");
                return;
            }

            var statusID = that.FindControl("FilterControl").FindControl("StatusOptionSetControl").GetValue();

            var chequeTypeSelectedID = that._ChequeTypeOptionSetControl.GetValue();
            var chequeTypeSelectedName = afw.OptionSetHelper.GetOptionSetItemName(chequeTypeSelectedID);

            var bankAccountID = null;
            if (chequeTypeSelectedName == "Received" &&
                ValueIsIn(that._GetStatusName(), ["DarJaryaneVosol", "VosoolShode"]))
                bankAccountID = that.FindControl("FilterControl").FindControl("BankAccountLookupControl").GetValue();

            var window = afw.uiApi.OpenSavedFormWindow(
                        "rp.ChequesStatusChangeForm",
                        {
                            ChequesEntityList: that._SelectedChequesEntityList,
                            ChequeCurrentStatus: statusID,
                            ChequesType: chequeTypeSelectedName,
                            BankAccountInPriorStatus: bankAccountID,
                            Modal: true
                        });

            window.bind("Close", function () {
                if (window.GetDialogResult() == "Ok") {
                    var resultEntity = window.ResultEntity;

                    var error = resultEntity.GetFieldValue("Error");
                    if (error != "") {
                        if (resultEntity.GetFieldValue("SucceedChequeIDs") != "") {
                            var succeedChequeIDs = resultEntity.GetFieldValue("SucceedChequeIDs").split(",");

                            for (var i = 0; i < succeedChequeIDs.length; i++) {
                                var selectedChequeIndex = that._SelectedChequesEntityList.Entities.FindIndex(
                                                                     function (o) { return o.GetFieldValue("ID").toLowerCase() == succeedChequeIDs[i].toLowerCase(); });

                                if (selectedChequeIndex != -1)
                                    that._SelectedChequesEntityList.Entities.RemoveItem(selectedChequeIndex);
                            }
                        }

                        afw.ErrorDialog.Show(error);
                    }
                    else
                        that._SelectedChequesEntityList = null;

                    that._LoadSelectedChequesGrid();
                }
            });

            window.Center();

        },

        _LeftButton_Click: function (e) {
            var that = this;

            that._MoveChequeToSelectedGrid();
        },

        _RightButton_Click: function (e) {
            var that = this;

            that._MoveChequeFromSelectedGrid();
        },

        _FoundChequesGridView_RowDoubleClick: function (e) {
            var that = this;

            that._MoveChequeToSelectedGrid();
        },

        _SelectedChequesGridView_RowDoubleClick: function (e) {
            var that = this;

            that._MoveChequeFromSelectedGrid();
        },

        _ChequeTypeOptionSetControl_ValueChanged: function (e) {
            var that = this;

            var chequeTypeSelectedID = that._ChequeTypeOptionSetControl.GetValue();
            if (chequeTypeSelectedID == null) {
                var id = afw.OptionSetHelper.GetOptionSetItemID("rp.ChequeGeneralType.Received");
                that._ChequeTypeOptionSetControl.SetValue(id);
                return;
            }

            var chequeTypeSelectedName = afw.OptionSetHelper.GetOptionSetItemName(chequeTypeSelectedID);

            that._CreateGridViews(chequeTypeSelectedName);

            var control = that._ContainerPanelFilter.FindControl("FilterControl");
            if (control != null) {
                control.Destroy();
                control = null;
            }

            if (chequeTypeSelectedName == "Received") {
                control = afw.uiApi.CreateSavedFormByName(
                                         that._ContainerPanelFilter, "rp.ChequesStatusChangeSearchForm_ReceivedFilter",
                                         { Name: "FilterControl", ChequesStatusChangeSearchForm: that });

            }
            else if (chequeTypeSelectedName == "Paid") {
                control = afw.uiApi.CreateSavedFormByName(
                                         that._ContainerPanelFilter, "rp.ChequesStatusChangeSearchForm_PaidFilter",
                                         { Name: "FilterControl", ChequesStatusChangeSearchForm: that });
            }

            control.SetFillParent(true);


        },

        _Control_ValueChanged: function (e) {
            var that = this;

            that.ApplyFilters();

        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        },

        _CreateGridViews: function (chequeType) {
            var that = this;

            if (that._FoundChequesGridView != null) {
                that._FoundChequesGridView.Destroy();
                that._FoundChequesGridView = null;
            }

            if (that._SelectedChequesGridView != null) {
                that._SelectedChequesGridView.Destroy();
                that._SelectedChequesGridView = null;
            }

            if (chequeType == "Received") {
                that._FoundChequesGridView = new afw.GridView({
                    ParentControl: that._FoundChequesPanel,
                    Name: "FoundChequesGridView",
                    FillParent: true,
                    Columns: [
                        {
                            title: "شماره رسید",
                            field: "ReceiveReceipt_Number",
                            rightToLeft: true,
                            width: 100,
                            valuesDisplayMethod: "number"
                        },
                        {
                            title: "ردیف دفتر",
                            field: "RadifeDaftareChek",
                            rightToLeft: true,
                            width: 100,
                            valuesDisplayMethod: "Number"
                        },
                        {
                            title: "شماره چک",
                            field: "ChequeNumber",
                            rightToLeft: true,
                            width: 100
                        },
                        {
                            title: "مبلغ",
                            field: "Amount",
                            rightToLeft: true,
                            width: 100,
                            valuesDisplayMethod: "Number"
                        },
                        {
                            title: "تاریخ سر رسید",
                            field: "DueDate_Persian",
                            rightToLeft: true,
                            width: 100
                        },
                        {
                            title: "پرداخت کننده",
                            field: "Payer_FullName",
                            rightToLeft: true,
                            width: 110
                        },
                        {
                            title: "بانک",
                            field: "Bank_Name",
                            rightToLeft: true,
                            width: 100
                        }
                    ],
                    SelectionMode: "SingleRow"
                });

                that._SelectedChequesGridView = new afw.GridView({
                    ParentControl: that._SelectedChequeDocPanel.Panes[2],
                    Name: "SelectedChequesGridView",
                    FillParent: true,
                    Columns: [
                        {
                            title: "شماره رسید",
                            field: "ReceiveReceipt_Number",
                            rightToLeft: true,
                            width: 100,
                            valuesDisplayMethod: "number"
                        },
                        {
                            title: "ردیف دفتر",
                            field: "RadifeDaftareChek",
                            rightToLeft: true,
                            width: 100,
                            valuesDisplayMethod: "Number"
                        },
                        {
                            title: "شماره چک",
                            field: "ChequeNumber",
                            rightToLeft: true,
                            width: 100
                        },
                        {
                            title: "مبلغ",
                            field: "Amount",
                            rightToLeft: true,
                            width: 100,
                            valuesDisplayMethod: "Number"
                        },
                        {
                            title: "تاریخ سر رسید",
                            field: "DueDate_Persian",
                            rightToLeft: true,
                            width: 100
                        },
                        {
                            title: "پرداخت کننده",
                            field: "Payer_FullName",
                            rightToLeft: true,
                            width: 110
                        },
                        {
                            title: "بانک",
                            field: "Bank_Name",
                            rightToLeft: true,
                            width: 100
                        }
                    ],
                    SelectionMode: "SingleRow"
                });
            }
            else
                if (chequeType == "Paid") {
                    that._FoundChequesGridView = new afw.GridView({
                        ParentControl: that._FoundChequesPanel,
                        Name: "FoundChequesGridView",
                        FillParent: true,
                        Columns: [
                            {
                                title: "شماره رسید",
                                field: "PayReceipt_Number",
                                rightToLeft: true,
                                width: 100,
                                valuesDisplayMethod: "number"
                            },
                            {
                                title: "شماره چک",
                                field: "ChequeNumber",
                                rightToLeft: true,
                                width: 100
                            },
                            {
                                title: "مبلغ",
                                field: "Amount",
                                rightToLeft: true,
                                width: 100,
                                valuesDisplayMethod: "Number"
                            },
                            {
                                title: "تاریخ سر رسید",
                                field: "DueDate_Persian",
                                rightToLeft: true,
                                width: 100
                            },
                            {
                                title: "دریافت کننده",
                                field: "Payee_FullName",
                                rightToLeft: true,
                                width: 110
                            },
                            {
                                title: "حساب بانکی",
                                field: "BankAccount_Number",
                                rightToLeft: true,
                                width: 100
                            }
                        ],
                        SelectionMode: "SingleRow"
                    });

                    that._SelectedChequesGridView = new afw.GridView({
                        ParentControl: that._SelectedChequeDocPanel.Panes[2],
                        Name: "SelectedChequesGridView",
                        FillParent: true,
                        Columns: [
                            {
                                title: "شماره رسید",
                                field: "PayReceipt_Number",
                                rightToLeft: true,
                                width: 100,
                                valuesDisplayMethod: "number"
                            },
                            {
                                title: "شماره چک",
                                field: "ChequeNumber",
                                rightToLeft: true,
                                width: 100
                            },
                            {
                                title: "تاریخ سر رسید",
                                field: "DueDate_Persian",
                                rightToLeft: true,
                                width: 100
                            },
                            {
                                title: "دریافت کننده",
                                field: "Payee_FullName",
                                rightToLeft: true,
                                width: 110
                            },
                            {
                                title: "حساب بانکی",
                                field: "BankAccount_Number",
                                rightToLeft: true,
                                width: 100
                            },
                            {
                                title: "مبلغ",
                                field: "Amount",
                                rightToLeft: true,
                                width: 100,
                                valuesDisplayMethod: "Number"
                            }
                        ],
                        SelectionMode: "SingleRow"
                    });
                }

        },

        ApplyFilters: function () {
            var that = this;

            var statusID = that.FindControl("FilterControl").FindControl("StatusOptionSetControl").GetValue();
            var statusName = afw.OptionSetHelper.GetOptionSetItemName(statusID);

            var fromDate = that._FromDateTimeControl.GetValue();
            var toDate = that._ToDateTimeControl.GetValue();
            var chequeNumber = that.FindControl("FilterControl").FindControl("ChequeNumberTextBox").GetText();
            var ownerUserID = that.FindControl("FilterControl").FindControl("OwnerUserLookupControl").GetValue();
            var amount = that.FindControl("FilterControl").FindControl("AmountNumericTextBox").GetValue();
            var filter = "";
             
            filter = String.Format("ChequeStatus = '{0}'", statusID);
              
            if (!ValueIsEmpty(fromDate)) {
                filter += " and " + String.Format("DueDate >= '{0}'", fromDate);
            }
            if (!ValueIsEmpty(toDate)) {
                filter += " and " + String.Format("DueDate <= '{0}'", toDate);
            }
            if (!ValueIsEmpty(chequeNumber)) {
                filter += " and " + String.Format("ChequeNumber like '%{0}%'", chequeNumber);
            }
            if (!ValueIsEmpty(amount)) {
                filter += " and " + String.Format("Amount = {0}", amount);
            }
            if (!ValueIsEmpty(ownerUserID)) {
                filter += " and " + String.Format("OwnerUser = '{0}'", ownerUserID);
            }

            //جلوگیری از دریافت رکورد هایی که قبلا انتخاب شده اند
            var excludedIDs = null;

            if (that._SelectedChequesEntityList != null) {
                var selectedEntityCount = that._SelectedChequesEntityList.Entities.length;
                if (selectedEntityCount > 0) {

                    excludedIDs = "";
                    for (var i = 0 ; i < selectedEntityCount; i++) {
                        excludedIDs += ("'" + that._SelectedChequesEntityList.Entities[i].GetFieldValue("ID") + "' ,");
                    }

                    excludedIDs = excludedIDs.substring('', excludedIDs.length - 1);
                }
            }

            if (excludedIDs != null)
                filter += String.Format(" and ID not in ({0})", excludedIDs);
            //..................................................................

            var chequeTypeSelectedID = that._ChequeTypeOptionSetControl.GetValue();
            var chequeTypeSelectedName = afw.OptionSetHelper.GetOptionSetItemName(chequeTypeSelectedID);
            if (chequeTypeSelectedName == "Received") {
                var payerID = that.FindControl("FilterControl").FindControl("PayerLookupControl").GetValue();
                var radifeDaftareChek = that.FindControl("FilterControl").FindControl("RadifeDaftareChekTextBox").GetText();

                if (!ValueIsEmpty(payerID)) {
                    filter += " and " + String.Format("Payer = '{0}'", payerID);
                }
                if (!ValueIsEmpty(radifeDaftareChek)) {
                    filter += " and " + String.Format("RadifeDaftareChek = {0}", radifeDaftareChek);
                }
                if (ValueIsIn(that._GetStatusName(), ["DarJaryaneVosol", "VosoolShode"])) {
                    var bankAccountID = that.FindControl("FilterControl").FindControl("BankAccountLookupControl").GetValue();
                    if (bankAccountID != null)
                        filter += String.Format(" and (select top 1 BankAccount" +
                                                " from rp_ReceivedChequeStatusChanges" +
                                                " where Cheque = Cheque.ID" +
                                                " order by CreationTime desc) = '{0}'", bankAccountID);

                }

                that._FoundChequesEntityList = afw.uiApi.CallServerMethodSync("rp.SearchReceivedCheques", [filter]);
            }
            else if (chequeTypeSelectedName == "Paid") {
                var payeeID = that.FindControl("FilterControl").FindControl("PayeeLookupControl").GetValue();
                var bankAccountID = that.FindControl("FilterControl").FindControl("BankAccountLookupControl").GetValue();

                if (!ValueIsEmpty(payeeID)) {
                    filter += " and " + String.Format("Payee = '{0}'", payeeID);
                }

                if (!ValueIsEmpty(bankAccountID)) {
                    filter += " and " + String.Format("BankAccount = '{0}'", bankAccountID);
                }

                that._FoundChequesEntityList = afw.uiApi.CallServerMethodSync("rp.SearchPaidCheques", [filter]);
            }

            that._LoadSearchChequesGrid();
        },

        _LoadSearchChequesGrid: function () {
            var that = this;

            if (that._FoundChequesEntityList == null)
                that._FoundChequesEntityList = afw.uiApi.CreateEntityList();

            that._FoundChequesGridView.GetDataSource().data(that._FoundChequesEntityList.ToDataSourceData());

            if (that._FoundChequesEntityList.Entities.length > 0)
                that._FoundChequesGridView.SelectRowByIndex(0);

        },

        _LoadSelectedChequesGrid: function () {
            var that = this;

            if (that._SelectedChequesEntityList == null)
                that._SelectedChequesEntityList = afw.uiApi.CreateEntityList();

            that._SelectedChequesGridView.GetDataSource().data(that._SelectedChequesEntityList.ToDataSourceData());

            if (that._SelectedChequesEntityList.Entities.length > 0)
                that._SelectedChequesGridView.SelectRowByIndex(0);

            that._AdjustControl();

        },

        _MoveChequeToSelectedGrid: function () {
            var that = this;

            var selectedEntities = that._FoundChequesGridView.GetSelectedRows();
            if (selectedEntities == 0) {
                return;
            }
            else {
                var chequeTypeSelectedID = that._ChequeTypeOptionSetControl.GetValue();
                var chequeTypeSelectedName = afw.OptionSetHelper.GetOptionSetItemName(chequeTypeSelectedID);
                var bankAccountID = that.FindControl("FilterControl").FindControl("BankAccountLookupControl").GetValue();

                if (chequeTypeSelectedName == "Received" &&
                    ValueIsIn(that._GetStatusName(), ["DarJaryaneVosol", "VosoolShode"]) &&
                    bankAccountID == null
                    ) {
                    afw.ErrorDialog.Show("حساب بانکی وارد نشده است");
                }
                else {
                    var selectedChequeID = selectedEntities[0].DataItem.ID;
                    var selectedChequeIndex = that._FoundChequesEntityList.Entities.FindIndex(
                        function (o) { return o.GetFieldValue("ID").toLowerCase() == selectedChequeID.toLowerCase(); });
                    var selectedCheque = that._FoundChequesEntityList.Entities[selectedChequeIndex];
                    that._FoundChequesEntityList.Entities.RemoveItem(selectedChequeIndex);
                    that._SelectedChequesEntityList.Entities.push(selectedCheque);

                    that._LoadSearchChequesGrid();
                    that._LoadSelectedChequesGrid();
                }
            }
        },

        _MoveChequeFromSelectedGrid: function () {
            var that = this;

            var selectedEntities = that._SelectedChequesGridView.GetSelectedRows();
            if (selectedEntities == 0) {
                return;
            }
            else {
                var selectedChequeID = selectedEntities[0].DataItem.ID;
                var selectedChequeIndex = that._SelectedChequesEntityList.Entities.FindIndex(
                        function (o) { return o.GetFieldValue("ID").toLowerCase() == selectedChequeID.toLowerCase(); });
                that._SelectedChequesEntityList.Entities.RemoveItem(selectedChequeIndex);
                that._LoadSelectedChequesGrid();

                //به علت امکان ناسازگاری با پارامترهای فیلتر ، به گرید سمت راست اضافه نمی شود
                that.ApplyFilters();
            }
        },

        _GetStatusName: function () {
            var that = this;

            var statusId = that.FindControl("FilterControl").FindControl("StatusOptionSetControl").GetValue();
            if (statusId == null)
                return null;

            var statusName = afw.OptionSetHelper.GetOptionSetItemName(statusId);
            return statusName;
        },

        _AdjustControl: function () {
            var that = this;

            var chequeTypeSelectedID = that._ChequeTypeOptionSetControl.GetValue();
            var chequeTypeSelectedName = afw.OptionSetHelper.GetOptionSetItemName(chequeTypeSelectedID);

            if (that._SelectedChequesEntityList.Entities.length > 0) {
                if (that._ChequeTypeOptionSetControl.GetEnabled())
                    that._ChequeTypeOptionSetControl.SetEnabled(false);

                if (that.FindControl("FilterControl").FindControl("StatusOptionSetControl").GetEnabled())
                    that.FindControl("FilterControl").FindControl("StatusOptionSetControl").SetEnabled(false);

                if (chequeTypeSelectedName == "Received" &&
                    that.FindControl("FilterControl").FindControl("BankAccountLookupControl").GetVisible()) {
                    if (!that.FindControl("FilterControl").FindControl("BankAccountLookupControl").GetReadOnly())
                        that.FindControl("FilterControl").FindControl("BankAccountLookupControl").SetReadOnly(true);
                }
            }

            if (that._SelectedChequesEntityList.Entities.length == 0) {
                if (!that._ChequeTypeOptionSetControl.GetEnabled())
                    that._ChequeTypeOptionSetControl.SetEnabled(true);

                if (!that.FindControl("FilterControl").FindControl("StatusOptionSetControl").GetEnabled())
                    that.FindControl("FilterControl").FindControl("StatusOptionSetControl").SetEnabled(true);

                if (chequeTypeSelectedName == "Received" &&
                    that.FindControl("FilterControl").FindControl("BankAccountLookupControl").GetVisible()) {
                    if (that.FindControl("FilterControl").FindControl("BankAccountLookupControl").GetReadOnly())
                        that.FindControl("FilterControl").FindControl("BankAccountLookupControl").SetReadOnly(false);
                }
            }
        }

    });

    //Static Members:

    FormClass.TypeName = "rp.ChequesStatusChangeSearchForm";
    FormClass.BaseType = afw.BasePanel;


    rp.ChequesStatusChangeSearchForm = FormClass;
})();
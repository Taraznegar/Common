(function () {
    var FormClass = afw.Window.extend({
        GetType: function () {
            return rp.QuickSettlementForm;
        },

        init: function (options) {
            var that = this;

            afw.Window.fn.init.call(that, options);
            var formObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (formObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, formObjectData, false);

            that._ReceiveItemsEntityList = null;
            that._ReceiveItemsTypesEntityList = null;
            that._NaqdDaryaftiItem = null;
            that._HavaleDaryaftiItem = null;
            that._ReceivedPosItem = null;
            that._LastShomareHavale = 1;
            that._LastShomarePos = 1;
            //that._SettlementTotalAmount = 0;
            that._RemainingAmount = 0;
            that._NaqdAmount = 0;
            that._PosAmount = 0;
            that._HavaleAmount = 0;
            that._CheqeAmount = 0;
            //that.HavaleControlsArray = null;
            //that.CheqeControlsArray = null;
            that._ReceiveItemsEntityListCurrent = null;

            that._CreatorOpName = options.CreatorOpName;
            that._CreatorOpID = options.CreatorOpID;
            that._InvoiceAmount = options.InvoiceAmount;
            that._ReceiveReceipt = options.ReceiveReceipt;
            that._FileSettlement = options.FileSettlement;
            that._FileSettlementsControl = options.FileSettlementsControl;
            that._SettlementTotalAmount = options.SettlementTotalAmount;
            that._PosItems = options.PosItems;
            that._HavaleItems = options.HavaleItems;
            that._CashItems = options.CashItems;
            that._QuickSettlement_UserDefaultHavaleItemID = options.QuickSettlement_UserDefaultHavaleItemID;
            that._QuickSettlement_UserDefaultCashItemID = options.QuickSettlement_UserDefaultCashItemID;
            that._QuickSettlementForm = options.QuickSettlementForm;
            that._PayerID = options.PayerID;

            if ("DebtorAmount" in options)
                that._DebtorAmount = options.DebtorAmount;
            else
                that._DebtorAmount = 0;

            if ("IsWorkShift" in options)
                that._IsWorkShift = options.IsWorkShift;
            else
                that._IsWorkShift = false;

            that._ControlsDockPanel = that.FindControl("ControlsDockPanel");
            that._PaymentComplete = that.FindControl("PaymentComplete");

            that._DayPayableTextLabel = that.FindControl("DayPayableTextLabel");
            that._DayPayableNumberLabel = that.FindControl("DayPayableNumberLabel");

            that._PayableTextLabel = that.FindControl("PayableTextLabel");
            that._PayableNumberLabel = that.FindControl("PayableNumberLabel");

            that._PayingAmountsSumLabel = that.FindControl("PayingAmountsSumLabel");

            that._DebtorAmountTextLabel = that.FindControl("DebtorAmountTextLabel");
            that._DebtorAmountNumberLabel = that.FindControl("DebtorAmountNumberLabel");
            that._CalculateDebtorAmountCheckBox = that.FindControl("CalculateDebtorAmountCheckBox");

            that._CalculateDebtorAmountCheckBox.bind("CheckedChanged", function (e) { that._CalculateDebtorAmountCheckBox_CheckedChanged(e); });

            if (that._DebtorAmount > 0 && afw.PermissionHelper.UserHasPermissionToItem("krf.ExitAndDebtorRegister")) {
                that._DebtorAmountTextLabel.SetVisible(true);
                that._DebtorAmountNumberLabel.SetVisible(true);
                that._CalculateDebtorAmountCheckBox.SetVisible(true);

                that._DebtorAmountNumberLabel.SetText(afw.BaseUtils.FormatNumber(that._DebtorAmount));

                that._CalculateDebtorAmountCheckBox.SetValue(true);
            }
            else {
                that._DebtorAmountTextLabel.SetVisible(false);
                that._DebtorAmountNumberLabel.SetVisible(false);
                that._CalculateDebtorAmountCheckBox.SetVisible(false);
            }

            if (!ValueIsEmpty(that._SettlementTotalAmount)) {
                that._DayPayableTextLabel.SetVisible(true);
                that._DayPayableNumberLabel.SetVisible(true);

                that._PayableTextLabel.SetVisible(true);
                that._PayableNumberLabel.SetVisible(true);

                that._RemainingAmount = that._SettlementTotalAmount;
                that._PayableNumberLabel.SetText(afw.BaseUtils.FormatNumber(that._SettlementTotalAmount));
                that._DayPayableNumberLabel.SetText(afw.BaseUtils.FormatNumber(that._SettlementTotalAmount));
            }
            else {
                that._DayPayableTextLabel.SetVisible(false);
                that._DayPayableNumberLabel.SetVisible(false);

                that._PayableTextLabel.SetVisible(false);
                that._PayableNumberLabel.SetVisible(false);
            }
            //that._AmountInvoiceLabel.SetText(afw.BaseUtils.FormatNumber(that._InvoiceAmount));

            //if (that._ReceiveReceipt.ChangeStatus != "Add")
            //    that._ReceiveReceipt = afw.uiApi.FetchEntity("rp.ReceiveReceipt", 
            //    String.Format("CreatorOpName = '{0}' and CreatorOp = '{1}'", that._CreatorOpName, that._CreatorOpID),
            //    ["Items"]);


            //that._ReceiveReceipt = afw.uiApi.CreateNewEntity("rp.ReceiveReceipt");
            //that._ReceiveReceipt.SetFieldValue("CreatorOp", that._CreatorOpID);
            //that._ReceiveReceipt.SetFieldValue("CreatorOpName", that._CreatorOpName);

            //if (receiveReceiptEntity == null) {
            //    receiveReceiptEntity = afw.uiApi.CreateNewEntity("rp.ReceiveReceipt");
            //    receiveReceiptEntity.SetFieldValue("CreatorOp", that._BindableEntity.GetEntity().GetFieldValue("ID"))
            //}

            //that._HavaleDaryaftiBindableEntity = that._HavaleDaryaftiItem.ToBindableEntity();

            that._PaymentComplete.bind("Click", function (e) { that._PaymentComplete_Click(e); });

            that._Additional = "";
            that.LoadTextArea();

            that.TerminalNumber = "";
            that.ConnectionType = "";
            that.IpAddress = "";
            that.PortNumber = "";
            that.AccountType = "";
            that.Language = "";
            that.PosAmount = 0;
        },

        _PaymentComplete_Click: function (e) {
            var that = this;

            var payingTotalAmount = 0
            if (!ValueIsEmpty(that._QuickSettlement_Pos) && !ValueIsEmpty(that._QuickSettlement_Pos.AmountTextBox.GetValue())) {
                payingTotalAmount += that._QuickSettlement_Pos.AmountTextBox.GetValue();
            }
            if (!ValueIsEmpty(that._QuickSettlement_Havale) && !ValueIsEmpty(that._QuickSettlement_Havale.AmountTextBox.GetValue())) {
                payingTotalAmount += that._QuickSettlement_Havale.AmountTextBox.GetValue();
            }
            if (!ValueIsEmpty(that._QuickSettlement_Naqd) && !ValueIsEmpty(that._QuickSettlement_Naqd.AmountTextBox.GetValue())) {
                payingTotalAmount += that._QuickSettlement_Naqd.AmountTextBox.GetValue();
            }

            if (payingTotalAmount <= 0)
                return;

            if (ValueIsEmpty(that.PosAmount) || that.PosAmount == 0) {
                that._SaveQuickSettlementAndClose();
                return;
            }

            //Start pos payment process:

            //that._IsSystemResponseHandler = false;
            //that._IsCardSwipedHandler = false;
            //that._IsTransactionResponseHandler = false;
            //that._IsContinue = true;

            SamanPosApi.GetSystemResponseHandler =
                function (message) {
                    //Initial method response
                    //that._IsSystemResponseHandler = true;

                    if (message == '0') {
                        if (that.AccountType == "0") { //Single Account
                            //if (that._IsContinue == true) {
                            SamanPosApi.Console.server.SendAmount1Step(that.PosAmount, null, that._Additional, "");
                            //}
                        }
                    }
                    else {
                        //that._IsContinue = false;
                        afw.uiApi.HideProgress(that);
                        var errorMessage = "امکان اتصال به دستگاه وجود ندارد!" + "<br/>" + "لطفا نتیجه عملیات را انتخاب کنید.";
                        that._OpenPosPaymentStatusForm(errorMessage);
                    }
                };

            SamanPosApi.GetCardSwipedHandler =
                function (TerminalId, CardNumberHash, CardNumberMask, PurchaseTypes) {
                    //that._IsCardSwipedHandler = true;
                };

            SamanPosApi.GetTransactionResponseHandler =
                function (TerminalId, ResponseCode, SerialId, RRN, ResponseDescription, TxnDate) {
                    //that._IsTransactionResponseHandler = true;
                    afw.uiApi.HideProgress(that);

                    if (ResponseCode == 0) {
                        that._SaveQuickSettlementAndClose();
                    }
                    else {
                        //that._IsContinue = false;
                        var errorMessage = "خطا در پرداخت:\r\n" + ResponseDescription;
                        afw.ErrorDialog.Show(errorMessage);
                    }
                };

            afw.uiApi.ShowProgress(that);
            try {
                //اتصال به دستگاه
                SamanPosApi.Console.server.Initial(that.ConnectionType, that.IpAddress, that.PortNumber, that.AccountType, that.Language, '0');
            }
            catch (ex) {
                //that._IsContinue = false;
                //that._IsTransactionResponseHandler = null;
                afw.uiApi.HideProgress(that);
                var errorMessage = "امکان اتصال به دستگاه وجود ندارد!" + "<br/>" + "لطفا نتیجه عملیات را انتخاب کنید.";
                that._OpenPosPaymentStatusForm(errorMessage);
                return;
            }

            //setTimeout(function () {
            //    if (that._IsSystemResponseHandler == false) {
            //        that._IsContinue = false;
            //        that._IsTransactionResponseHandler = null;
            //        afw.uiApi.HideProgress(that);
            //        var errorMessage = "امکان اتصال به دستگاه وجود ندارد!" + "<br/>" + "لطفا نتیجه عملیات را انتخاب کنید.";
            //        that._OpenPosPaymentStatusForm(errorMessage);
            //    }
            //}, 15000);

            //setTimeout(function () {
            //    if (that._IsTransactionResponseHandler == false) {
            //        that._IsContinue = false;
            //        that._IsSystemResponseHandler = null;
            //        afw.uiApi.HideProgress(that);
            //        var errorMessage = "پاسخی از دستگاه پور دریافت نشد!" + "<br/>" + "لطفا نتیجه عملیات را انتخاب کنید.";
            //        that._OpenPosPaymentStatusForm(errorMessage);
            //    }
            //}, 16000);
        },

        _CalculateDebtorAmountCheckBox_CheckedChanged: function (e) {
            var that = this;

            var itemAmount = 0;

            if (!ValueIsEmpty(that._QuickSettlement_Pos) && !ValueIsEmpty(that._QuickSettlement_Pos.AmountTextBox.GetValue()))
                itemAmount = that._QuickSettlement_Pos.AmountTextBox.GetValue();
            else if (!ValueIsEmpty(that._QuickSettlement_Havale) && !ValueIsEmpty(that._QuickSettlement_Havale.AmountTextBox.GetValue()))
                itemAmount = that._QuickSettlement_Havale.AmountTextBox.GetValue();
            else if (!ValueIsEmpty(that._QuickSettlement_Naqd) && !ValueIsEmpty(that._QuickSettlement_Naqd.AmountTextBox.GetValue()))
                itemAmount = that._QuickSettlement_Naqd.AmountTextBox.GetValue();

            if (that._CalculateDebtorAmountCheckBox.GetValue() == true) {
                that._SettlementTotalAmount += that._DebtorAmountNumberLabel.GetText().Replace(',', '').ToNumber();

                itemAmount += that._DebtorAmountNumberLabel.GetText().Replace(',', '').ToNumber();
            }
            else {
                that._SettlementTotalAmount -= that._DebtorAmountNumberLabel.GetText().Replace(',', '').ToNumber();
                itemAmount -= that._DebtorAmountNumberLabel.GetText().Replace(',', '').ToNumber();
            }

            if (!ValueIsEmpty(that._QuickSettlement_Pos) && !ValueIsEmpty(that._QuickSettlement_Pos.AmountTextBox.GetValue()))
                that._QuickSettlement_Pos.AmountTextBox.SetValue(itemAmount);
            else if (!ValueIsEmpty(that._QuickSettlement_Havale) && !ValueIsEmpty(that._QuickSettlement_Havale.AmountTextBox.GetValue()))
                that._QuickSettlement_Havale.AmountTextBox.SetValue(itemAmount);
            else if (!ValueIsEmpty(that._QuickSettlement_Naqd) && !ValueIsEmpty(that._QuickSettlement_Naqd.AmountTextBox.GetValue()))
                that._QuickSettlement_Naqd.AmountTextBox.SetValue(itemAmount);

            that._RemainingAmount = that._SettlementTotalAmount;
            that._PayableNumberLabel.SetText(afw.BaseUtils.FormatNumber(that._SettlementTotalAmount));
            that.RefeshAmountLabel(0, null);
        },

        _OpenPosPaymentStatusForm: function (messageText) {
            var that = this;

            var posPaymentStatusFormWindow = afw.uiApi.OpenSavedFormWindow("rp.PosPaymentStatusForm",
                {
                    Name: "PosPaymentStatusFormWindow",
                    Modal: true,
                    Title: "سوال",
                    FormMode: "New",
                    MessageText: messageText
                });

            posPaymentStatusFormWindow.bind("Close", function (e) { that._PosPaymentStatusFormWindow_Close(e); });
        },

        _PosPaymentStatusFormWindow_Close: function (e) {
            var that = this;

            if (e.Sender.UserSelectedButton == "Successful") {
                that._SaveQuickSettlementAndClose();
            }
            else if (e.Sender.UserSelectedButton == "Unsuccessful") {

            }
        },

        _SaveQuickSettlementAndClose: function () {
            var that = this;

            try {
                that._PayingAmountsSum = that._CalculateTotalAmount();

                if (!ValueIsEmpty(that._SettlementTotalAmount)) {

                    if (that._PayingAmountsSum > that._SettlementTotalAmount) {
                        afw.ErrorDialog.Show('مبلغ پرداختی از مبلغ تسویه بیشتر است.');
                        return;
                    }
                    //that._SetReceiveReceiptFieldsValues();
                    //if (that._CompareSettlementAndInvoiceAmounts()) {

                    //if (that._FileSettlement.ChangeStatus != 'Add')
                    //    that._FileSettlement.ChangeStatus != 'Modify'

                    //FileSettlement
                    afw.uiApi.CallServerMethodSync("rp.SaveQuickSettelmentEntity", [that._ReceiveReceipt, that._FileSettlement, that._IsWorkShift]);
                    that._FileSettlementsControl.LoadData();
                    that.Close();
                }
                else {
                    afw.uiApi.CallServerMethodSync("rp.SaveQuickSettelmentEntity", [that._ReceiveReceipt, that._FileSettlement, that._IsWorkShift]);
                    that._FileSettlementsControl.LoadData();
                    that.Close();
                }
            }
            catch (ex) {
                afw.MessageDialog.Show("مشکلی در ثبت وجود دارد: " + ex.message);
            }
        },

        _CreateControls: function () {
            var that = this;

            if (that._ReceiveReceipt.GetFieldValue("Items") != null)
                that._GetClinicfileReceiveItems();

            if (that._ReceiveItemsEntityList == null)
                that._ReceiveItemsEntityList = afw.uiApi.CreateEntityList("rp.ReceiveReceiptItem");

            that._FetchAndCreateItems();

            if (!that._ReceiveReceipt.FieldExists("Items"))
                that._ReceiveReceipt.AddField("Items");

            that._ReceiveReceipt.SetFieldValue("Items", that._ReceiveItemsEntityList);
        },

        _FetchAndCreateItems: function () {
            var that = this;

            var posEntityList = $.grep(that._ReceiveItemsEntityList.Entities,
                   function (o) { return ValueIsIn(o.GetFieldValue("ID"), that._GetItemsEntitesID('Pos')); });

            var havaleEntityList = $.grep(that._ReceiveItemsEntityList.Entities,
                   function (o) { return ValueIsIn(o.GetFieldValue("ID"), that._GetItemsEntitesID('Havale')); });

            var naqd = $.grep(that._ReceiveItemsEntityList.Entities,
                    function (o) { return o.GetFieldValue("ID") == that._GetItemsEntitesID('Naqd'); });

            //var cheqesEntityList = $.grep(that._ReceiveItemsEntityList.Entities,
            //        function (o) { return ValueIsIn(o.GetFieldValue("ID"), that._GetItemsEntitesID('Cheqe')); });

            if (that._PosItems.length > 0) {
                // ایجاد کنترل پوز
                if (posEntityList.length > 0)
                    for (var i = 0; i < posEntityList.length; i++) {
                        var posEntity = $.grep(that._ReceiveItemsEntityListCurrent.Entities,
                            function (o) { return o.GetFieldValue("ID") == posEntityList[i].GetFieldValue("ID"); });
                        if (posEntity.length > 0)
                            that._CreateQuickSettlement_Pos(posEntityList[i]);
                    }
                that.CreateNewQuickSettlement_Pos();
            }

            // ایجاد کنترل حواله
            if (havaleEntityList.length > 0)
                for (var i = 0; i < havaleEntityList.length; i++) {
                    var havaleEntity = $.grep(that._ReceiveItemsEntityListCurrent.Entities,
                        function (o) { return o.GetFieldValue("ID") == havaleEntityList[i].GetFieldValue("ID"); });
                    if (havaleEntity.length > 0)
                        that._CreateQuickSettlement_Havale(havaleEntityList[i]);
                }
            that.CreateNewQuickSettlement_Havale();

            // ایجاد کنترل نقد
            if (naqd.length > 0) {
                var naghdEntity = $.grep(that._ReceiveItemsEntityListCurrent.Entities,
                       function (o) { return o.GetFieldValue("ID") == naqd[0].GetFieldValue("ID"); });
                if (naghdEntity.length > 0)
                    that._CreateQuickSettlement_Naqd(naqd[0]);
            }

            else
                that._CreateNewQuickSettlement_Naqd();

            // ایجاد کنترل چک
            //if (cheqesEntityList.length > 0)
            //    for (var i = 0; i < cheqesEntityList.length; i++) {
            //        var cheqeEntity = $.grep(that._ReceiveItemsEntityListCurrent.Entities,
            //           function (o) { return o.GetFieldValue("ID") == cheqesEntityList[i].GetFieldValue("ID"); });
            //        if (cheqeEntity.length > 0)
            //        that._CreateQuickSettlement_Cheqe(cheqesEntityList[i]);
            //    } 
            //that.CreateNewQuickSettlement_Cheqe();

        },

        _GetClinicfileReceiveItems: function () {
            var that = this;

            that._ReceiveItemsEntityList = that._ReceiveReceipt.GetFieldValue("Items");
            var receiveItemsEntityList = afw.uiApi.CreateEntityList();
            var receiveItemEntity = null;

            for (var i = 0; i < that._ReceiveItemsEntityList.Entities.length ; i++) {
                if (that._ReceiveItemsEntityList.Entities[i].GetFieldValue("CreatorOp") == that._CreatorOpID)
                    receiveItemEntity = that._ReceiveItemsEntityList.Entities[i];
                //receiveItemEntity = $.grep(that._ReceiveItemsEntityList.Entities,
                //   function (o) { return o.GetFieldValue("CreatorOp") == that._CreatorOpID });

                if (receiveItemEntity != null)
                    receiveItemsEntityList.Entities.push(receiveItemEntity);

                receiveItemEntity = null;
            }
            that._ReceiveItemsEntityListCurrent = receiveItemsEntityList;
            return receiveItemsEntityList;
        },

        _SetReceiveReceiptFieldsValues: function () {
            var that = this;

            var filter = String.Format("FinancialYear = '{0}'", that._ActiveFinancialYearID);
            var lastReceiptNumber = afw.uiApi.CallServerMethodSync("cmn.GetFieldMaxIntValue", ["ReceiptNumber", "rp_ReceiveReceipts", filter]);
            var financialDocTypeID = afw.OptionSetHelper.GetOptionSetItemID("cmn.FinancialDocType.Main");

            var financialGroupEntity = cmn.GetFinancialGroupEntity(that._ActiveOrgUnitID, that._ActiveFinancialYearID, financialDocTypeID);

            that._ReceiveReceipt.SetFieldValue("ReceiptNumber", lastReceiptNumber + 1);
            that._ReceiveReceipt.SetFieldValue("CreatorOpName", that._CreatorOpName);
            that._ReceiveReceipt.SetFieldValue("FinancialYear", that._ActiveFinancialYearID);
            that._ReceiveReceipt.SetFieldValue("FinancialGroup", financialGroupEntity.GetFieldValue("ID"));
            that._ReceiveReceipt.SetFieldValue("ReceiptDate", afw.DateTimeHelper.GetServerDateTime());
            that._ReceiveReceipt.SetFieldValue("TotalAmount", 0);
            that._ReceiveReceipt.SetFieldValue("FinancialDocType", financialDocTypeID);
        },

        CreateNewQuickSettlement_Pos: function () {
            var that = this;

            that._LastShomarePos = 100 + that._LastShomarePos;

            var newEntity = afw.uiApi.CreateNewEntity("rp.ReceiveReceiptItem");
            newEntity.SetFieldValue("ReceiveReceipt", that._ReceiveReceipt.GetFieldValue("ID"));
            newEntity.SetFieldValue("CreatorOp", that._CreatorOpID);

            if (that._ItemCreatorOpName == null)
                newEntity.SetFieldValue("CreatorOpName", that._CreatorOpName);
            else
                newEntity.SetFieldValue("CreatorOpName", that._ItemCreatorOpName);

            that._ReceiveItemsEntityList.Entities.push(newEntity);

            that._CreateQuickSettlement_Pos(newEntity);
        },

        _CreateQuickSettlement_Pos: function (entity) {
            var that = this;

            var parentControl = that._GetItemParentControl("QuickSettlement_Pos")
            //var bankAccountItems = null;

            that._QuickSettlement_Pos = new rp.QuickSettlement_Pos({
                Name: "QuickSettlement_Pos",
                FillParent: true,
                ParentControl: parentControl,
                ReceiveReceiptItemEntity: entity,
                QuickSettlementForm: that,
                PayerID: that._PayerID,
                SettlementTotalAmount: that._RemainingAmount,
                ShomarePos: that._ReceiveReceipt.GetFieldValue("ReceiptNumber").toString() + that._LastShomarePos.toString(),
                QuickSettlementPosItems: that._PosItems
            });

            //quickSettlement_Pos = { Name: "Pos", Index: parentControl.GetPaneIndex() };
            //that.PosControlsArray.push(quickSettlement_Pos);
        },

        CreateNewQuickSettlement_Havale: function () {
            var that = this;

            that._LastShomareHavale = afw.uiApi.CallServerMethodSync("cmn.GetFieldMaxIntValue", ["ShomareHavale", "rp_HavaleDaryafti",
                String.Format("ID in (" +
	                            "select FinancialItem_Havale " +
	                            "from rp_ReceiveReceiptItems " +
	                            "where ReceiveReceipt = '{0}' and FinancialItem_Havale is not null)",
                     that._ReceiveReceipt.GetFieldValue("ID"))]);

            if (that._LastShomareHavale == 0)
                that._LastShomareHavale = that._ReceiveReceipt.GetFieldValue("ReceiptNumber").toString() + "100";
            else
                that._LastShomareHavale++;

            var newEntity = afw.uiApi.CreateNewEntity("rp.ReceiveReceiptItem");
            newEntity.SetFieldValue("ReceiveReceipt", that._ReceiveReceipt.GetFieldValue("ID"));
            newEntity.SetFieldValue("CreatorOp", that._CreatorOpID);

            if (that._ItemCreatorOpName == null)
                newEntity.SetFieldValue("CreatorOpName", that._CreatorOpName);
            else
                newEntity.SetFieldValue("CreatorOpName", that._ItemCreatorOpName);

            that._ReceiveItemsEntityList.Entities.push(newEntity);

            that._CreateQuickSettlement_Havale(newEntity);
        },

        _CreateQuickSettlement_Havale: function (entity) {
            var that = this;

            var parentControl = that._GetItemParentControl("QuickSettlement_Havale")
            //var bankAccountItems = null;

            that._QuickSettlement_Havale = new rp.QuickSettlement_Havale({
                Name: "QuickSettlement_Havale",
                FillParent: true,
                ParentControl: parentControl,
                ReceiveReceiptItemEntity: entity,
                QuickSettlementForm: that,
                PayerID: that._PayerID,
                SettlementTotalAmount: that._RemainingAmount,
                ShomareHavale: that._LastShomareHavale,
                QuickSettlementHavaleItems: that._HavaleItems,
                QuickSettlement_UserDefaultHavaleItemID: that._QuickSettlement_UserDefaultHavaleItemID
            });

            //quickSettlement_Havale = { Name: "Havale", Index: parentControl.GetPaneIndex() };
            //that.HavaleControlsArray.push(quickSettlement_Havale);
        },

        _CreateNewQuickSettlement_Naqd: function () {
            var that = this;

            var newEntity = afw.uiApi.CreateNewEntity("rp.ReceiveReceiptItem");

            newEntity.SetFieldValue("ReceiveReceipt", that._ReceiveReceipt.GetFieldValue("ID"));
            newEntity.SetFieldValue("CreatorOp", that._CreatorOpID);

            if (that._ItemCreatorOpName == null)
                newEntity.SetFieldValue("CreatorOpName", that._CreatorOpName);
            else
                newEntity.SetFieldValue("CreatorOpName", that._ItemCreatorOpName);

            that._ReceiveItemsEntityList.Entities.push(newEntity);

            that._CreateQuickSettlement_Naqd(newEntity);
        },

        _CreateQuickSettlement_Naqd: function (entity) {
            var that = this;

            var parentControl = that._GetItemParentControl("QuickSettlement_Naqd")
            //if(entity)
            that._QuickSettlement_Naqd = new rp.QuickSettlement_Naqd({
                Name: "QuickSettlement_Naqd",
                FillParent: true,
                ParentControl: parentControl,
                ReceiveReceiptItemEntity: entity,
                QuickSettlementForm: that,
                PayerID: that._PayerID,
                QuickSettlementCashItems: that._CashItems,
                QuickSettlement_UserDefaultCashItemID: that._QuickSettlement_UserDefaultCashItemID
            });

            //return servicePackageRowControl;
        },

        CreateNewQuickSettlement_Cheqe: function () {
            var that = this;

            var newEntity = afw.uiApi.CreateNewEntity("rp.ReceiveReceiptItem");

            newEntity.SetFieldValue("ReceiveReceipt", that._ReceiveReceipt.GetFieldValue("ID"));
            newEntity.SetFieldValue("CreatorOp", that._CreatorOpID);
            if (that._ItemCreatorOpName == null)
                newEntity.SetFieldValue("CreatorOpName", that._CreatorOpName);
            else
                newEntity.SetFieldValue("CreatorOpName", that._ItemCreatorOpName);

            that._ReceiveItemsEntityList.Entities.push(newEntity);

            that._CreateQuickSettlement_Cheqe(newEntity);
        },

        _CreateQuickSettlement_Cheqe: function (entity) {
            var that = this;

            var parentControl = that._GetItemParentControl("QuickSettlement_Cheqe")
            //if(entity)
            var quickSettlement_Cheqe = new rp.QuickSettlement_Cheqe({
                Name: "QuickSettlement_Cheqe",
                FillParent: true,
                ParentControl: parentControl,
                ReceiveReceiptItemEntity: entity,
                QuickSettlementForm: that,
                PayerID: that._PayerID
            });
        },

        _GetItemParentControl: function (controlType) {
            var that = this;

            var parentControl = null;

            var itemCount = that._ControlsDockPanel.GetPanesCount();

            if (itemCount < 2) {
                var paneIndex = itemCount - 1;
                //return  parentControl = that._ControlsDockPanel.InsertPane(paneIndex, { Size: 50 }, true);
            }
            else {
                for (var index = 1 ; index < itemCount; index++) {
                    itemControl = that._ControlsDockPanel.Panes[index].FindControl(controlType);
                    if (itemControl == null) {
                        if (that._PosItems.length > 0) {
                            if (controlType == "QuickSettlement_Havale") {
                                paneIndex = index;
                                controlType = '';
                            }
                        }
                        else {
                            if (controlType == "QuickSettlement_Pos") {
                                paneIndex = index;
                                controlType = '';
                            }
                        }
                    }
                }
                if (controlType == "QuickSettlement_Cheqe" || controlType == "QuickSettlement_Naqd") {
                    paneIndex = itemCount - 1;
                    //LastCheqeIndx.LastCheqeIndx = paneIndex;
                }
            }
            parentControl = that._ControlsDockPanel.InsertPane(paneIndex, { Size: 50 }, true)

            return that._CreateBorderPanels(parentControl);
            //that.ParentControl.GetPaneIndex()
        },

        RemoveItemControl: function (itemControl) {
            var that = this;

            var itemCount = that._ControlsDockPanel.GetPanesCount();
            var posCount = 0;
            var havaleCount = 0;
            var cheqeCount = 0;
            var posItem = null;
            var havaleItem = null;
            var cheqeItem = null;

            for (var index = 1 ; index < itemCount; index++) {
                if (itemControl._Name == "QuickSettlement_Pos") {
                    posItem = that._ControlsDockPanel.Panes[index].FindControl("QuickSettlement_Pos");
                    if (posItem != null)
                        posCount = posCount + 1;
                }
                else if (itemControl._Name == "QuickSettlement_Havale") {
                    havaleItem = that._ControlsDockPanel.Panes[index].FindControl("QuickSettlement_Havale");
                    if (havaleItem != null)
                        havaleCount = havaleCount + 1;
                }
                else if (itemControl._Name == "QuickSettlement_Cheqe") {
                    cheqeItem = that._ControlsDockPanel.Panes[index].FindControl("QuickSettlement_Cheqe");
                    if (cheqeItem != null)
                        cheqeCount = cheqeCount + 1;
                }
            }

            if (cheqeCount > 1 || havaleCount > 1)
                that._ControlsDockPanel.RemovePane(itemControl.ParentControl.ParentControl.ParentControl.GetPaneIndex());

            if (posCount >= 1)
                that._SetAddButtonVisible("QuickSettlement_Pos");

            if (havaleCount >= 1)
                that._SetAddButtonVisible("QuickSettlement_Havale");

            if (cheqeCount >= 1)
                that._SetAddButtonVisible("QuickSettlement_Cheqe");
        },

        _SetAddButtonVisible: function (controlName) {
            var that = this;

            var indexesArray = [];

            var itemCount = that._ControlsDockPanel.GetPanesCount();
            var itemIndex = null;
            //var firstItemIndex = null;
            //var firstItem = null;
            var item = null;

            for (var index = 1 ; index < itemCount; index++) {
                item = that._ControlsDockPanel.Panes[index].FindControl(controlName);
                if (item != null) {
                    indexesArray.push(item.ParentControl.ParentControl.ParentControl.GetPaneIndex());
                    //firstItemIndex = item.ParentControl.ParentControl.ParentControl.GetPaneIndex();
                }
            }

            if (indexesArray.length > 0) {
                for (var i = 0 ; i <= indexesArray.length; i++) {
                    if (i == indexesArray.length)
                        itemIndex = indexesArray[i - 1];
                }
            }

            item = that._ControlsDockPanel.Panes[itemIndex].FindControl(controlName);
            //firstItem = that._ControlsDockPanel.Panes[firstItemIndex].FindControl(controlName);

            item.AddButton.SetVisible(true);
            //firstItem.RemoveButton.SetVisible(false);
        },

        _CreateBorderPanels: function (parentControl) {
            var that = this;

            var padingPanel = new afw.Panel({
                ParentControl: parentControl,
                Name: "PadingPanel",
                //Orientation: Vertical,//afw.Constants.Vertical,
                FillParent: true,
                BorderColor: "#e6e6e6",
                BorderWidth: 0,
                Padding: 2
            });

            var innerPanel = new afw.Panel({
                ParentControl: padingPanel,
                Name: "InnerPanel",
                //Orientation: Vertical,//afw.Constants.Vertical,
                FillParent: true,
                BorderColor: "#e6e6e6",
                BorderWidth: 1,
                Padding: 0
            });

            return innerPanel;
        },

        _GetItemsEntitesID: function (itemName) {
            var that = this;

            var naqdId = null;
            var posIDsArray = [];
            var havaleIDsArray = [];
            var cheqeIDsArray = [];

            for (var i = 0; i < that._ReceiveItemsEntityList.Entities.length; i++) {
                if (that._ReceiveItemsEntityList.Entities[i].GetFieldValue("FinancialItem_Naghd") != null)
                    naqdId = that._ReceiveItemsEntityList.Entities[i].GetFieldValue("ID");

                if (that._ReceiveItemsEntityList.Entities[i].GetFieldValue("FinancialItem_Pos") != null)
                    posIDsArray.push(that._ReceiveItemsEntityList.Entities[i].GetFieldValue("ID"));

                if (that._ReceiveItemsEntityList.Entities[i].GetFieldValue("FinancialItem_Havale") != null)
                    havaleIDsArray.push(that._ReceiveItemsEntityList.Entities[i].GetFieldValue("ID"));

                if (that._ReceiveItemsEntityList.Entities[i].GetFieldValue("FinancialItem_Cheque") != null)
                    cheqeIDsArray.push(that._ReceiveItemsEntityList.Entities[i].GetFieldValue("ID"));
            }

            if (itemName == 'Naqd')
                return naqdId;

            else if (itemName == 'Pos')
                return posIDsArray;

            else if (itemName == 'Havale')
                return havaleIDsArray;

            else if (itemName == 'Cheqe')
                return cheqeIDsArray;
        },

        RefeshAmountLabel: function (amount, type) {
            var that = this;

            //if (type == 'Naqd')
            //    that._NaqdAmount = amount + that._NaqdAmount;
            //if (type == 'Havale')
            //    that._HavaleAmount = amount + that._HavaleAmount;
            //if (type == 'Cheqe')
            //    that._CheqeAmount = amount + that._CheqeAmount;

            that._PayingAmountsSum = that._CalculateTotalAmount();// that._NaqdAmount + that._HavaleAmount + that._CheqeAmount;//Math.abs(amount - that._SettlementTotalAmount);
            that._RemainingAmount = that._SettlementTotalAmount - that._PayingAmountsSum;
            //that._SettlementTotalAmount = that._InvoiceAmount - that._CalculateTotalAmount();

            that._PayingAmountsSumLabel.SetText(afw.BaseUtils.FormatNumber(that._PayingAmountsSum));
        },

        GetRemainingAmount: function () {
            var that = this;

            return that._RemainingAmount;
        },

        _CompareSettlementAndInvoiceAmounts: function () {
            var that = this;

            if (that._SettlementTotalAmount < 0)
                return false;
            else
                return true;
        },

        _CalculateTotalAmount: function () {
            var that = this;

            var settlementAmount = 0;

            for (var i = 0; i < that._ControlsDockPanel.Panes.length; i++) {
                if (that._ControlsDockPanel.Panes[i].HasChildControls) {
                    var itemControl = that._ControlsDockPanel.Panes[i].ChildControls[0].ChildControls[0].ChildControls[0];
                    if (itemControl.AmountTextBox.GetValue() >= 0) {
                        settlementAmount = itemControl.AmountTextBox.GetValue() + settlementAmount;

                        if (itemControl.GetName() == "QuickSettlement_Pos") {
                            if (!ValueIsEmpty(itemControl._PosComboBox.GetValue()))
                                that.PosAmount = itemControl.AmountTextBox.GetValue();
                            else
                                that.PosAmount = 0;
                        }

                    }
                }
            }

            return settlementAmount;
        },

        LoadTextArea: function () {
            var that = this;

            that._Additional = "<?xml version=\"1.0\" encoding=\"utf-16\"?>" + "\r\n" +
                              "<List>" + "\r\n" +
                              "<print>" + "\r\n" +
                              "<item>123</item>" + "\r\n" +
                              "<value>a</value>" + "\r\n" +
                              "<alignment>0</alignment>" + "\r\n" +
                              "<receiptype>0</receiptype>" + "\r\n" +
                              "</print>" + "\r\n" +
                              "<print>" + "\r\n" +
                              "<item>456</item>" + "\r\n" +
                              "<value>c</value>" + "\r\n" +
                              "<alignment>1</alignment>" + "\r\n" +
                              "<receipttype>1</receipttype>" + "\r\n" +
                              "</print>" + "\r\n" +
                               "</List>";
        },

        _OnOpening: function (sender, e) {
            var that = this;

            that.Center();
            afw.Window.fn._OnOpening.call(that);
        },

        _OnOpened: function (sender, e) {
            var that = this;

            afw.Window.fn._OnOpened.call(that);

            that._ActiveFinancialYearID = cmn.GetUserActiveFinancialYearID();

            if (that._ReceiveReceipt.ChangeStatus == "Add") {
                if (that._ActiveFinancialYearID == null) {
                    afw.ErrorDialog.Show("سال مالی فعال تعیین نشده است.");
                    that.Close();
                    return;
                }

                that._ActiveOrgUnitID = cmn.GetUserActiveOrganizationUnitIDs();
                if (that._ActiveOrgUnitID.length != 1) {
                    afw.ErrorDialog.Show("واحد سازمانی فعال انتخاب نشده است.");
                    that.Close();
                    return;
                }

                that._ReceiveReceipt.SetFieldValue("OrganizationUnit", that._ActiveOrgUnitID[0]);
                that._ReceiveReceipt.SetFieldValue("CreatorOpName", that._CreatorOpName);
            }

            if (that._ReceiveReceipt.ChangeStatus == "Add")
                that._SetReceiveReceiptFieldsValues();

            that._CreateControls();
        },

        _OnClosed: function () {
            var that = this;

            afw.Window.fn._OnClosed.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "rp.QuickSettlementForm";
    FormClass.BaseType = afw.Window;

    FormClass._AllQuickSettlementPosItems = null;
    FormClass._AllQuickSettlementHavaleItems = null;
    FormClass._AllQuickSettlementCashItems = null;

    FormClass.UserLastSelectedPosItemID = null;
    FormClass._UserDefaultHavaleItemID = null;
    FormClass._UserDefaultCashItemID = null;

    FormClass.GetAllQuickSettlementPosItems = function () {
        var formClass = rp.QuickSettlementForm;

        if (formClass._AllQuickSettlementPosItems == null)
            formClass._AllQuickSettlementPosItems =
                afw.DataListHelper.FetchEntityListOfDataList("rp.QuickSettlementPosItemsList").ToDataSourceData();

        return formClass._AllQuickSettlementPosItems;
    };

    FormClass.GetAllQuickSettlementHavaleItems = function () {
        var formClass = rp.QuickSettlementForm;

        if (formClass._AllQuickSettlementHavaleItems == null)
            formClass._AllQuickSettlementHavaleItems =
                afw.DataListHelper.FetchEntityListOfDataList("rp.QuickSettlementHavaleItemsList").ToDataSourceData();

        return formClass._AllQuickSettlementHavaleItems;
    };

    FormClass.GetAllQuickSettlementCashItems = function () {
        var formClass = rp.QuickSettlementForm;

        if (formClass._AllQuickSettlementCashItems == null)
            formClass._AllQuickSettlementCashItems =
                afw.DataListHelper.FetchEntityListOfDataList("rp.QuickSettlementCashItemsList").ToDataSourceData();

        return formClass._AllQuickSettlementCashItems;
    };

    FormClass.GetUserDefaultHavaleItemID = function () {
        var formClass = rp.QuickSettlementForm;

        if (formClass._UserDefaultHavaleItemID == null) {
            var allQuickSettlementHavaleItems = formClass.GetAllQuickSettlementHavaleItems();

            var currentUser = cmn.GetCurrentUser();
            var userGenderID = currentUser.GetFieldValue("Gender");

            var foundItems = $.grep(allQuickSettlementHavaleItems,
                function (o) {
                    return o.IsDefault == true
                        && (o.Gender == null || o.Gender == userGenderID);
                });

            if (foundItems.length > 0)
                formClass._UserDefaultHavaleItemID = foundItems[0].ID;
            else
                formClass._UserDefaultHavaleItemID = null;
        }

        return formClass._UserDefaultHavaleItemID;
    };

    FormClass.GetUserDefaultCashItemID = function () {
        var formClass = rp.QuickSettlementForm;

        if (formClass._UserDefaultCashItemID == null) {
            var allQuickSettlementCashItems = formClass.GetAllQuickSettlementCashItems();

            var currentUser = cmn.GetCurrentUser();
            var userGenderID = currentUser.GetFieldValue("Gender");

            var foundItems = $.grep(allQuickSettlementCashItems,
                function (o) {
                    return o.IsDefault == true
                        && (o.Gender == null || o.Gender == userGenderID);
                });

            if (foundItems.length > 0)
                formClass._UserDefaultCashItemID = foundItems[0].ID;
            else
                formClass._UserDefaultCashItemID = null;
        }

        return formClass._UserDefaultCashItemID;
    }


    rp.QuickSettlementForm = FormClass;
})();
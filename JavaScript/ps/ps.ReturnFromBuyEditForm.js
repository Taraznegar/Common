(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return ps.ReturnFromBuyEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._MainDockPanel = that.FindControl("MainDockPanel");

            that.ItemsEntityList = null;
            that._ItemsGridControl = null;

            that._ReturnFromBuyNumberPaneIndex = 0;
            that._BuyInvoiceIssueDatePaneIndex = 1;
            that._IsSettingGeneralDiscount = false;
            that._IsSettingGeneralDiscountPercent = false;
            that._IsSettingGeneralDiscountByDiscountPercent = false;
            that._IsSettingGeneralDiscountPercentByDiscount = false;
            that._HorizontalDockPanel1 = that.FindControl("HorizontalDockPanel1");
            that._HorizontalDockPanel2 = that.FindControl("HorizontalDockPanel2");
            that._BuyInvoiceLookupControl = that.FindControl("BuyInvoiceLookupControl");
            that._BuyInvoiceAutoComplete = that._BuyInvoiceLookupControl.GetAutoComplete();
            that._SellerLookupControl = that.FindControl("SellerLookupControl");
            that._SellerAutoComplete = that._SellerLookupControl.GetAutoComplete();
            that._IssueDateControl = that.FindControl("IssueDateControl");
            that._BuyInvoiceIssueDateControl = that.FindControl("BuyInvoiceIssueDateControl");
            that._FinancialDocTypeOptionSetControl = that.FindControl("FinancialDocTypeOptionSetControl");
            that._OwnerUserLookupControl = that.FindControl("OwnerUserLookupControl");
            that._ReturnFromBuyNumberTextBox = that.FindControl("ReturnFromBuyNumberTextBox");
            that._ReturnFromBuyNumberTextBox.SetReadOnly(true);

            that._GeneralDiscountTextBox = that.FindControl("GeneralDiscountTextBox");
            that._GeneralDiscountPercentTextBox = that.FindControl("GeneralDiscountPercentTextBox");

            var entity = that._BindableEntity.GetEntity();

            if (!entity.FieldExists("StuffItems"))
                entity.AddField("StuffItems");

            that._ActiveFinancialYearID = cmn.GetUserActiveFinancialYearID();

            if (that._FormMode == "New") {
                that._BindableEntity.set("IssueDate", afw.DateTimeHelper.GetServerDateTime());

                if (entity.GetFieldValue("StuffItems") == null) {
                    var itemsEntityList = afw.uiApi.CreateEntityList("ps.ReturnFromBuyItem");
                    entity.SetFieldValue("StuffItems", itemsEntityList);
                }

                that._BindableEntity.set("FinancialYear", that._ActiveFinancialYearID);

                that._OwnerUserLookupControl.SetValue(afw.App.CurrentUserID);

                that._ReturnFromBuyNumberTextBox.SetVisible(false);
                that._HorizontalDockPanel1.SetPaneSizeSetting(that._ReturnFromBuyNumberPaneIndex, 1);
                that._HorizontalDockPanel2.SetPaneSizeSetting(that._BuyInvoiceIssueDatePaneIndex, 1);
            }
            else {
                if (entity.GetFieldValue("StuffItems") == null) {
                    itemsEntityList = afw.uiApi.FetchEntityList("ps.ReturnFromBuyItem",
                        String.Format("ReturnFromBuy = '{0}'", that._BindableEntity.get("ID")), "RowNumber");
                    entity.SetFieldValue("StuffItems", itemsEntityList);
                }

                var buyInvoiceID = that._BindableEntity.get("BuyInvoice");
                if (buyInvoiceID != null) {
                    var invoiceEntity = afw.uiApi.FetchEntity("ps.BuyInvoice",
                           String.Format("ID = '{0}'", buyInvoiceID));
                    that._BuyInvoiceIssueDateControl.SetValue(invoiceEntity.GetFieldValue("IssueDate"));
                }
                else {
                    that._HorizontalDockPanel2.SetPaneSizeSetting(that._BuyInvoiceIssueDatePaneIndex, 1);
                }

                that._BuyInvoiceLookupControl.SetReadOnly(true);

                that._HorizontalDockPanel1.SetPaneSizeSetting(that._ReturnFromBuyNumberPaneIndex, 230);
            }

            that.ItemsEntityList = entity.GetFieldValue("StuffItems");

            that._CreateItemsGridControl(that.ItemsEntityList);

            that._IssueDateControl.bind("ValueChanged", function (e) { that._IssueDateControl_ValueChanged(e); });
            that._GeneralDiscountTextBox.bind("ValueChanged", function (e) { that._GeneralDiscountTextBox_ValueChanged(e); });
            that._GeneralDiscountPercentTextBox.bind("ValueChanged", function (e) { that._GeneralDiscountPercentTextBox_ValueChanged(e); });
            that._BuyInvoiceLookupControl.bind("ValueChanged", function (e) { that._BuyInvoiceLookupControl_ValueChanged(e) });
            that._FinancialDocTypeOptionSetControl.bind("ValueChanged", function (e) { that._FinancialDocTypeOptionSetControl_ValueChanged(e) });
            that._BuyInvoiceLookupControl.bind("OpeningLookup", function (e) { that._BuyInvoiceLookupControl_OpeningLookup(e) });

            that._SetGeneralDiscountPercentByDiscount();
        },

        _BuyInvoiceLookupControl_OpeningLookup: function (e) {
            var that = this;

            e.Sender.SetLookupDataListControlCustomOptions({ Mode: 'BuyInvoice', DisableActiveFinancialYearFilter: true });
        },

        GetBindableEntity: function () {
            var that = this;

            return that._BindableEntity;
        },

        _OnOpened: function (sender, e) {
            var that = this;

            afw.Window.fn._OnOpened.call(that);

            if (that._FormMode == "New") {
                if (that._ActiveFinancialYearID == null) {
                    afw.ErrorDialog.Show("سال مالی فعال تعیین نشده است.");
                    that.Close();
                    return;
                }

                var activeOrgUnitID = cmn.GetUserActiveOrganizationUnitIDs();
                if (activeOrgUnitID.length != 1) {
                    afw.ErrorDialog.Show("واحد سازمانی فعال انتخاب نشده است.");
                    that.Close();
                    return;
                }

                that._BindableEntity.set("OrganizationUnit", activeOrgUnitID[0]);
            }

            that._BuyInvoiceLookupControl.SetBaseFilterExpression(
                String.Format("OrganizationUnit = '{0}'",
                    that._BindableEntity.get("OrganizationUnit")));

            if (ps.GetCurrentTaxAndTollPercentEntity() == null) {
                afw.ErrorDialog.Show("درصد مالیات و عوارض تعیین نشده است.");
                that.Close();
                return;
            }

            setTimeout(
                function () {
                    that._BuyInvoiceAutoComplete.Focus();
                }, 500);
        },

        _OnClosed: function () {
            var that = this;

            afw.Window.fn._OnClosed.call(that);
        },

        _BuyInvoiceLookupControl_ValueChanged: function (e) {
            var that = this;

            that._BindableEntity.set("Seller", null);
            that._BindableEntity.set("FinancialGroup", null);
            that._BindableEntity.set("FinancialDocType", null);
            that._BuyInvoiceIssueDateControl.SetValue(null);
            that._BindableEntity.set("OwnerUser", null);

            if (that._ItemsGridControl != null)
                that._DestroyItemsGridControl();

            if (ValueIsEmpty(that._BuyInvoiceLookupControl.GetValue())) {
                that._SellerLookupControl.SetReadOnly(false);

                that._HorizontalDockPanel2.SetPaneSizeSetting(that._BuyInvoiceIssueDatePaneIndex, 1);

                var itemsEntityList = afw.uiApi.CreateEntityList("ps.ReturnFromBuyItem");
                that._BindableEntity.GetEntity().SetFieldValue("StuffItems", itemsEntityList);
                that.ItemsEntityList = itemsEntityList;
                that._CreateItemsGridControl(that.ItemsEntityList);
            }
            else {
                that._SellerLookupControl.SetReadOnly(true);

                that._HorizontalDockPanel2.SetPaneSizeSetting(that._BuyInvoiceIssueDatePaneIndex, 280);

                var invoiceEntity = afw.uiApi.FetchEntity("ps.BuyInvoice",
                       String.Format("ID = '{0}'", that._BuyInvoiceLookupControl.GetValue()));

                that._BindableEntity.set("Seller", invoiceEntity.GetFieldValue("Seller"));
                that._BindableEntity.set("FinancialGroup", invoiceEntity.GetFieldValue("FinancialGroup"));
                that._BindableEntity.set("FinancialDocType", invoiceEntity.GetFieldValue("FinancialDocType"));
                that._BuyInvoiceIssueDateControl.SetValue(invoiceEntity.GetFieldValue("IssueDate"));
                that._BindableEntity.set("FinancialYear", that._ActiveFinancialYearID);
                that._BindableEntity.set("OwnerUser", invoiceEntity.GetFieldValue("OwnerUser"));

                var invoiceItemsEntityList = afw.uiApi.CallServerMethodSync("ps.GenerateReturnFromBuyItems", [
                    that._BindableEntity.get("ID"),
                    invoiceEntity.GetFieldValue("ID")]);

                that._BindableEntity.GetEntity().SetFieldValue("StuffItems", invoiceItemsEntityList);
                that.ItemsEntityList = invoiceItemsEntityList;

                that._CreateItemsGridControl(that.ItemsEntityList);

                that._UpdateItemsTaxAndToll();

                that._SetRowFieldsReadOnly();
            }

            that._AdjustForm();
        },

        _IssueDateControl_ValueChanged: function (e) {
            var that = this;

            that._AdjustForm();
        },

        _FinancialDocTypeOptionSetControl_ValueChanged: function (e) {
            var that = this;

            if (ValueIsEmpty(that._FinancialDocTypeOptionSetControl.GetValue()))
                return;

            try {
                var financialGroupEntity = cmn.GetFinancialGroupEntity(that._BindableEntity.get("OrganizationUnit"),
                    that._BindableEntity.get("FinancialYear"), that._BindableEntity.get("FinancialDocType"));
                if (financialGroupEntity != null)
                    that._BindableEntity.set("FinancialGroup", financialGroupEntity.GetFieldValue("ID"));
                else
                    that._BindableEntity.set("FinancialGroup", null);

                if (that._ItemsGridControl != null)
                    that._UpdateItemsTaxAndToll();
            }
            catch (ex) {
                that._BindableEntity.set("FinancialDocType", null);
                afw.ErrorDialog.Show(ex);
            }
        },

        _UpdateItemsTaxAndToll: function () {
            var that = this;

            for (var i = 0; i < that._ItemsGridControl.GetRowsCount() ; i++) {
                var rowControl = that._ItemsGridControl.GetRowByIndex(i);
                rowControl.UpdateTaxAndToll();
            }
        },

        _CreateItemsGridControl: function (itemsEntityList) {
            var that = this;

            that._ItemsGridControl = new ps.ReturnFromBuyItemsGridControl({
                ParentControl: that._MainDockPanel.Panes[2],
                Name: "ItemsGridControl",
                ReturnFromBuyEditForm: that,
                RowsEntityList: itemsEntityList,
                FillParent: false
            });

            if (itemsEntityList.Entities.length == 0)
                that._ItemsGridControl.AddEmptyItems(1);
            else {
                for (var i = 0; i < itemsEntityList.Entities.length; i++) {
                    that._ItemsGridControl.AddRow(itemsEntityList.Entities[i]);
                }
            }
        },

        _DestroyItemsGridControl: function () {
            var that = this;

            that._ItemsGridControl.Destroy();
            that._ItemsGridControl = null;
        },

        _SetRowFieldsReadOnly: function (e) {
            var that = this;

            for (var i = 0; i < that._ItemsGridControl.GetRowsCount() ; i++)
                that._ItemsGridControl.GetRowByIndex(i).SetFieldsReadOnly(true);
        },

        _HideRemoveRowButtons: function (e) {
            var that = this;

            for (var i = 0; i < that._ItemsGridControl.GetRowsCount() ; i++) {
                that._ItemsGridControl.GetRowByIndex(i).HideRemoveRowButton();
            }
        },

        _AdjustForm: function () {
            var that = this;

            afw.EntityWindowBase.fn._AdjustForm.call(that);

            if (that._ItemsGridControl != null && that._BindableEntity.get("BuyInvoice") != null)
                that._ItemsGridControl.HideAddRowButton();
        },

        _FormReadOnlyMode: function (readOnlyMode) {
            var that = this;

            that._SellerLookupControl.SetReadOnly(readOnlyMode);
        },

        _ValidateForm: function () {
            var that = this;

            if (!afw.EntityWindowBase.fn._ValidateForm.call(that))
                return false;

            if (!that._ItemsGridControl.ValidateRows())
                return false;

            return true;
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            if (buttonKey == "Save" && that._BindableEntity.GetEntity().ChangeStatus == "Add") {
                if (!that._Save())
                    return;

                var salesInvoceEntity = afw.uiApi.FetchEntityByID("ps.ReturnFromBuy", that._BindableEntity.get("ID"));
                that._BindableEntity.set("AccDoc", salesInvoceEntity.GetFieldValue("AccDoc"));
                that._BindableEntity.set("ReturnFromBuyNumber", salesInvoceEntity.GetFieldValue("ReturnFromBuyNumber"));
                return;
            }
            else
                afw.EntityWindowBase.fn._OnToolbarButtonClicked.call(that, buttonKey);
        },

        _Save: function () {
            var that = this;

            if (ValueIsEmpty(that._GeneralDiscountTextBox.GetValue()))
                that._GeneralDiscountTextBox.SetText(0);

            var saved = afw.EntityWindowBase.fn._Save.call(that);

            return saved;
        },

        GetTaxCalculationIsEnabled: function () {
            var that = this;

            return cmn.GetFinancialGroupTaxCalculationIsEnabled(that._BindableEntity.get("OrganizationUnit"),
                that._BindableEntity.get("FinancialYear"), that._BindableEntity.get("FinancialDocType"));
        },

        _GeneralDiscountTextBox_ValueChanged: function (e) {
            var that = this;

            that._IsSettingGeneralDiscount = true;
            try {
                if (!that._IsSettingGeneralDiscountPercent && !that._IsSettingGeneralDiscountByDiscountPercent) {
                    that._GeneralDiscountPercentTextBox.SetText(null);
                }

                that.UpdateSummaryFields();
            }
            finally {
                that._IsSettingGeneralDiscount = false;
            }
        },

        _GeneralDiscountPercentTextBox_ValueChanged: function (e) {
            var that = this;

            that._IsSettingGeneralDiscountPercent = true;
            try {
                if (!that._IsSettingGeneralDiscount && !that._IsSettingGeneralDiscountPercentByDiscount) {
                    if (ValueIsEmpty(that._GeneralDiscountPercentTextBox.GetText()))
                        that._GeneralDiscountTextBox.SetText("");
                    else {
                        that._SetGeneralDiscountByDiscountPercent();
                    }
                }
            }
            finally {
                that._IsSettingGeneralDiscountPercent = false;
            }
        },

        _SetGeneralDiscountByDiscountPercent: function () {
            var that = this;

            that._IsSettingGeneralDiscountByDiscountPercent = true;
            try {
                var discountPercent = that._GeneralDiscountPercentTextBox.GetText().ToNumber();
                var totalPrice = that._ItemsGridControl.GetTotalPriceSum();
                var discount = Math.round(totalPrice * discountPercent / 100);
                that._GeneralDiscountTextBox.SetText(discount);
            }
            finally {
                that._IsSettingGeneralDiscountByDiscountPercent = false;
            }
        },

        _SetGeneralDiscountPercentByDiscount: function () {
            var that = this;

            that._IsSettingGeneralDiscountPercentByDiscount = true;
            try {
                var discount = that._GeneralDiscountTextBox.GetValue();
                if (discount == 0 || ValueIsEmpty(discount))
                    that._GeneralDiscountPercentTextBox.SetText("");
                else {
                    var totalPrice = that._ItemsGridControl.GetTotalPriceSum();
                    var discountPercent = Math.round(discount * 100 / totalPrice, 2);
                    that._GeneralDiscountPercentTextBox.SetText(discountPercent);
                }
            }
            finally {
                that._IsSettingGeneralDiscountPercentByDiscount = false;
            }
        },

        UpdateSummaryFields: function () {
            var that = this;

            if (!ValueIsEmpty(that._GeneralDiscountPercentTextBox.GetText()))
                that._SetGeneralDiscountByDiscountPercent();

            var generalDiscount = that._BindableEntity.get("GeneralDiscount");
            var totalPrice = that._ItemsGridControl.GetTotalPriceSum();
            var stuffTotalAmountAfterDiscount = that._ItemsGridControl.GetTotalPriceSum() - that._ItemsGridControl.GetDiscountSum();
            var totalTaxAndToll = that._ItemsGridControl.GetTaxAndTollSum();
            var totalDiscount = that._ItemsGridControl.GetDiscountSum() + generalDiscount;
            var finalAmount = that._ItemsGridControl.GetFinalPriceSum() - generalDiscount;

            that._BindableEntity.set("TotalPrice", totalPrice);
            that._BindableEntity.set("StuffTotalAmountAfterDiscount", stuffTotalAmountAfterDiscount);
            that._BindableEntity.set("TotalTaxAndToll", totalTaxAndToll);
            that._BindableEntity.set("TotalDiscount", totalDiscount);
            that._BindableEntity.set("FinalAmount", finalAmount);

            that.FindControl("FinalAmountLabel").SetText(FormatNumber(finalAmount) + " ریال");
        }
    });

    //Static Members:

    FormClass.TypeName = "ps.ReturnFromBuyEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    ps.ReturnFromBuyEditForm = FormClass;
})();
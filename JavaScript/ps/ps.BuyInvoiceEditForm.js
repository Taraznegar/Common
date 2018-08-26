(function () {
    var FormClass = afw.EntityFormBase.extend({
        GetType: function () {
            return ps.BuyInvoiceEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityFormBase.fn.init.call(that, options);

            that._FormHasUnsavedChanges = true;

            that._MainDockPanel = that.FindControl("MainDockPanel");

            that.ItemsEntityList = null;

            that.FormMode = that._FormMode;

            that._InvoiceNumberPaneIndex = 0;
            that._IsSettingGeneralDiscount = false;
            that._IsSettingGeneralDiscountPercent = false;
            that._IsSettingGeneralDiscountByDiscountPercent = false;
            that._IsSettingGeneralDiscountPercentByDiscount = false;

            that._SellerLookupControl = that.FindControl("SellerLookupControl");
            that._SellerAutoComplete = that._SellerLookupControl.GetAutoComplete();
            that._IssueDateControl = that.FindControl("IssueDateControl");
            that._FinancialDocTypeOptionSetControl = that.FindControl("FinancialDocTypeOptionSetControl");
            that._GeneralDiscountTextBox = that.FindControl("GeneralDiscountTextBox");
            that._GeneralDiscountPercentTextBox = that.FindControl("GeneralDiscountPercentTextBox");
            that._HorizontalDockPanel1 = that.FindControl("HorizontalDockPanel1");
            that._OwnerUserLookupControl = that.FindControl("OwnerUserLookupControl");
            that._InvoiceNumberTextBox = that.FindControl("InvoiceNumberTextBox");
            that._InvoiceNumberTextBox.SetReadOnly(true);

            that._SellerLookupControl.bind("ValueChanged", function (e) { that._SellerLookupControl_ValueChanged(e) });
            that._SellerLookupControl.bind("ValueChanged", function (e) { that._SellerLookupControl_ValueChanged(e) });
            that._FinancialDocTypeOptionSetControl.bind("ValueChanged", function (e) { that._FinancialDocTypeOptionSetControl_ValueChanged(e); });

            that._ActiveFinancialYearID = cmn.GetUserActiveFinancialYearID();
            that._FinancialYearEntity = cmn.GetUserActiveFinancialYearEntity();

            var entity = that._BindableEntity.GetEntity();

            that._BindableEntity.set("FinancialYear", that._ActiveFinancialYearID);

            if (!entity.FieldExists("StuffItems"))
                entity.AddField("StuffItems");

            if (that.FormMode == "New") {
                that._BindableEntity.set("IssueDate", afw.DateTimeHelper.GetServerDateTime());

                if (entity.GetFieldValue("StuffItems") == null) {
                    var itemsEntityList = afw.uiApi.CreateEntityList("ps.BuyInvoiceItem");
                    entity.SetFieldValue("StuffItems", itemsEntityList);
                }

                that._OwnerUserLookupControl.SetValue(afw.App.CurrentUserID);
                that._HorizontalDockPanel1.SetPaneSizeSetting(that._InvoiceNumberPaneIndex, 1);
            }
            else {
                // that._IsOfficialInvoiceFieldControl.SetReadOnly(true);
                if (entity.GetFieldValue("StuffItems") == null) {
                    itemsEntityList = afw.uiApi.FetchEntityList("ps.BuyInvoiceItem",
                        String.Format("BuyInvoice = '{0}'", that._BindableEntity.get("ID")), "RowNumber");
                    entity.SetFieldValue("StuffItems", itemsEntityList);
                }

                that._HorizontalDockPanel1.SetPaneSizeSetting(that._InvoiceNumberPaneIndex, 210);
            }

            that.ItemsEntityList = entity.GetFieldValue("StuffItems");

            that._ItemsGridControl = new ps.BuyInvoiceItemsGridControl({
                ParentControl: that._MainDockPanel.Panes[2],
                Name: "ItemsGridControl",
                BuyInvoiceEditForm: that,
                RowsEntityList: that.ItemsEntityList,
                FillParent: false
            });

            if (that.ItemsEntityList.Entities.length == 0)
                that._ItemsGridControl.AddEmptyItems(1);
            else {
                for (var i = 0; i < that.ItemsEntityList.Entities.length; i++) {
                    that._ItemsGridControl.AddRow(that.ItemsEntityList.Entities[i]);
                }
            }

            that._SellerAutoComplete.bind("KeyPressed", function (e) {
                if (e.Key == "Enter") {
                    if (that._ItemsGridControl.GetRowsCount() != 0)
                        that._ItemsGridControl.GetRowByIndex(0).Focus();
                }
            });


            that._IssueDateControl.bind("ValueChanged", function (e) { that._IssueDateControl_ValueChanged(e); });
            that._GeneralDiscountTextBox.bind("ValueChanged", function (e) { that._GeneralDiscountTextBox_ValueChanged(e); });
            that._GeneralDiscountPercentTextBox.bind("ValueChanged", function (e) { that._GeneralDiscountPercentTextBox_ValueChanged(e); });

            that._SetGeneralDiscountPercentByDiscount();
        },

        GetTaxCalculationIsEnabled: function () {
            var that = this;

            return cmn.GetFinancialGroupTaxCalculationIsEnabled(that._BindableEntity.get("OrganizationUnit"),
                that._BindableEntity.get("FinancialYear"), that._BindableEntity.get("FinancialDocType"));
        },

        GetBindableEntity: function () {
            var that = this;

            return that._BindableEntity;
        },

        _OnOpened: function (sender, e) {
            var that = this;

            if (that.FormMode == "New") {
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

            if (ps.GetCurrentTaxAndTollPercentEntity() == null) {
                afw.ErrorDialog.Show("درصد مالیات و عوارض تعیین نشده است.");
                that.Close();
                return;
            }

            setTimeout(
                function () {
                    if (that._ItemsGridControl.GetRowsCount() != 0)
                        if (that.FormMode == "New")
                            that._SellerAutoComplete.Focus();
                        else {
                            var lastRowIndex = that._ItemsGridControl.GetRowsCount() - 1;
                            that._ItemsGridControl.GetRowByIndex(lastRowIndex).Focus();
                        }
                }, 500);

            afw.EntityFormBase.fn._OnOpened.call(that);
        },

        _OnClosed: function () {
            var that = this;

            afw.EntityFormBase.fn._OnClosed.call(that);
        },

        _SellerLookupControl_ValueChanged: function (e) {
            var that = this;

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

                for (var i = 0; i < that._ItemsGridControl.GetRowsCount() ; i++) {
                    var rowControl = that._ItemsGridControl.GetRowByIndex(i);
                    rowControl.UpdateTaxAndToll();
                }
            }
            catch (ex) {
                that._BindableEntity.set("FinancialDocType", null);
                afw.ErrorDialog.Show(ex);
            }
        },

        _AdjustForm: function () {
            var that = this;

            afw.EntityFormBase.fn._AdjustForm.call(that);

        },

        _ValidateForm: function () {
            var that = this;

            if (!afw.EntityFormBase.fn._ValidateForm.call(that))
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

                var buyInvoiceEntity = afw.uiApi.FetchEntityByID("ps.BuyInvoice", that._BindableEntity.get("ID"));
                that._BindableEntity.set("AccDoc", buyInvoiceEntity.GetFieldValue("AccDoc"));
                that._BindableEntity.set("InvoiceNumber", buyInvoiceEntity.GetFieldValue("InvoiceNumber"));
                that._BindableEntity.set("InternalNumber1", buyInvoiceEntity.GetFieldValue("InternalNumber1"));
                return;
            }
            else
                afw.EntityFormBase.fn._OnToolbarButtonClicked.call(that, buttonKey);
        },

        _Save: function () {
            var that = this;

            if (ValueIsEmpty(that._GeneralDiscountTextBox.GetValue()))
                that._GeneralDiscountTextBox.SetText(0);

            var saved = afw.EntityFormBase.fn._Save.call(that);

            return saved;
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
            var totalStuffAndServicesPrice = that._ItemsGridControl.GetTotalPriceSum();
            var stuffAndServicesTotalAmountAfterDiscount = that._ItemsGridControl.GetTotalPriceSum() - that._ItemsGridControl.GetDiscountSum();
            var totalTaxAndToll = that._ItemsGridControl.GetTaxAndTollSum();
            var totalDiscount = that._ItemsGridControl.GetDiscountSum() + generalDiscount;
            var finalAmount = that._ItemsGridControl.GetFinalPriceSum() - generalDiscount;

            that._BindableEntity.set("TotalStuffAndServicesPrice", totalStuffAndServicesPrice);
            that._BindableEntity.set("StuffAndServicesTotalAmountAfterDiscount", stuffAndServicesTotalAmountAfterDiscount);
            that._BindableEntity.set("TotalTaxAndToll", totalTaxAndToll);
            that._BindableEntity.set("TotalDiscount", totalDiscount);
            that._BindableEntity.set("FinalAmount", finalAmount);

            that.FindControl("FinalAmountLabel").SetText(FormatNumber(finalAmount) + " ریال");
        }
    });

    //Static Members:

    FormClass.TypeName = "ps.BuyInvoiceEditForm";
    FormClass.BaseType = afw.EntityFormBase;


    ps.BuyInvoiceEditForm = FormClass;
})();
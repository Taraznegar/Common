(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return ps.ReturnFromSaleItemsGridRowControl;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._BindableEntity = options.RowEntity.ToBindableEntity();
            that._GridControl = options.GridControl;

            that._IsSettingDiscount = false;
            that._IsSettingDiscountPercent = false;
            that._IsSettingDiscountByDiscountPercent = false;
            that._IsSettingDiscountPercentByDiscount = false;
            that._IsCalculatingAmounts = false;
            that._StuffInfo = null;

            that._ItemDockPanel = that.FindControl("ItemDockPanel");
            that._MeasurementUnitDropDownList = that.FindControl("MeasurementUnitDropDownList");
            that._StuffLookupContainerPanel = that.FindControl("StuffLookupContainerPanel");
            that._StuffLookupControl = that.FindControl("StuffLookupControl");
            that._QuantityTextBox = that.FindControl("QuantityTextBox");
            that._UnitPriceTextBox = that.FindControl("UnitPriceTextBox");
            that._DiscountTextBox = that.FindControl("DiscountTextBox");
            that._DiscountPercentTextBox = that.FindControl("DiscountPercentTextBox");
            that._TotalPriceLabel = that.FindControl("TotalPriceLabel");
            that._TaxAndTollLabel = that.FindControl("TaxAndTollLabel");
            that._FinalPriceLabel = that.FindControl("FinalPriceLabel");
            that._RemoveButton = that.FindControl("RemoveButton");
            that.FindControl("RowNumberLabel").InitDataBinding(that._BindableEntity);

            that._AdjustStuffLookupControl();

            that._QuantityTextBox.InitDataBinding(that._BindableEntity);

            that._MeasurementUnitDropDownList.SetItemsDataSource(cmn.GetMeasurementUnitsEntityList().ToDataSourceData());
            that._MeasurementUnitDropDownList.SetReadOnly(true);
            that._MeasurementUnitDropDownList.InitDataBinding(that._BindableEntity);

            that._UnitPriceTextBox.InitDataBinding(that._BindableEntity);
            that._DiscountTextBox.InitDataBinding(that._BindableEntity);

            that._DiscountTextBox.bind("ValueChanged", function (e) { that._DiscountTextBox_ValueChanged(e); });
            that._DiscountPercentTextBox.bind("ValueChanged", function (e) { that._DiscountPercentTextBox_ValueChanged(e); });

            that._TotalPriceLabel.SetText(FormatNumber(that._BindableEntity.get("TotalPrice")));
            that._TaxAndTollLabel.SetText(FormatNumber(that._BindableEntity.get("TaxAndToll")));
            that._FinalPriceLabel.SetText(FormatNumber(that._BindableEntity.get("FinalPrice")));

            that._BindableEntity.bind("change", function (e) { that._BindableEntity_change(e); });

            that._RemoveButton.bind("Click", function (e) { that._RemoveButton_Click(e); });

            that.AdjustColor();

            that._StuffLookupControl.GetAutoComplete().bind("KeyPressed", function (e) {
                if (e.Key == "Enter") {
                    that._QuantityTextBox.Focus();
                }
            });

            that._QuantityTextBox.bind("KeyPressed", function (e) {
                if (e.Key == "Enter") {
                    that._UnitPriceTextBox.Focus();
                }
            });

            that._UnitPriceTextBox.bind("KeyPressed", function (e) {
                if (e.Key == "Enter") {
                    //var rowIndex = that._BindableEntity.get("RowNumber") - 1;
                    //var isLastRow = (rowIndex == that._GridControl.GetRowsCount() - 1);
                    //if (isLastRow)
                    //    that._GridControl.AddEmptyItems(1);

                    //that._GridControl.GetRowByIndex(rowIndex + 1).Focus();
                }
            });

            that._SetDiscountPercentByDiscount();
        },

        GetBindableEntity: function () {
            var that = this;

            return that._BindableEntity;
        },

        AdjustColor: function () {
            var that = this;

            var rowNumber = that._BindableEntity.get("RowNumber");

            if (afw.BaseUtils.NumberIsOdd(rowNumber))
                that.SetBackColor("#ffffff");
            else
                that.SetBackColor("#f7f7f7");
        },

        _StuffChanged: function () {
            var that = this;

            var stuffID = that._BindableEntity.get("Stuff");
            var measurementUnitID = null;
            var unitPrice = null;

            if (stuffID != null) {
                var stuffInfo = that._GetStuffInfo();
                measurementUnitID = stuffInfo.GetFieldValue("MainMeasurementUnitID");
                unitPrice = afw.uiApi.CallServerMethodSync("ps.GetStuffPrice", [stuffID]);
            }

            that._BindableEntity.set("UnitPrice", unitPrice);
            that._BindableEntity.set("MeasurementUnit", measurementUnitID);
        },

        _AdjustStuffLookupControl: function () {
            var that = this;

            var stuffLookupControl = that.FindControl("StuffLookupControl");
            var controlCreated = false;

            if (stuffLookupControl != null && stuffLookupControl.GetDataListFullName() != "cmn.Stuffs") {
                stuffLookupControl.Destroy();
                stuffLookupControl = null;
            }

            if (stuffLookupControl == null) {
                stuffLookupControl = new afw.SingleEntityLookupControl({
                    ParentControl: that._StuffLookupContainerPanel,
                    Name: "StuffLookupControl",
                    DataListFullName: "cmn.Stuffs",
                    EntityCaptionFieldName: "DisplayName",
                    LabelVisible: false,
                    FillParent: true,
                    HasEntityViewButton: false,
                    LookupWindowDefaultWidth: 1600,
                    ValueDataMember: "Stuff",
                    BaseFilterExpression: "IsActive = 1"
                });

                controlCreated = true;
            }

            if (controlCreated) {
                stuffLookupControl.InitDataBinding(that._BindableEntity);
                stuffLookupControl.bind("OpeningLookup", function (e) { that._StuffLookupControl_OpeningLookup(e); });
                that._StuffLookupControl = stuffLookupControl;
            }
        },

        _StuffLookupControl_OpeningLookup: function (e) {
            var that = this;

            e.Sender.SetLookupDataListControlCustomOptions({ Mode: 'Lookup' });
        },

        _BindableEntity_change: function (e) {
            var that = this;

            if (ValueIsIn(e.field, ["Stuff", "Quantity", "UnitPrice", "Discount", "TaxAndToll"])) {
                if (that._IsCalculatingAmounts)
                    return;

                that._IsCalculatingAmounts = true;
                try {
                    if (e.field == "Stuff")
                        that._StuffChanged();

                    var quantity = that._BindableEntity.get("Quantity");
                    if (quantity == null)
                        quantity = 0;

                    var unitPrice = that._BindableEntity.get("UnitPrice");
                    if (unitPrice == null)
                        unitPrice = 0;

                    var discount = that._BindableEntity.get("Discount");
                    if (discount == null)
                        discount = 0;

                    var totalPrice = Math.round(quantity * unitPrice);
                    that._BindableEntity.set("TotalPrice", totalPrice);

                    if (!ValueIsEmpty(that._DiscountPercentTextBox.GetText()))
                        that._SetDiscountByDiscountPercent();

                    var discountAmount = that._BindableEntity.get("Discount");
                    totalPriceAfterDiscount = totalPrice - discountAmount;
                    that._BindableEntity.set("TotalPriceAfterDiscount", totalPriceAfterDiscount);

                    var taxAndToll = that._CalculateTaxAndToll();
                    that._BindableEntity.set("TaxAndToll", taxAndToll);

                    that._BindableEntity.set("FinalPrice", totalPriceAfterDiscount + taxAndToll);

                    that._TotalPriceLabel.SetText(FormatNumber(that._BindableEntity.get("TotalPrice")));
                    that._TaxAndTollLabel.SetText(FormatNumber(that._BindableEntity.get("TaxAndToll")));
                    that._FinalPriceLabel.SetText(FormatNumber(that._BindableEntity.get("FinalPrice")));

                    that._GridControl.UpdateSummaryLabels();
                }
                finally {
                    that._IsCalculatingAmounts = false;
                }
            }

            that.AdjustColor();
        },

        _CalculateTaxAndToll: function () {
            var that = this;

            if (ValueIsEmpty(that._GridControl.GetReturnFromSalesEditForm().GetBindableEntity().get("FinancialDocType"))) {
                afw.ErrorDialog.Show("خطا در محاسبه مالیات و عوارض : نوع سند مالی تعیین نشده است.");
                return;
            }

            var totalPriceAfterDiscount = that._BindableEntity.get("TotalPriceAfterDiscount");
            var taxAndToll = 0;

            if (that._HasTaxAndToll()) {
                var currentTaxAndTollPercentEntity = ps.GetCurrentTaxAndTollPercentEntity();
                taxAndTollPercent = currentTaxAndTollPercentEntity.GetFieldValue("Tax") + currentTaxAndTollPercentEntity.GetFieldValue("Toll");
                taxAndToll = Math.round(totalPriceAfterDiscount * taxAndTollPercent / 100);
            }

            return taxAndToll;
        },

        UpdateTaxAndToll: function () {
            var that = this;

            var taxAndToll = that._CalculateTaxAndToll();
            that._BindableEntity.set("TaxAndToll", taxAndToll);
        },

        _DiscountTextBox_ValueChanged: function (e) {
            var that = this;

            that._IsSettingDiscount = true;
            try {
                if (!that._IsSettingDiscountPercent && !that._IsSettingDiscountByDiscountPercent) {
                    that._DiscountPercentTextBox.SetText(null);
                }
            }
            finally {
                that._IsSettingDiscount = false;
            }
        },

        _DiscountPercentTextBox_ValueChanged: function (e) {
            var that = this;

            that._IsSettingDiscountPercent = true;
            try {
                if (!that._IsSettingDiscount && !that._IsSettingDiscountPercentByDiscount) {
                    if (ValueIsEmpty(that._DiscountPercentTextBox.GetText()))
                        that._DiscountTextBox.SetText("");
                    else {
                        that._SetDiscountByDiscountPercent();
                    }
                }
            }
            finally {
                that._IsSettingDiscountPercent = false;
            }
        },

        _SetDiscountByDiscountPercent: function () {
            var that = this;

            that._IsSettingDiscountByDiscountPercent = true;
            try {
                var discountPercent = that._DiscountPercentTextBox.GetText().ToNumber();

                if (discountPercent == 0 || ValueIsEmpty(discountPercent))
                    that._DiscountTextBox.SetText("");
                else {
                    var totalPrice = that._BindableEntity.get("TotalPrice");
                    if (ValueIsEmpty(totalPrice))
                        totalPrice = 0;

                    var discount = Math.Round(totalPrice * discountPercent / 100);
                    that._DiscountTextBox.SetText(discount);
                }
            }
            finally {
                that._IsSettingDiscountByDiscountPercent = false;
            }
        },

        _SetDiscountPercentByDiscount: function () {
            var that = this;

            that._IsSettingDiscountPercentByDiscount = true;
            try {
                var discount = that._DiscountTextBox.GetValue();

                if (discount == 0 || ValueIsEmpty(discount))
                    that._DiscountPercentTextBox.SetText("");
                else {
                    var totalPrice = that._BindableEntity.get("TotalPrice");
                    if (ValueIsEmpty(totalPrice))
                        totalPrice = 0;

                    var discountPercent = Math.Round(discount * 100 / totalPrice, 2);
                    that._DiscountPercentTextBox.SetText(discountPercent);
                }
            }
            finally {
                that._IsSettingDiscountPercentByDiscount = false;
            }
        },

        _RemoveButton_Click: function (e) {
            var that = this;

            that._GridControl.RemoveRow(that);
        },

        _HasTaxAndToll: function () {
            var that = this;

            var taxCalculationIsEnabled = that._GridControl.GetReturnFromSalesEditForm().GetTaxCalculationIsEnabled();

            if (!taxCalculationIsEnabled)
                return false;

            if (that._BindableEntity.get("Stuff") != null) {
                var stuffInfo = that._GetStuffInfo();
                return stuffInfo.GetFieldValue("DarayeMaliatBarArzesheAfzudeh");
            }

            return false;
        },

        _GetStuffInfo: function () {
            var that = this;

            var stuffID = that._BindableEntity.get("Stuff");

            if (stuffID == null)
                throw "Stuff is not set!";

            if (that._StuffInfo == null || that._StuffInfo.GetFieldValue("ID") != stuffID)
                that._StuffInfo = afw.uiApi.CallServerMethodSync("ps.GetInvoiceItemStuffInfo", [stuffID]);

            return that._StuffInfo;
        },

        SetControlReadOnly: function (controlName, readOnlyMode) {
            var that = this;

            that.FindControl(controlName).SetReadOnly(readOnlyMode);
        },

        SetFieldsReadOnly: function (value) {
            var that = this;

            that.SetControlReadOnly("StuffLookupControl", value);
            that.SetControlReadOnly("UnitPriceTextBox", value);
            that.SetControlReadOnly("StuffLookupControl", value);
            that.SetControlReadOnly("MeasurementUnitDropDownList", value);
            that.SetControlReadOnly("DiscountTextBox", value);
            that.SetControlReadOnly("DiscountPercentTextBox", value);
        },

        ValidateRow: function () {
            var that = this;

            var validationError = null;
            var rowNumber = that._BindableEntity.get("RowNumber");

            var shouldValidateRow = that._BindableEntity.GetEntity().ChangeStatus == "Modify"
                || (that._StuffLookupControl.GetValue() != null
                    || !ValueIsEmpty(that._QuantityTextBox.GetText())
                    || !ValueIsEmpty(that._UnitPriceTextBox.GetText())
                );

            if (shouldValidateRow) {
                if (that._StuffLookupControl.GetValue() == null)
                    validationError = String.Format("کالا در سطر {0} وارد نشده است.", rowNumber);
                else if (ValueIsEmpty(that._QuantityTextBox.GetText()))
                    validationError = String.Format("تعداد/مقدار در سطر {0} وارد نشده است.", rowNumber);
                else if (ValueIsEmpty(that._UnitPriceTextBox.GetText()))
                    validationError = String.Format("مبلغ واحد در سطر {0} وارد نشده است.", rowNumber);
            }

            if (shouldValidateRow && validationError == null) {
                if (that._BindableEntity.get("Discount") == null)
                    that._BindableEntity.set("Discount", 0);
            }

            if (validationError == null)
                return true;
            else {
                afw.ErrorDialog.Show(validationError);
                return false;
            }
        },

        Focus: function () {
            var that = this;

            that._StuffLookupControl.Focus();
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "ps.ReturnFromSaleItemsGridRowControl";
    FormClass.BaseType = afw.BasePanel;


    ps.ReturnFromSaleItemsGridRowControl = FormClass;
})();
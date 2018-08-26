(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return ps.BuyInvoiceItemsGridRowControl;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._BindableEntity = options.RowEntity.ToBindableEntity();
            that._GridControl = options.GridControl;

            that._IsInitForm = true;
            that._IsSettingDiscount = false;
            that._IsSettingDiscountPercent = false;
            that._IsSettingDiscountByDiscountPercent = false;
            that._IsSettingDiscountPercentByDiscount = false;
            that._IsCalculatingAmounts = false;
            that._StuffInfo = null;

            that._ItemDockPanel = that.FindControl("ItemDockPanel");
            that._MeasurementUnitDropDownList = that.FindControl("MeasurementUnitDropDownList");
            that._ItemKindDropDownList = that.FindControl("ItemKindDropDownList");
            that._StuffOrServiceLookupContainerPanel = that.FindControl("StuffOrServiceLookupContainerPanel");
            that._StuffOrServiceLookupControl = that.FindControl("StuffOrServiceLookupControl");
            that._QuantityTextBox = that.FindControl("QuantityTextBox");
            that._UnitPriceLookupControl = that.FindControl("UnitPricesLookupControl");
            that._UnitPriceLookupControl_AutoComplete = that._UnitPriceLookupControl.GetAutoComplete();
            that._DiscountTextBox = that.FindControl("DiscountTextBox");
            that._DiscountPercentTextBox = that.FindControl("DiscountPercentTextBox");
            that._TotalPriceLabel = that.FindControl("TotalPriceLabel");
            that._TaxAndTollLabel = that.FindControl("TaxAndTollLabel");
            that._FinalPriceLabel = that.FindControl("FinalPriceLabel");
            that._RemoveButton = that.FindControl("RemoveButton");

            that.FindControl("RowNumberLabel").InitDataBinding(that._BindableEntity);

            if ("IsActiveBarCode" in options && options.IsActiveBarCode)
                that._IsActiveBarCode = true;
            else
                that._IsActiveBarCode = false;

            if ("BarCodeLen" in options && options.BarCodeLen)
                that._BarCodeLen = options.BarCodeLen;
            else
                that._BarCodeLen = null;

            if ("BuyStuffRepeat" in options && options.BuyStuffRepeat)
                that._BuyStuffRepeat = options.BuyStuffRepeat;
            else
                that._BuyStuffRepeat = false;

            that._StuffOrServiceLookupControlInitialized = false;

            if ("ItemKindVisible" in options && options.ItemKindVisible == true) {
                var rowKindItems = [{ Name: "Stuff", Title: "کالا" }, { Name: "Service", Title: "خدمات" }];
                that._ItemKindDropDownList.SetItemsDataSource(rowKindItems);
                that._ItemKindDropDownList.bind("ValueChanged", function (e) { that._ItemKindDropDownList_ValueChanged(e); });

                if (!ValueIsEmpty(options.ItemKind))
                    that._SetItemKind(options.ItemKind);

                that._StuffOrServiceLookupControlInitialized = true;
            }

            that._AdjustStuffOrServiceLookupControl();

            var formMode = that._GridControl.GetBuyInvoiceEditForm().FormMode;
            if (formMode == "Edit") {
                var stuffID = that._BindableEntity.get("Stuff");
                var serviceID = that._BindableEntity.get("Service");
                if (stuffID != null)
                    that._StuffOrServiceLookupControl.SetValue(stuffID);
                else
                    that._StuffOrServiceLookupControl.SetValue(serviceID);

                that._UnitPriceLookupControl_AutoComplete.SetText(that._BindableEntity.get("UnitPrice"));
            }

            that._QuantityTextBox.InitDataBinding(that._BindableEntity);
            that._QuantityTextBox.bind("GotFocus", function (e) { that._InputControl_GotFocus(e); });

            that._MeasurementUnitDropDownList.SetItemsDataSource(cmn.GetMeasurementUnitsEntityList().ToDataSourceData());
            that._MeasurementUnitDropDownList.SetReadOnly(true);
            that._MeasurementUnitDropDownList.InitDataBinding(that._BindableEntity);

            that._DiscountTextBox.InitDataBinding(that._BindableEntity);

            that._DiscountTextBox.bind("ValueChanged", function (e) { that._DiscountTextBox_ValueChanged(e); });
            that._DiscountPercentTextBox.bind("ValueChanged", function (e) { that._DiscountPercentTextBox_ValueChanged(e); });

            that._TotalPriceLabel.SetText(FormatNumber(that._BindableEntity.get("TotalPrice")));
            that._TaxAndTollLabel.SetText(FormatNumber(that._BindableEntity.get("TaxAndToll")));
            that._FinalPriceLabel.SetText(FormatNumber(that._BindableEntity.get("FinalPrice")));
            that._UnitPriceLookupControl_AutoComplete.SetText(that._BindableEntity.get("UnitPrice"));

            that._BindableEntity.bind("change", function (e) { that._BindableEntity_change(e); });

            that._RemoveButton.bind("Click", function (e) { that._RemoveButton_Click(e); });

            that.AdjustColor();

            that._StuffOrServiceLookupControl.GetAutoComplete().bind("KeyPressed", function (e) {
                if (e.Key == "Enter") {
                    that._QuantityTextBox.Focus();
                }
            });

            that._StuffOrServiceLookupControl.GetAutoComplete().bind("TextChanged", function (e) {
                if (!ValueIsEmpty(that._BarCodeLen)) {
                    var enteredText = that._StuffOrServiceLookupControl.GetAutoComplete().GetText();
                    if (enteredText.length > that._BarCodeLen) {
                        var editedText = enteredText.substring(0, that._BarCodeLen);
                        that._StuffOrServiceLookupControl.GetAutoComplete().SetText(editedText);
                    }
                }
            });

            that._QuantityTextBox.bind("KeyPressed", function (e) {
                if (e.Key == "Enter") {
                    that._UnitPriceLookupControl.Focus();
                }
            });

            that._UnitPriceLookupControl_AutoComplete.bind("KeyPressed", function (e) { that._UnitPriceLookupControl_AutoComplete_KeyPressed(e); });
            that._UnitPriceLookupControl_AutoComplete.bind("TextChanged", function (e) { that._UnitPriceLookupControl_AutoComplete_TextChanged(e); });

            that._SetDiscountPercentByDiscount();

            if ("RowNumberVisible" in options && options.RowNumberVisible == false) {
                that.HideCell("RowNumber");
            }
            if ("ItemKindVisible" in options && options.ItemKindVisible == false) {
                that.HideCell("ItemKind");

                if (that._BindableEntity.get("Stuff") == null)
                    that._StuffOrServiceLookupControl.SetValue(that._BindableEntity.get("Service"));
                else if (that._BindableEntity.get("Service") == null)
                    that._StuffOrServiceLookupControl.SetValue(that._BindableEntity.get("Stuff"));
            }
            if ("MeasurementUnitVisible" in options && options.MeasurementUnitVisible == false) {
                that.HideCell("MeasurementUnit");
            }
            if ("DiscountVisible" in options && options.DiscountVisible == false) {
                that.HideCell("Discount");
            }
            if ("DiscountPerecentVisible" in options && options.DiscountPerecentVisible == false) {
                that.HideCell("DiscountPerecent");
            }
            if ("TaxAndTollVisible" in options && options.TaxAndTollVisible == false) {
                that.HideCell("TaxAndToll");
            }
            if ("TotalPriceVisible" in options && options.TotalPriceVisible == false) {
                that.HideCell("TotalPrice");
            }
            if ("FinalPriceVisible" in options && options.FinalPriceVisible == false) {
                that.HideCell("FinalPrice");
            }

            that._IsInitForm = false;
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

        HideCell: function (cellName) {
            var that = this;

            if (cellName == "RowNumber") {
                that._ItemDockPanel.SetPaneSizeSetting(2, 1);
            }
            if (cellName == "ItemKind") {
                that._ItemDockPanel.SetPaneSizeSetting(4, 1);
            }
            if (cellName == "MeasurementUnit") {
                that._MeasurementUnitDropDownList.SetVisible(false);
                that._ItemDockPanel.SetPaneSizeSetting(10, 1);
            }
            if (cellName == "TotalPrice") {
                that._ItemDockPanel.SetPaneSizeSetting(14, 1);
            }
            if (cellName == "Discount") {
                that._DiscountTextBox.SetVisible(false);
                that._ItemDockPanel.SetPaneSizeSetting(16, 1);
            }
            if (cellName == "DiscountPerecent") {
                that._DiscountPercentTextBox.SetVisible(false);
                that._ItemDockPanel.SetPaneSizeSetting(18, 1);
            }
            if (cellName == "TaxAndToll") {
                that._ItemDockPanel.SetPaneSizeSetting(20, 1);
            }
            if (cellName == "FinalPrice") {
                that._ItemDockPanel.SetPaneSizeSetting(22, 1);
            }
        },

        GetItemKind: function () {
            var that = this;

            return that._ItemKindDropDownList.GetValue();
        },

        _SetItemKind: function (value) {
            var that = this;

            that._ItemKindDropDownList.SetValue(value);
        },

        _ItemKindDropDownList_ValueChanged: function (e) {
            var that = this;

            that._AdjustStuffOrServiceLookupControl();

            if (that._ItemKindDropDownList.GetValue() == null)
                that.FindControl("StuffOrServiceLookupControl").SetValue(null);
        },

        _StuffOrServiceLookupControl_ValueChanged: function (e) {
            var that = this;

            if (that._IsInitForm)
                return;

            var stuffID = null;
            var serviceID = null;
            var measurementUnitID = null;

            if (that._StuffOrServiceLookupControlInitialized) {
                that._QuantityTextBox.SetText(null);
                that._UnitPriceLookupControl_AutoComplete.SetText(null);
            }

            var stuffOrServiceID = that._StuffOrServiceLookupControl.GetValue();

            if (that._GridControl._ItemKindVisible == false) {
                if (stuffOrServiceID != null) {
                    var isStuff = afw.uiApi.EntityExists("cmn.Stuff", String.Format("ID = '{0}'", stuffOrServiceID));
                    if (isStuff) {
                        stuffID = stuffOrServiceID;
                    }
                    else {
                        var isService = afw.uiApi.EntityExists("cmn.Service", String.Format("ID = '{0}'", stuffOrServiceID));
                        if (isService) {
                            serviceID = stuffOrServiceID;
                        }
                        else
                            throw "Selected item not found in neither stuffs and services.";
                    }
                }
            }
            else {
                var itemKind = that.GetItemKind();
                if (itemKind == "Stuff")
                    stuffID = stuffOrServiceID;

                if (itemKind == "Service")
                    serviceID = stuffOrServiceID;
            }

            that._BindableEntity.set("Stuff", stuffID);
            that._BindableEntity.set("Service", serviceID);

            if (stuffID != null) {

                if (that._BuyStuffRepeat == false) {
                    var savedStuff = $.grep(that._GridControl._RowsEntityList.Entities, function (o) {
                        return o.GetFieldValue("Stuff") === stuffID;
                    });

                    if (savedStuff.length > 1) {

                        var quantity = savedStuff[0].GetFieldValue("Quantity");
                        if (!ValueIsNumber(quantity))
                            quantity = quantity.ToNumber();

                        var index = that._GridControl._RowsEntityList.Entities.FindIndex(function (o) {
                            return o.GetFieldValue("Stuff") === stuffID;
                        });

                        savedStuff[0].SetFieldValue("Quantity", quantity + 1);

                        var rowControl = that._GridControl.GetRowByIndex(index);
                        rowControl.FindControl("QuantityTextBox").SetText(quantity + 1);

                        that._StuffOrServiceLookupControl.Focus();
                        that._StuffOrServiceLookupControl.SetValue(null);
                        return;
                    }

                    if (that._IsActiveBarCode && savedStuff.length == 1 && that._IsInitForm == false)
                        that._QuantityTextBox.SetText("1");
                }

                var stuffInfo = that._GetStuffInfo();
                measurementUnitID = stuffInfo.GetFieldValue("MainMeasurementUnitID");

                that._UnitPriceLookupControl.SetBaseFilterExpression(String.Format("Stuff_ID = '{0}' and SaleBuyType_Name = 'Buy'", stuffID));

                var defaultUnitPrices = afw.DataListHelper.FetchEntityListOfDataList("ps.StuffsOrServicesUnitPrices", null, null,
                    String.Format("Stuff_ID = '{0}' and IsDefault = 1 and SaleBuyType_Name = 'Buy'", stuffID)).Entities;

                if (defaultUnitPrices.length > 0)
                    that._UnitPriceLookupControl.SetValue(defaultUnitPrices[0].GetFieldValue("ID"));

                if (that._IsActiveBarCode) {
                    if (defaultUnitPrices.length == 0)
                        that._UnitPriceLookupControl_AutoComplete.SetText("");

                    setTimeout(function () { that._FocusNextRow(); }, 1200);
                }
                else {
                    that._QuantityTextBox.Focus();
                }
            }
            else if (serviceID != null) {
                var service = afw.uiApi.FetchEntityByID("cmn.Service", serviceID);
                measurementUnitID = service.GetFieldValue("MeasurementUnit");

                that._UnitPriceLookupControl.SetBaseFilterExpression(String.Format("Service_ID = '{0}'  and SaleBuyType_Name = 'Buy'", serviceID));
            }

            that._BindableEntity.set("MeasurementUnit", measurementUnitID);
        },

        _AdjustStuffOrServiceLookupControl: function () {
            var that = this;

            var stuffOrServiceLookupControl = that.FindControl("StuffOrServiceLookupControl");
            var controlCreated = false;

            if (that._GridControl._ItemKindVisible == false) {
                if (stuffOrServiceLookupControl != null) {
                    stuffOrServiceLookupControl.Destroy();
                    stuffOrServiceLookupControl = null;
                }

                if (stuffOrServiceLookupControl == null) {
                    stuffOrServiceLookupControl = new afw.SingleEntityLookupControl({
                        ParentControl: that._StuffOrServiceLookupContainerPanel,
                        Name: "StuffOrServiceLookupControl",
                        DataListFullName: "ps.StuffsAndServices",
                        EntityCaptionFieldName: "DisplayName",
                        LabelVisible: false,
                        FillParent: true,
                        HasEntityViewButton: false,
                        LookupWindowDefaultWidth: 1600,
                        BaseFilterExpression: "IsActive = 1"
                    });

                    controlCreated = true;
                }
            }
            else {
                var itemKind = that.GetItemKind();
                if (itemKind == "Stuff" || ValueIsEmpty((itemKind))) {
                    if (stuffOrServiceLookupControl != null && stuffOrServiceLookupControl.GetDataListFullName() != "cmn.Stuffs") {
                        stuffOrServiceLookupControl.Destroy();
                        stuffOrServiceLookupControl = null;
                    }

                    if (stuffOrServiceLookupControl == null) {
                        stuffOrServiceLookupControl = new afw.SingleEntityLookupControl({
                            ParentControl: that._StuffOrServiceLookupContainerPanel,
                            Name: "StuffOrServiceLookupControl",
                            DataListFullName: "cmn.Stuffs",
                            EntityCaptionFieldName: "DisplayName",
                            LabelVisible: false,
                            FillParent: true,
                            HasEntityViewButton: false,
                            LookupWindowDefaultWidth: 1600,
                            BaseFilterExpression: "IsActive = 1"
                        });

                        controlCreated = true;
                    }
                }
                else if (itemKind == "Service") {
                    if (stuffOrServiceLookupControl != null && stuffOrServiceLookupControl.GetDataListFullName() != "cmn.Services") {
                        stuffOrServiceLookupControl.Destroy();
                        stuffOrServiceLookupControl = null;
                    }

                    if (stuffOrServiceLookupControl == null) {
                        stuffOrServiceLookupControl = new afw.SingleEntityLookupControl({
                            ParentControl: that._StuffOrServiceLookupContainerPanel,
                            Name: "StuffOrServiceLookupControl",
                            DataListFullName: "cmn.Services",
                            EntityCaptionFieldName: "Name",
                            LabelVisible: false,
                            FillParent: true,
                            HasEntityViewButton: false,
                            LookupWindowDefaultWidth: 1600
                        });

                        controlCreated = true;
                    }
                }
            }

            if (controlCreated) {
                stuffOrServiceLookupControl.bind("GotFocus", function (e) { that._InputControl_GotFocus(e); });
                stuffOrServiceLookupControl.bind("ValueChanged", function (e) { that._StuffOrServiceLookupControl_ValueChanged(e); });
                stuffOrServiceLookupControl.bind("OpeningLookup", function (e) { that._StuffOrServiceLookupControl_OpeningLookup(e); });
                that._StuffOrServiceLookupControl = stuffOrServiceLookupControl;
            }
        },

        _StuffOrServiceLookupControl_OpeningLookup: function (e) {
            var that = this;

            e.Sender.SetLookupDataListControlCustomOptions({ Mode: 'Lookup' });
        },

        _InputControl_GotFocus: function (e) {
            var that = this;

            if (that.GetItemKind() == null) {
                var rowDefaultItemKind = that._GetRowDefaultItemKind();
                that._SetItemKind(rowDefaultItemKind);
            }
        },

        _BindableEntity_change: function (e) {
            var that = this;

            if (ValueIsIn(e.field, ["Quantity", "UnitPrice", "Discount", "TaxAndToll"])) {
                if (that._IsCalculatingAmounts)
                    return;

                that._IsCalculatingAmounts = true;
                try {
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

            if (ValueIsEmpty(that._BindableEntity.get("Quantity")) || that._BindableEntity.get("Quantity") == 0)
                return 0;

            if (ValueIsEmpty(that._BindableEntity.get("UnitPrice")) || that._BindableEntity.get("UnitPrice") == 0)
                return 0;

            if (ValueIsEmpty(that._GridControl.GetBuyInvoiceEditForm().GetBindableEntity().get("FinancialDocType"))) {
                afw.ErrorDialog.Show("خطا در محاسبه مالیات و عوارض : 1نوع سند مالی تعیین نشده است.");
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

        _GetRowDefaultItemKind: function () {
            var that = this;

            var rowIndex = that._BindableEntity.get("RowNumber") - 1;

            if (rowIndex == 0)
                return "Stuff";
            else {
                previousRowItemKind = that._GridControl.GetRowByIndex(rowIndex - 1).GetItemKind();

                if (previousRowItemKind != null)
                    return previousRowItemKind;
                else
                    return "Stuff";
            }
        },

        _HasTaxAndToll: function () {
            var that = this;

            var taxCalculationIsEnabled = that._GridControl.GetBuyInvoiceEditForm().GetTaxCalculationIsEnabled();

            if (!taxCalculationIsEnabled)
                return false;

            if (that._BindableEntity.get("Stuff") != null) {
                var stuffInfo = that._GetStuffInfo();
                return stuffInfo.GetFieldValue("DarayeMaliatBarArzesheAfzudeh");
            }
            else if (that._BindableEntity.get("Service") != null)
                return true;
            else
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

        ValidateRow: function () {
            var that = this;

            var validationError = null;
            var rowNumber = that._BindableEntity.get("RowNumber");

            var unitPriceLookup_Text = that._UnitPriceLookupControl_AutoComplete.GetText();

            var shouldValidateRow = that._BindableEntity.GetEntity().ChangeStatus == "Modify"
                || (that._StuffOrServiceLookupControl.GetValue() != null
                    || !ValueIsEmpty(that._QuantityTextBox.GetText())
                    || !ValueIsEmpty(unitPriceLookup_Text)
                );

            if (shouldValidateRow) {
                if (that._StuffOrServiceLookupControl.GetValue() == null)
                    validationError = String.Format("کالا/ خدمات در سطر {0} وارد نشده است.", rowNumber);
                else if (ValueIsEmpty(that._QuantityTextBox.GetText()))
                    validationError = String.Format("تعداد/مقدار در سطر {0} وارد نشده است.", rowNumber);
                else if (ValueIsEmpty(unitPriceLookup_Text))
                    validationError = String.Format("قیمت واحد در سطر {0} وارد نشده است.", rowNumber);
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

            that._StuffOrServiceLookupControl.Focus();
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        },

        _UnitPriceLookupControl_AutoComplete_TextChanged: function (e) {
            var that = this;

            var unitPrice = that._UnitPriceLookupControl_AutoComplete.GetText();
            that._BindableEntity.set("UnitPrice", unitPrice);
        },

        _UnitPriceLookupControl_AutoComplete_KeyPressed: function (e) {
            var that = this;

            var unitPrice = that._UnitPriceLookupControl_AutoComplete.GetText();
            if (e.Key == "Enter") {
                if (unitPrice == "")
                    that._UnitPriceLookupControl._OpenLookup();
                else
                    that._FocusNextRow();
            }
        },

        _FocusNextRow: function () {
            var that = this;

            if (!that.ValidateRow())
                return;

            var rowIndex = that._BindableEntity.get("RowNumber") - 1;
            var isLastRow = (rowIndex == that._GridControl.GetRowsCount() - 1);
            if (isLastRow)
                that._GridControl.AddEmptyItems(1);

            that._GridControl.GetRowByIndex(rowIndex + 1).Focus();
        }

    });

    //Static Members:

    FormClass.TypeName = "ps.BuyInvoiceItemsGridRowControl";
    FormClass.BaseType = afw.BasePanel;


    ps.BuyInvoiceItemsGridRowControl = FormClass;
})();
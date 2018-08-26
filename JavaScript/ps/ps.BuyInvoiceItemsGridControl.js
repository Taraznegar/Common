(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return ps.BuyInvoiceItemsGridControl;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._GridTitleDockPanel = that.FindControl("GridTitleDockPanel");
            that._BuyInvoiceEditForm = options.BuyInvoiceEditForm;
            that._RowsEntityList = that._BuyInvoiceEditForm.ItemsEntityList;
            that._GridBodyPanel = that.FindControl("GridBodyPanel");
            that._GridBodyDockPanel = that.FindControl("GridBodyDockPanel");
            that._GridFooterDockPanel = that.FindControl("GridFooterDockPanel");
            that._AddRowButton = that._GridFooterDockPanel.FindControl("AddRowButton");

            that._TotalPriceSum = 0;
            that._DiscountSum = 0;
            that._TaxAndTollSum = 0;
            that._FinalPriceSum = 0;

            that._GridBodyPanel.SetHeight(10);

            that._RowHeight = 51;

            that._AddRowButton.bind("Click", function (e) { that._AddRowButton_Click(e); });

            that._RowNumberVisible = ps.GetConfigValue("BuyInvoice_ShowRowNumber");
            that._ItemKindVisible = ps.GetConfigValue("BuyInvoice_ShowItemKind");
            that._MeasurementUnitVisible = ps.GetConfigValue("BuyInvoice_ShowMeasurementUnit");
            that._DiscountVisible = ps.GetConfigValue("BuyInvoice_ShowDiscount");
            that._DiscountPerecentVisible = ps.GetConfigValue("BuyInvoice_ShowDiscountPerecent");
            that._TaxAndTollVisible = ps.GetConfigValue("BuyInvoice_ShowTaxAndToll");
            that._TotalPriceVisible = ps.GetConfigValue("BuyInvoice_ShowTotalPrice");
            that._FinalPriceVisible = ps.GetConfigValue("BuyInvoice_ShowFinalPrice");
            that._IsActiveBarCode = ps.GetConfigValue("IsActiveBarCode");
            that._BarCodeLen = ps.GetConfigValue("BarCodeLen");
            that._BuyStuffRepeat = ps.GetConfigValue("BuyStuffRepeat");

            if (that._RowNumberVisible == false)
                that._HideColumn("RowNumber");
            if (that._ItemKindVisible == false)
                that._HideColumn("ItemKind"); 
            if (that._MeasurementUnitVisible == false)
                that._HideColumn("MeasurementUnit");
            if (that._DiscountVisible == false)
                that._HideColumn("Discount");
            if (that._DiscountPerecentVisible == false)
                that._HideColumn("DiscountPerecent");
            if (that._TaxAndTollVisible == false)
                that._HideColumn("TaxAndToll");
            if (that._TotalPriceVisible == false)
                that._HideColumn("TotalPrice");
            if (that._FinalPriceVisible == false)
                that._HideColumn("FinalPrice");
        },

        _HideColumn: function (columnName) {
            var that = this;

            if (that.GetRowsCount() != 0)
                throw "Cannot call HideColumn after rows created.";

            if (columnName == "RowNumber"){
                that._GridTitleDockPanel.SetPaneSizeSetting(1, 1);
                that._GridTitleDockPanel.SetPaneSizeSetting(2, 1);
                that._GridTitleDockPanel.Panes[1].ChildControls[0].SetBackColor("#ffffff");
                that._GridFooterDockPanel.SetPaneSizeSetting(1, 1);
            }
            if (columnName == "ItemKind") {
                that._GridTitleDockPanel.SetPaneSizeSetting(3, 1);
                that._GridTitleDockPanel.SetPaneSizeSetting(4, 1);
                that._GridTitleDockPanel.Panes[1].ChildControls[0].SetBackColor("#ffffff");
                that._GridFooterDockPanel.SetPaneSizeSetting(2, 1);
            } 
            if (columnName == "MeasurementUnit") {
                that._GridTitleDockPanel.SetPaneSizeSetting(9, 1);
                that._GridTitleDockPanel.SetPaneSizeSetting(10, 1);
                that._GridTitleDockPanel.Panes[1].ChildControls[0].SetBackColor("#ffffff");
                that._GridFooterDockPanel.SetPaneSizeSetting(5, 1);
            }
            if (columnName == "TotalPrice") {
                that._GridTitleDockPanel.SetPaneSizeSetting(13, 1);
                that._GridTitleDockPanel.SetPaneSizeSetting(14, 1);
                that._GridTitleDockPanel.Panes[1].ChildControls[0].SetBackColor("#ffffff");
                that._GridFooterDockPanel.SetPaneSizeSetting(6, 1);
            }
            if (columnName == "Discount") {
                that._GridTitleDockPanel.SetPaneSizeSetting(15, 1);
                that._GridTitleDockPanel.SetPaneSizeSetting(16, 1);
                that._GridTitleDockPanel.Panes[1].ChildControls[0].SetBackColor("#ffffff");
                that._GridFooterDockPanel.SetPaneSizeSetting(7, 1);
            }
            if (columnName == "DiscountPerecent") {
                that._GridTitleDockPanel.SetPaneSizeSetting(17, 1);
                that._GridTitleDockPanel.SetPaneSizeSetting(18, 1);
                that._GridTitleDockPanel.Panes[1].ChildControls[0].SetBackColor("#ffffff");
                that._GridFooterDockPanel.SetPaneSizeSetting(8, 1);
            }
            if (columnName == "TaxAndToll") {
                that._GridTitleDockPanel.SetPaneSizeSetting(19, 1);
                that._GridTitleDockPanel.SetPaneSizeSetting(20, 1);
                that._GridTitleDockPanel.Panes[1].ChildControls[0].SetBackColor("#ffffff");
                that._GridFooterDockPanel.SetPaneSizeSetting(9, 1);
            }
            if (columnName == "FinalPrice") {
                that._GridTitleDockPanel.SetPaneSizeSetting(21, 1);
                that._GridTitleDockPanel.SetPaneSizeSetting(22, 1);
                that._GridTitleDockPanel.Panes[1].ChildControls[0].SetBackColor("#ffffff");
                that._GridFooterDockPanel.SetPaneSizeSetting(10, 1);
            }
        },

        GetBuyInvoiceEditForm: function () {
            var that = this;

            return that._BuyInvoiceEditForm;
        },

        GetRowsCount: function() {
            var that = this;

            return that._GridBodyDockPanel.GetPanesCount() - 1;
        },

        AddRow: function (rowEntity) {
            var that = this;

            var rowIndex = that._GridBodyDockPanel.GetPanesCount() - 1;
            var rowPane = that._GridBodyDockPanel.InsertPane(rowIndex, { Size: that._RowHeight }, true);

            var itemKind = null;
            if (rowEntity.GetFieldValue("Stuff") != null)
                itemKind = "Stuff";
            else if (rowEntity.GetFieldValue("Service") != null)
                itemKind = "Service";

            var rowControl = new ps.BuyInvoiceItemsGridRowControl({
                ParentControl: rowPane,
                Name: "Row_" + GenerateGuid(),
                GridControl: that,
                RowEntity: rowEntity,
                ItemKind: itemKind,
                RowNumberVisible: that._RowNumberVisible,
                ItemKindVisible: that._ItemKindVisible,
                MeasurementUnitVisible: that._MeasurementUnitVisible,
                DiscountVisible: that._DiscountVisible,
                DiscountPerecentVisible: that._DiscountPerecentVisible,
                TaxAndTollVisible: that._TaxAndTollVisible,
                TotalPriceVisible: that._TotalPriceVisible,
                FinalPriceVisible: that._FinalPriceVisible,
                IsActiveBarCode: that._IsActiveBarCode,
                BarCodeLen: that._BarCodeLen,
                BuyStuffRepeat: that._BuyStuffRepeat
            });

            that._AdjustControl();
            that.UpdateSummaryLabels();
        },

        RemoveRow: function (rowControl) {
            var that = this;

            var rowIndex = rowControl.ParentControl.GetPaneIndex();
            that._GridBodyDockPanel.RemovePane(rowIndex);

            var rowBindableEntity = rowControl.GetBindableEntity();
            if (rowBindableEntity._Entity.ChangeStatus == "Add") {
                var rowItemIndex = that._RowsEntityList.Entities.IndexOf(rowBindableEntity._Entity);
                that._RowsEntityList.Entities.RemoveItem(rowItemIndex);
            }
            else if (ValueIsIn(rowBindableEntity._Entity.ChangeStatus, ["None", "Modify"]))
                rowBindableEntity._Entity.ChangeStatus = "Delete";            

            var rowNumber = 1;
            var rowEntity = null;
            var row = null;
            for (var i = 0; i < that.GetRowsCount(); i++) {
                row = that.GetRowByIndex(i);
                row.GetBindableEntity().set("RowNumber", rowNumber);                
                rowNumber++;
            }

            that._AdjustControl();
            that.UpdateSummaryLabels();
        },

        GetRowByIndex: function (rowIndex) {
            var that = this;

            if (rowIndex > that._GridBodyDockPanel.GetPanesCount() - 2)
                throw String.Format("Row with index {0} not exists.", rowIndex);

            return that._GridBodyDockPanel.Panes[rowIndex].ChildControls[0];
        },

        AddEmptyItems: function (itemsCount) {
            var that = this;

            if (!that.ValidateRows())
                return;

            var priorRowsCount = that.GetRowsCount();
            var itemEntity = null;

            for (var i = 0; i < itemsCount; i++) {
                itemEntity = afw.uiApi.CreateNewEntity("ps.BuyInvoiceItem");
                itemEntity.SetFieldValue("BuyInvoice", that._BuyInvoiceEditForm.GetBindableEntity().get("ID"));
                itemEntity.SetFieldValue("RowNumber", priorRowsCount + i + 1);

                that._RowsEntityList.Entities.push(itemEntity);
                that.AddRow(itemEntity);
            }
        },

        ValidateRows: function () {
            var that = this;

            for (var i = 0; i < that.GetRowsCount() ; i++) {
                if (!that.GetRowByIndex(i).ValidateRow())
                    return false;
            }

            return true;
        },

        _AddRowButton_Click: function (e) {
            var that = this;

            that.AddEmptyItems(1);
        },

        _OnResize: function () {
            var that = this;

            afw.BasePanel.fn._OnResize.call(that);

            if (!ValueIsEmpty(that._GridBodyDockPanel))
                that._AdjustControl();
        },

        _AdjustControl: function () {
            var that = this;

            var rowsCount = that._GridBodyDockPanel.GetPanesCount() - 1;
            that._GridBodyPanel.SetMinHeight(rowsCount * that._RowHeight + 5);
            that._GridBodyPanel.SetHeight(rowsCount * that._RowHeight + 5);
            
            var gridBodyScrollPanel = that.FindControl("GridBodyScrollPanel");
            gridBodyScrollPanel.AdjustScrollBars();

            var scrollWidth = gridBodyScrollPanel.GetVerticalScrollBarWidth();

            var gridTitleDockPanel = that.FindControl("GridTitleDockPanel");
            var lastPaneIndex = gridTitleDockPanel.GetPanesCount() - 1;
            that.FindControl("GridTitleDockPanel").SetPaneSizeSetting(lastPaneIndex, scrollWidth > 0 ? scrollWidth : 1);
        },

        UpdateSummaryLabels: function () {
            var that = this;

            var rowBindableEntity = null;
            var totalPriceSum = 0;
            var discountSum = 0;
            var taxAndTollSum = 0;
            var finalPriceSum = 0;

            for (var i = 0; i < that.GetRowsCount() ; i++) {
                rowBindableEntity = that.GetRowByIndex(i).GetBindableEntity();

                if (rowBindableEntity.get("TotalPrice") != null)
                    totalPriceSum += rowBindableEntity.get("TotalPrice");
                if (rowBindableEntity.get("Discount") != null)
                    discountSum += rowBindableEntity.get("Discount");
                if (rowBindableEntity.get("TaxAndToll") != null)
                    taxAndTollSum += rowBindableEntity.get("TaxAndToll");
                if (rowBindableEntity.get("FinalPrice") != null)
                    finalPriceSum += rowBindableEntity.get("FinalPrice");
            }

            that._TotalPriceSum = totalPriceSum;
            that._DiscountSum = discountSum;
            that._TaxAndTollSum = taxAndTollSum;
            that._FinalPriceSum = finalPriceSum;

            that._GridFooterDockPanel.FindControl("TotalPriceSumLabel").SetText(FormatNumber(totalPriceSum));
            that._GridFooterDockPanel.FindControl("DiscountSumLabel").SetText(FormatNumber(discountSum));
            that._GridFooterDockPanel.FindControl("TaxAndTollSumLabel").SetText(FormatNumber(taxAndTollSum));
            that._GridFooterDockPanel.FindControl("FinalPriceSumLabel").SetText(FormatNumber(finalPriceSum));

            that._BuyInvoiceEditForm.UpdateSummaryFields();
        },

        GetTotalPriceSum: function () {
            var that = this;

            return that._TotalPriceSum;
        },

        GetDiscountSum: function () {
            var that = this;

            return that._DiscountSum;
        },

        GetTaxAndTollSum: function () {
            var that = this;

            return that._TaxAndTollSum;
        },

        GetFinalPriceSum: function () {
            var that = this;

            return that._FinalPriceSum;
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "ps.BuyInvoiceItemsGridControl";
    FormClass.BaseType = afw.BasePanel;


    ps.BuyInvoiceItemsGridControl = FormClass;
})();
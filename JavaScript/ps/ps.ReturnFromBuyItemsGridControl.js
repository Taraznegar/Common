(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return ps.ReturnFromBuyItemsGridControl;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._ReturnFromBuyEditForm = options.ReturnFromBuyEditForm;
            that._RowsEntityList = that._ReturnFromBuyEditForm.ItemsEntityList;
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
        },

        GetReturnFromBuyEditForm: function () {
            var that = this;

            return that._ReturnFromBuyEditForm;
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
           

            var rowControl = new ps.ReturnFromBuyItemsGridRowControl({
                ParentControl: rowPane,
                Name: "Row_" + GenerateGuid(),
                GridControl: that,
                RowEntity: rowEntity,
                ItemKind: itemKind
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

            var priorRowsCount = that.GetRowsCount();
            var itemEntity = null;
            for (var i = 0; i < itemsCount; i++) {
                itemEntity = afw.uiApi.CreateNewEntity("ps.ReturnFromBuyItem");
                itemEntity.SetFieldValue("ReturnFromBuy", that._ReturnFromBuyEditForm.GetBindableEntity().get("ID"));
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

            that._ReturnFromBuyEditForm.UpdateSummaryFields();
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

        HideAddRowButton:function(){
            var that =this;

            that._AddRowButton.SetVisible(false);
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "ps.ReturnFromBuyItemsGridControl";
    FormClass.BaseType = afw.BasePanel;


    ps.ReturnFromBuyItemsGridControl = FormClass;
})();
(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return ps.SalesInvoicePayPlanItemsGridControl;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._SalesInvoiceEditForm = options.SalesInvoiceEditForm;
            that._RowsEntityList = that._SalesInvoiceEditForm.PayPlanItemsEntityList;

            that._GridTitleDockPanel = that.FindControl("GridTitleDockPanel");
            that._GridBodyPanel = that.FindControl("GridBodyPanel");
            that._GridBodyDockPanel = that.FindControl("GridBodyDockPanel");
            that._GridFooterDockPanel = that.FindControl("GridFooterDockPanel");
            that._AddRowButton = that._GridFooterDockPanel.FindControl("AddRowButton");
            that._PaidFinalAmountLabel = that._GridFooterDockPanel.FindControl("PaidFinalAmountLabel");
            that._InvoiceFinalAmountLabel = that.FindControl("InvoiceFinalAmountLabel");
            that._RemainAmountLabel = that.FindControl("RemainAmountLabel");

            that._GridBodyPanel.SetHeight(10);

            that._RowHeight = 51;

            that._AddRowButton.bind("Click", function (e) { that._AddRowButton_Click(e); });

            that._FinalAmount = null;
            that._PaidFinalAmount = null;

            that._RemainAmountLabel.SetText(0);
            that._PaidFinalAmountLabel.SetText(0);
        },

        GetSalesInvoiceEditForm: function () {
            var that = this;

            return that._SalesInvoiceEditForm;
        },

        RefreshPaidFinalAmount: function () {
            var that = this;

            var paidFinalAmount = 0
            for (var i = 0; i < that.GetRowsCount() ; i++) {
                rowBindableEntity = that.GetRowByIndex(i).GetBindableEntity();

                if (rowBindableEntity.get("Amount") != null)
                    paidFinalAmount += rowBindableEntity.get("Amount");
            }

            that._PaidFinalAmount = paidFinalAmount;

            paidFinalAmount = FormatNumber(paidFinalAmount);
            that._PaidFinalAmountLabel.SetText(paidFinalAmount);
        },

        RefreshRemainAmount: function () {
            var that = this;

            var remainAmount = that._FinalAmount - that._PaidFinalAmount;
            that._RemainAmountLabel.SetText(FormatNumber(remainAmount));
        },

        GetInvoiceFinalAmount: function () {
            var that = this;

            return that._FinalAmount;
        },

        GetRowsCount: function () {
            var that = this;

            return that._GridBodyDockPanel.GetPanesCount() - 1;
        },

        AddRow: function (rowEntity) {
            var that = this;

            var rowIndex = that._GridBodyDockPanel.GetPanesCount() - 1;
            var rowPane = that._GridBodyDockPanel.InsertPane(rowIndex, { Size: that._RowHeight }, true);

            var rowControl = new ps.SalesInvoicePayPlanItemsGridRowControl({
                ParentControl: rowPane,
                Name: "Row_" + GenerateGuid(),
                GridControl: that,
                RowEntity: rowEntity
            });

            that._AdjustControl();
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
            for (var i = 0; i < that.GetRowsCount() ; i++) {
                row = that.GetRowByIndex(i);
                row.GetBindableEntity().set("RowNumber", rowNumber);
                rowNumber++;
            }

            that._AdjustControl();
            that.RefreshAmounts();
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
                itemEntity = afw.uiApi.CreateNewEntity("ps.SalesInvoicePayPlanItem");
                itemEntity.SetFieldValue("SalesInvoice", that._SalesInvoiceEditForm.GetBindableEntity().get("ID"));
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

            if (that._FinalAmount < that._PaidFinalAmount) {
                afw.ErrorDialog.Show("مبلغ کل آیتم های پرداختی از مبلغ قابل پرداخت بیشتر شده است ");
                return false;
            }

            return true;
        },

        RemoveEmptyRows: function () {
            var that = this;

            var items = [];
            for (var i = 0; i < that.GetRowsCount() ; i++) {
                items.push(that.GetRowByIndex(i));
            }

            while (true) {

                var index = items.FindIndex(function (o) { return o.ItemIsEmpty() == true; });
                if (index == -1)
                    break;
                else {
                    that.RemoveRow(items[index]);
                    items.RemoveItem(index);
                }
            }


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
            that.FindControl("GridTitleDockPanel").SetPaneSizeSetting(10, scrollWidth > 0 ? scrollWidth : 1);
        },

        RefreshAmounts: function () {
            var that = this;

            that._FinalAmount = that._SalesInvoiceEditForm.GetBindableEntity().get("FinalAmount");

            var formatedValue = FormatNumber(that._FinalAmount) + " ریال";
            that._InvoiceFinalAmountLabel.SetText(formatedValue);

            for (var i = 0; i < that.GetRowsCount() ; i++) {
                that.GetRowByIndex(i).RefreshAmounts();
            }

        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "ps.SalesInvoicePayPlanItemsGridControl";
    FormClass.BaseType = afw.BasePanel;


    ps.SalesInvoicePayPlanItemsGridControl = FormClass;
})();
(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return ps.SalesInvoicePayPlanItemsGridRowControl;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._BindableEntity = options.RowEntity.ToBindableEntity();
            that._GridControl = options.GridControl;

            that._ItemDockPanel = that.FindControl("ItemDockPanel");
            that._RowNumberLabel = that.FindControl("RowNumberLabel");
            that._ReceiveTypeLookupControl = that.FindControl("ReceiveTypeLookupControl");
            that._ReceiveTypeLookupControl_DropDownList = that._ReceiveTypeLookupControl.GetDropDownList();
            that._DurationNumericTextBox = that.FindControl("DurationNumericTextBox");
            that._PercentNumericTextBox = that.FindControl("PercentNumericTextBox");
            that._AmountNumericTextBox = that.FindControl("AmountNumericTextBox");
            that._RemoveButton = that.FindControl("RemoveButton");

            that._RowNumberLabel.InitDataBinding(that._BindableEntity);
            that._ReceiveTypeLookupControl.InitDataBinding(that._BindableEntity);
            that._DurationNumericTextBox.InitDataBinding(that._BindableEntity);
            that._PercentNumericTextBox.InitDataBinding(that._BindableEntity);
            that._AmountNumericTextBox.InitDataBinding(that._BindableEntity);

            that._ApplyReceiveTypeLookupControlFilter();

            that._BindableEntity.bind("change", function (e) { that._BindableEntity_change(e); });
            that._RemoveButton.bind("Click", function (e) { that._RemoveButton_Click(e); });

            that._ReceiveTypeLookupControl_DropDownList.bind("KeyPressed", function (e) {
                if (e.Key == "Enter") {
                    that._DurationNumericTextBox.Focus();
                }
            });

            that._DurationNumericTextBox.bind("KeyPressed", function (e) {
                if (e.Key == "Enter") {
                    that._PercentNumericTextBox.Focus();
                }
            });

            that._PercentNumericTextBox.bind("KeyPressed", function (e) {
                if (e.Key == "Enter") {
                    that._AmountNumericTextBox.Focus();
                }
            });

            that._AmountNumericTextBox.bind("KeyPressed", function (e) {
                if (e.Key == "Enter") {
                    that._FocusNextRow();
                }
            });


        },

        _ApplyReceiveTypeLookupControlFilter: function () {
            var that = this;

            var id1 = rp.GetReceiveTypeID("Naghd");
            var id2 = rp.GetReceiveTypeID("Cheque");

            that._ReceiveTypeLookupControl.SetBaseFilterExpression(String.Format("ID in ('{0}','{1}')", id1, id2));
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

        _BindableEntity_change: function (e) {
            var that = this;

            if (ValueIsIn(e.field, ["FinalPricePercent", "Amount"]))
                that.RefreshAmounts(e.field);

            that.AdjustColor();

        },

        RefreshAmounts: function (field) {
            var that = this;

            var amount = 0;

            var finalPrice = that._GridControl.GetInvoiceFinalAmount();

            var percent = that._PercentNumericTextBox.GetValue();

            if (field == "FinalPricePercent") {
                amount = (finalPrice * (percent / 100)).toFixed();
            }
            else if (field == "Amount") {
                amount = that._AmountNumericTextBox.GetValue();
            }
            else {
                if (percent == null || percent <= 0)
                    amount = that._AmountNumericTextBox.GetValue();
                else
                    amount = (finalPrice * (percent / 100)).toFixed();
            }

            that._AmountNumericTextBox.SetValue(amount);

            that._GridControl.RefreshPaidFinalAmount();

            that._GridControl.RefreshRemainAmount();


        },

        _RemoveButton_Click: function (e) {
            var that = this;

            that._GridControl.RemoveRow(that);
        },

        ItemIsEmpty: function () {
            var that = this;

            return that._ReceiveTypeLookupControl.GetValue() == null &&
                    ValueIsEmpty(that._PercentNumericTextBox.GetText()) &&
                    ValueIsEmpty(that._DurationNumericTextBox.GetText()) &&
                    ValueIsEmpty(that._AmountNumericTextBox.GetText());
        },

        ValidateRow: function () {
            var that = this;
            
            var validationError = null;
            var rowNumber = that._BindableEntity.get("RowNumber");

            if (that._ReceiveTypeLookupControl.GetValue() == null)
                validationError = String.Format("نوع دریافت در سطر {0} وارد نشده است.", rowNumber);
            else if (ValueIsEmpty(that._DurationNumericTextBox.GetText()))
                validationError = String.Format("مدت در سطر {0} وارد نشده است.", rowNumber);
            else if (ValueIsEmpty(that._AmountNumericTextBox.GetText()) && that._AmountNumericTextBox.GetValue() <= 0)
                validationError = String.Format("مبلغ در سطر {0} وارد نشده است.", rowNumber);

            if (validationError == null)
                return true;
            else {
                afw.ErrorDialog.Show(validationError);
                return false;
            }
        },

        Focus: function () {
            var that = this;

            that._ReceiveTypeLookupControl.Focus();
        },

        _FocusNextRow: function () {
            var that = this;

            var rowIndex = that._BindableEntity.get("RowNumber") - 1;
            var isLastRow = (rowIndex == that._GridControl.GetRowsCount() - 1);
            if (isLastRow)
                that._GridControl.AddEmptyItems(1);

            that._GridControl.GetRowByIndex(rowIndex + 1).Focus();
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        }



    });

    //Static Members:

    FormClass.TypeName = "ps.SalesInvoicePayPlanItemsGridRowControl";
    FormClass.BaseType = afw.BasePanel;


    ps.SalesInvoicePayPlanItemsGridRowControl = FormClass;
})();
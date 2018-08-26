(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return rp.ChequesStatusChangeSearchForm_PaidFilter;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (designObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._ChequesStatusChangeSearchForm = options.ChequesStatusChangeSearchForm;

            that._ChequeNumberTextBox = that.FindControl("ChequeNumberTextBox");
            that._PayeeLookupControl = that.FindControl("PayeeLookupControl");
            that._OwnerUserLookupControl = that.FindControl("OwnerUserLookupControl");
            that._AmountNumericTextBox = that.FindControl("AmountNumericTextBox");
            that._StatusOptionSetControl = that.FindControl("StatusOptionSetControl");
            that._BankAccountLookupControl = that.FindControl("BankAccountLookupControl");

            that._StatusOptionSetControl.bind("ValueChanged", function (e) { that._Control_ValueChanged(e); });
            that._AmountNumericTextBox.bind("ValueChanged", function (e) { that._Control_ValueChanged(e); });
            that._PayeeLookupControl.bind("ValueChanged", function (e) { that._Control_ValueChanged(e); });
            that._ChequeNumberTextBox.bind("ValueChanged", function (e) { that._Control_ValueChanged(e); });
            that._OwnerUserLookupControl.bind("ValueChanged", function (e) { that._Control_ValueChanged(e); });
            that._BankAccountLookupControl.bind("ValueChanged", function (e) { that._Control_ValueChanged(e); });

            var defaultOptionSetID = afw.OptionSetHelper.GetOptionSetItemID("rp.PaidChequeStatus.PasNashode");
            that._StatusOptionSetControl.SetValue(defaultOptionSetID);
            that._Set_StatusOptionSetControlFilter();
        },

        _Set_StatusOptionSetControlFilter: function () {
            var that = this;

            that._StatusOptionSetControl.SetFilterExpression("Name = 'PasNashode'");
        },

        _Control_ValueChanged: function (e) {
            var that = this;
                        
            if (e.Sender == that._StatusOptionSetControl) {
                var statusSelectedID = that._StatusOptionSetControl.GetValue();
                if (statusSelectedID == null) {
                    var defaultOptionSetID = afw.OptionSetHelper.GetOptionSetItemID("rp.PaidChequeStatus.PasNashode");
                    that._StatusOptionSetControl.SetValue(defaultOptionSetID);
                    return;
                }
                else {
                    that._ChequesStatusChangeSearchForm.ApplyFilters();
                }
            }
            else
                that._ChequesStatusChangeSearchForm.ApplyFilters();
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        }

    });

    //Static Members:

    FormClass.TypeName = "rp.ChequesStatusChangeSearchForm_PaidFilter";
    FormClass.BaseType = afw.BasePanel;


    rp.ChequesStatusChangeSearchForm_PaidFilter = FormClass;
})();
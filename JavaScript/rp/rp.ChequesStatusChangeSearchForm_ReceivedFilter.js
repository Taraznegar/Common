(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return rp.ChequesStatusChangeSearchForm_ReceivedFilter;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (designObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._ChequesStatusChangeSearchForm = options.ChequesStatusChangeSearchForm;

            that._ChequeNumberTextBox = that.FindControl("ChequeNumberTextBox");
            that._PayerLookupControl = that.FindControl("PayerLookupControl");
            that._RadifeDaftareChekTextBox = that.FindControl("RadifeDaftareChekTextBox");
            that._OwnerUserLookupControl = that.FindControl("OwnerUserLookupControl");
            that._AmountNumericTextBox = that.FindControl("AmountNumericTextBox");
            that._StatusOptionSetControl = that.FindControl("StatusOptionSetControl");
            that._BankAccountLookupControl = that.FindControl("BankAccountLookupControl");
            that._BankAccountLabel = that.FindControl("BankAccountLabel");

            that._StatusOptionSetControl.bind("ValueChanged", function (e) { that._Control_ValueChanged(e); });
            that._AmountNumericTextBox.bind("ValueChanged", function (e) { that._Control_ValueChanged(e); });
            that._PayerLookupControl.bind("ValueChanged", function (e) { that._Control_ValueChanged(e); });
            that._ChequeNumberTextBox.bind("ValueChanged", function (e) { that._Control_ValueChanged(e); });
            that._RadifeDaftareChekTextBox.bind("ValueChanged", function (e) { that._Control_ValueChanged(e); });
            that._OwnerUserLookupControl.bind("ValueChanged", function (e) { that._Control_ValueChanged(e); });
            that._BankAccountLookupControl.bind("ValueChanged", function (e) { that._Control_ValueChanged(e); });

            var defaultOptionSetID = afw.OptionSetHelper.GetOptionSetItemID("rp.ReceivedChequeStatus.AsnadeDaryaftani");
            that._StatusOptionSetControl.SetValue(defaultOptionSetID);
            that._Set_StatusOptionSetControlFilter();

        },

        _Set_StatusOptionSetControlFilter:function(){
            var that = this;

            that._StatusOptionSetControl.SetFilterExpression("Name in( 'VagozariBeShakhs', 'AsnadeDaryaftani', 'DarJaryaneVosol') " );
        },

        _Control_ValueChanged: function (e) {
            var that = this;

            var statusName = that._GetStatusName();

            if (ValueIsIn(statusName, ["DarJaryaneVosol", "VosoolShode"]) &&
                that._BankAccountLookupControl.GetValue() == null) {
                that._PayerLookupControl.SetReadOnly(true);
                that._AmountNumericTextBox.SetReadOnly(true);
                that._ChequeNumberTextBox.SetReadOnly(true);
                that._RadifeDaftareChekTextBox.SetReadOnly(true);
                that._OwnerUserLookupControl.SetReadOnly(true);
            }
            else {
                that._PayerLookupControl.SetReadOnly(false);
                that._AmountNumericTextBox.SetReadOnly(false);
                that._ChequeNumberTextBox.SetReadOnly(false);
                that._RadifeDaftareChekTextBox.SetReadOnly(false);
                that._OwnerUserLookupControl.SetReadOnly(false);
            }

            if (e.Sender == that._StatusOptionSetControl) {
                var statusSelectedID = that._StatusOptionSetControl.GetValue();
                if (statusSelectedID == null) {
                    var asnadeDaryaftaniOptionSetID = afw.OptionSetHelper.GetOptionSetItemID("rp.ReceivedChequeStatus.AsnadeDaryaftani");
                    that._StatusOptionSetControl.SetValue(asnadeDaryaftaniOptionSetID);
                    return;
                }
                else {
                    if (ValueIsIn(statusName, ["DarJaryaneVosol", "VosoolShode"])) {
                        that._BankAccountLookupControl.SetVisible(true);
                        that._BankAccountLabel.SetVisible(true);
                    }
                    else {
                        that._BankAccountLookupControl.SetVisible(false);
                        that._BankAccountLabel.SetVisible(false);
                    }

                    that._BankAccountLookupControl.SetValue(null);

                    that._ChequesStatusChangeSearchForm.ApplyFilters();
                }
            }
            else
                that._ChequesStatusChangeSearchForm.ApplyFilters();

        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        },

        _GetStatusName: function () {
            var that = this;

            var statusId = that.FindControl("StatusOptionSetControl").GetValue();
            if (statusId == null)
                return null;

            var statusName = afw.OptionSetHelper.GetOptionSetItemName(statusId);
            return statusName;
        }

    });

    //Static Members:

    FormClass.TypeName = "rp.ChequesStatusChangeSearchForm_ReceivedFilter";
    FormClass.BaseType = afw.BasePanel;


    rp.ChequesStatusChangeSearchForm_ReceivedFilter = FormClass;
})();
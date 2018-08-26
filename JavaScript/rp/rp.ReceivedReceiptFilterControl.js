(function () {
    var typeName = "rp.ReceivedReceiptFilterControl";
    var baseType = afw.BasePanel;
    var events = baseType.Events.concat(["FilterChanged"]);
    var objectEvents = afw.BasePanel.Events.concat([]);

    var FormClass = afw.BasePanel.extend({
        events: objectEvents,

        GetType: function () {
            return rp.ReceivedReceiptFilterControl;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (designObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._ReceiptTypeComboBox = that.FindControl("ReceiptTypeComboBox");

            var optionSetItems = afw.uiApi.CallServerMethodSync("rp.GetReceivedReceiptOptionSetItem");
            if (optionSetItems.Entities.length > 0) {
                that._ReceiptTypeComboBox.SetItemsDataSource(optionSetItems.ToDataSourceData());
                that._ReceiptTypeComboBox.SetValue(optionSetItems.ToDataSourceData()[0].OptionsetItem);

                that._ReceiptTypeComboBox.bind("ValueChanged", function (e) { that._OnFilterChanged(); });
            }
        },

        _OnFilterChanged: function () {
            var that = this;

            if (that._IsInSettingFilter)
                return;

            that._IsInSettingFilter = true;

            try {
                if (that._events != null)
                    that.trigger("FilterChanged", { Sender: that });
            }
            finally {
                that._IsInSettingFilter = false;
            }
        },

        GetFilterExpression: function () {
            var that = this;

            var filterExpression = "";

            // if (that._IsFinancialGroup == true) {
            var receiptType = that._ReceiptTypeComboBox.GetValue();
            if (receiptType != null) {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";
                filterExpression += String.Format("ReceiptType = '{0}'", receiptType);
            }

            return filterExpression;
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "rp.ReceivedReceiptFilterControl";
    FormClass.BaseType = afw.BasePanel;
    FormClass.Events = objectEvents;

    rp.ReceivedReceiptFilterControl = FormClass;
})();
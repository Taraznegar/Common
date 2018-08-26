(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return ps.SalesInvoicesFilterControl;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (designObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            var customerID = null;
            if ("CustomerID" in options)
                customerID = options.CustomerID;
            else
                customerID = null;

            that._CustomerLookupControl = that.FindControl("CustomerLookupControl");
            if (customerID != null)
                that._CustomerLookupControl.SetValue(customerID);
            that._CustomerLookupControl.bind("ValueChanged", function (e) { that._OnFilterChanged(); });
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

            var customerID = that._CustomerLookupControl.GetValue();
            if (!ValueIsEmpty(customerID)) {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";
                filterExpression += String.Format("Customer = '{0}'", customerID);
            }

            return filterExpression;
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "ps.SalesInvoicesFilterControl";
    FormClass.BaseType = afw.BasePanel;
    FormClass.Events = FormClass.BaseType.Events.concat(["FilterChanged"]);

    ps.SalesInvoicesFilterControl = FormClass;
})();
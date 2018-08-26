(function () {
    var typeName = "acc.AccountReviewFilterControl";
    var baseType = afw.BasePanel;
    var events = baseType.Events.concat(["FilterChanged"]);

    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return acc.AccountReviewFilterControl;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (designObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._AccountNameTextBox = that.FindControl("AccountNameTextBox");
            that._AccountNameTextBox.bind("TextChanged", function (e) { that._OnFilterChanged(); });

        },

        _OnFilterChanged: function (e) {
            var that = this;

            if (that._IsInFilterChanged)
                return;

            that._IsInFilterChanged = true;

            try {
                if (that._events != null)
                    that.trigger("FilterChanged", { Sender: that });
            }
            finally {
                that._IsInFilterChanged = false;
            }
        },

        GetFilterExpression: function () {
            var that = this;

            var filterExpression = "";

            var accountName = that._AccountNameTextBox.GetText();
            if (accountName != null && accountName != "") {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";
                filterExpression += String.Format("AccountReviewName like N'%{0}%'", accountName);
            }

            return filterExpression;
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "acc.AccountReviewFilterControl";
    FormClass.BaseType = afw.BasePanel;


    acc.AccountReviewFilterControl = FormClass;
})();
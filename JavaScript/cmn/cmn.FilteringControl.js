(function () {
    var typeName = "cmn.FilteringControl";
    var baseType = afw.BasePanel;
    var objectEvents = baseType.Events.concat(["FilterChanged"]);

    var FormClass = afw.BasePanel.extend({
        events: objectEvents,

        GetType: function () {
            return cmn.FilteringControl;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._IsInSettingFilter = false;

            that._FinancialDocTypeOptionSetControl = that.FindControl("FinancialDocTypeOptionSetControl");
            that._UserLookupControl = that.FindControl("UserLookupControl");

            that._FinancialDocTypeOptionSetControl.bind("ValueChanged", function (e) { that._OnFilterChanged(); });

            that._UserLookupControl.SetBaseFilterExpression("");
            that._UserLookupControl.bind("ValueChanged", function (e) { that._OnFilterChanged(); });
        },

        SetFilters: function (filterNameValues) {
            var that = this;

            that._IsInSettingFilter = true;
            try {
                if ("FinancialDocType" in filterNameValues) {
                    that._FinancialDocTypeOptionSetControl.SetValue(filterNameValues.FinancialDocType);
                } 
            }
            finally {
                that._IsInSettingFilter = false;
            }

            that._OnFilterChanged();
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

            var financialDocTypeID = that._FinancialDocTypeOptionSetControl.GetValue();
            if (!ValueIsEmpty(financialDocTypeID)) {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";
                filterExpression += String.Format("FinancialDocType = '{0}'", financialDocTypeID);
            }
            //var paperType = that._PaperTypeFilteration.GetValue();
            //if (paperType != null && paperType != "All") {
            //    if (!ValueIsEmpty(filterExpression))
            //        filterExpression += " and ";
            //    filterExpression += String.Format("Type = '{0}'", paperType);
            //} 

            var userID = that._UserLookupControl.GetValue();
            if (userID != null) {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";
                filterExpression += String.Format("CreatorUser = '{0}'", userID);
            }

            return filterExpression;
        }

    });

    //Static Members:

    FormClass.TypeName = typeName;
    FormClass.BaseType = baseType;
    FormClass.Events = objectEvents;

    cmn.FilteringControl = FormClass;
})();
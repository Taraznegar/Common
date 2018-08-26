(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return acc.AccDocSearchFrom;
        },

        init: function (options) {
            var that = this;

            that._FinancialYearID = cmn.GetUserActiveFinancialYearID();

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (designObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, designObjectData, false);
              
            that._AccDocItemPanel = that.FindControl("AccDocItemPanel"); 
              
            var accdocItemsListControl = afw.uiApi.CreateDataListControl("acc.AccDocItems",
                {
                    ParentControl: that._AccDocItemPanel,
                    BaseFilterExpression: String.Format("FinancialYear = '{0}'", that._FinancialYearID),
                    FillParent: true
                }); 
        },
           
        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "acc.AccDocSearchFrom";
    FormClass.BaseType = afw.BasePanel;


    acc.AccDocSearchFrom = FormClass;
})();
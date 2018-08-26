(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return acc.AccDocForeignCurrencyPopupForm;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (designObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "acc.AccDocForeignCurrencyPopupForm";
    FormClass.BaseType = afw.BasePanel;


    acc.AccDocForeignCurrencyPopupForm = FormClass;
})();
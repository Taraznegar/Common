(function () {
    var objectEvents = afw.Window.Events.concat([]);

    var FormClass = afw.Window.extend({
        events: objectEvents,

        GetType: function () {
            return wm.WarehouseDocsAccSettingCopyAdditionalInfoForm;
        },

        init: function (options) {
            var that = this;

            afw.Window.fn.init.call(that, options);
            var formObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (formObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, formObjectData, false);

            that._SourceSettingDataItem = options.RefSettingDataItem;

            that.FindControl("FinancialYearLookup").SetValue(that._SourceSettingDataItem["FinancialYear"]);
            that.FindControl("GhabzOrHavaleTypeLookup").SetValue(that._SourceSettingDataItem["GhabzOrHavaleType"]);
            that.FindControl("TarafHesabeAnbarAccountLookup").SetValue(that._SourceSettingDataItem["TarafHesabeAnbarAccount"]);

            that.FindControl("CopySettingButton").BindEvent("Click", function (e) { that._CopyWarehouseDocsAccSetting(); });
        },

        _CopyWarehouseDocsAccSetting: function(){
            var that = this;
            
            afw.uiApi.ShowProgress(that);
            afw.uiApi.CallServerMethodAsync("wm.SaveWarehouseDocsAccSettingsCopy",
                [that.FindControl("FinancialYearLookup").GetValue(), 
                that.FindControl("GhabzOrHavaleTypeLookup").GetValue(),
                that.FindControl("TarafHesabeAnbarAccountLookup").GetValue()],
                function (result) {
                    afw.uiApi.HideProgress(that);
                    if (result.HasError)
                        afw.ErrorDialog.Show(result.ErrorMessage);
                    else {
                        that.Close();
                    }
                });
        },

        _OnOpening: function () {
            var that = this;

            afw.Window.fn._OnOpening.call(that);
        },

        _OnOpened: function () {
            var that = this;

            afw.Window.fn._OnOpened.call(that);
        },

        _OnClosed: function () {
            var that = this;

            afw.Window.fn._OnClosed.call(that);
        },

        _OnPreviewKeyUp: function (e) {
            var that = this;

            afw.Window.fn._OnPreviewKeyUp.call(that, e);
        },

        _DoDestroy: function () {
            var that = this;

            afw.Window.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "wm.WarehouseDocsAccSettingCopyAdditionalInfoForm";
    FormClass.BaseType = afw.Window;
    FormClass.Events = objectEvents;

    wm.WarehouseDocsAccSettingCopyAdditionalInfoForm = FormClass;
})();
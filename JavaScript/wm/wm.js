(function () {
    window.wm = {
        Init: function () {
            var that = this;

            that._DefaultSourceStuffLocation = null;
        },

        GetDefaultSourceStuffLocation: function () {
            var that = this;

            return that._DefaultSourceStuffLocation;
        },

        SetDefaultSourceStuffLocation: function (defaultSourceStuffLocation) {
            var that = this;

            if (!ValueIsEmpty(defaultSourceStuffLocation))
                that._DefaultSourceStuffLocation = defaultSourceStuffLocation;
        },

        GetNewGhabzOrHavaleNumber: function (warehouseDocType, stufflocation) {
            var that = this;

            return afw.uiApi.CallServerMethodSync("wm.GetNewGhabzOrHavaleNumber", [warehouseDocType, stufflocation]);
        },

        SetRialiAmountManually: function () {
            var that = this;

            afw.uiApi.OpenSavedFormInMdiContainer("wm.SetRialiAmountManuallyForm", "ورود دستی مبالغ ریالی");

        },

        OpenRialiNemodanAsnadAnbarForm: function () {
            var that = this;

            afw.uiApi.OpenSavedFormInMdiContainer("wm.RialiNemodanAsnadAnbarForm", "ریالی نمودن اسناد انبار");

        },

        ShowKarteksTedadiRialiKalaForm: function () {
            var that = this;

            afw.uiApi.OpenSavedFormInMdiContainer("wm.KarteksTedadiRialiKalaForm", "کاردکس تعدادی ریالی کالا");
        },

        ShowKarteksTedadiKalaForm: function () {
            var that = this;

            afw.uiApi.OpenSavedFormInMdiContainer("wm.KarteksTedadiKalaForm", "کاردکس تعدادی کالا");
        },

        ShowMontageOpList: function () {
            var that = this;

            afw.DataListHelper.DisplayDataListInAppContainer("wm.MontageOrDemontageList", "عملیات مونتاژ",
                { ListMode: "Montage" });
        },

        ShowDemontageOpList: function () {
            var that = this;

            afw.DataListHelper.DisplayDataListInAppContainer("wm.MontageOrDemontageList", "عملیات دمونتاژ",
                { ListMode: "Demontage" });
        }
    }
})();
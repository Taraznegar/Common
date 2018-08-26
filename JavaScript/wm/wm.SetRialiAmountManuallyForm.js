(function () {
    var objectEvents = afw.BasePanel.Events.concat([]);

    var FormClass = afw.BasePanel.extend({
        events: objectEvents,

        GetType: function () {
            return wm.SetRialiAmountManuallyForm;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (designObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._DataListPanel = that.FindControl("DataListPanel");

            that._CreateDataList();
        },

        _CreateDataList: function () {
            var that = this;

            that._DataListControl = afw.uiApi.CreateDataListControl("wm.SetRialiAmountManuallyList", {
                Name: 'DataListControl',
                ParentControl: that._DataListPanel,
                FillParent: true
            });
        },

        _OnPreviewKeyUp: function (e) {
            var that = this;

            afw.BasePanel.fn._OnPreviewKeyUp.call(that, e);
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "wm.SetRialiAmountManuallyForm";
    FormClass.BaseType = afw.BasePanel;
    FormClass.Events = objectEvents;

    wm.SetRialiAmountManuallyForm = FormClass;
})();
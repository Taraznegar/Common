(function () {
    var objectEvents = afw.BasePanel.Events.concat([]);

    var FormClass = afw.BasePanel.extend({
        events: objectEvents,

        GetType: function () {
            return acc.GhabzOrHavaleOfOneAccDocForm;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (designObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._DataListPanel = that.FindControl("DataListPanel");
            that._AccDocLookupControl = that.FindControl("AccDocLookupControl");
            that._AccDocLookupControl.SetBaseFilterExpression(String.Format("DocKind = '{0}'", afw.uiApi.CallServerMethodSync("acc.GetDocKindID", ["WarehouseDoc"])));

            that._AccDocLookupControl.BindEvent("ValueChanged", function (e) { that._AccDocLookupControl_ValueChanged(e);})
        },

        _AccDocLookupControl_ValueChanged: function (e) {
            var that = this;

            if (ValueIsEmpty(that._AccDocLookupControl.GetValue()))
                that._DestroyDataList();
            else
                that._CreateDataList();
        },

        _CreateDataList: function () {
            var that = this;

            that._DestroyDataList();

            that._DataList = new afw.uiApi.CreateDataListControl("acc.GhabzOrHavaleOfOneAccDocList", {
                Name: "GhabzOrHavaleOfOneAccDocList",
                ParentControl: that._DataListPanel,
                BaseFilterExpression: String.Format("AccDoc = '{0}'", that._AccDocLookupControl.GetValue()),
                FillParent: true
            });

            that._DataList.LoadData();

        },

        _DestroyDataList: function () {
            var that = this;

            var dataList = that._DataListPanel.FindControl("GhabzOrHavaleOfOneAccDocList");
            if (dataList != null)
                dataList.Destroy();
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

    FormClass.TypeName = "acc.GhabzOrHavaleOfOneAccDocForm";
    FormClass.BaseType = afw.BasePanel;
    FormClass.Events = objectEvents;

    acc.GhabzOrHavaleOfOneAccDocForm = FormClass;
})();
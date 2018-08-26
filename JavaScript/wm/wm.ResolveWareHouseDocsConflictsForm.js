(function () {
    var objectEvents = afw.BasePanel.Events.concat([]);

    var FormClass = afw.BasePanel.extend({
        events: objectEvents,

        GetType: function () {
            return wm.ResolveWareHouseDocsConflictsForm;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (designObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._MessageEntityList = options.WareHouseDocsEntityList;

            that._GridViewPanel = that.FindControl("GridViewPanel");
            that._CreateGridView();
        },

        _CreateGridView: function () {
            var that = this;

            var message = { title: "پیام خطا", field: "Message", rightToLeft: true, width: "fill" };

            that._DestroyGridView();

            that._GridView = new afw.GridView({
                ParentControl: that._GridViewPanel,
                Name: "GridView",
                FillParent: true,
                Columns: [message],
                SelectionMode: "SingleRow"
            });

            that._GridView.GetDataSource().data(that._MessageEntityList.ToDataSourceData());
        },

        _DestroyGridView: function(){
            var that = this;

            var gridView = that._GridViewPanel.FindControl("GridView");
            if (gridView != null)
                gridView.Destroy();
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

    FormClass.TypeName = "wm.ResolveWareHouseDocsConflictsForm";
    FormClass.BaseType = afw.BasePanel;
    FormClass.Events = objectEvents;

    wm.ResolveWareHouseDocsConflictsForm = FormClass;
})();
(function () {
    var typeName = "wm.GhabzOrHavalehaListControl";
    var baseType = afw.DataListControl;
    var objectEvents = afw.DataListControl.Events.concat([]);

    var GhabzOrHavalehaListControl = baseType.extend({
        events: objectEvents,

        GetType: function () {
            return wm.GhabzOrHavalehaListControl;
        },

        init: function (options) {
            var that = this;

            options.DataListFullName = "wm.GhabzOrHavalehaList";
            afw.DataListControl.fn.init.call(that, options);
        },

        _OnCreatingColumn: function (columnInfo) {
        },

        _CreateToolbar: function () {
            var that = this;

            afw.DataListControl.fn._CreateToolbar.call(that);

            that.ToolBar.AddButton("View", "مشاهده", { Image: "resource(cmn.View)" });
            that.ToolBar.RemoveButton("Edit");
            that.ToolBar.RemoveButton("Reload");
            that.ToolBar.RemoveButton("New");
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            if (buttonKey == "View") {
                var selectedEntities = that._EntitiesGridView.GetSelectedRows();

                if (selectedEntities.length != 0) {
                    var entityId = selectedEntities[0].DataItem["ID"];
                    var ghabzOrHavaleEntity = afw.uiApi.FetchEntityByID("wm.GhabzOrHavale", entityId);

                    that._ShowEntityWindow(ghabzOrHavaleEntity, "Edit", { WarehouseDocTypeName: selectedEntities[0].DataItem["WarehouseDocType_Name"] });
                }
            }
            else
                afw.DataListControl.fn._OnToolbarButtonClicked.call(that, buttonKey);
        },

        _GetTotalFilterExpression: function () {
            var that = this;

            var filterExpression = afw.DataListControl.fn._GetTotalFilterExpression.call(that);

            filterExpression = cmn.AddActiveFinancialYearFilterToFilterExpression(filterExpression);

            return filterExpression;
        },

        _OnLoadingData: function () {
            var that = this;

            afw.DataListControl.fn._OnLoadingData.call(that);
        },

        _OnDataLoaded: function () {
            var that = this;

            afw.DataListControl.fn._OnDataLoaded.call(that);
        },

        _ShowEntityWindow: function (entity, formMode, options) {
            var that = this;

            return afw.DataListControl.fn._ShowEntityWindow.call(that, entity, formMode, options);
        },

        _OnEntityWindowOpened: function (entityWindow) {
            var that = this;

            afw.DataListControl.fn._OnEntityWindowOpened.call(that, entityWindow);
        },

        _OnEntityWindowClosed: function (entityWindow) {
            var that = this;

            afw.DataListControl.fn._OnEntityWindowClosed.call(that, entityWindow);
        },

        _EntitiesGridView_RowDoubleClick: function (e) {
            var that = this;

            afw.DataListControl.fn._EntitiesGridView_RowDoubleClick.call(that, e);
        },

        _OnPreviewKeyUp: function (e) {
            var that = this;

            afw.DataListControl.fn._OnPreviewKeyUp.call(that, e);
        },

        _DoDestroy: function () {
            var that = this;

            afw.DataListControl.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    GhabzOrHavalehaListControl.TypeName = typeName;
    GhabzOrHavalehaListControl.BaseType = baseType;
    GhabzOrHavalehaListControl.Events = objectEvents;


    wm.GhabzOrHavalehaListControl = GhabzOrHavalehaListControl;
})();

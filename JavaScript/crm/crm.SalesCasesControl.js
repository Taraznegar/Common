(function () {
    var typeName = "crm.SalesCasesControl";
    var baseType = afw.DataListControl;
    var events = afw.DataListControl.Events.concat([]);

    var SalesCasesControl = baseType.extend({
        events: events,

        GetType: function () {
            return crm.SalesCasesControl;
        },

        init: function (options) {
            var that = this;

            that._FilterControl = null;

            options.DataListFullName = "crm.SalesCases";
            afw.DataListControl.fn.init.call(that, options);

         
          
            that._VDockPanel.SetPaneSizeSetting(2,50);
            //that._ProceedingDataList._VDockPanel.RemovePane(1);
            that._QuickSearchDockPanel = that.FindControl(that.GetName() + "_QuickSearchDockPanel");
            that._QuickSearchDockPanel.AppendPane();
            that._QuickSearchDockPanel.SetPaneSizeSetting(0, 300);
            that._QuickSearchDockPanel.SetPaneSizeSetting(1, "fill");

            that._FilterControl = afw.uiApi.CreateSavedFormByName(that._QuickSearchDockPanel.Panes[1], "crm.SalesCasesFilterControl", { Name: "SalesCasesFilterControl" });
            that._FilterControl.bind("FilterChanged", function (e) { that._FilterControl_FilterChanged(e); });

            that.LoadData();
        },

        _CreateToolbar: function () {
            var that = this;

            afw.DataListControl.fn._CreateToolbar.call(that);
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            afw.DataListControl.fn._OnToolbarButtonClicked.call(that, buttonKey);
        },

        _FilterControl_FilterChanged: function (e) {
            var that = this;

            that.LoadData();
        },

        _GetTotalFilterExpression: function () {
            var that = this;

            var filter = afw.DataListControl.fn._GetTotalFilterExpression.call(that);

            var filterExpression = that._FilterControl.GetFilterExpression();
            if (that._FilterControl != null && !ValueIsEmpty(filterExpression)) {
                if (!ValueIsEmpty(filter))
                    filter += " and ";
                filter += filterExpression;
            }

            return filter;
        },

        _LoadData: function () {
            var that = this;

            if (that._FilterControl == null)
                return;

            afw.DataListControl.fn._LoadData.call(that);
        },

        _OnLoadingData: function () {
            var that = this;

            afw.DataListControl.fn._OnLoadingData.call(that);
        },

        _ShowEntityWindow: function (entity, formMode) {
            var that = this;

            return afw.DataListControl.fn._ShowEntityWindow.call(that, entity, formMode);
        },

        _OnEntityWindowOpened: function (entityWindow) {
            var that = this;

            afw.DataListControl.fn._OnEntityWindowOpened.call(that, entityWindow);
        },

        _EntitiesGridView_RowDoubleClick: function (e) {
            var that = this;

            afw.DataListControl.fn._EntitiesGridView_RowDoubleClick.call(that, e);
        }
    });

    //Static Members:

    SalesCasesControl.TypeName = typeName;
    SalesCasesControl.BaseType = baseType;
    SalesCasesControl.Events = events;


    crm.SalesCasesControl = SalesCasesControl;
})();

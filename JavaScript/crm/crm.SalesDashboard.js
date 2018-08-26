(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return crm.SalesDashboard;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var formObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            afw.uiApi.CreateControlByObjectData(that, formObjectData, false);

            var dashboardSplitterPanel = that.FindControl("DashboardSplitterPanel");
            dashboardSplitterPanel.SetPaneSize("Pane2", 300);

            afw.uiApi.CreateSavedFormByName(dashboardSplitterPanel.Panes[0], "crm.SalesCasesPipelineViewControl", { Name: "SalesCasesPipelineViewControl", FillParent: true });
            afw.uiApi.CreateSavedFormByName(dashboardSplitterPanel.Panes[1], "crm.DailyCalendarControl", { Name: "DailyCalendarControl", FillParent: true });
        }
    });

    //Static Members:

    FormClass.TypeName = "crm.SalesDashboard";
    FormClass.BaseType = afw.BasePanel;


    crm.SalesDashboard = FormClass;
})();
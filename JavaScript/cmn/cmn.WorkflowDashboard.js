(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return cmn.WorkflowDashboard;

        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (designObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._WorkflowFormsName = [];
            that._WorkflowStages = [];
            that._FoldersTreeView = null;
            that._MainSplitterPanel = that.FindControl("MainSplitterPanel");
            that._FoldersTreeViewPanel = that.FindControl("FoldersTreeViewPanel");
            that._DataListControlPanel = that.FindControl("DataListControlPanel");
            that._MainSplitterPanel.SetPaneSize(0, 350);
            that._CreateFolderNodes();
        },

        _FoldersTreeView_SelectedNodeChanged: function (e) {
            var that = this;

            var item = e.SelectedNodeDataItem;
            if (item.id != null)
                that._CreateGridView(item.id);
        },

        _CreateGridView: function (nodeId) {
            var that = this;

            var workflowStageId = $.grep(that._WorkflowStages, function (o) { return o.index == nodeId; });
            var workflowFormsName = $.grep(that._WorkflowFormsName, function (o) { return o.index == nodeId; });

            var filter = String.Format("WorkflowStage = '{0}'", workflowStageId[0].ID);

            var datalist = that._DataListControlPanel.FindControl("DataList");
            if (datalist != null)
                datalist.Destroy();

            var datalistFullName = that._GetDataListName(workflowFormsName[0].FormName)
            var dataListControl = afw.uiApi.CreateDataListControl(datalistFullName, {
                ParentControl: that._DataListControlPanel,
                Name: datalistFullName,
                Visible: true,
                FillParent: true,
                BaseFilterExpression: filter,
                Mode: that._GetDataListModeByDataListName(datalistFullName)
            });
            //that._ProceedingDataList.SetColumnVisible("TName", false);
            //that._ProceedingDataList.SetColumnVisible("ReceptionID", false);
            //that._ProceedingDataList.SetColumnVisible("Text", false);
            dataListControl._VDockPanel.RemovePane(0);
            dataListControl.bind("EntityWindowClosed", function (e) { that._DataListControl_EntityWindowClosed(e); });
        },

        _GetDataListModeByDataListName: function (dataListName) {
            var that = this;

            if (dataListName.Contains("SalesInvoice"))
                return "SalesInvoice";

            if (dataListName.Contains("SalesProformaInvoice"))
                return "SalesProformaInvoice";
        },

        _DataListControl_EntityWindowClosed: function (e) {
            var that = this;

            that._CreateFolderNodes();
        },

        _GetDataListName: function (workflowFormName) {
            var that = this;

            switch (workflowFormName) {
                case "SalesProformaInvoice": {
                    return "ps.SalesProformaInvoices";
                    break;
                }
                case "SalesInvoice": {
                    return "ps.SalesInvoices";
                    break;
                }
                case "Leads": {
                    return "crm.Leads";
                    break;
                }
            }
        },

        _CreateFolderNodes: function () {
            var that = this;

            var treeView = that._FoldersTreeViewPanel.FindControl("FolderTreeView");
            if (treeView != null)
                treeView.Destroy();

            that._FoldersTreeView = new afw.TreeView({
                ParentControl: that._FoldersTreeViewPanel,
                Name: "FolderTreeView",
                FillParent: true,
                BackColor: "#FFFFFF"
            });

            var userOrganizationalPosition = afw.App.Session.GetFieldValue("SystemUser_Entity").GetFieldValue("OrganizationalPosition");
            if (userOrganizationalPosition == null)
                return;

            var orgPostions = afw.uiApi.FetchEntityList("cmn.WorkflowStageOrgPostion", String.Format("OrgPostion = '{0}'", userOrganizationalPosition));

            var workflowDefs = that._GetWorkflowDefs(orgPostions);

            if (workflowDefs.length > 0) {
                for (var index = 0; index < workflowDefs.length; index++) {
                    var workflowDef = workflowDefs[index].GetEntity();

                    var workflowForm = cmn._GetWorkflowFormByID(workflowDef.GetFieldValue("WorkflowForm"));

                    var workflowStages = that._GetCurrentUserWorkflowStagesTitles(orgPostions, workflowDef.GetFieldValue("ID"));

                    for (stageIndex = 0; stageIndex < workflowStages.length; stageIndex++) {
                        var workflowCount = that._GetWorkflowItemsCount(workflowForm.GetFieldValue("Name"), workflowStages[stageIndex].GetEntity().GetFieldValue("ID"));

                        var nodeText = that._GenerateFolderText(workflowForm.GetFieldValue("Title"), workflowStages[stageIndex].GetEntity().GetFieldValue("StageTitle"), workflowCount);

                        that._WorkflowFormsName.push({ index: workflowForm.GetFieldValue("Name") + stageIndex, FormName: workflowForm.GetFieldValue("Name") });
                        that._WorkflowStages.push({ index: workflowForm.GetFieldValue("Name") + stageIndex, ID: workflowStages[stageIndex].GetEntity().GetFieldValue("ID") });

                        that._FoldersTreeView.AppendNode({ id: workflowForm.GetFieldValue("Name") + stageIndex, text: nodeText });

                    }
                }
                that._FoldersTreeView.bind("SelectedNodeChanged", function (e) { that._FoldersTreeView_SelectedNodeChanged(e); });
            }
        },

        _GetCurrentUserWorkflowStagesTitles: function (orgPostions, workflowDefId) {
            var that = this;

            var workflowStagesArray = [];
            for (index = 0; index < orgPostions.Entities.length; index++) {
                if (orgPostions.Entities[index].GetFieldValue("WorkflowDef") == workflowDefId)
                    workflowStagesArray.push(orgPostions.Entities[index].GetFieldValue("WorkflowStage"));
            }

            var workflowStagesWorkflowDef = $.grep(cmn._GetWorkflowStagesEntityList().ToDataSourceData(), function (o) { return ValueIsIn(o.get("ID"), workflowStagesArray); });
            var workflowStages = $.grep(cmn._GetWorkflowStagesEntityList().ToDataSourceData(), function (o) { return ValueIsIn(o.get("ID"), workflowStagesArray); });
            return workflowStages;
        },

        _GenerateFolderText: function (workflowFormTitle, workflowStageTitle, workflowsCount) {
            var that = this;

            return workflowFormTitle + " ( " + workflowStageTitle + " ) " + " ( " + workflowsCount + " ) ";
        },

        _GetWorkflowDefs: function (orgPostions) {
            var that = this;

            var orgPostionsArray = [];
            for (index = 0; index < orgPostions.Entities.length; index++) {
                orgPostionsArray.push(orgPostions.Entities[index].GetFieldValue("WorkflowDef"));
            }

            //var allItemKinds = sacc.GetFinancialOpKindsEntityList("SystemDefined").ToDataSourceData();
            var workflowDefs = $.grep(cmn.GetWorkflowDefs().ToDataSourceData(), function (o) { return ValueIsIn(o.get("ID"), orgPostionsArray); });
            return workflowDefs;
        },

        _GetWorkflowFormsNameConnectedOrgPositions: function (workflowDefs) {
            var that = this;

            var workflowFormsNameArray = [];

            var workflowForms = $.grep(cmn.GetWorkflowDefs(), function (o) { return ValueIsIn(o.get("ID"), workflowDefs); });
            for (index = 0; index < workflowForms.Entities.length; index++) {
                workflowFormsNameArray.push(workflowForms.Entities[index].GetFieldValue("Title"));
            }
        },

        _GetFiterTotalSalesProformaInvoiceFilter: function (filter, workflowFormName) {
            var that = this;

            if (that._GetDataListName(workflowFormName) == "ps.SalesProformaInvoices")
                filter += " and IsLastEdition = 1";
            return filter;
        },

        _GetWorkflowItemsCount: function (workflowFormName, workflowStageId) {
            var that = this;

            var filter = String.Format("WorkflowStage = '{0}'", workflowStageId);

            filter = that._GetFiterTotalSalesProformaInvoiceFilter(filter, workflowFormName);

            var count = afw.DataListHelper.GetDataListEntityCount(that._GetDataListName(workflowFormName), null, null, filter);
            return count;
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "cmn.WorkflowDashboard";
    FormClass.BaseType = afw.BasePanel;


    cmn.WorkflowDashboard = FormClass;
})();
(function () {
    var Class = afw.BasePanel.extend({
        GetType: function () {
            return crm.SalesCasesPipelineViewControl;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var formObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            afw.uiApi.CreateControlByObjectData(that, formObjectData, false);

            that._PipelineBodyWrapperPanel = that.FindControl("PipelineBodyWrapperPanel");
            that._PipelineHeaderWrapperDockPanel = that.FindControl("PipelineHeaderWrapperDockPanel");
            that._PipelineHeaderDockPanel = null;

            var requestTypes = afw.uiApi.FetchEntityList("crm.SalesCaseRequestType").ToDataSourceData();
            var requestTypeDropDownList = that.FindControl("RequestTypeDropDownList");
            requestTypeDropDownList.SetItemsDataSource(requestTypes);

            if (requestTypes.length == 0)
                afw.ErrorDialog.Show("انواع درخواست فروش ثبت نشده اند.");
            else
                requestTypeDropDownList.SetValue(requestTypes[0].get("ID"));

            requestTypeDropDownList.bind("ValueChanged", function (e) { that.CreatePipeline(); });

            var users = afw.DataListHelper.FetchEntityListOfDataList("afw.SystemUsers").ToDataSourceData();
            users.splice(0, 0, { ID: "All", DisplayName: "همه" });
            var userDropDownList = that.FindControl("UserDropDownList");
            userDropDownList.SetItemsDataSource(users);
            userDropDownList.SetValue(users[0].ID);                       
            userDropDownList.bind("ValueChanged", function (e) { that.CreatePipeline(); });

            var activeStatuses = [{ ID: "Active", Title: "فعال" },
                { ID: "Inactive", Title: "غیر فعال" },
                { ID: "All", Title: "همه" }];
            var activeStatusDropDownList = that.FindControl("ActiveStatusDropDownList");
            activeStatusDropDownList.SetItemsDataSource(activeStatuses);
            activeStatusDropDownList.SetValue("Active");
            activeStatusDropDownList.bind("ValueChanged", function (e) { that.CreatePipeline(); });

            var campingLookupControl = that.FindControl("CampingLookupControl");
            campingLookupControl.bind("ValueChanged", function (e) { that.CreatePipeline(); });

            that.FindControl("RefreshButton").bind("Click", function (e) { that.CreatePipeline(); });
            that.FindControl("CreateNewSalesCaseButton").bind("Click", function (e) { that._CreateNewSalesCaseButton_Click(e); });

            that._ItemsHeight = 60;

            that.CreatePipeline();

            document.getElementById(that._PipelineBodyWrapperPanel._DomElementId).onscroll = function (e) { that._LoadViewableItems(); };

            $("#" + that.FindControl("WonButtonPanel")._DomElementId).kendoDropTarget({
                drop: function (e) { that._WonButtonPanel_drop(e); }
            });

            $("#" + that.FindControl("LostButtonPanel")._DomElementId).kendoDropTarget({
                drop: function (e) { that._LostButtonPanel_drop(e); }
            });

            $("#" + that.FindControl("DeleteButtonPanel")._DomElementId).kendoDropTarget({
                drop: function (e) { that._DeleteButtonPanel_drop(e); }
            });
        },

        CreatePipeline: function () {
            var that = this;

            var currentRequestType = that.FindControl("RequestTypeDropDownList").GetValue();
            var campingID = that.FindControl("CampingLookupControl").GetValue();

            if (currentRequestType == null)
                return;

            var userID = that.FindControl("UserDropDownList").GetValue();
            var activeStatus = that.FindControl("ActiveStatusDropDownList").GetValue();

            var salesCasesFilter = String.Format("Status = '{0}' and RequestType = '{1}'",
                afw.OptionSetHelper.GetOptionSetItemID("crm.SalesCaseStatuses.Open"), currentRequestType);

            if (campingID != null)
                salesCasesFilter += String.Format(" and SourceCampain = '{0}'", campingID);

            if (userID != "All")
                salesCasesFilter += String.Format(" and OwnerUser = '{0}'", userID);

            if (activeStatus == "Active")
                salesCasesFilter += " and IsActive = 1";
            if (activeStatus == "Inactive")
                salesCasesFilter += " and IsActive = 0";

            afw.uiApi.ShowProgress(that);
            afw.DataListHelper.AsyncFetchEntityListOfDataList("crm.SalesCases", null, null, salesCasesFilter, "LastActionTime desc", null, null, function (result) {
                afw.uiApi.HideProgress(that);
                if (result.HasError) {
                    afw.Application.HandleError(result.ErrorMessage);
                }
                else {
                    that._LoadedSalesCases = result.Value.Entities;

                    var currentRequestType = that.FindControl("RequestTypeDropDownList").GetValue();
                    var pipelineHeaderWrapperPanel = that.FindControl("PipelineHeaderWrapperPanel");
                    that._PipelineBodyWrapperPanel.SetPosition(0, 0);

                    if (pipelineHeaderWrapperPanel.HasChildControls) {
                        pipelineHeaderWrapperPanel.ChildControls[0].Destroy();
                        that._PipelineBodyWrapperPanel.ChildControls[0].Destroy();
                    }

                    that._Stages = afw.uiApi.FetchEntityList("crm.SalesCaseStage", String.Format("RequestType = '{0}'", currentRequestType), "StageNumber").Entities;

                    if (that._Stages.length == 0) {
                        afw.ErrorDialog.Show("مرحله های پرونده فروش تعریف نشده اند.");
                        return;
                    }

                    that._PipelineHeaderDockPanel =
                        new afw.DockPanel({
                            ParentControl: pipelineHeaderWrapperPanel,
                            Name: "PipelineHeaderDockPanel",
                            Orientation: afw.Constants.Horizontal,
                            PanesCount: that._Stages.length
                        });

                    that._PipelineBodyDockPanel =
                        new afw.DockPanel({
                            ParentControl: that._PipelineBodyWrapperPanel,
                            Name: "PipelineBodyDockPanel",
                            Orientation: afw.Constants.Horizontal,
                            PanesCount: that._Stages.length,
                            FillParent: false,
                            Width: 100,
                            Height: 12000,
                            Top: 0,
                            Left: 0
                        });

                    that._PipelineBodyWrapperPanel.bind("Resize", function (e) {
                        that._AdjustControls();
                    });

                    that._PipelineBodyWrapperPanel.AdjustScrollBars();
                    that._AdjustControls();

                    var stageColumnHeaderData = JSON.parse('{"TypeName":"afw.DockPanel","Name":"DockPanel1","ChildControls":null,"Width":300,"Height":62,"Left":0,"Top":0,"RightToLeft":null,"FillParent":false,"Padding":0,"BackColor":null,"Orientation":"Horizontal","PanesCount":2,"PanesSettings":[{"Size":"fill"},{"Size":"15"}],"Panes":[{"TypeName":"afw.DockPanelPane","Name":"Pane1","ChildControls":[{"TypeName":"afw.DockPanel","Name":"DockPanel1","ChildControls":null,"Width":283,"Height":60,"Left":1,"Top":1,"RightToLeft":null,"FillParent":true,"Padding":0,"BackColor":null,"Orientation":"Vertical","PanesCount":4,"PanesSettings":[{"Size":"10"},{"Size":"21"},{"Size":"20"},{"Size":"fill"}],"Panes":[{"TypeName":"afw.DockPanelPane","Name":"Pane1","ChildControls":null,"Width":283,"Height":10,"Left":0,"Top":0,"RightToLeft":null,"FillParent":false,"Padding":1,"BackColor":null,"PaneIndex":0},{"TypeName":"afw.DockPanelPane","Name":"Pane2","ChildControls":[{"TypeName":"afw.Label","Name":"StageTitleLabel","ChildControls":null,"Width":281,"Height":19,"Left":0,"Top":0,"RightToLeft":null,"FillParent":false,"Padding":0,"TextColor":null,"BackColor":null,"Text":"[StageTitle]","FontBold":true}],"Width":283,"Height":21,"Left":0,"Top":10,"RightToLeft":null,"FillParent":false,"Padding":1,"BackColor":null,"PaneIndex":1},{"TypeName":"afw.DockPanelPane","Name":"Pane3","ChildControls":[{"TypeName":"afw.Label","Name":"SummaryLabel","ChildControls":null,"Width":281,"Height":18,"Left":0,"Top":0,"RightToLeft":null,"FillParent":false,"Padding":0,"TextColor":"#808080","BackColor":null,"Text":"-","FontSize":12,"FontBold":false}],"Width":283,"Height":20,"Left":0,"Top":31,"RightToLeft":null,"FillParent":false,"Padding":1,"BackColor":null,"PaneIndex":2},{"TypeName":"afw.DockPanelPane","Name":"Pane4","ChildControls":null,"Width":283,"Height":9,"Left":0,"Top":51,"RightToLeft":null,"FillParent":false,"Padding":1,"BackColor":null,"PaneIndex":3}]}],"Width":285,"Height":62,"Left":15,"Top":0,"RightToLeft":null,"FillParent":false,"Padding":1,"BackColor":null,"PaneIndex":0},{"TypeName":"afw.DockPanelPane","Name":"Pane2","ChildControls":[{"TypeName":"afw.Panel","Name":"Panel1","ChildControls":null,"Width":13,"Height":60,"Left":1,"Top":1,"RightToLeft":null,"FillParent":false,"Padding":0,"BackColor":null,"BorderColor":"#808080","BorderWidth":0,"BackgroundImage":"resource(crm.RtlSalesCaseStageArrow)","AutoScroll":false}],"Width":15,"Height":62,"Left":0,"Top":0,"RightToLeft":null,"FillParent":false,"Padding":1,"BackColor":null,"PaneIndex":1}]}');
                    var totalEstimatedRevenue = 0;
                    for (var stageIndex = 0; stageIndex < that._Stages.length; stageIndex++) {
                        var stageColumnHeader = afw.uiApi.CreateControlByObjectData(that._PipelineHeaderDockPanel.Panes[stageIndex], stageColumnHeaderData);
                        var stageColumnHeaderElement = document.getElementById(stageColumnHeader._DomElementId);
                        that._SetDomElementStyle(stageColumnHeaderElement, "border-color", "#cccccc");
                        that._SetDomElementStyle(stageColumnHeaderElement, "border-width", "1px");
                        that._SetDomElementStyle(stageColumnHeaderElement, "background", "linear-gradient(#fff, #f3f5f6)");
                        stageColumnHeader.FindControl("StageTitleLabel").SetText(that._Stages[stageIndex].GetFieldValue("Title"));

                        var stageColumnDockPanel =
                            new afw.DockPanel({
                                ParentControl: that._PipelineBodyDockPanel.Panes[stageIndex],
                                Name: "StageColumnDockPanel" + stageIndex,
                                Orientation: afw.Constants.Vertical,
                                PanesCount: 1
                            });
                        var stageColumnDockPanelElement = document.getElementById(stageColumnDockPanel._DomElementId);
                        that._SetDomElementStyle(stageColumnDockPanelElement, "border-color", "#cccccc");
                        that._SetDomElementStyle(stageColumnDockPanelElement, "border-width", "1px");

                        $("#" + stageColumnDockPanel._DomElementId).kendoDropTarget({
                            drop: function (e) { that._StageColumnDockPanel_drop(e); }
                        });

                        var salesCasesInCurrentStage = $.grep(that._LoadedSalesCases, function (o) { return o.GetFieldValue("SalesCaseStage") == that._Stages[stageIndex].GetFieldValue("ID"); });
                        for (var salesCaseIndex = 0; salesCaseIndex < salesCasesInCurrentStage.length; salesCaseIndex++) {
                            that._CreateSalesCaseItemControl(salesCasesInCurrentStage[salesCaseIndex], stageColumnDockPanel, salesCaseIndex, false);
                        }

                        stageColumnDockPanel.AdjustPanes();
                    }
                   
                    that._RefreshSummaryFields();
                    that._LoadViewableItems();

                    setTimeout(function () {
                        that._PipelineHeaderDockPanel.SetFillParent(false);
                        that._PipelineHeaderDockPanel.SetWidth(1500);
                        that._PipelineHeaderDockPanel.SetFillParent(true);
                    }, 1000);
                }
            });
        },

        _AdjustControls: function () {
            var that = this;

            var pipelineBodyWrapperPanelElement = document.getElementById(that._PipelineBodyWrapperPanel._DomElementId);
            var scrollbarWidth = pipelineBodyWrapperPanelElement.offsetWidth - pipelineBodyWrapperPanelElement.clientWidth;
            
            if (scrollbarWidth == 0)
                scrollbarWidth = 1;

            that._PipelineHeaderWrapperDockPanel.SetPaneSizeSetting(1, scrollbarWidth);
            that._PipelineBodyDockPanel.SetWidth(that._PipelineBodyWrapperPanel.GetWidth() - scrollbarWidth);
        },

        _CreateSalesCaseItemControl: function (salesCase, columnDockPanel, paneIndex, adjustColumnDockPanel) {
            var that = this;

            if (ValueIsEmpty(adjustColumnDockPanel))
                adjustColumnDockPanel = true;

            var targetPaneIndex = paneIndex;
            if (!targetPaneIndex) {
                var firstEmptyPaneIndex = -1;
                for (var paneIndex2 = 0; paneIndex2 < columnDockPanel.Panes.length; paneIndex2++) {
                    if (!columnDockPanel.Panes[paneIndex2].HasChildControls) {
                        firstEmptyPaneIndex = paneIndex2;
                        break;
                    }
                }

                targetPaneIndex = firstEmptyPaneIndex;
            }

            if (targetPaneIndex == columnDockPanel.GetPanesCount() - 1) {
                columnDockPanel.InsertPane(targetPaneIndex, { Size: that._ItemsHeight }, adjustColumnDockPanel);
            }

            var itemControl = new crm.SalesCasesPipelineViewItemControl({
                ParentControl: columnDockPanel.Panes[targetPaneIndex],
                Name: "SalesCasesItemControl_" + salesCase.GetFieldValue("ID"),
                SalesCase: salesCase,
                PipelineViewControl: that
            });

            return itemControl;
        },

        _LoadViewableItems: function () {
            var that = this;

            var scrollPanelElement = document.getElementById(that._PipelineBodyWrapperPanel._DomElementId);
            var scrollPosition = scrollPanelElement.scrollTop;

            var firstViewableRowIndex = 0;
            var lastViewableRowIndex = 0;

            if (scrollPosition != 0) {
                firstViewableRowIndex = Math.round(scrollPosition / that._ItemsHeight);

                if (firstViewableRowIndex > 0)
                    firstViewableRowIndex--;
            }

            lastViewableRowIndex = firstViewableRowIndex
                + Math.round(that._PipelineBodyWrapperPanel.GetHeight() / that._ItemsHeight)
                + 1;

            for (var stageIndex = 0; stageIndex < that._Stages.length; stageIndex++) {
                var stageColumnDockPanel = that._PipelineBodyWrapperPanel.FindControl("StageColumnDockPanel" + stageIndex);

                for (var rowIndex = firstViewableRowIndex; rowIndex <= lastViewableRowIndex; rowIndex++) {
                    if (rowIndex >= stageColumnDockPanel.GetPanesCount() - 1)//last pane is filler
                        break;

                    if (!stageColumnDockPanel.Panes[rowIndex].HasChildControls)
                        break;

                    if (stageColumnDockPanel.Panes[rowIndex].ChildControls[0].GetIsLoaded() == false)
                        stageColumnDockPanel.Panes[rowIndex].ChildControls[0].Load();
                }
            }
        },

        _RefreshSummaryFields: function () {
            var that = this;

            var totalEstimatedRevenue = 0;
            var stageEstimatedRevenue = 0;
            var totalSalesCasesCount = 0;
            var stageSalesCasesCount = 0;

            var stageColumnHeader = null;
            var stageColumnDockPanel = null;
            var salesCaseControl = null;

            for (var col = 0; col < that._PipelineBodyDockPanel.Panes.length; col++)
            {
                stageSalesCasesCount = 0;
                stageEstimatedRevenue = 0;
                stageColumnDockPanel = that._PipelineBodyDockPanel.Panes[col].ChildControls[0];

                for (var cellIndex = 0; cellIndex < stageColumnDockPanel.Panes.length; cellIndex++) {
                    if (stageColumnDockPanel.Panes[cellIndex].HasChildControls) {
                        salesCaseControl = stageColumnDockPanel.Panes[cellIndex].ChildControls[0];
                        stageSalesCasesCount++;
                        stageEstimatedRevenue += salesCaseControl.GetSalesCase().GetFieldValue("EstimatedRevenue");
                    }
                }
               
                var stageColumnHeader = that._PipelineHeaderDockPanel.Panes[col].ChildControls[0];
                stageColumnHeader.FindControl("SummaryLabel").SetText(
                    String.Format("{0} پرونده، {1} ریال",
                    FormatNumber(stageSalesCasesCount), FormatNumber(stageEstimatedRevenue)));

                totalSalesCasesCount += stageSalesCasesCount;
                totalEstimatedRevenue += stageEstimatedRevenue;
            }

            that.FindControl("TopBarSummaryLabel").SetText(String.Format("{0} پرونده، {1} ریال",
                FormatNumber(totalSalesCasesCount), FormatNumber(totalEstimatedRevenue)));
        },

        _StageColumnDockPanel_drop: function (e) {
            var that = this;

            var dropedObjectId = e.draggable.element[0].id;
            var dropTargetObjectId = e.dropTarget[0].id;
            var dropedSalesCaseItemControl = afw.uiApi.GetControlById(dropedObjectId);
            var dropTargetColumnDockPanel = afw.uiApi.GetControlById(dropTargetObjectId);
            var dropSourceColumnDockPanel = dropedSalesCaseItemControl.ParentControl.ParentControl;

            if (dropTargetColumnDockPanel == dropSourceColumnDockPanel)
                return;

            var salesCase = dropedSalesCaseItemControl.GetSalesCase();
            var targetStageID = that._Stages[dropTargetColumnDockPanel.ParentControl.GetPaneIndex()].GetFieldValue("ID");

            try {
                afw.uiApi.CallServerMethodSync("crm.SetSalesCaseStage", [salesCase.GetFieldValue("ID"), targetStageID]);
            }
            catch (ex) {
                afw.Application.HandleError(ex);
                return;
            }

            that._RemoveSalesCaseItem(dropedSalesCaseItemControl);

            salesCase.SetFieldValue("DaysRemainedInCurrentStage", 0);
            var itemControl = that._CreateSalesCaseItemControl(salesCase, dropTargetColumnDockPanel, null, true);
            itemControl.Load();

            that._RefreshSummaryFields();
        },

        _RemoveSalesCaseItem: function (salesCaseItemControl) {
            var that = this;

            var salesCaseItemPaneIndex = salesCaseItemControl.ParentControl.GetPaneIndex();
            var salesCaseColumnDockPanel = salesCaseItemControl.ParentControl.ParentControl;

            salesCaseItemControl.Destroy();

            //shift next panes up:
            var shiftingSalesCase = null;

            for (var paneIndex = salesCaseItemPaneIndex + 1; paneIndex < salesCaseColumnDockPanel.Panes.length - 1; paneIndex++) {
                if (salesCaseColumnDockPanel.Panes[paneIndex].HasChildControls) {
                    shiftingSalesCase = salesCaseColumnDockPanel.Panes[paneIndex].ChildControls[0].GetSalesCase();
                    salesCaseColumnDockPanel.Panes[paneIndex].ChildControls[0].Destroy();
                    var itemControl = that._CreateSalesCaseItemControl(shiftingSalesCase, salesCaseColumnDockPanel, paneIndex - 1, false);
                    itemControl.Load();
                }
            }

            salesCaseColumnDockPanel.AdjustPanes();
        },

        _WonButtonPanel_drop: function (e) {
            var that = this;

            var dropedObjectId = e.draggable.element[0].id;
            var dropedSalesCaseItemControl = afw.uiApi.GetControlById(dropedObjectId);

            try {
                var salesCaseStatus_WonID = afw.OptionSetHelper.GetOptionSetItemID("crm.SalesCaseStatuses.Won");
                var salesCase = afw.uiApi.FetchEntityByID("crm.SalesCase", dropedSalesCaseItemControl.GetSalesCase().GetFieldValue("ID"));
                salesCase.SetFieldValue("Status", salesCaseStatus_WonID);
                afw.uiApi.UpdateEntity(salesCase);
                that._RemoveSalesCaseItem(dropedSalesCaseItemControl);
                that._RefreshSummaryFields();
            }
            catch (ex) {
                afw.Application.HandleError(ex);
                return;
            }            
        },

        _LostButtonPanel_drop: function (e) {
            var that = this;

            var dropedObjectId = e.draggable.element[0].id;
            var dropedSalesCaseItemControl = afw.uiApi.GetControlById(dropedObjectId);

            try {
                var salesCaseID = dropedSalesCaseItemControl.GetSalesCase().GetFieldValue("ID");
                var salesCaseLoseWindow = crm.ShowSalesCaseLoseInfoDialog(salesCaseID);
                salesCaseLoseWindow.bind("Close", function (e) {
                    if (e.Sender._DialogResult == "Ok") {
                        that._RemoveSalesCaseItem(dropedSalesCaseItemControl);
                        that._RefreshSummaryFields();
                    }
                });                
            }
            catch (ex) {
                afw.Application.HandleError(ex);
                return;
            }
        },

        _DeleteButtonPanel_drop: function (e) {
            var that = this;

            var dropedObjectId = e.draggable.element[0].id;
            var dropedSalesCaseItemControl = afw.uiApi.GetControlById(dropedObjectId);
            that._DeletingSalesCaseItemControl = dropedSalesCaseItemControl;

            try {
                var confirmDialog = afw.ConfirmDialog.Show("آیا با حذف موافقید؟");
                confirmDialog.bind("Close", function () {
                    if (confirmDialog.GetDialogResult() == "Yes") {
                        var salesCase = afw.uiApi.FetchEntityByID("crm.SalesCase", that._DeletingSalesCaseItemControl.GetSalesCase().GetFieldValue("ID"));
                        afw.uiApi.DeleteEntity(salesCase);
                        that._RemoveSalesCaseItem(that._DeletingSalesCaseItemControl);
                        that._RefreshSummaryFields();
                    }
                });
            }
            catch (ex) {
                afw.Application.HandleError(ex);
                return;
            }
        },

        _CreateNewSalesCaseButton_Click: function (e) {
            var that = this;

            var entity = afw.uiApi.CreateNewEntity("crm.SalesCase");

            var entityWindow = afw.EntityHelper.ShowEntityWindow(entity, "crm.SalesCaseEditForm", "New");
            if (entityWindow != null) {
                entityWindow.bind("Close", function () {
                    if (entityWindow.GetDialogResult() == "Ok") {
                        that.CreatePipeline();
                    }
                });
            }
        },

        ShowBottomBar: function () {
            var that = this;

            var mainWrapperDockPanel = that.FindControl("MainWrapperDockPanel");
            mainWrapperDockPanel.SetPaneSizeSetting(7, 50);
        },

        HideBottomBar: function () {
            var that = this;

            var mainWrapperDockPanel = that.FindControl("MainWrapperDockPanel");
            mainWrapperDockPanel.SetPaneSizeSetting(7, 1);
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);

        }
    });

    //Static Members:

    Class.TypeName = "crm.SalesCasesPipelineViewControl";
    Class.BaseType = afw.BasePanel;


    crm.SalesCasesPipelineViewControl = Class;
})();
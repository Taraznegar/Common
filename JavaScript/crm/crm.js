(function () {
    window.crm = {
        Init: function () {
            var that = this;

            that._UserWarningPopupItemsCount = 0;

            var appTopBar = afw.App.AppContainer.FindControl("AppTopBar");
            appTopBar.bind("SubsystemChanged", function (e) {
                if (appTopBar.GetActiveSubsystemName() == "crm") {
                    warningsMenuItem = appTopBar.FindControl("WarningsMenuItem");

                    if (warningsMenuItem == null) {
                        var appTopBarDockPanel = appTopBar.FindControl("AppTopBarDockPanel");
                        appTopBarDockPanel.SetPaneSizeSetting(5, 55);

                        warningsMenuItem = new crm.WarningsMenuItem({
                            ParentControl: appTopBarDockPanel.Panes[5],
                            Name: "WarningsMenuItem"
                        });
                    }

                    warningsMenuItem.SetWarningItemsCount(that._UserWarningPopupItemsCount);

                    that.ShowSalesDashboard();
                }
            });

            afw.App.bind("OneMinuteClientSyncResultReceived", function (e) { that._OneMinuteClientSyncResultReceived(e); });

            //Preload to speedup SalesCaseEditForm first opening:
            afw.EntityDefHelper.AsyncLoadEntityDef("crm.SalesCase");
            afw.EntityDefHelper.AsyncLoadEntityDef("cmn.Person");
            afw.FormHelper.AsyncLoadForm("crm.SalesCaseEditForm");
            afw.DataListHelper.AsyncLoadDataList("afw.SystemUsers");
            afw.EntityDefHelper.AsyncLoadEntityDef("afw.DataListFieldDef");
            afw.EntityDefHelper.AsyncLoadEntityDef("crm.SalesCaseLoseInfo");

            afw.DataListHelper.AsyncLoadDataList("crm.SalesCaseRequestTypes");
            afw.DataListHelper.AsyncLoadDataList("cmn.Persons");
            afw.DataListHelper.AsyncLoadDataList("crm.SalesCaseSources");
            afw.DataListHelper.AsyncLoadDataList("crm.SalesCaseStages");
            afw.DataListHelper.AsyncLoadDataList("crm.SalesCaseHistory");
            afw.DataListHelper.AsyncLoadDataList("cmn.Activities");
            afw.DataListHelper.AsyncLoadDataList("crm.SalesCaseNotes");
            afw.DataListHelper.AsyncLoadDataList("crm.SalesCaseAttachedFiles");
            afw.DataListHelper.AsyncLoadDataList("crm.SalesCaseConnectedPersons");
        },

        _OneMinuteClientSyncResultReceived: function (e) {
            var that = this;

            var syncResultEntity = e.SyncResultEntity;

            try {
                var appTopBar = afw.App.AppContainer.FindControl("AppTopBar");

                that._UserWarningPopupItemsCount = syncResultEntity.GetFieldValue("crm_UserWarningPopupItemsCount");               
                
                if (appTopBar.GetActiveSubsystemName() == "crm" && appTopBar.FindControl("WarningsMenuItem") != null) {
                    appTopBar.FindControl("WarningsMenuItem").SetWarningItemsCount(that._UserWarningPopupItemsCount);
                }
            }
            catch (ex) {
                afw.App.AddStatusError(ex);
            }
        },

        ShowSalesCasesPipeline: function () {
            afw.uiApi.OpenSavedFormInMdiContainer("crm.SalesCasesPipelineViewControl", "روند پرونده های فروش");
        },

        ShowSalesDashboard: function () {
            afw.uiApi.OpenSavedFormInMdiContainer("crm.SalesDashboard", "داشبورد فروش");
        },

        QualifyLead: function (lead) {
            var that = this;

            var leadID = null;
            var currentQualifictionStatus = null;

            if ("QualificationStatus" in lead) {//lead is DataItem
                leadID = lead.ID;
                currentQualifictionStatus = lead.QualificationStatus;
            }
            else if ("FieldValues" in lead) { //lead is Entity
                leadID = lead.GetFieldValue("ID");
                currentQualifictionStatus = lead.GetFieldValue("QualificationStatus");
            }
            else {
                throw "Invalid value for parameter lead.";
            }

            if (currentQualifictionStatus == afw.OptionSetHelper.GetOptionSetItemID("crm.LeadQualificationStatus.Qualified")) {
                throw "این سرنخ تجاری قبلا تایید شده است.";
            }
            else {
                afw.uiApi.CallServerMethodSync("crm.QualifyLead", [leadID]);
            }

        },

        DisqualifyLead: function (lead, callback) {
            var that = this;

            var leadID = null;
            var currentQualifictionStatus = null;

            if ("QualificationStatus" in lead) {//lead is DataItem
                leadID = lead.ID;
                currentQualifictionStatus = lead.QualificationStatus;
            }
            else if ("FieldValues" in lead) { //lead is Entity
                leadID = lead.GetFieldValue("ID");
                currentQualifictionStatus = lead.GetFieldValue("QualificationStatus");
            }
            else {
                throw "Invalid value for parameter lead.";
            }

            if (currentQualifictionStatus == afw.OptionSetHelper.GetOptionSetItemID("crm.LeadQualificationStatus.Disqualified"))
                throw "این سرنخ تجاری قبلا رد شده است.";
            else if (currentQualifictionStatus == afw.OptionSetHelper.GetOptionSetItemID("crm.LeadQualificationStatus.Qualified"))
                throw "این سرنخ تجاری قبلا تایید شده است.";

            var leadDisqualifyInfo = afw.uiApi.CreateNewEntity("crm.LeadDisqualifyInfo");
            leadDisqualifyInfo.SetFieldValue("Lead", leadID);

            var disqualifyWindow = afw.uiApi.OpenSavedFormWindow("crm.LeadDisqualifyInfoEditForm", {
                Name: "LeadDisqualifyInfoEditForm",
                Modal: true,
                FormMode: "New",
                Title: "رد سرنخ تجاری",
                Entity: leadDisqualifyInfo
            });

            disqualifyWindow.bind("Close",
                function (e) {
                    if (e.Sender.GetDialogResult() == "Ok") {
                        if (!ValueIsEmpty(callback))
                            callback(true);
                    }
                });
        },

        ShowSalesCaseLoseInfoDialog: function (salesCaseID) {
            var formMode = null;
            var loseInfoEntity = afw.uiApi.FetchEntity("crm.SalesCaseLoseInfo", String.Format("SalesCase = '{0}'", salesCaseID));

            if (loseInfoEntity != null) {
                loseInfoEntity.ChangeStatus = "Modify";
                formMode = "Edit";
            }
            else {
                loseInfoEntity = afw.uiApi.CreateNewEntity("crm.SalesCaseLoseInfo");
                loseInfoEntity.SetFieldValue("SalesCase", salesCaseID);
                formMode = "New";
            }

            var salesCaseLoseWindow = afw.uiApi.OpenSavedFormWindow("crm.SalesCaseLoseInfoEditForm", { Name: "SalesCaseLoseInfoEditFormWindow", Modal: true, Title: "بستن پرونده بعنوان بازنده", FormMode: formMode, Entity: loseInfoEntity });

            return salesCaseLoseWindow;
        }
    }
})();
(function () {
    var typeName = "crm.SalesCasesFilterControl";
    var baseType = afw.BasePanel;
    var events = baseType.Events.concat(["FilterChanged"]);

    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return crm.SalesCasesFilterControl;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._IsInSettingFilter = false;

            var mainFilterItems = [
                { ID: "All", Title: "همه" },
                { ID: "Open", Title: "باز" },
                { ID: "Raked", Title: "راکد" },
                { ID: "Moavagh", Title: "معوقه" },
                { ID: "Won", Title: "برنده" },
                { ID: "Lost", Title: "بازنده" }];
            var mainFilterDropDownList = that.FindControl("MainFilterDropDownList");
            mainFilterDropDownList.SetItemsDataSource(mainFilterItems);
            mainFilterDropDownList.SetValue(mainFilterItems[1].ID);
            mainFilterDropDownList.bind("ValueChanged", function (e) { that._OnFilterChanged(); });

            var requestTypes = afw.uiApi.FetchEntityList("crm.SalesCaseRequestType").ToDataSourceData();
            var requestTypeDropDownList = that.FindControl("RequestTypeDropDownList");
            requestTypeDropDownList.SetItemsDataSource(requestTypes);
            //requestTypeDropDownList.SetValue(requestTypes[0].get("ID"));
            requestTypeDropDownList.bind("ValueChanged", function (e) { that._OnFilterChanged(); });

            var users = afw.DataListHelper.FetchEntityListOfDataList("afw.SystemUsers").ToDataSourceData();
            users.splice(0, 0, { ID: "All", DisplayName: "همه" });
            var userDropDownList = that.FindControl("UserDropDownList");
            userDropDownList.SetItemsDataSource(users);
            userDropDownList.SetValue(users[0].ID);
            userDropDownList.bind("ValueChanged", function (e) { that._OnFilterChanged(); });

            var activeStatuses = [
                { ID: "Active", Title: "فعال" },
                { ID: "Inactive", Title: "غیر فعال" },
                { ID: "All", Title: "همه" }];
            var activeStatusDropDownList = that.FindControl("ActiveStatusDropDownList");
            activeStatusDropDownList.SetItemsDataSource(activeStatuses);
            activeStatusDropDownList.SetValue("Active");
            activeStatusDropDownList.bind("ValueChanged", function (e) { that._OnFilterChanged(); });

            //var campains = afw.DataListHelper.FetchEntityListOfDataList("crm.AdvertisingCampaigns").ToDataSourceData();
            //campains.splice(0, 0, { ID: "All", DisplayName: "همه" });   
            var campainLookupControl = that.FindControl("CampainLookupControl");
            //var campainAutoComplete = campainLookupControl.GetAutoComplete();
            //campainAutoComplete.SetItemsDataSource(campains);
            //campainAutoComplete.SetValue(campains[0].ID);
            campainLookupControl.bind("ValueChanged", function (e) { that._OnFilterChanged(); });

        },

        SetFilters: function (filterNameValues) {
            var that = this;

            that._IsInSettingFilter = true;
            try {
                if ("MainFilter" in filterNameValues) {
                    var mainFilterDropDownList = that.FindControl("MainFilterDropDownList");
                    mainFilterDropDownList.SetValue(filterNameValues.MainFilter);
                }

                if ("RequestType" in filterNameValues) {
                    var requestTypeDropDownList = that.FindControl("RequestTypeDropDownList");
                    requestTypeDropDownList.SetValue(filterNameValues.RequestType);
                }

                if ("User" in filterNameValues) {
                    var userDropDownList = that.FindControl("UserDropDownList");
                    userDropDownList.SetValue(filterNameValues.User);
                }

                if ("ActiveStatus" in filterNameValues) {
                    var activeStatusDropDownList = that.FindControl("ActiveStatusDropDownList");
                    activeStatusDropDownList.SetValue(filterNameValues.ActiveStatus);
                }
            }
            finally {
                that._IsInSettingFilter = false;
            }

            that._OnFilterChanged();
        },

        _OnFilterChanged: function () {
            var that = this;

            if (that._IsInSettingFilter)
                return;

            that._IsInSettingFilter = true;

            try {
                var mainFilter = that.FindControl("MainFilterDropDownList").GetValue();
                if (mainFilter == "Open") {
                    //that.FindControl("ActiveStatusLabel").SetVisible(true);
                    that.FindControl("ActiveStatusDropDownList").SetReadOnly(false);
                }
                else {
                    //that.FindControl("ActiveStatusLabel").SetVisible(false);
                    that.FindControl("ActiveStatusDropDownList").SetReadOnly(true);
                    that.FindControl("ActiveStatusDropDownList").SetValue(null);
                }

                if (that._events != null)
                    that.trigger("FilterChanged", { Sender: that });
            }
            finally {
                that._IsInSettingFilter = false;
            }
        },

        GetFilterExpression: function () {
            var that = this;

            var filterExpression = "";

            var mainFilter = that.FindControl("MainFilterDropDownList").GetValue();
            if (mainFilter == "Open")
                filterExpression = String.Format("Status = '{0}'", 
                    afw.OptionSetHelper.GetOptionSetItemID("crm.SalesCaseStatuses.Open"));
            else if (mainFilter == "Raked")
                filterExpression = String.Format("Status = '{0}' and IsActive = 1 and IsStagnant = 1",
                    afw.OptionSetHelper.GetOptionSetItemID("crm.SalesCaseStatuses.Open"));
            else if (mainFilter == "Moavagh")
                filterExpression = String.Format("Status = '{0}' and IsActive = 1 and DaysRemainedInCurrentStage > CurrentStageAllowedDays",
                    afw.OptionSetHelper.GetOptionSetItemID("crm.SalesCaseStatuses.Open"));
            if (mainFilter == "Won")
                filterExpression = String.Format("Status = '{0}'",
                    afw.OptionSetHelper.GetOptionSetItemID("crm.SalesCaseStatuses.Won"));
            if (mainFilter == "Lost")
                filterExpression = String.Format("Status = '{0}'",
                    afw.OptionSetHelper.GetOptionSetItemID("crm.SalesCaseStatuses.Lost"));

            var requestType = that.FindControl("RequestTypeDropDownList").GetValue();
            if (requestType != null) {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";
                filterExpression += String.Format("RequestType = '{0}'", requestType);
            }

            var userID = that.FindControl("UserDropDownList").GetValue();
            if (userID != null && userID != "All") {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";
                filterExpression += String.Format("OwnerUser = '{0}'", userID);
            }

            
            var campaingId = that.FindControl("CampainLookupControl").GetValue();
            if (campaingId != null) {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";
                filterExpression += String.Format("SourceCampain = '{0}'", campaingId);
            }

            var activeStatus = that.FindControl("ActiveStatusDropDownList").GetValue();
            if (activeStatus != null && activeStatus != "All") {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";

                if (activeStatus == "Active")
                    filterExpression += "IsActive = 1";
                if (activeStatus == "Inactive")
                    filterExpression += "IsActive = 0";
            }

            return filterExpression;
        }
    });

    //Static Members:

    FormClass.TypeName = typeName;
    FormClass.BaseType = baseType;
    FormClass.Events = events;


    crm.SalesCasesFilterControl = FormClass;
})();
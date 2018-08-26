(function () {
    var typeName = "crm.LeadsFilterControl";
    var baseType = afw.BasePanel;
    var events = baseType.Events.concat(["FilterChanged"]);


    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return crm.LeadsFilterControl;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (designObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._IsInSettingFilter = false;

            var advertisingCampaigns = afw.uiApi.FetchEntityList("crm.AdvertisingCampaign").ToDataSourceData();
            that._AdvertisingCampaignDropDownList = that.FindControl("AdvertisingCampaignDropDownList");
            that._AdvertisingCampaignDropDownList.SetItemsDataSource(advertisingCampaigns);
            that._AdvertisingCampaignDropDownList.bind("ValueChanged", function (e) { that._OnFilterChanged(); });

            var responses = afw.DataListHelper.FetchEntityListOfDataList("afw.SystemUsers").ToDataSourceData();
            responses.splice(0, 0, { ID: "All", DisplayName: "همه" });
            that._ResponseDropDownList = that.FindControl("ResponseDropDownList");
            that._ResponseDropDownList.SetItemsDataSource(responses);
            that._ResponseDropDownList.SetValue(responses[0].ID);
            that._ResponseDropDownList.bind("ValueChanged", function (e) { that._OnFilterChanged(); });

            var negotiators = afw.DataListHelper.FetchEntityListOfDataList("afw.SystemUsers").ToDataSourceData();
            negotiators.splice(0, 0, { ID: "All", DisplayName: "همه" });
            that._NegotiatorDropDownList = that.FindControl("NegotiatorDropDownList");
            that._NegotiatorDropDownList.SetItemsDataSource(negotiators);
            that._NegotiatorDropDownList.SetValue(negotiators[0].ID);
            that._NegotiatorDropDownList.bind("ValueChanged", function (e) { that._OnFilterChanged(); });

            var custromerBussinseFields = afw.DataListHelper.FetchEntityListOfDataList("cmn.CustomerBussinseFields").ToDataSourceData();
            that._CustomerBussinseDropDownList = that.FindControl("CustomerBussinseDropDownList");
            that._CustomerBussinseDropDownList.SetItemsDataSource(custromerBussinseFields);
            that._CustomerBussinseDropDownList.bind("ValueChanged", function (e) { that._OnFilterChanged(); });

            var personRanks = afw.DataListHelper.FetchEntityListOfDataList("cmn.PersonRanks").ToDataSourceData();
            that._PersonRankDropDownList = that.FindControl("PersonRankDropDownList");
            that._PersonRankDropDownList.SetItemsDataSource(personRanks);
            that._PersonRankDropDownList.bind("ValueChanged", function (e) { that._OnFilterChanged(); });

            that._EducationOptionSetControl = that.FindControl("EducationOptionSetControl");
            that._EducationOptionSetControl.bind("ValueChanged", function (e) { that._OnFilterChanged(); });

            var cities = afw.DataListHelper.FetchEntityListOfDataList("cmn.Cities").ToDataSourceData();
            that._CityDropDownList = that.FindControl("CityDropDownList");
            that._CityDropDownList.SetItemsDataSource(cities);
            that._CityDropDownList.bind("ValueChanged", function (e) { that._OnFilterChanged(); });

            var states = afw.DataListHelper.FetchEntityListOfDataList("cmn.States").ToDataSourceData();
            that._StateDropDownList = that.FindControl("StateDropDownList");
            that._StateDropDownList.SetItemsDataSource(states);
            that._StateDropDownList.bind("ValueChanged", function (e) { that._OnFilterChanged(); });

            var notSetID = afw.OptionSetHelper.GetOptionSetItemID("crm.LeadQualificationStatus.NotSet")
            var qualifiedID = afw.OptionSetHelper.GetOptionSetItemID("crm.LeadQualificationStatus.Qualified")
            var disqualifiedID = afw.OptionSetHelper.GetOptionSetItemID("crm.LeadQualificationStatus.Disqualified")

            var qualificationStatuses = [
                        { ID: "All", Title: "همه" },
                        { ID: notSetID, Title: "نامشخص" },
                        { ID: qualifiedID, Title: "تایید شده" },
                        { ID: disqualifiedID, Title: "رد شده" },
                        ];
            that._QualificationStatusDropDownList = that.FindControl("ActiveStatusDropDownList");
            that._QualificationStatusDropDownList.SetItemsDataSource(qualificationStatuses);
            that._QualificationStatusDropDownList.SetValue("All");
            that._QualificationStatusDropDownList.bind("ValueChanged", function (e) { that._OnFilterChanged(); });

        },

        GetQualificationStatus:function(){
            var that = this;

            return that._QualificationStatusDropDownList.GetText();
        },


        GetNegotiatorName: function () {
            var that = this;

            return that._NegotiatorDropDownList.GetText();
        },

        GetResponseName: function () {
            var that = this;

            return that._ResponseDropDownList.GetText();
        },

        GetAdvertisingCampaignName: function () {
            var that = this;

            return  that._AdvertisingCampaignDropDownList.GetText();
        },

        GetStateName: function () {
            var that = this;

            return that._StateDropDownList.GetText();
        },

        GetCityName: function () {
            var that = this;

            return that._CityDropDownList.GetText();
        },

        GetEducationLevel: function () {
            var that = this;

            return that._EducationOptionSetControl._DropDownList.GetText();
        },

        GetCustomerBussinseFieldName: function () {
            var that = this;

            return that._CustomerBussinseDropDownList.GetText();
        },

        GetPersonRank: function () {
            var that = this;

            return that._PersonRankDropDownList.GetText();
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

        GetFilterExpression: function () {
            var that = this;

            var filterExpression = "";

            var advertisingCampaign = that._AdvertisingCampaignDropDownList.GetValue();
            if (advertisingCampaign != null) {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";
                filterExpression += String.Format("AdvertisingCampaign = '{0}'", that._AdvertisingCampaignDropDownList.GetValue());
            }

            var responseID = that._ResponseDropDownList.GetValue();
            if (responseID != null && responseID != "All") {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";
                filterExpression += String.Format("OwnerUser = '{0}'", responseID);
            }

            var negotiatorID = that._NegotiatorDropDownList.GetValue();
            if (negotiatorID != null && negotiatorID != "All") {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";
                filterExpression += String.Format("OwnerUser = '{0}'", negotiatorID);
            }

            var qualificationStatus = that._QualificationStatusDropDownList.GetValue();
            if (qualificationStatus != null && qualificationStatus != "All") {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";
                filterExpression += String.Format("QualificationStatus = '{0}'", qualificationStatus);
            }

            var bussinseField = that._CustomerBussinseDropDownList.GetValue();
            if (bussinseField != null && bussinseField != "") {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";
                filterExpression += String.Format("CustomerBussinseField = '{0}'", bussinseField);
            }

            var personRank = that._PersonRankDropDownList.GetValue();
            if (personRank != null && personRank != "") {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";
                filterExpression += String.Format("PersonRank = '{0}'", personRank);
            }

            var cityId = that._CityDropDownList.GetValue();
            if (cityId != null && cityId != "") {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";
                filterExpression += String.Format("Shahr = '{0}'", cityId);
            }

            var stateId = that._StateDropDownList.GetValue();
            if (stateId != null && stateId != "") {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";
                filterExpression += String.Format("Ostan = '{0}'", stateId);
            }

            var educationLevelID = that._EducationOptionSetControl.GetValue();
            if (educationLevelID != null && educationLevelID != "") {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";
                filterExpression += String.Format("EducationLevle = '{0}'", educationLevelID);
            }

            return filterExpression;
        },

        _OnFilterChanged: function () {
            var that = this;

            if (that._events != null)
                that.trigger("FilterChanged", { Sender: that });
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "crm.LeadsFilterControl";
    FormClass.BaseType = afw.BasePanel;


    crm.LeadsFilterControl = FormClass;
})();
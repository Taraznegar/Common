(function () {
    var typeName = "cmn.PersonsFilterControl";
    var baseType = afw.BasePanel;
    var events = baseType.Events.concat(["FilterChanged"]);

    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return cmn.PersonsFilterControl;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._IsInFilterChanged = false;
            that.FilterChangedEventIsEnabled = true;

            that._PersonRolesEntityList = afw.uiApi.FetchEntityList("cmn.PersonRole");

            var personRoles = that._PersonRolesEntityList.ToDataSourceData();
            personRoles.splice(0, 0, { ID: "AllExceptConnectedPersons", Title: "همه بجز اشخاص مرتبط" });
            that._PersonRoleDropDownList = that.FindControl("PersonRoleDropDownList");
            that._PersonRoleDropDownList.SetItemsDataSource(personRoles);
            that._PersonRoleDropDownList.SetValue(personRoles[0].ID);
            that._PersonRoleDropDownList.bind("ValueChanged", function (e) { that._OnFilterChanged(); });

            that._PersonNameTextBox = that.FindControl("PersonNameTextBox");
            that._PersonNameTextChangeCheckTimeout = null;
            that._PersonNameTextBox.bind("TextChanged", function (e) {
                //prevent loading data while typing and wait some time after last key pressed before loading data. 
                if (that._PersonNameTextChangeCheckTimeout != null) {
                    clearTimeout(that._PersonNameTextChangeCheckTimeout);
                }

                that._PersonNameTextChangeCheckTimeout = setTimeout(function (e) {
                    if (!that.IsDestroying) {
                        that._OnFilterChanged();
                    }
                }, 500);
            });

            that._PhoneNumberTextBox = that.FindControl("PhoneNumberTextBox");
            that._PhoneNumberTextChangeCheckTimeout = null;
            that._PhoneNumberTextBox.bind("TextChanged", function (e) {
                //prevent loading data while typing and wait some time after last key pressed before loading data. 
                if (that._PhoneNumberTextChangeCheckTimeout != null) {
                    clearTimeout(that._PhoneNumberTextChangeCheckTimeout);
                }

                that._PhoneNumberTextChangeCheckTimeout = setTimeout(function (e) {
                    if (!that.IsDestroying) {
                        that._OnFilterChanged();
                    }
                }, 500);
            });

            that._StateDropDownList = that.FindControl("StateDropDownList");
            var states = afw.DataListHelper.FetchEntityListOfDataList("cmn.States").ToDataSourceData();
            that._StateDropDownList.SetItemsDataSource(states);
            that._StateDropDownList.bind("ValueChanged", function (e) { that._StateDropDownList_ValueChanged(e); });

            that._CityDropDownList = that.FindControl("CityDropDownList");
            that._CityDropDownList.SetReadOnly(true);
            that._CityDropDownList.bind("ValueChanged", function (e) { that._OnFilterChanged(); });

            that._RecognitionMethodDropDownList = that.FindControl("RecognitionMethodDropDownList");
            var recognitionMethods = afw.DataListHelper.FetchEntityListOfDataList("crm.RecognitionMethods").ToDataSourceData();
            //recognitionMethods.splice(0, 0, { ID: "All", Title: "همه" });
            that._RecognitionMethodDropDownList.SetItemsDataSource(recognitionMethods);
            //recognitionMethodDropDownList.SetValue(recognitionMethods[0].ID);
            that._RecognitionMethodDropDownList.bind("ValueChanged", function (e) { that._OnFilterChanged(); });

            var personRanks = afw.DataListHelper.FetchEntityListOfDataList("cmn.PersonRanks").ToDataSourceData();
            that._PersonRankDropDownList = that.FindControl("PersonRankDropDownList");
            that._PersonRankDropDownList.SetItemsDataSource(personRanks);
            that._PersonRankDropDownList.bind("ValueChanged", function (e) { that._OnFilterChanged(); });

            var custromerBusinessFields = afw.DataListHelper.FetchEntityListOfDataList("cmn.CustomerBusinessFields").ToDataSourceData();
            that._CustomerBusinessDropDownList = that.FindControl("CustomerBusinessDropDownList");
            that._CustomerBusinessDropDownList.SetItemsDataSource(custromerBusinessFields);
            that._CustomerBusinessDropDownList.bind("ValueChanged", function (e) { that._OnFilterChanged(); });

            var users = afw.DataListHelper.FetchEntityListOfDataList("afw.SystemUsers").ToDataSourceData();
            //users.splice(0, 0, { ID: "All", DisplayName: "همه" });
            that._CreatorUserDropDownList = that.FindControl("CreatorUserDropDownList");
            that._CreatorUserDropDownList.SetItemsDataSource(users);
            //that._CreatorUserDropDownList.SetValue(users[0].ID);
            that._CreatorUserDropDownList.bind("ValueChanged", function (e) { that._OnFilterChanged(); });
        },

        _OnFilterChanged: function () {
            var that = this;

            if (!that.FilterChangedEventIsEnabled)
                return;

            if (that._IsInFilterChanged)
                return;

            that._IsInFilterChanged = true;
            try {
                if (that._events != null)
                    that.trigger("FilterChanged", { Sender: that });
            }
            finally {
                that._IsInFilterChanged = false;
            }
        },

        GetFilterExpression: function () {
            var that = this;

            var filterExpression = "";

            var selectedPersonRole = that._PersonRoleDropDownList.GetValue();
            if (selectedPersonRole != null) {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";

                if (selectedPersonRole == "AllExceptConnectedPersons")
                    filterExpression += String.Format(
                        "not exists (select 1 from cmn_PersonRoleRelations where Person = InnerQuery.ID and PersonRole = '{0}')",
                        that._GetPersonRoleID("ConnectedPerson"));
                else
                    filterExpression += String.Format(
                        "exists (select 1 from cmn_PersonRoleRelations where Person = InnerQuery.ID and PersonRole = '{0}')",
                        selectedPersonRole);
            }

            var personName = that._PersonNameTextBox.GetText();
            if (!ValueIsEmpty(personName)) {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";
                filterExpression += String.Format("(afw.FullStringSearch(StoredDisplayText, N'{0}') = 1)", personName);
            }

            var phoneNumber = that._PhoneNumberTextBox.GetText().trim();
            if (!ValueIsEmpty(phoneNumber)) {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";
                filterExpression += String.Format("(isnull(TelNumber1, '') + isnull(WorkPhoneNumber, '') + isnull(MobilePhoneNumber1, '') like N'%{0}%'" +
                    " or exists (select 1 from cmn_PhoneNumbers where Person = InnerQuery.ID and Phone like N'%{0}%'))",
                    phoneNumber);
            }

            var stateId = that._StateDropDownList.GetValue();
            if (!ValueIsEmpty(stateId)) {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";
                filterExpression += String.Format("State = '{0}'", stateId);
            }

            var cityId = that._CityDropDownList.GetValue();
            if (!ValueIsEmpty(cityId)) {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";
                filterExpression += String.Format("City = '{0}'", cityId);
            }

            var recognitionMethodID = that._RecognitionMethodDropDownList.GetValue();
            if (recognitionMethodID != "All" && recognitionMethodID != null) {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";
                filterExpression += String.Format("RecognitionMethod = '{0}'", recognitionMethodID);
            }

            var personRank = that._PersonRankDropDownList.GetValue();
            if (!ValueIsEmpty(personRank)) {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";
                filterExpression += String.Format("PersonRank = '{0}'", personRank);
            }

            var businessField = that._CustomerBusinessDropDownList.GetValue();
            if (!ValueIsEmpty(businessField)) {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";
                filterExpression += String.Format("CustomerBusinessField = '{0}'", businessField);
            }

            var creatorUserID = that._CreatorUserDropDownList.GetValue();
            if (creatorUserID != "All" && creatorUserID != null) {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";
                filterExpression += String.Format("CreatorUser = '{0}'", creatorUserID);
            }

            return filterExpression;
        },

        ClearFilters: function (e) {
            var that = this;

            var storedFilterChangedEventIsEnabled = that.FilterChangedEventIsEnabled;

            that.FilterChangedEventIsEnabled = false;
            try {
                that._PersonRoleDropDownList.SetValue(null);
                that._PersonNameTextBox.SetValue(null);
                that._PhoneNumberTextBox.SetValue(null);
                that._StateDropDownList.SetValue(null);
                that._CityDropDownList.SetValue(null);
                that._RecognitionMethodDropDownList.SetValue(null);
                that._PersonRankDropDownList.SetValue(null);
                that._CustomerBusinessDropDownList.SetValue(null);
                that._CreatorUserDropDownList.SetValue(null);
            }
            finally {
                that.FilterChangedEventIsEnabled = storedFilterChangedEventIsEnabled;
            }

            that._OnFilterChanged();
        },

        _GetPersonRoleID: function (roleName) {
            var that = this;

            var personRoles = $.grep(that._PersonRolesEntityList.Entities, function (o) { return o.GetFieldValue("Name") == roleName });

            if (personRoles.length == 0)
                throw String.Format("PersonRole with Name '{0}' not exists.", roleName);
            else
                return personRoles[0].GetFieldValue("ID");
        },

        _StateDropDownList_ValueChanged: function (e) {
            var that = this;

            var stateID = that._StateDropDownList.GetValue();

            if (ValueIsEmpty(that._CityDropDownList.GetValue()))
                that._OnFilterChanged();
            else {
                that._CityDropDownList.SetValue(null);//causes _OnFilterChanged by CityDropDownList 
            }

            if (ValueIsEmpty(stateID)) {
                that._CityDropDownList.SetItemsDataSource([]);
                that._CityDropDownList.SetReadOnly(true);
            }
            else {
                var cities = afw.DataListHelper.FetchEntityListOfDataList("cmn.Cities", null, null, String.Format("State = '{0}'", stateID)).ToDataSourceData();
                that._CityDropDownList.SetItemsDataSource(cities);
                that._CityDropDownList.SetReadOnly(false);
            }
        },

        SetColumnFilterDisabled: function (fieldName) {
            var that = this;

            if (fieldName == "PersonRole")
                that._PersonRoleDropDownList.SetEnabled(false);
            else
                throw "Not implemented Disabled filter "+ fieldName;
        },

        SetColumnFilterValue: function (fieldName, fieldValue) {
            var that = this;

            if (fieldName == "PersonName")
                that._PersonNameTextBox.SetValue(fieldValue);
            else
                throw "Not implemented.";
        }
    });

    //Static Members:

    FormClass.TypeName = typeName;
    FormClass.BaseType = baseType;
    FormClass.Events = events;


    cmn.PersonsFilterControl = FormClass;
})();
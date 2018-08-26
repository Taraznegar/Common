(function () {
    var typeName = "crm.LeadsControl";
    var baseType = afw.DataListControl;
    var events = afw.DataListControl.Events.concat([]);

    var LeadsControl = baseType.extend({
        events: events,

        GetType: function () {
            return crm.LeadsControl;
        },

        init: function (options) {
            var that = this;

            options.DataListFullName = "crm.Leads";
            afw.DataListControl.fn.init.call(that, options);

            that._VDockPanel.SetPaneSizeSetting(2, 150);
            that._QuickSearchDockPanel.AppendPane();
            that._QuickSearchDockPanel.SetPaneSizeSetting(0, 300);
            that._QuickSearchDockPanel.SetPaneSizeSetting(1, "fill");

            that._FilterControl = afw.uiApi.CreateSavedFormByName(that._QuickSearchDockPanel.Panes[1], "crm.LeadsFilterControl", { Name: "LeadsFilterControl" });
            that._FilterControl.bind("FilterChanged", function (e) { that._FilterControl_FilterChanged(e); });

            that.LoadData();
        },

        _CreateToolbar: function () {
            var that = this;

            afw.DataListControl.fn._CreateToolbar.call(that);

            that.Toolbar.AddButton("Qualify", "تایید و ایجاد پرونده فروش", { Image: "resource(crm.LeadQualifyButtonIcon)" });
            that.Toolbar.AddButton("Disqualify", "رد سرنخ تجاری", { Image: "resource(crm.LeadDisqualifyButtonIcon)" });
            that.Toolbar.AddButton("Print", "چاپ لیست", { Image: "resource(cmn.PrintToolBarIcon)" });
           // that.Toolbar.AddButton("RunCurrentWorkflowStage", "Test", { Image: "resource(cmn.WorkflowIcon)", BackColor: "#00b33c" });

        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            afw.DataListControl.fn._OnToolbarButtonClicked.call(that, buttonKey);
            var selectedEntities = that._EntitiesGridView.GetSelectedRows();

            if (ValueIsIn(buttonKey, ["Qualify", "Disqualify"])) {
                if (selectedEntities.length == 0) {
                    afw.ErrorDialog.Show("موردی انتخاب نشده است.");
                    return;
                }
            }

            try {
                if (buttonKey == "Qualify") {
                    crm.QualifyLead(selectedEntities[0].DataItem);
                    that.LoadData();
                }
                else if (buttonKey == "Disqualify") {
                    crm.DisqualifyLead(selectedEntities[0].DataItem,
                        function (succeed) {
                            if (succeed) {
                                that.LoadData();
                            }
                        });
                }
                else if (buttonKey == "Print") {
                    that._PrintReport();
                }
            }   
            catch (ex) {
                afw.App.HandleError(ex);
            }
        },

        _PrintReport: function(){
            var that = this;

            var quickSearchTextBoxValue = that._QuickSearchTextBox.GetValue();

            var filterExpession = that._GetTotalFilterExpression();
            if (filterExpession == "")
                filterExpession = "1 = 1";
            
            var advertisingCampaignName = that._FilterControl.GetAdvertisingCampaignName();
            var responseName = that._FilterControl.GetResponseName();
            var negotiatorName = that._FilterControl.GetNegotiatorName();
            var qualificationStatus = that._FilterControl.GetQualificationStatus();
            var state = that._FilterControl.GetStateName();
            var city = that._FilterControl.GetCityName();
            var educationLevel = that._FilterControl.GetEducationLevel();
            var customerBussinseField = that._FilterControl.GetCustomerBussinseFieldName();
            var personRank = that._FilterControl.GetPersonRank();

            afw.uiApi.ShowProgress(that);
            afw.ReportHelper.RunReport("crm.LeadsReport",
                ["FilterExpression", "Response", "Negotiator", "AdvertisingCampaign", "QualificationStatus", "SearchText", "State", "City", "EducationLevel", "CustomerBussinseField", "PersonRank"],
                [filterExpession, responseName, negotiatorName, advertisingCampaignName, qualificationStatus, quickSearchTextBoxValue, state, city, educationLevel, customerBussinseField, personRank],
                null,
                function (result) {
                    afw.uiApi.HideProgress(that);
                });
        },

        _FilterControl_FilterChanged: function (e) {
            var that = this;

            that.LoadData();
        },

        _GetTotalFilterExpression: function () {
            var that = this;

            var filter = afw.DataListControl.fn._GetTotalFilterExpression.call(that);

            // var filterExpression = that._FilterControl.GetFilterExpression();
            
            if (that._FilterControl != null && !ValueIsEmpty(that._FilterControl.GetFilterExpression())) {
                if (!ValueIsEmpty(filter))
                    filter += " and ";
                filter += that._FilterControl.GetFilterExpression();

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

        _ShowEntityWindow: function (entity, formMode, options) {
            var that = this;

            return afw.DataListControl.fn._ShowEntityWindow.call(that, entity, formMode, options);
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

    LeadsControl.TypeName = typeName;
    LeadsControl.BaseType = baseType;
    LeadsControl.Events = events;


    crm.LeadsControl = LeadsControl;
})();

(function () {
    var FormClass = afw.Window.extend({
        GetType: function () {
            return cmn.ReceivedCallSalesCaseSelectWindow;
        },

        init: function (options) {
            var that = this;

            afw.Window.fn.init.call(that, options);
            var formObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            afw.uiApi.CreateControlByObjectData(that, formObjectData, false);

            if ("ReceivedCallID" in options) {
                that._ReceivedCallID = options.ReceivedCallID;
            }
            if ("CallPersonID" in options) {
                that._CallPersonID = options.CallPersonID;
            }

            that._MainDockPanel = that.FindControl("MainDockPanel")

            that._AllSalesCaseCheckBox = that.FindControl("AllSalesCaseCheckBox");
            that._RelatedSalesCaseCheckBox = that.FindControl("RelatedSalesCaseCheckBox");
            that._OkButton = that.FindControl("OkButton");
            that._CancelButton = that.FindControl("CancelButton");

            that._AllSalesCaseCheckBox.bind("CheckedChanged", function (e) { that._AllSalesCaseCheckBox_CheckedChanged(e); });
            that._RelatedSalesCaseCheckBox.bind("CheckedChanged", function (e) { that._RelatedSalesCaseCheckBox_CheckedChanged(e); });
            that._OkButton.bind("Click", function (e) { that._OkButton_Click(e); });
            that._CancelButton.bind("Click", function (e) { that._CancelButton_Click(e); });

            that._DataListControl = new afw.DataListControl({
                ParentControl: that._MainDockPanel.Panes[3],
                Name: "dataListControl",
                DataListFullName: "crm.SalesCases",
                BaseFilterExpression: String.Format("Customer = '{0}' or exists (select 1 from crm_SalesCaseConnectedPersons where ConnectedPerson = '{0}' and SalesCase = InnerQuery.ID)", that._CallPersonID)
            });

            that._RelatedSalesCaseCheckBox.SetValue(true);

            that._DataListControl.bind("EntityWindowOpened", function (e) { that._DataListControl_EntityWindowOpened(e); })
        },

        _DataListControl_EntityWindowOpened: function (sender, e) {
            var that = this;

            var customerEntityList = afw.uiApi.FetchEntityList("cmn.Person_CustomerInfo", String.Format("Person = '{0}'", that._CallPersonID))
            if (customerEntityList.Entities.length > 0)
                if (sender.EntityWindow._FormMode == "New") {
                    sender.EntityWindow._BindableEntity.set("Customer", that._CallPersonID);
                }
        },

        _AllSalesCaseCheckBox_CheckedChanged: function (sender, e) {
            var that = this;

            if (that._AllSalesCaseCheckBox.GetValue() == true) {

                that._DataListControl._BaseFilterExpression = "";
                that._DataListControl._LoadData();

                that._RelatedSalesCaseCheckBox.SetValue(!that._AllSalesCaseCheckBox.GetValue());
            }
        },

        _RelatedSalesCaseCheckBox_CheckedChanged: function (sender, e) {
            var that = this;

            if (that._RelatedSalesCaseCheckBox.GetValue() == true) {

                that._DataListControl._BaseFilterExpression = String.Format("Customer = '{0}' or exists (select 1 from crm_SalesCaseConnectedPersons where ConnectedPerson = '{0}' and SalesCase = InnerQuery.ID)", that._CallPersonID);
                that._DataListControl._LoadData();

                that._AllSalesCaseCheckBox.SetValue(!that._RelatedSalesCaseCheckBox.GetValue());
            }
        },

        _OkButton_Click: function (sender, e) {
            var that = this;
             
            var selectedSalesCaseEntities = that._DataListControl._EntitiesGridView.GetSelectedRows();
            if (selectedSalesCaseEntities == 0) {
                afw.ErrorDialog.Show("ابتدا یک سطر را انتخاب نمایید.");
            }
            else {
                var selectedSalesCaseID = selectedSalesCaseEntities[0].DataItem["ID"];
                var activityStatus_CompletedID = afw.OptionSetHelper.GetOptionSetItemID("cmn.ActivityStatuses.Completed");
                var activityType_IncommingCallID = afw.OptionSetHelper.GetOptionSetItemID("cmn.ActivityTypes.IncommingCall");

                var activityEntity = afw.uiApi.CreateNewEntity("cmn.Activity");
                activityEntity.SetFieldValue("SalesCase", selectedSalesCaseID);                
                activityEntity.SetFieldValue("ActivityStatus", activityStatus_CompletedID);               
                activityEntity.SetFieldValue("ActivityType", activityType_IncommingCallID);

                var activityWindow = afw.uiApi.OpenSavedFormWindow("cmn.ActivityEditForm", { 
                    Name: "ActivityEditForm", 
                    Modal: true, 
                    FormMode: "New", 
                    Entity: activityEntity 
                });

                activityWindow.SetTitle("ثبت فعالیت");
                activityWindow.bind("Opened",
                       function (e) {
                           e.Sender.SetSize(900, 765);
                           e.Sender.Center();
                       });


                activityWindow.bind("Close", function (e) { that._ActivityWindow_Close(e); });

                that.SetDialogResult("Ok");
                that.Close();
            }            
        },

        _ActivityWindow_Close: function (e) {
            var that = this;
            if (e.Sender._DialogResult == "Ok") {
                var activity = e.Sender._BindableEntity;
                afw.uiApi.CallServerMethodSync("cmn.SetReceivedCallSalesCaseActivity", [that._ReceivedCallID, activity.get("ID")]);
            }
        },

        _CancelButton_Click: function (sender, e) {
            var that = this;

            that.SetDialogResult("Cancel");

            that.Close();
        },

        _OnOpened: function (sender, e) {
            var that = this;

            afw.Window.fn._OnOpened.call(that);
        },

        _OnClosed: function () {
            var that = this;

            afw.Window.fn._OnClosed.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "cmn.ReceivedCallSalesCaseSelectWindow";
    FormClass.BaseType = afw.Window;


    cmn.ReceivedCallSalesCaseSelectWindow = FormClass;
})();


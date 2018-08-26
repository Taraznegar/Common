(function () {
    var objectEvents = afw.Window.Events.concat([]);

    var FormClass = afw.Window.extend({
        events: objectEvents,

        GetType: function () {
            return acc.AccountFloatGroupsForm;
        },

        init: function (options) {
            var that = this;

            afw.Window.fn.init.call(that, options);
            var formObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);

            if (formObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, formObjectData, false);

            that._AccountID = options.AccountID;

            that._SaveButton = that.FindControl("SaveButton");
            that._CancelButton = that.FindControl("CancelButton");

            that._SaveButton.bind("Click", function (e) { that._SaveButton_Click(e); });
            that._CancelButton.bind("Click", function (e) { that._CancelButton_Click(e); });
        },

        _OnOpening: function () {
            var that = this;

            afw.Window.fn._OnOpening.call(that);

            that._LoadData();
        },

        _OnOpened: function () {
            var that = this;

            afw.Window.fn._OnOpened.call(that);
        },

        _OnClosed: function () {
            var that = this;

            afw.Window.fn._OnClosed.call(that);
        },

        _LoadData: function () {
            var that = this;

            that._FloatGroupsData = afw.uiApi.CallServerMethodSync("acc.GetAccountFloatGroupsData", [that._AccountID]);
            
            for (var floatGroupIndex = 0; floatGroupIndex < that._FloatGroupsData.Entities.length; floatGroupIndex++)
            {
                var floatGroupTitle = that._FloatGroupsData.Entities[floatGroupIndex].GetFieldValue("FloatGroupTitle");
                var floatGroupDocPanel;

                if(floatGroupTitle == "گروه اشخاص")                    
                    floatGroupDocPanel = that.FindControl("PersonGroupDocPanel");
                else if(floatGroupTitle == "گروه های مرکز هزینه")
                    floatGroupDocPanel = that.FindControl("CostCenterGroupDockPanel");
                else if(floatGroupTitle == "گروه های پروژه")
                    floatGroupDocPanel = that.FindControl("ProjectGroupDocPanel");
                else if(floatGroupTitle == "گروه های ارزهای خارجی")
                    floatGroupDocPanel = that.FindControl("ForeignCurrencyGroupDocPanel");

                var accountFloatGroupData = that._FloatGroupsData.Entities[floatGroupIndex].GetFieldValue("AccountFloatGroupData");
                    
                for (var accountFloatGroupDataIndex = 0; accountFloatGroupDataIndex < accountFloatGroupData.Entities.length; accountFloatGroupDataIndex++)
                {
                    var item = [{
                        Name: accountFloatGroupData.Entities[accountFloatGroupDataIndex].GetFieldValue("FloatGroupID"),
                        Title: accountFloatGroupData.Entities[accountFloatGroupDataIndex].GetFieldValue("Title"),
                        IsSelected: accountFloatGroupData.Entities[accountFloatGroupDataIndex].GetFieldValue("IsSelected")
                    }];

                    floatGroupDocPanel.AppendPane();
                    that._CreateCheckBoxControl(item[0], floatGroupDocPanel.Panes[accountFloatGroupDataIndex]);
                    floatGroupDocPanel.Panes[accountFloatGroupDataIndex].SetSizeSetting(20);
                }
            }
        },

        _SaveButton_Click: function (e) {
            var that = this;

            afw.uiApi.ShowProgress(that);

            afw.uiApi.CallServerMethodSync("acc.SaveAccountFloatGroupsData",
                [that._AccountID, that._FloatGroupsData]);

            afw.uiApi.HideProgress(that);
            that.Close();
        },

        _CancelButton_Click: function (e) {
            var that = this;

            that.Close();
        },

        _CreateCheckBoxControl: function (item, parentControl) {
            var that = this;

            var checkBox = new afw.CheckBox({
                ParentControl:parentControl,
                Name: item.Name,
                Visible: true,
                LabelVisible: true,
                LabelText: item.Title,
                Checked: item.IsSelected
            });

            checkBox.bind("ValueChanged", function (e) { that._CheckBoxControl_ValueChanged(e); });
        },

        _CheckBoxControl_ValueChanged: function (e) {
            var that= this;

            var floatgroupID = e.Sender.GetName();
            var parentControlName = e.Sender.ParentControl.ParentControl.GetName();
            var accountFloatGroupData;
          
            if (parentControlName == "PersonGroupDocPanel")
                accountFloatGroupData = that._FloatGroupsData.Entities[0].GetFieldValue("AccountFloatGroupData");
            else if(parentControlName == "CostCenterGroupDockPanel")
                accountFloatGroupData = that._FloatGroupsData.Entities[1].GetFieldValue("AccountFloatGroupData");
            else if(parentControlName == "ProjectGroupDocPanel")
                accountFloatGroupData = that._FloatGroupsData.Entities[2].GetFieldValue("AccountFloatGroupData");
            else if(parentControlName == "ForeignCurrencyGroupDocPanel")  
                accountFloatGroupData = that._FloatGroupsData.Entities[3].GetFieldValue("AccountFloatGroupData");
            
            for (var i = 0; i < accountFloatGroupData.Entities.length; i++) {
                if (accountFloatGroupData.Entities[i].GetFieldValue("FloatGroupID") == floatgroupID) {
                    accountFloatGroupData.Entities[i].SetFieldValue("IsSelected",e.Sender.GetValue());
                    return;
                }
            }
        }
    });

    //Static Members:

    FormClass.TypeName = "acc.AccountFloatGroupsForm";
    FormClass.BaseType = afw.Window;
    FormClass.Events = objectEvents;

    acc.AccountFloatGroupsForm = FormClass;
})();
(function () {
    var FormClass = afw.Window.extend({
        GetType: function () {
            return cmn.ReceivedCallContractSelectWindow;
        },

        init: function (options) {
            var that = this;

            afw.Window.fn.init.call(that, options);
            var formObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            afw.uiApi.CreateControlByObjectData(that, formObjectData, false);

            if ("receivedCall_ID" in options) {
                that._receivedCall_ID = options.receivedCall_ID;
            }
            if ("callPerson_ID" in options) {
                that._callPerson_ID = options.callPerson_ID;
            }

            that._mainDockPanel = that.FindControl("MainDockPanel")

            that._allContractCheckBox = that.FindControl("AllContractCheckBox");
            that._relatedContractCheckBox = that.FindControl("RelatedContractCheckBox");
            that._okButton = that.FindControl("OkButton");
            that._cancelButton = that.FindControl("CancelButton");

            that._allContractCheckBox.bind("CheckedChanged", function (e) { that._allContractCheckBox_CheckedChanged(e); });
            that._relatedContractCheckBox.bind("CheckedChanged", function (e) { that._relatedContractCheckBox_CheckedChanged(e); });
            that._okButton.bind("Click", function (e) { that._okButton_Click(e); });
            that._cancelButton.bind("Click", function (e) { that._cancelButton_Click(e); });

            that._dataListControl = new afw.DataListControl({
                ParentControl: that._mainDockPanel.Panes[3],
                Name: "dataListControl",
                DataListFullName: "cmn.Contracts",
                BaseFilterExpression: String.Format("Customer = '{0}' or exists (select 1 from cmn_PersonMembers where MemberPerson = '{0}' and ParentPerson = InnerQuery.Customer)", that._callPerson_ID)
            });

            that._relatedContractCheckBox.SetValue(true);

            that._dataListControl.bind("EntityWindowOpened", function (e) { that._dataListControl_EntityWindowOpened(e); })
        },

        _dataListControl_EntityWindowOpened: function (sender, e) {
            var that = this;

            var customerEntityList = afw.uiApi.FetchEntityList("cmn.Person_CustomerInfo", String.Format("Person = '{0}'", that._callPerson_ID))
            if (customerEntityList.Entities.length > 0)
                if (sender.EntityWindow._FormMode == "New") {
                    sender.EntityWindow._BindableEntity.set("Customer", that._callPerson_ID);
                }
        },

        _allContractCheckBox_CheckedChanged: function (sender, e) {
            var that = this;

            if (that._allContractCheckBox.GetValue() == true) {

                that._dataListControl._BaseFilterExpression = "";
                that._dataListControl._LoadData();

                that._relatedContractCheckBox.SetValue(!that._allContractCheckBox.GetValue());
            }
        },
        _relatedContractCheckBox_CheckedChanged: function (sender, e) {
            var that = this;

            if (that._relatedContractCheckBox.GetValue() == true) {

                that._dataListControl._BaseFilterExpression = String.Format("Customer = '{0}' or exists (select 1 from cmn_PersonMembers where MemberPerson = '{0}' and ParentPerson = InnerQuery.Customer)", that._callPerson_ID);
                that._dataListControl._LoadData();

                that._allContractCheckBox.SetValue(!that._relatedContractCheckBox.GetValue());
            }
        },

        _okButton_Click: function (sender, e) {
            var that = this;

            var selectedContractEntities = that._dataListControl._EntitiesGridView.GetSelectedRows();
            if (selectedContractEntities == 0) {
                afw.ErrorDialog.Show("ابتدا یک سطر را انتخاب نمایید.");
            }
            else {                
                var ContractID = selectedContractEntities[0].DataItem["ID"];

                try {
                    afw.uiApi.CallServerMethodSync("cmn.SetReceivedCallRelatedContract", [that._receivedCall_ID, ContractID]);
                    that.SetDialogResult("Ok");
                    that.Close();
                }
                catch (ex) {
                    afw.ErrorDialog.Show(ex);
                }
            }
        },

        _cancelButton_Click: function (sender, e) {
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

    FormClass.TypeName = "cmn.ReceivedCallContractSelectWindow";
    FormClass.BaseType = afw.Window;


    cmn.ReceivedCallContractSelectWindow = FormClass;
})();
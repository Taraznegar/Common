(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return cmn.SettingsForm;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (designObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._MainTabControl = that.FindControl("MainTabControl");
            that._MainTabControl.AppendTab("rpTab", "خزانه داری");
            that._MainTabControl.SelectTabByIndex(0);

            that._rpTab = that.FindControl("rpTab");
            var control = afw.uiApi.CreateSavedFormByName(that._rpTab, "cmn.ReceivePaySettingsForm", { Name: "ReceivePaySettingsForm" });
            control.SetFillParent(true);

            that._rpSetting = afw.uiApi.FetchEntity("rp.Setting");

            if (that._rpSetting != null) {
                that._rpSettingBindableEntity = that._rpSetting.ToBindableEntity()
                control.FindControl("ReceiveReceiptAutomaticAccDocSettingOptionSetControl").InitDataBinding(that._rpSettingBindableEntity);
                control.FindControl("PayReceiptAutomaticAccDocSettingOptionSetControl").InitDataBinding(that._rpSettingBindableEntity);
                control.FindControl("ReceivedChequeStatusChangeAutomaticAccDocSettingOptionSetControl").InitDataBinding(that._rpSettingBindableEntity);
                control.FindControl("PaidChequeStatusChangeAutomaticAccDocSettingOptionSetControl").InitDataBinding(that._rpSettingBindableEntity);
                that._rpSettingBindableEntity.bind("change", function (e) { that._BindableEntity_change(e); });
            }
        },

        _BindableEntity_change: function (e) {
            var that = this;

            var selectedTabIndex = that._MainTabControl.GetSelectedTabIndex();
            var selectedTabName = that._MainTabControl.GetTabPageByIndex(selectedTabIndex).GetName();
            switch (selectedTabName) {
                case "rpTab":
                    afw.uiApi.ApplyEntityChanges(that._rpSettingBindableEntity.GetEntity());
                    break;
            }
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "cmn.SettingsForm";
    FormClass.BaseType = afw.BasePanel;


    cmn.SettingsForm = FormClass;
})();
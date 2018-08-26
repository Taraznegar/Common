(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return cmn.CmnUserSettingsForm;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            if ("Entity" in options) {
                that._BindableEntity = options.Entity.ToBindableEntity();
            }
            else
                throw "CmnUserSettingsForm Entity is not set.";

            if (ValueIsEmpty(that._BindableEntity.get("DefaultReminderTimeDistanceFromScheduledTime"))) {
                that._BindableEntity.set("DefaultReminderTimeDistanceFromScheduledTime", 60);
            }

            if (ValueIsEmpty(that._BindableEntity.get("ReminderSnoozeMinutes"))) {
                that._BindableEntity.set("ReminderSnoozeMinutes", 10);
            }

            that.InitDataBinding(that._BindableEntity);
        }
    });

    //Static Members:

    FormClass.TypeName = "cmn.CmnUserSettingsForm";
    FormClass.BaseType = afw.BasePanel;


    cmn.CmnUserSettingsForm = FormClass;
})();
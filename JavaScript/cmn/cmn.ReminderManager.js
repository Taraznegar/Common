(function () {
    var Class = afw.Object.extend({
        GetType: function () {
            return cmn.ReminderManager;
        },

        init: function (options) {
            var that = this;

            if (cmn.ReminderManager.Instance != null)
                throw "ReminderManager is already created."

            afw.Object.fn.init.call(that);

            cmn.ReminderManager.Instance = that;

            that.SyncReminder();

            afw.App.bind("OneMinuteClientSyncResultReceived", function (e) { that._OneMinuteClientSyncResultReceived(e); });
        },

        _OneMinuteClientSyncResultReceived: function (e) {
            var that = this;

            var syncResultEntity = e.SyncResultEntity;

            try {
                var userReminderItems = syncResultEntity.GetFieldValue("cmn_UserReminderItems").Entities;
                that._SetReminderItems(userReminderItems);
            }
            catch (ex) {                        
                afw.App.AddStatusError(ex);
            }
        },

        _SetReminderItems: function (userReminderItems) {
            var that = this;

            if (userReminderItems.length > 0 && !cmn.ReminderWindow.IsOpen)
                cmn.ReminderWindow.Open();

            if (cmn.ReminderWindow.IsOpening || cmn.ReminderWindow.IsOpen)
                cmn.ReminderWindow.SetItems(userReminderItems);

            if (userReminderItems.length == 0 && cmn.ReminderWindow.IsOpen)
                cmn.ReminderWindow.Close();
        },

        SyncReminder: function () {
            var that = this;

            afw.uiApi.CallServerMethodAsync("cmn.GetUserReminderItems", null, function (result) {
                if (result.HasError) {
                    afw.App.AddStatusError(result.ErrorMessage);
                    that._TryHideReminderWindowProgress();
                }
                else {
                    try {
                        that._SetReminderItems(result.Value.Entities);
                    }
                    catch (ex) {
                        afw.App.AddStatusError(ex);
                    }
                    finally {
                        that._TryHideReminderWindowProgress();
                    }
                }
            });
        },

        _TryHideReminderWindowProgress: function () {
            try {
                afw.uiApi.HideProgress(cmn.ReminderWindow.Instance);
            }
            catch (ex) {
            }
        }
    });

    //Static Members:

    Class.TypeName = "cmn.ReminderManager";
    Class.BaseType = afw.Object;

    Class.Instance = null;

    Class.SyncReminder = function () {
        if (cmn.ReminderManager.Instance == null)
            throw "ReminderManager is not created."

        cmn.ReminderManager.Instance.SyncReminder();
    }

    cmn.ReminderManager = Class;
})();

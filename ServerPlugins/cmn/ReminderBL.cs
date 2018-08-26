using AppFramework;
using AppFramework.AppServer;
using AppFramework.DataAccess;
using AppFramework.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace AppFramework.AppServer
{
    public class ReminderBL
    {
        public bool IsInSnoozeReminderItems { get; private set; }

        public EntityList GetUserReminderItems()
        {
            var core = CoreComponent.Instance;

            var filterExpression = string.Format("ReminderTime is not null and ReminderTime <= '{0}'", core.GetServerDateTime());
            filterExpression += string.Format(" and ActivityStatus = '{0}'", OptionSetHelper.GetOptionSetItemID("cmn.ActivityStatuses", "NotCompleted"));
            filterExpression += string.Format(" and OwnerUser = '{0}'", core.CurrentSession.GetFieldValue<Guid>("SystemUser"));

            var result = core.MainDbHelper.FetchMultiple("cmn_ActivitiesView", filterExpression, "ReminderTime", null, null, null);
            return result;
        }

        public void SnoozeReminderItems(EntityList reminderItems)
        {
            IsInSnoozeReminderItems = true;
            try
            {
                var core = CoreComponent.Instance;
                var dbHelper = core.MainDbHelper;

                foreach (var reminderItem in reminderItems.Entities)
                {
                    var activity = dbHelper.FetchSingleByID("cmn.Activity", reminderItem.GetFieldValue<Guid>("ID"), null);
                    activity.SetFieldValue("ReminderTime", GetUserReminderSnoozeTime());
                    dbHelper.UpdateEntity(activity);
                }
            }
            finally
            {
                IsInSnoozeReminderItems = false;
            }
        }

        private string GetUserReminderSnoozeTime()
        {
            var core = CoreComponent.Instance;
            var dbHelper = core.MainDbHelper;
            var currentUserId = core.CurrentSession.GetFieldValue<Guid>("SystemUser");

            var defaultSnoozeMinutes = 10;
            var snoozeMinutes = defaultSnoozeMinutes;

            var cmnUserSettings = dbHelper.FetchSingle("cmn.UserSettings",
                String.Format("SystemUser = '{0}'", currentUserId), null);

            if (cmnUserSettings != null
                && cmnUserSettings.GetFieldValue<int?>("ReminderSnoozeMinutes") != null
                && cmnUserSettings.GetFieldValue<int?>("ReminderSnoozeMinutes") != 0)
            {
                snoozeMinutes = cmnUserSettings.GetFieldValue<int>("ReminderSnoozeMinutes");
            }

            var snoozeTime = DateTimeHelper.DateTimeToString(DateTime.Now.AddMinutes(snoozeMinutes));

            return snoozeTime;
        }
    }
}

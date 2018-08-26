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
    public class ActivityBL : EntityBL
    {
        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify))
            {
                if (entity.GetFieldValue<DateTime?>("ReminderTime") == null && entity.GetFieldValue<DateTime?>("ScheduledTime") != null)
                {
                    var reminderTime = GetDefaultReminderTime(entity);
                    entity.SetFieldValue("ReminderTime", reminderTime);
                }
            }
        }

        public override void AfterApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.AfterApplyChanges(dbHelper, entity);

            //var cmn = CoreComponent.Instance.GetSubsystemObject("cmn") as cmn;

            //if (!cmn.ReminderBL.IsInSnoozeReminderItems && entity.GetFieldValue<Guid?>("SalesCase") != null)
            //{
            //    new SalesCaseBL().UpdateSalesCaseLastActionTime(entity.GetFieldValue<Guid>("SalesCase"));
            //}
        }

        private string GetDefaultReminderTime(Entity activity)
        {
            var core = CoreComponent.Instance;
            var dbHelper = core.MainDbHelper;
            var currentUserId = core.CurrentSession.GetFieldValue<Guid>("SystemUser");

            var defaultDistanceMinutes = 60;
            var distanceMinutes = defaultDistanceMinutes;

            var cmnUserSettings = dbHelper.FetchSingle("cmn.UserSettings",
                String.Format("SystemUser = '{0}'", currentUserId), null);

            if (cmnUserSettings != null
                && cmnUserSettings.GetFieldValue<int?>("DefaultReminderTimeDistanceFromScheduledTime") != null
                && cmnUserSettings.GetFieldValue<int?>("DefaultReminderTimeDistanceFromScheduledTime") != 0)
            {
                distanceMinutes = cmnUserSettings.GetFieldValue<int>("DefaultReminderTimeDistanceFromScheduledTime");
            }

            var scheduledTime = activity.GetFieldValue<DateTime>("ScheduledTime");
            var defaultReminderTime = DateTimeHelper.DateTimeToString(scheduledTime.AddMinutes(-distanceMinutes));

            return defaultReminderTime;
        }
    }
}

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
    public class ServiceAccSettingBL : EntityBL
    {
        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus != EntityChangeTypes.Delete)
            {
                if (dbHelper.EntityExists("cmn.ServiceAccSetting",
                        string.Format("Service = '{0}' and FinancialYear = '{1}' and ID <> '{2}'",
                            entity.GetFieldValue<Guid>("Service"),
                            entity.GetFieldValue<Guid>("FinancialYear"),
                            entity.GetFieldValue<Guid>("ID"))))
                {
                    throw new AfwException("این رکورد قبلا ثبت شده است");
                }
            }
        }

        public void CheckServicesAccSetting(List<Entity> serviceEntities, Guid financialYear)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var message = "";

            for (int i = 0; i < serviceEntities.Count; i++)
            {
                var accSetting = dbHelper.FetchSingle("cmn.ServiceAccSetting", string.Format("Service = '{0}' and FinancialYear = '{1}'"
                    , serviceEntities[i].GetFieldValue<Guid>("ID"), financialYear), null);
                if (accSetting == null)
                    message += (message == "" ? "" : " , ") + serviceEntities[i].GetFieldValue<string>("Name");
                else if (accSetting.GetFieldValue<Guid?>("Account") == null)
                    message += (message == "" ? "" : " , ") + serviceEntities[i].GetFieldValue<string>("Name");
            }

            if (message != "")
                throw new AfwException("تنظیمات حسابداری سرویس های " + message + " برای سال مالی فعال موجود نیست.");
        }
    }
}

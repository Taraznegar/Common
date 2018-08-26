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
    public class DiscountAccSettingBL : EntityBL
    {
        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus != EntityChangeTypes.Delete)
            {
                if (dbHelper.EntityExists("cmn.DiscountAccSetting",
                        string.Format("Discount = '{0}' and FinancialYear = '{1}' and ID <> '{2}'",
                            entity.GetFieldValue<Guid>("Discount"),
                            entity.GetFieldValue<Guid>("FinancialYear"),
                            entity.GetFieldValue<Guid>("ID"))))
                {
                    throw new AfwException("این رکورد قبلا ثبت شده است");
                }
            }
        }
    }
}

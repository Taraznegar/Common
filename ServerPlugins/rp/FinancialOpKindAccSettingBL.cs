using AppFramework;
using AppFramework.DataAccess;
using AppFramework.DataAccess.Utils;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace AppFramework.AppServer.ReceiveAndPay
{
    class FinancialOpKindAccSettingBL : EntityBL
    {
        public override void AfterApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.AfterApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus != EntityChangeTypes.Delete)
            {
                if (dbHelper.EntityExists("rp.FinancialOpKindAccSetting", string.Format("ID <> '{0}' and FinancialYear = '{1}' and FinancialOpKind = '{2}'",
                    entity.GetFieldValue<Guid>("ID"), entity.GetFieldValue<Guid>("FinancialYear"), entity.GetFieldValue<Guid>("FinancialOpKind"))))
                {
                    throw new AfwException("برای این سال مالی قبلا تنظیمات حسابداری ثبت شده است");
                }
            }
        }
    }
}

using AppFramework;
using AppFramework.AppServer;
using AppFramework.DataAccess;
using AppFramework.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace AppFramework.AppServer.ReceiveAndPay
{
    public class TarafHesabeTankhahAccSettingBL : EntityBL
    {
        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus != EntityChangeTypes.Delete)
            {
                if (dbHelper.EntityExists("rp.TarafHesabeTankhahAccSetting",
                        string.Format("TarafHesabeTankhah = '{0}' and FinancialYear = '{1}' and ID <> '{2}'",
                            entity.GetFieldValue<Guid>("TarafHesabeTankhah"),
                            entity.GetFieldValue<Guid>("FinancialYear"),
                            entity.GetFieldValue<Guid>("ID"))))
                {
                    throw new AfwException("این رکورد قبلا ثبت شده است");
                }
            }
        }
    }
}

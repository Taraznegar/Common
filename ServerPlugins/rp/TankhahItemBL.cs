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
    public class TankhahItemBL : EntityBL
    {
        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Modify, EntityChangeTypes.Delete))
            {
                var tankhah = dbHelper.FetchSingleByID("rp.Tankhah", entity.GetFieldValue<Guid>("Tankhah"), null);

                if (tankhah.GetFieldValue<Guid?>("AccDoc") != null)
                    throw new AfwException("امکان تغییر یا حذف این آیتم بدلیل صدور سند حسابداری وجود ندارد.");
            }
        }
    }
}

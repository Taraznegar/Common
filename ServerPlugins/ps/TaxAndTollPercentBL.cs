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
    public class TaxAndTollPercentBL : EntityBL
    {
        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify))
            {
                if (dbHelper.EntityExists("ps.TaxAndTollPercent",
                    string.Format("ID <> '{0}' and (FromDate between '{1}' and '{2}' or ToDate between '{1}' and '{2}')",
                        entity.GetFieldValue<Guid>("ID"), entity.GetFieldValue<DateTime>("FromDate"), entity.GetFieldValue<DateTime>("ToDate"))
                    )) {
                        throw new AfwException("رکورد دیگری با این رکورد همپوشانی زمانی دارد.");
                }
            }
        }
    }
}

using AppFramework;
using AppFramework.DataAccess;
using AppFramework.DataAccess.Utils;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace AppFramework.AppServer.WarehouseManagement
{
    class ArzeshRialiEstandardKalaBL : EntityBL
    {
        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify))
            {
                if( entity.GetFieldValue<DateTime>("FromDate") >= entity.GetFieldValue<DateTime>("ToDate"))
                    throw new AfwException("تاریخ شروع نمیتواند بزرگتر از تاریخ پایان باشد.");

                var entityExists = dbHelper.EntityExists("wm.ArzeshRialiEstandardKala",
                    string.Format(@"((FromDate >= '{0}' and ToDate <= '{1}')
                                        or (FromDate >= '{0}' and ToDate >= '{1}')
                                        or (FromDate <= '{0}' and ToDate <= '{1}')
                                        or (FromDate <= '{0}' and ToDate >= '{1}')
                                    )and StuffDef = '{2}'
                                    and ID <> '{3}'",
                        entity.GetFieldValue<DateTime>("FromDate"),
                        entity.GetFieldValue<DateTime>("ToDate"),
                        entity.GetFieldValue<Guid>("StuffDef"),
                        entity.GetFieldValue<Guid>("ID")));

                if (entityExists)
                    throw new AfwException("در بازه مشترک ارزش ریالی استاندارد برای کالا، موجود است.");

                var stuffEntity = dbHelper.FetchSingle("cmn.Stuff", string.Format("StuffDef = '{0}'", entity.GetFieldValue<Guid>("StuffDef")), null);
                entity.SetFieldValue("Stuff", stuffEntity.GetFieldValue<Guid>("ID"));
            }
        }

        public decimal? GetArzeshRialiEstandardKala(Guid stuffID, DateTime date)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;
            var entity = dbHelper.FetchSingle("wm.ArzeshRialiEstandardKala", string.Format("Stuff = '{0}' and FromDate <= '{1}' and ToDate >= '{1}'",
                stuffID , date), null);

            if (entity == null)
                return null;
            else
                return entity.GetFieldValue<decimal>("MablaghEstandard");
        }

    }
}

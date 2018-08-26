using AppFramework;
using AppFramework.AppServer;
using AppFramework.DataAccess;
using AppFramework.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace AppFramework.AppServer.PurchaseAndSales
{
    public class StuffRequestBL : EntityBL
    {
        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus == EntityChangeTypes.Modify)
            {
                var oldEntity = dbHelper.FetchSingleByID("ps.StuffRequest", entity.GetFieldValue<Guid>("ID"), null);
            }
        }

        public override void AfterApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.AfterApplyChanges(dbHelper, entity);

            //DebugHelper.Break();

            if (entity.ChangeStatus != EntityChangeTypes.Delete)
            {
                if (entity.FieldExists("StuffItems"))
                {
                    var StuffItems = entity.GetFieldValue<EntityList>("StuffItems");
                    StuffItems.Entities.RemoveAll(
                        o => o.ChangeStatus == EntityChangeTypes.Add
                            && o.GetFieldValue<Guid?>("Stuff") == null);

                    dbHelper.ApplyChanges(StuffItems);
                }
            }            
        }

       
    }
}

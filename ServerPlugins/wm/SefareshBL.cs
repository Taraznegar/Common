using AppFramework;
using AppFramework.AppServer;
using AppFramework.DataAccess;
using AppFramework.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace AppFramework.AppServer.WarehouseManagement
{
    class SefareshBL : EntityBL
    {
        public override void AfterApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.AfterApplyChanges(dbHelper, entity);

            //DebugHelper.Break();
            var id = entity.GetFieldValue<Guid>("ID");

            if (entity.ChangeStatus != EntityChangeTypes.Delete)
            {
                if (entity.FieldExists("SefareshItems"))
                {
                    var sefareshItems = entity.GetFieldValue<EntityList>("SefareshItems").Entities;
                    new SefareshItemBL().SaveItems(sefareshItems);
                }

                if (!HasItem(id))
                    throw new AfwException("سفارش آیتم ندارد .");
            }
        }

        private bool HasItem(Guid id)
        {
            var exist = false;

            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var items = dbHelper.FetchMultiple("wm.SefareshItem", string.Format("Sefaresh = '{0}'", id), null, null, null, null).Entities;
            if (items.Count > 0)
                exist = true;

            return exist;
        }
    }
}

using AppFramework;
using AppFramework.AppServer;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace AppFramework.AppServer.WarehouseManagement
{
    class SefareshItemBL : EntityBL
    {
        public void SaveItems(List<Entity> items)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            foreach (var item in items)
            {
                if (item.GetFieldValue<Guid?>("Stuff") == null)
                    continue;

                if (dbHelper.EntityExists("wm.SefareshItem", item.GetFieldValue<Guid>("ID")))
                    item.ChangeStatus = "Modify";
                else
                    item.ChangeStatus = "Add";

                dbHelper.ApplyChanges(item);
            }
        }
    }
}

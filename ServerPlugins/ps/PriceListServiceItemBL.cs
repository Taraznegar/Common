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
    public class PriceListServiceItemBL : EntityBL
    {
        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify))
            {
                var redundantExists = dbHelper.EntityExists("ps.PriceListServiceItem",
                    string.Format("PriceList = '{0}' and Service = '{1}' and ID <> '{2}'",
                        entity.GetFieldValue<Guid>("PriceList"),
                        entity.GetFieldValue<Guid>("Service"),
                        entity.GetFieldValue<Guid>("ID")));

                if (redundantExists)
                    throw new AfwException("این خدمات قبلا ثبت شده است.");
            }
        }
    }
}

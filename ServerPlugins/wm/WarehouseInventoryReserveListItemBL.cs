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
    class WarehouseInventoryReserveListItemBL : EntityBL
    {
        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus == EntityChangeTypes.Delete)
                return;

            var unreservedStock = GetUnreservedStuffStock(entity.GetFieldValue<Guid>("Stuff"), entity.GetFieldValue<Guid?>("StuffStatus"),
                entity.ChangeStatus == EntityChangeTypes.Modify ? entity.GetFieldValue<Guid>("ID") : (Guid?)null);

            if (entity.GetFieldValue<Guid?>("Unreserve_RelatedReserveItem") == null)
            {
                if (unreservedStock - entity.GetFieldValue<int>("Quantity") < 0)
                    throw new AfwException("تعداد کالا رزرو شده بیشتر از موجودی رزرو نشده کالا است. تعداد کالای قابل رزرو : " + unreservedStock);
            }
        }

        public override void AfterApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.AfterApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus == EntityChangeTypes.Delete)
                return;

            var relatedReserveItem = entity.GetFieldValue<Guid>("ID");
            var relatedReserveEntity = entity;

            if (entity.GetFieldValue<Guid?>("Unreserve_RelatedReserveItem") != null)
            {
                relatedReserveItem = entity.GetFieldValue<Guid>("Unreserve_RelatedReserveItem");
                relatedReserveEntity = dbHelper.FetchSingleByID("wm.WarehouseInventoryReserveListItem", relatedReserveItem, null);
            }
            var unreserve_RelatedItems = dbHelper.FetchMultiple("wm.WarehouseInventoryReserveListItem",
                string.Format("Unreserve_RelatedReserveItem = '{0}'", relatedReserveItem), null, null, null, null);

            var quantitySum = 0;
            for (int i = 0; i < unreserve_RelatedItems.Entities.Count; i++)
                quantitySum += unreserve_RelatedItems.Entities[i].GetFieldValue<int>("Quantity");

            if (quantitySum > relatedReserveEntity.GetFieldValue<int>("Quantity"))
                throw new AfwException("تعداد کل کالاهای برگشتی این رزرو بیشتر از تعداد اولیه رزرو است");

        }

        public int GetUnreservedStuffStock(Guid stuffID, Guid? stuffStatus, Guid? warehouseInventoryReserveItemEditedQuantity)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var realStock = wm.Instance.GetStuffRealStock(stuffID, null, stuffStatus, null, null, null);

            int quantity = (int)realStock;

            var reservedStuffStock = dbHelper.FetchSingleBySqlQuery(string.Format(@"
                select isnull(sum( q.Quantity), 0) SumReservedNum
		        from (
			        select case when ReserveOrUnreserve.Name = 'Reserve' then ReserveListItem.Quantity
					        - (
						        select isnull(sum(Quantity) , 0)
						        from wm_WarehouseInventoryReserveListItems
						        where Unreserve_RelatedReserveItem = ReserveListItem.ID
						        )
					        else 0 end Quantity
			        from wm_WarehouseInventoryReserveListItems ReserveListItem
				        inner join afw_OptionSetItems ReserveOrUnreserve on ReserveOrUnreserve.ID = ReserveListItem.ReserveOrUnreserve				 
                    where Stuff = '{0}' and Unreserve_RelatedReserveItem is null and {1} {2} )q", stuffID,
                    stuffStatus == null ? "StuffStatus is null" : string.Format("StuffStatus = '{0}'", stuffStatus),
                    warehouseInventoryReserveItemEditedQuantity == null ? "" : string.Format("and ReserveListItem.ID<>'{0}'", warehouseInventoryReserveItemEditedQuantity)))
                .GetFieldValue<int>("SumReservedNum");

            quantity -= reservedStuffStock;
            return quantity;
        }
    }
}

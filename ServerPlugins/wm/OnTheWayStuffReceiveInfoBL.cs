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
    class OnTheWayStuffReceiveInfoBL : EntityBL
    {
        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            var onTheWayStuffInfoID = entity.GetFieldValue<Guid>("OnTheWayStuffInfo");

            Entity onTheWayStuffInfoEntity = dbHelper.FetchSingleByID("wm.OnTheWayStuffInfo", onTheWayStuffInfoID, null);
            int notReceivedNumber = new OnTheWayStuffInfoBL().GetNotReceivedStuffNumber(onTheWayStuffInfoEntity);

            if (notReceivedNumber < entity.GetFieldValue<int>("CurrentPartyReceivedQuantity"))
                throw new AfwException("تعداد رسیده در این دریافت بیشتر از تعداد دریافت نشده در اطلاعات کالا در راه است ");
        }

    }
}

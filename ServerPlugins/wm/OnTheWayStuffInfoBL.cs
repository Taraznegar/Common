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
    class OnTheWayStuffInfoBL : EntityBL
    {
        public int GetNotReceivedStuffNumber(Entity onTheWayStuffInfoEntity)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            int? initialOnTheWayQuantity = onTheWayStuffInfoEntity.GetFieldValue<int?> ("InitialOnTheWayQuantity");

            if (initialOnTheWayQuantity == null)
                return 0;

            var onTheWayStuffReceiveInfoEntityList = dbHelper.FetchMultiple("wm.OnTheWayStuffReceiveInfo", string.Format("OnTheWayStuffInfo = '{0}'", onTheWayStuffInfoEntity.GetFieldValue<Guid>("ID")), null, null, null, null);

            int notReceivedNumber = (int)initialOnTheWayQuantity;
            
            for (int i = 0; i < onTheWayStuffReceiveInfoEntityList.Entities.Count; i++)
            {
                notReceivedNumber -= onTheWayStuffReceiveInfoEntityList.Entities[i].GetFieldValue<int>("CurrentPartyReceivedQuantity");
                if (notReceivedNumber < 0)
                    throw new AfwException("تعداد کالاهای دریافت شده بیشتر از تعداد در راه اولیه است.");
            }

            return notReceivedNumber;
        }
    }
}

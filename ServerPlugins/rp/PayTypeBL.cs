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
    public class PayTypeBL : EntityBL
    {
        private List<Entity> _PayTypes = null;

        private List<Entity> GetPayTypes() 
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            if (_PayTypes == null)
                _PayTypes = dbHelper.FetchMultiple("rp.PayType", null, null, null, null, null).Entities;

            return _PayTypes;
        }

        public string GetPayTypeName(Guid id) 
         {
             var foundPayTypes = GetPayTypes().FindAll(x => x.GetFieldValue<Guid>("ID") == id);

            if (foundPayTypes.Count == 1)
                return foundPayTypes[0].GetFieldValue<string>("Name");
            else
                throw new AfwException("Invalid PayType ID.");  
        }

        
    }
}

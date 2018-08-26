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
    public class ReceiveTypeBL : EntityBL
    {
        private List<Entity> _ReceiveTypes = null;

        private List<Entity> GetReceiveTypes()
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            if (_ReceiveTypes == null)
                _ReceiveTypes = dbHelper.FetchMultiple("rp.ReceiveType", null, null, null, null, null).Entities;

            return _ReceiveTypes;
        }

        public string GetReceiveTypeName(Guid id)
        {
            var foundReceiveTypes = GetReceiveTypes().FindAll(x => x.GetFieldValue<Guid>("ID") == id);

            if (foundReceiveTypes.Count == 1)
                return foundReceiveTypes[0].GetFieldValue<string>("Name");
            else
                throw new AfwException("Invalid ReceiveType ID.");
        }


    }
}

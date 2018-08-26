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
    public class SalesInvoiceItemBL : EntityBL
    {
        public Entity GetStuffInfo(Guid stuffID)
        {
            //DebugHelper.Break();
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var stuff = dbHelper.FetchSingleByID("cmn.Stuff", stuffID, new string[] { "StuffDef" });
            var stuffDef = stuff.GetFieldValue<Entity>("StuffDef_Entity");

            var resultEntity = new Entity();
            resultEntity.AddField("ID", stuffID);
            resultEntity.AddField("MainMeasurementUnitID", stuffDef.GetFieldValue<Guid>("MainMeasurementUnit"));
            resultEntity.AddField("DarayeMaliatBarArzesheAfzudeh", stuffDef.GetFieldValue<bool>("DarayeMaliatBarArzesheAfzudeh"));
            resultEntity.AddField("Custom_TedadeMaheGaranti", stuffDef.GetFieldValue<int?>("Custom_TedadeMaheGaranti"));

            return resultEntity;
        }
    }
}

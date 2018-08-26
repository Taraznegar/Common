using AppFramework;
using AppFramework.AppServer;
using AppFramework.DataAccess;
using AppFramework.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace AppFramework.AppServer
{
    public class StuffSubCategoryBL : EntityBL
    {
        public override void AfterApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.AfterApplyChanges(dbHelper, entity);

            //در صورت تیک خوردن تنظیمات در گروه فرعی، تیک ها در تعریف کالا ها هم زده می شوند.
            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify))
            {
                var stuffDefs = dbHelper.FetchMultiple("cmn.StuffDef", string.Format("SubCategory = '{0}'", entity.GetFieldValue<Guid>("ID")), null, null, null, null).Entities;

                foreach (var stuffDef in stuffDefs)
                {
                    if (entity.GetFieldValue<bool>("HideInProforma") == true)
                        stuffDef.SetFieldValue("HideInProforma", true);
                    if (entity.GetFieldValue<bool>("HideInInvoice") == true)
                        stuffDef.SetFieldValue("HideInInvoice", true);
                    if (entity.GetFieldValue<bool>("HideInStockTransfer") == true)
                        stuffDef.SetFieldValue("HideInStockTransfer", true);
                    if (entity.GetFieldValue<bool>("DarayeMaliatBarArzesheAfzudeh") == true)
                        stuffDef.SetFieldValue("DarayeMaliatBarArzesheAfzudeh", true);

                    dbHelper.UpdateEntity(stuffDef);
                }
            }

        }
    }
}

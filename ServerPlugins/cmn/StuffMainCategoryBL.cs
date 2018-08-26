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
    public class StuffMainCategoryBL : EntityBL
    {
        public override void AfterApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.AfterApplyChanges(dbHelper, entity);

            //در صورت تیک خوردن تنظیمات در گروه کلی، تیک ها در گروه های زیر مجموعه و تعریف کالا ها هم زده می شوند.
            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify))
            {
                var subCategories = dbHelper.FetchMultiple("cmn.StuffSubCategory", string.Format("MainCategory = '{0}'", entity.GetFieldValue<Guid>("ID")), null, null, null, null).Entities;

                foreach (var subCategory in subCategories)
                {
                    if (entity.GetFieldValue<bool>("HideInProforma") == true)
                        subCategory.SetFieldValue("HideInProforma", true);
                    if (entity.GetFieldValue<bool>("HideInInvoice") == true)
                        subCategory.SetFieldValue("HideInInvoice", true);
                    if (entity.GetFieldValue<bool>("HideInStockTransfer") == true)
                        subCategory.SetFieldValue("HideInStockTransfer", true);
                    if (entity.GetFieldValue<bool>("DarayeMaliatBarArzesheAfzudeh") == true)
                        subCategory.SetFieldValue("DarayeMaliatBarArzesheAfzudeh", true);

                    dbHelper.UpdateEntity(subCategory);
                }
            }
        }
    }
}

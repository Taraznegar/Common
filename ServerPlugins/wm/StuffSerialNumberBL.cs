using AppFramework;
using AppFramework.DataAccess;
using AppFramework.DataAccess.Utils;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace AppFramework.AppServer.WarehouseManagement
{
    class StuffSerialNumberBL : EntityBL
    {
        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify))
            {
                if (String.IsNullOrEmpty(entity.GetFieldValue<string>("SerialNumber")))
                    throw new AfwException("هیچ شماره سریالی وارد نشده است.");

                var redundantExists = dbHelper.EntityExists("wm.StuffSerialNumber",
                    string.Format("GhabzOrHavaleItem = '{0}' and SerialNumber = '{1}' and ID <> '{2}'",
                        entity.GetFieldValue<Guid>("GhabzOrHavaleItem"),
                        entity.GetFieldValue<string>("SerialNumber"),
                        entity.GetFieldValue<Guid>("ID")));

                if (redundantExists)
                {

                    var rowNumber = dbHelper.FetchSingleByID("wm.GhabzOrHavaleItem", 
                        entity.GetFieldValue<Guid>("GhabzOrHavaleItem"), null).GetFieldValue<int>("RowNumber");
                    throw new AfwException("برای کالا در سطر {0} شماره سریال {1} تکراری ثبت شده است.", rowNumber, entity.GetFieldValue<string>("SerialNumber"));
                }
            }
        }

        public void SaveStuffSerialNumbers(EntityList stuffSerialNumbers)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            foreach (var entity in stuffSerialNumbers.Entities)
            {
                if (entity.ChangeStatus != EntityChangeTypes.Delete)
                {
                    if (dbHelper.EntityExists("wm.StuffSerialNumber", entity.GetFieldValue<Guid>("ID")))
                        entity.ChangeStatus = "Modify";
                    else
                        entity.ChangeStatus = "Add";
                }

                dbHelper.ApplyChanges(entity);
            }
        }
    }
}

using AppFramework;
using AppFramework.AppServer;
using AppFramework.DataAccess;
using AppFramework.DataAccess.Utils;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace TarazNegarAppFrameworkPlugin.ServerPlugins.cmn
{
    class StuffBOMBL : EntityBL
    {
        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus == EntityChangeTypes.Add)
            {
                //چک شود برای هرکالا تنها بتوان یکBOM ثبت کرد             
                var stuffBomExists = dbHelper.EntityExists("cmn.StuffBOM",
                    string.Format("Stuff = '{0}'", entity.GetFieldValue<Guid>("Stuff")));

                if (stuffBomExists)
                {
                    throw new AfwException(" برای هر کالا تنها می توان یک BOM تعریف کرد. برای این کالا BOM تعریف شده است.");
                }
            }

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify))
            {
                var stuffComponents = entity.GetFieldValue<EntityList>("StuffBOM_StuffComponents").Entities;

                foreach (var stuffComponent in stuffComponents)
                {
                    if (stuffComponent.FieldExists("Stuff_Entity"))
                        stuffComponent.RemoveField("Stuff_Entity");
                }

                if (stuffComponents.Any(o => o.GetFieldValue<decimal?>("ValuePercent") != null))
                {
                    int valuePercentSum = 0;
                    
                    foreach (var stuffComponent in stuffComponents)
                    {
                        if (stuffComponent.GetFieldValue<decimal?>("ValuePercent") == null)
                            throw new AfwException("درصد ریالی برای سطر {0} وارد نشده است.\r\nدرصد ریالی باید یا برای همه سطر ها وارد شود و یا برای هیچ سطری وارد نشود.", stuffComponent.GetFieldValue<int>("RowNumber"));

                        valuePercentSum += stuffComponent.GetFieldValue<int>("ValuePercent");
                    }
                    
                    if (valuePercentSum != 100)
                        throw new AfwException("مجموع درصد ریالی اجزاء باید برابر با 100 باشد.");
                }
            }
        }

        public override void AfterApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.AfterApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus != EntityChangeTypes.Delete)
            {
                dbHelper.ApplyChanges(entity.GetFieldValue<EntityList>("StuffBOM_StuffComponents"));
            }
        }
    }
}

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
    public class CustomTextFieldInfoBL : EntityBL
    {
        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add))
            {
                var redundantExists = dbHelper.EntityExists("cmn.CustomTextFieldInfo",
                    string.Format("EntityFullName = '{0}' and FieldNumber >= '{1}'",
                        entity.GetFieldValue<string>("EntityFullName"),
                        entity.GetFieldValue<int>("FieldNumber")));

                if (redundantExists)
                    throw new AfwException(string.Format("شماره فیلد نامعتبر است، شماره فیلد {0} قبلا ثبت شده یا شماره بزرگتر از آن موجود است.", entity.GetFieldValue<string>("FieldNumber")));
            }
            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Delete))
            {

                var redundantExists = dbHelper.EntityExists("cmn.CustomTextFieldInfo",
                    string.Format("FieldNumber > '{0}' and EntityFullName = '{1}'",
                        entity.GetFieldValue<int>("FieldNumber"),
                        entity.GetFieldValue<string>("EntityFullName")));

                if (redundantExists)
                    throw new AfwException(string.Format("فیلد با شماره بزرگتر از {0} موجود است. ابتدا باید آن حذف شود.", entity.GetFieldValue<string>("FieldNumber")));            
            }
        }

        public void DeleteCustomTextFieldInfo(Guid entityID, bool isDeleteFromRefEntity)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var entity = dbHelper.FetchSingleByID("cmn.CustomTextFieldInfo", entityID, null);

            var redundantExists = dbHelper.EntityExists("cmn.CustomTextFieldInfo",
                string.Format("FieldNumber > '{0}' and EntityFullName = '{1}'",
                    entity.GetFieldValue<int>("FieldNumber"),
                    entity.GetFieldValue<string>("EntityFullName")));

            if (redundantExists)
                throw new AfwException(string.Format("فیلد با شماره بزرگتر از {0} موجود است. ابتدا باید آن حذف شود.", entity.GetFieldValue<string>("FieldNumber")));

            dbHelper.DeleteEntity(entity);

            if (isDeleteFromRefEntity)
            {
                var dynamicFieldName = "DynamicField" + entity.GetFieldValue<int>("FieldNumber");
                var entityFullName = entity.GetFieldValue<string>("EntityFullName");
                var entityList = dbHelper.FetchMultiple(entityFullName, string.Format("{0} <> null", dynamicFieldName), null, null, null, null);

                for (int i = 0; i < entityList.Entities.Count; i++)
                {
                    entity = entityList.Entities[i];
                    entity.SetFieldValue(dynamicFieldName, null);
                    dbHelper.UpdateEntity(entity);
                }
            }
        }
    }
}

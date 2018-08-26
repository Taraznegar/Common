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
    public class StuffDefBL : EntityBL
    {
        public string GenerateStuffDefName(Guid stuffDefId)
        {
            string title = "";
            using (var dbHelper = DbHelperFactory.CreateMainDbEntityDbHelper())
            {
                string strSQL = string.Format(@"
                    select MainCategory.Title  + ' ' + SubCategory.Title + ' ' + StuffDef.Name
                    from cmn_StuffDefs StuffDef 
                        inner join cmn_StuffSubCategories SubCategory on SubCategory.ID = StuffDef.SubCategory 
                        inner join cmn_StuffMainCategories MainCategory on MainCategory.ID = SubCategory.MainCategory 
                    where StuffDef.ID = '{0}' ", stuffDefId);

                title = dbHelper.AdoDbHelper.ExecuteScalar(strSQL).ToString();
            }

            return title;
        }

        //public bool StuffDefHasTaxAndToll(Guid stuffDefId)
        //{
        //    var dbHelper = CoreComponent.Instance.MainDbHelper;

        //    var stuffDef = dbHelper.FetchSingleByID("cmn.StuffDef", stuffDefId, new string[] { "SubCategory.MainCategory" });

        //    if (stuffDef.GetFieldValue<bool>("DarayeMaliatBarArzesheAfzudeh")
        //        || )
        //}

        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.AfterApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus == EntityChangeTypes.Delete)
            {
                //فعلا با ایجاد هر تعریف کالا، یک کالا هم ایجاد می کنیم.
                //با حذف تعریف کالا، ابتدا کالا باید حذف شود
                var stuff = dbHelper.FetchSingle("cmn.Stuff", string.Format("StuffDef = '{0}'", entity.GetFieldValue<Guid>("ID")), null);

                if (stuff != null)
                    dbHelper.DeleteEntity(stuff);
            }
        }

        public override void AfterApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.AfterApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify))
            {
                //فعلا با ایجاد هر تعریف کالا، یک کالا هم ایجاد می کنیم.
                //بعدا وقتی امکان تعیین مشخصه ها مشخصه ها به تعریف کالا اضافه شد، باید به ازای ترکیب مشخصه ها کالا ایجاد شود

                if (!dbHelper.EntityExists("cmn.Stuff", string.Format("StuffDef = '{0}'", entity.GetFieldValue<Guid>("ID"))))
                {
                    var stuff = dbHelper.CreateNewEntity("cmn.Stuff");
                    stuff.SetFieldValue("StuffDef", entity.GetFieldValue<Guid>("ID"));
                    dbHelper.InsertEntity(stuff);
                }
            }
        }

        public EntityList GetMahdudiatBatriEntityLists()
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var query = string.Format(@"
                select Custom_MahdodiateBatri Name
                from ps_MegaModavemSalesDashboard_InventoryView v
                group by Custom_MahdodiateBatri 
            ");

            return dbHelper.FetchMultipleBySqlQuery(query);
        }

        public Entity GetStuffDefFieldsMaxIntValue()
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var query = string.Format(@"
                select
                    isnull(max(cast(Code as bigint)), 0) MaxCode, 
                    isnull(max(cast(Custom_SecondaryCode as bigint)), 0) MaxCustom_SecondaryCode 
                from cmn_StuffDefs");

            return dbHelper.FetchSingleBySqlQuery(query);
        }
    }
}

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
    public class StuffBL : EntityBL
    {
        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            //DebugHelper.Break();

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify))
            {
                var redundantExists = dbHelper.EntityExists("cmn.Stuff",
                    string.Format("CustomCode = '{0}' and StuffDef <> '{1}'",
                        entity.GetFieldValue<string>("CustomCode"),
                        entity.GetFieldValue<Guid>("StuffDef")));

                if (redundantExists)
                    throw new AfwException("این کالا با این کد قبلا ثبت شده است."); 
            }
        }
        public EntityList GetSalesStuffList()
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var stuffList = dbHelper.FetchMultipleBySqlQuery(@"
                select Stuff.ID, StuffDef.MainMeasurementUnit MeasurementUnitID,
                	StuffDef.Code, StuffDef.Name StuffDef_Text,
                	MainCategory.Title as MainCategory_Text, SubCategory.Title SubCategory_Text,
                	MUnit.Title  MeasurementUnit_Text, isnull(PriceListItem.UnitPrice, 0) UnitPrice 
                from cmn_Stuffs Stuff
                	inner join cmn_StuffDefs StuffDef on StuffDef.ID = Stuff.StuffDef
                	left join cmn_StuffSubCategories SubCategory on StuffDef.SubCategory = SubCategory.ID
                	left join cmn_StuffMainCategories MainCategory on  SubCategory.MainCategory = MainCategory.ID
                	left join cmn_MeasurementUnits MUnit on MUnit.ID = StuffDef.MainMeasurementUnit
                	left join ps_PriceListStuffItems PriceListItem on PriceListItem.StuffDef = StuffDef.ID
                	left join ps_PriceLists PriceList on PriceList.ID = PriceListItem.PriceList
                	left join afw_OptionSetItems SaleBuyType on SaleBuyType.ID = PriceList.SaleBuyType
                where PriceList.IsActive = 1 and PriceList.IsDefault = 1 and SaleBuyType.Name = 'Sale'");

            return stuffList;
        }

        public Entity GetStuffDefByStuffID(Guid stuffID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var sqlQuery = string.Format(@"select StuffDef.* 
                from cmn_StuffDefs StuffDef
	                inner join cmn_Stuffs Stuff on Stuff.StuffDef = StuffDef.ID
                where Stuff.ID = '{0}'", stuffID);

            return dbHelper.FetchSingleBySqlQuery(sqlQuery);
        }

        public EntityList GetStuffLocationIDsByStuffID(Guid stuffID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var sqlQuery = string.Format(@"
            select StuffLocation.ID, 
	            StuffLocation.Name
            from cmn_StuffLocations StuffLocation
	            left join cmn_StuffPossibleLocations StuffPossibleLocation on StuffPossibleLocation.StuffLocation = StuffLocation.ID
	            left join cmn_StuffDefs StuffDef on StuffDef.ID = StuffPossibleLocation.StuffDef
	            left join cmn_Stuffs Stuff on Stuff.StuffDef = StuffDef.ID
            where Stuff.ID = '{0}'", stuffID);

            return dbHelper.FetchMultipleBySqlQuery(sqlQuery);
        }

        public string GetStuffTitle(Guid stuffID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var stuff = cmn.Instance.CachedStuffs.FirstOrDefault(o => o.GetFieldValue<Guid>("ID") == stuffID);

            if (stuff == null)
            {
                stuff = dbHelper.FetchSingleByID("cmn.Stuff", stuffID, new string[] { "StuffDef" });
                cmn.Instance.CachedStuffs.Add(stuff);
            }

            return stuff.GetFieldValue<Entity>("StuffDef_Entity").GetFieldValue<string>("Name");
        }
    }
}

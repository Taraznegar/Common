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
    public class PriceListBL : EntityBL
    {
        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            //DebugHelper.Break();

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify))
            {
                var redundantExists = dbHelper.EntityExists("ps.PriceList",
                    string.Format("Title = '{0}' and ID <> '{1}'",
                        entity.GetFieldValue<string>("Title"),
                        entity.GetFieldValue<Guid>("ID")));

                if (redundantExists)
                    throw new AfwException("این لیست قیمت با این نام قبلا ثبت شده است.");

                if (entity.GetFieldValue<bool>("IsDefault") == true)
                {
                    var isDefaultExists = dbHelper.EntityExists("ps.PriceList",
                        string.Format("IsDefault = '{0}' and SaleBuyType = '{1}' and ID <> '{2}'",
                            entity.GetFieldValue<bool>("IsDefault"),
                            entity.GetFieldValue<Guid>("SaleBuyType"),
                            entity.GetFieldValue<Guid>("ID")));

                    if (isDefaultExists)
                    {
                        var priceListEntity = dbHelper.FetchSingle("ps.PriceList",
                            string.Format("IsDefault = '{0}' and SaleBuyType = '{1}' and ID <> '{2}'",
                        entity.GetFieldValue<bool>("IsDefault"),
                        entity.GetFieldValue<Guid>("SaleBuyType"),
                        entity.GetFieldValue<Guid>("ID")), null);

                        priceListEntity.ChangeStatus = "Modify";
                        priceListEntity.SetFieldValue("IsDefault", false);
                        dbHelper.ApplyChanges(priceListEntity);
                    }
                }
            }
        } 

        public int? GetStuffPrice(Guid stuffID)
        {
            //DebugHelper.Break();

            int? UnitPrice = null;

            using (var dbHelper = DbHelperFactory.CreateMainDbEntityDbHelper())
            {
                try
                {
                    UnitPrice = dbHelper.AdoDbHelper.ExecuteScalar<int?>(string.Format(
                        @"select PriceListItem.UnitPrice
                      from ps_PriceListStuffItems PriceListItem
                      	inner join ps_PriceLists PriceList on PriceList.ID = PriceListItem.PriceList
                      	inner join cmn_Stuffs Stff on Stff.StuffDef = PriceListItem.StuffDef
                      where PriceList.IsActive = 1 and Stff.ID = '{0}'", stuffID));
                }
                catch (Exception ex)
                {
                    throw new Exception("Error in GetStuffPrice.", ex);
                } 
            }
            return UnitPrice;
        }

        public int? GetServicePrice(Guid serviceID)
        {
            //DebugHelper.Break();

            int? UnitPrice = null;

            using (var dbHelper = DbHelperFactory.CreateMainDbEntityDbHelper())
            {
                try
                {
                    UnitPrice = dbHelper.AdoDbHelper.ExecuteScalar<int?>(string.Format(
                        @"select PriceListItem.UnitPrice
                      from ps_PriceListServiceItems PriceListItem
                      	inner join ps_PriceLists PriceList on PriceList.ID = PriceListItem.PriceList
                      	inner join cmn_Services Servic on Servic.ID = PriceListItem.Service
                      where PriceList.IsActive = 1 and Servic.ID = '{0}'", serviceID));
                }
                catch (Exception ex)
                {
                    throw new Exception("Error in GetServicePrice.", ex);
                }
            }
            return UnitPrice;
        }
    }
}

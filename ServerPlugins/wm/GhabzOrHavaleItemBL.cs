using AppFramework;
using AppFramework.AppServer;
using AppFramework.DataAccess;
using AppFramework.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace AppFramework.AppServer.WarehouseManagement
{
    class GhabzOrHavaleItemBL: EntityBL
    {
        public GhabzOrHavaleItemBL(): base()
        {
        }

        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            if (wm.Instance.IsRunningUnvaluation)
                LoadOldEntityOnBeforeApplyChanges = false;

            base.BeforeApplyChanges(dbHelper, entity);

            if (wm.Instance.IsRunningUnvaluation)
                return;

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify))
            {
                var ghabzOrHavale = dbHelper.FetchSingleByID("wm.GhabzOrHavale", entity.GetFieldValue<Guid>("GhabzOrHavale"), null);
                var ghabzOrHavaleTypeEntity = wm.Instance.GetGhabzOrHavaleTypeEntity(ghabzOrHavale.GetFieldValue<Guid>("GhabzOrHavaleType"));
                var warehouseDocName = OptionSetHelper.GetOptionSetItemName(ghabzOrHavaleTypeEntity.GetFieldValue<Guid>("WarehouseDocType"));
                var stuffLocationID = ghabzOrHavale.GetFieldValue<Guid?>("StuffLocation");
                var stuffLocation = dbHelper.FetchSingleByID("cmn.StuffLocation", (Guid)stuffLocationID, null);
                var stuff = dbHelper.FetchSingleByID("cmn.Stuff", entity.GetFieldValue<Guid>("Stuff"), null);

                if (entity.FieldExists("Stuff_Entity"))
                    entity.RemoveField("Stuff_Entity");

                if (entity.GetFieldValue<int>("Quantity") < 0)
                    throw new AfwException("تعداد کالای وارد شده در سطر {0} مجاز نمی باشد.",
                        entity.GetFieldValue<int>("RowNumber"));
                else if (entity.GetFieldValue<int>("Quantity") == 0)
                {
                    //تنها در رسید و حواله تغییر ارزش تعداد 0 مجاز است و در این حالت هم نباید شماره بچ و وضعیت وارد شود
                    if (!string.IsNullOrEmpty(entity.GetFieldValue<string>("BatchNumber")) || entity.GetFieldValue<Guid?>("StuffStatus") != null)
                        throw new AfwException("تعداد کالای وارد شده در سطر {0} مجاز نمی باشد.",
                            entity.GetFieldValue<int>("RowNumber"));
                }

                if (!dbHelper.EntityExists("cmn.StuffPossibleLocation", string.Format("StuffDef = '{0}' and StuffLocation = '{1}'",
                    stuff.GetFieldValue<Guid>("StuffDef"), stuffLocationID)))
                {
                    throw new AfwException("در تعریف کالای سطر {0}، {1} بعنوان انبار مجاز انتخاب نشده است.",
                        entity.GetFieldValue<int>("RowNumber"), stuffLocation.GetFieldValue<string>("Name"));
                }

                new GhabzOrHavaleItemBL().ValidateBatchNumbers(entity);
            }
        }

        public override void AfterApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.AfterApplyChanges(dbHelper, entity);

            if (wm.Instance.IsRunningUnvaluation)
                return;

            var ghabzOrHavale = dbHelper.FetchSingleByID("wm.GhabzOrHavale", entity.GetFieldValue<Guid>("GhabzOrHavale"), null);
            var ghabzOrHavaleTypeEntity = wm.Instance.GetGhabzOrHavaleTypeEntity(ghabzOrHavale.GetFieldValue<Guid>("GhabzOrHavaleType"));
            var warehouseDocName = OptionSetHelper.GetOptionSetItemName(ghabzOrHavaleTypeEntity.GetFieldValue<Guid>("WarehouseDocType"));
            var stuffLocationID = ghabzOrHavale.GetFieldValue<Guid>("StuffLocation");

            if (entity.ChangeStatus == EntityChangeTypes.Delete)
            {
                if (entity.GetFieldValue<Guid>("GhabzOrHavale") != wm.Instance.DeletingGhabzOrHavaleID)
                    wm.Instance.CompareRefDocItemsWithGhabzOrHavaleItems(ghabzOrHavale);
            }
            else
            {
                if (warehouseDocName == "Havale" 
                    && ghabzOrHavaleTypeEntity.GetFieldValue<bool>("Havale_CheckStuffStock"))
                {
                    CheckStuffStock(entity, stuffLocationID,
                        ghabzOrHavale.GetFieldValue<DateTime>("IssueDate"),
                        null, null);
                }

                //bool? isValuationActivity = null;
                //if (entity.ChangeStatus == EntityChangeTypes.Modify)
                //{
                //    if (wm.Instance.IsRunningValuation || wm.Instance.IsRunningUnvaluation || wm.Instance.IsEvaluatingDocsForValuation)
                //        isValuationActivity = true;
                //    else
                //    {
                //        var changedFieldNames = cmn.Instance.GetChangedFieldsName(_OldEntity, entity, null);
                //        if (changedFieldNames.Any(o => !o.IsIn("LastModifyTime", "LastModifierUser", "RialiAmount")))
                //            isValuationActivity = true;
                //        else
                //            isValuationActivity = false;
                //    }
                //}
                //else
                //    isValuationActivity = false;

                if (!wm.Instance.InventoryValuationBL.IsInValuationOperation)
                    ApplyItemSerialNumbersChanges(ghabzOrHavale, entity);
            }
        }

        public void SaveItem(Entity ghabzOrHavale, Entity ghabzOrHavaleItem, Entity ghabzOrHavaleTypeEntity)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            using (var tranManager = new DbTransactionManager(dbHelper))
            {
                var rowNumber = ghabzOrHavaleItem.GetFieldValue<Int64>("RowNumber");

                if (ghabzOrHavaleItem.GetFieldValue<Guid?>("Stuff") == null)
                    return;

                if (ghabzOrHavaleItem.GetFieldValue<int>("Quantity") < 0)
                    throw new AfwException("تعدا کالا در سطر " + ghabzOrHavaleItem.GetFieldValue<int>("RowNumber") + " مجاز نمی باشد");

                dbHelper.ApplyChanges(ghabzOrHavaleItem);

                tranManager.Commit();
            }
        }

        private void ApplyItemSerialNumbersChanges(Entity ghabzOrHavale, Entity ghabzOrHavaleItem)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;
            EntityList stuffsSerialNumbers = null;

            if (ghabzOrHavaleItem.ChangeStatus != EntityChangeTypes.Delete)
            {
                var ghabzOrHavaleTypeEntity = wm.Instance.GetGhabzOrHavaleTypeEntity(ghabzOrHavale.GetFieldValue<Guid>("GhabzOrHavaleType"));

                //اگر عملیات (قطعه برداری) و (تغییر وضعیت و انتقال) و (عملیات ترکیبی) نبود
                if (ghabzOrHavale.GetFieldValue<Guid?>("RefDoc_GhetehBardariAzKala") == null
                    && ghabzOrHavale.GetFieldValue<Guid?>("RefDoc_StuffStatusChangeAndTransfer") == null
                    && ghabzOrHavale.GetFieldValue<Guid?>("RefDoc_WarehouseHybridOperation") == null)
                {
                    if (ghabzOrHavaleItem.FieldExists("StuffsSerialNumbers"))
                        stuffsSerialNumbers = ghabzOrHavaleItem.GetFieldValue<EntityList>("StuffsSerialNumbers");

                    if (stuffsSerialNumbers != null)
                        wm.Instance.SaveStuffSerialNumbers(stuffsSerialNumbers);

                    var serialSerialNumbersAreSet = CalculateSerialNumbersAreSet(ghabzOrHavaleItem, ghabzOrHavaleTypeEntity);

                    dbHelper.AdoDbHelper.ExecuteNonQuery(string.Format(@"
                        update wm_GhabzOrHavaleha set SerialNumbersAreSet = {0} where ID = '{1}'",
                        serialSerialNumbersAreSet == true ? 1 : 0, ghabzOrHavale.GetFieldValue<Guid>("ID")));
                }
            }
            else
            {
                if (stuffsSerialNumbers != null)
                {
                    foreach (var entity in stuffsSerialNumbers.Entities)
                    {
                        dbHelper.DeleteEntity(entity);
                    }
                }
            }
        }

        public int GetItemSavedSerialNumbersCount(Guid ghabzOrHavaleItemID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            return dbHelper.GetCount("wm.StuffSerialNumber", string.Format("GhabzOrHavaleItem = '{0}'", ghabzOrHavaleItemID));
        }

        private bool GetItemStuffSerialNumberIsNeeded(Guid ghabzOrHavaleItemID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var sqlQuery = string.Format(@"
                select StuffDef.NeedsSerialNumber
                from wm_GhabzOrHavaleItems GhabzOrHavaleItem
                    inner join cmn_Stuffs Stuff on Stuff.ID = GhabzOrHavaleItem.Stuff
	                inner join cmn_StuffDefs StuffDef on StuffDef.ID = Stuff.StuffDef
                where GhabzOrHavaleItem.ID = '{0}'", ghabzOrHavaleItemID);

            return dbHelper.AdoDbHelper.ExecuteScalar<bool>(sqlQuery);
        }

        private bool CalculateSerialNumbersAreSet(Entity ghabzOrHavaleItem, Entity ghabzOrHavaleTypeEntity)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var stuffSerialNumberIsNeeded = GetItemStuffSerialNumberIsNeeded(ghabzOrHavaleItem.GetFieldValue<Guid>("ID"));

            if (stuffSerialNumberIsNeeded)
            {
                var rowNumber = ghabzOrHavaleItem.GetFieldValue<Int64>("RowNumber");

                var itemSavedSerialNumbersCount = GetItemSavedSerialNumbersCount(ghabzOrHavaleItem.GetFieldValue<Guid>("ID"));

                if (ghabzOrHavaleItem.GetFieldValue<int>("Quantity") < itemSavedSerialNumbersCount)
                    throw new AfwException("تعداد شماره سریال های وارد شده در سطر {0} بیشتر از تعداد کالا می باشد.", rowNumber);

                if (ghabzOrHavaleTypeEntity.GetFieldValue<bool>("SetStuffsSerialNumberIsRequiered")
                    && ghabzOrHavaleItem.GetFieldValue<int>("Quantity") != itemSavedSerialNumbersCount)
                    throw new AfwException("تعداد شماره سریال های وارد شده و تعداد کالا در سطر {0} برابر نمی باشند.", rowNumber);

                if (ghabzOrHavaleItem.GetFieldValue<int>("Quantity") != itemSavedSerialNumbersCount)
                    return false;
            }

            return true;
        }

        public void CheckStuffStock(Entity item, Guid? stuffLocationID, DateTime? issueDate, DateTime? creationTime,
            Guid? salesInvoiceID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var stuffID = item.GetFieldValue<Guid?>("Stuff");

            if (stuffID == null)
                throw new AfwException("Error in CheckStuffStock: Field 'Stuff' is null.");

            var rowNumber = item.GetFieldValue<int?>("RowNumber");
            Guid? stuffStatusID = null;
            string batchNumber = null;

            //چون رزرو موجودی برای کالا در پیش فاکتور فروش انجام می شود 
            //پس فقط زمانی رزرو موجودی برای کالا چک می شود که عملیات مرتبط پیش فاکتور فروش باشد
            int? reservedStockInProformas = null;
            int? reservedStockInWarehouseInventoryReserveList = null;

            if (salesInvoiceID != null)
            {
                var psConfig = dbHelper.FetchSingle("ps.Config", null, null);
                if (psConfig.GetFieldValue<Guid?>("VaziateKalayeGhabeleForosh") == null)
                    throw new AfwException("وضعیت کالای قابل فروش در تنظیمات سیستم خرید و فروش انتخاب نشده است.");

                stuffStatusID = psConfig.GetFieldValue<Guid>("VaziateKalayeGhabeleForosh");
                reservedStockInProformas = GetStuffReservedStockInProformas((Guid)stuffID);
                reservedStockInWarehouseInventoryReserveList = GetWarehouseInventoryReserveQuantity((Guid)stuffID);
            }

            if (item.FieldExists("StuffStatus"))
                stuffStatusID = item.GetFieldValue<Guid?>("StuffStatus");

            if (item.FieldExists("BatchNumber"))
                batchNumber = item.GetFieldValue<string>("BatchNumber");

            var realStock = wm.Instance.GetStuffRealStock((Guid)stuffID, stuffLocationID, stuffStatusID, batchNumber, issueDate, creationTime);

            if (reservedStockInProformas == null)
                reservedStockInProformas = 0;

            if (reservedStockInWarehouseInventoryReserveList == null)
                reservedStockInWarehouseInventoryReserveList = 0;

            var mojodiGhabeleEraee = realStock - (reservedStockInWarehouseInventoryReserveList + reservedStockInProformas);
            if (mojodiGhabeleEraee < 0)
            {
                var stuffTitle = dbHelper.FetchSingleByID("cmn.Stuff", (Guid)stuffID, new string[] { "StuffDef" })
                    .GetFieldValue<Entity>("StuffDef_Entity").GetFieldValue<string>("Name");
                var stuffLocationName = stuffLocationID == null? ""
                    : " " + dbHelper.FetchSingleByID("cmn.StuffLocation", (Guid)stuffLocationID, null).GetFieldValue<string>("Name");
                
                throw new AfwException("مقدار '{0}' بیشتر از موجودی قابل ارائه{2} ({3}) می باشد.", 
                    stuffTitle, rowNumber, stuffLocationName,  mojodiGhabeleEraee);
            }
        }

        private int GetWarehouseInventoryReserveQuantity(Guid stuffID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var sqlQuery = string.Format(@"
                select isnull(sum(Q.Quantity), 0) ReservedQuantity
                from (
	                select case when ReserveOrUnreserve.Name = 'Reserve' then ReserveListItem.Quantity
		                - (
			                select isnull(sum(Quantity) , 0)
			                from wm_WarehouseInventoryReserveListItems
			                where Unreserve_RelatedReserveItem = ReserveListItem.ID
			                )
		                else 0 end Quantity
	                from wm_WarehouseInventoryReserveListItems ReserveListItem
		                inner join cmn_OrganizationInformations OrganizationUnit on OrganizationUnit.ID = ReserveListItem.InsertOrganizationUnit
		                inner join afw_OptionSetItems ReserveOrUnreserve on ReserveOrUnreserve.ID = ReserveListItem.ReserveOrUnreserve	
	                where ReserveListItem.Stuff = '{0}' and 
		                Unreserve_RelatedReserveItem is null
		                ) Q", stuffID);

            return dbHelper.AdoDbHelper.ExecuteScalar<int>(sqlQuery);
        }

        public int? GetStuffReservedStockInProformas(Guid stuffID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var sqlQuery = string.Format(@"
                select isnull(sum(ProformaItems.Quantity), 0) Quantity
                from ps_SalesInvoiceItems ProformaItems
	                left join ps_SalesInvoices Proforma on Proforma.ID = ProformaItems.SalesInvoice
	                left join cmn_WorkflowStages WorkflowStage on WorkflowStage.ID = Proforma.WorkflowStage
                where Proforma.IsProforma = 1
	                and WorkflowStage.LatinName <> 'NotApproved'
	                and not exists(select 1
		                from wm_GhabzOrHavaleha where RefDoc_SalesInvoice = Proforma.ID)
                    and ProformaItems.Stuff = '{0}'
                    and not exists(select 1 from ps_SalesInvoices CreatedInvoice where CreatedInvoice.SourceProforma = Proforma.ID 
		                and CreatedInvoice.IsProforma = 0)
                group by ProformaItems.Stuff",
                stuffID);

            return dbHelper.AdoDbHelper.ExecuteScalar<int?>(sqlQuery);
        }

        public void ValidateBatchNumbers(Entity entity)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var batchNumbers = GeBatchNumbers();

            var stuffDef = cmn.Instance.GetStuffDefByStuffID(entity.GetFieldValue<Guid>("Stuff"));

            var rowNumber = entity.GetFieldValue<int>("RowNumber");
            var batchNumberIsRequiered = false;

            if (stuffDef.GetFieldValue<Guid>("ID") == entity.GetFieldValue<Guid>("Stuff"))
            {
                batchNumberIsRequiered = stuffDef.GetFieldValue<Entity>("StuffDef_Entity").GetFieldValue<bool>("BatchNumberIsRequiered");
            }

            if (batchNumberIsRequiered
                && !batchNumbers.Exists(o => o.GetFieldValue<string>("BatchNumber") == entity.GetFieldValue<string>("BatchNumber")))
                throw new AfwException("شماره بچ وارد شده در سطر {0} در سیستم یافت نشد.", rowNumber);
        }

        private List<Entity> GeBatchNumbers()
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var sqlQuery = string.Format(@"
                select distinct BatchNumber
                from wm_GhabzOrHavaleItems
                where BatchNumber is not null");
            var batchNumberEntityList = dbHelper.FetchMultipleBySqlQuery(sqlQuery);

            return batchNumberEntityList.Entities;
        }
    }
}


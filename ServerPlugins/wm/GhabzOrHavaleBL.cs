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
    public class GhabzOrHavaleBL : EntityBL
    {
        public GhabzOrHavaleBL(): base()
        {
        }

        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            if (wm.Instance.IsRunningUnvaluation)
                LoadOldEntityOnBeforeApplyChanges = false;
            
            base.BeforeApplyChanges(dbHelper, entity);

            if (wm.Instance.IsRunningUnvaluation)
                return;

            var vazeyatRialiNashodeID = OptionSetHelper.GetOptionSetItemID("wm.VaziyatRialiAsnadAnbar", "RialiNashode");
            var vazeyatRialiSanadShodeID = OptionSetHelper.GetOptionSetItemID("wm.VaziyatRialiAsnadAnbar", "SanadShode");
            var oldGhabzOrHavaleEntity = dbHelper.FetchSingleByID("wm.GhabzOrHavale", entity.GetFieldValue<Guid>("ID"), null);

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Delete, EntityChangeTypes.Modify))
            {

                if (oldGhabzOrHavaleEntity.GetFieldValue<Guid>("VazeyatRialiShodan") != vazeyatRialiNashodeID)
                {
                    wm.Instance.InventoryValuationBL.CheckValuationPermission();

                    if (entity.GetFieldValue<Guid>("VazeyatRialiShodan") == vazeyatRialiSanadShodeID &&
                        oldGhabzOrHavaleEntity.GetFieldValue<Guid>("VazeyatRialiShodan") != vazeyatRialiSanadShodeID &&
                        oldGhabzOrHavaleEntity.GetFieldValue<Guid?>("AccDoc") == null)
                    {
                        if (entity.GetFieldValue<Guid?>("AccDoc") == null)
                            throw new AfwException("AccDoc Is not set but VazeyatRialiShodan is set to 'SanadShode'");
                    }
                    else if (entity.GetFieldValue<Guid>("VazeyatRialiShodan") != vazeyatRialiNashodeID)
                        throw new AfwException("برای تغییر سند انبار ابتدا آن را از حالت ریالی خارج نمایید.");
                }
            }
            else if (entity.ChangeStatus == EntityChangeTypes.Add)
                entity.SetFieldValue("VazeyatRialiShodan", vazeyatRialiNashodeID);

            var ghabzOrHavaleTypeEntity = dbHelper.FetchSingleByID("wm.GhabzOrHavaleType", entity.GetFieldValue<Guid>("GhabzOrHavaleType"), null);
            var warehouseDocName = OptionSetHelper.GetOptionSetItemName(ghabzOrHavaleTypeEntity.GetFieldValue<Guid>("WarehouseDocType"));
            var stuffLocationID = entity.GetFieldValue<Guid?>("StuffLocation");

            if (entity.ChangeStatus != EntityChangeTypes.Delete)
            {
                CompareRefDocItemsWithGhabzOrHavaleItems(entity);
            }

            if (entity.ChangeStatus == EntityChangeTypes.Delete)
            {
                string masterOpName;
                Guid? masterOpId;
                GetMasterOpInfo(entity, out masterOpName, out masterOpId);
                
                if (masterOpId != null && masterOpId != wm.Instance.DeletingOpID)
                {
                    var referenceDocTypeEntity = dbHelper.FetchSingleByID("wm.ReferenceDocType", entity.GetFieldValue<Guid>("ReferenceDocType"), null);
                    throw new AfwException("امکان حذف و ویرایش رسید/حواله مربوط به '{0}' وجود ندارد.", referenceDocTypeEntity.GetFieldValue<string>("Title"));
                }

                var dependedGhabzOrHavaleEntities = dbHelper.FetchMultiple("wm.GhabzOrHavale", string.Format("WareHouseDocRialiReference = '{0}'", entity.GetFieldValue<Guid>("ID")), null, null, null, null).Entities;

                if (dependedGhabzOrHavaleEntities.Count > 0)
                {
                    string ghabzOrHavaleNumbers = dependedGhabzOrHavaleEntities[0].GetFieldValue<int>("GhabzOrHavaleNumber").ToString();

                    for (int i = 1; i < dependedGhabzOrHavaleEntities.Count; i++)
                        ghabzOrHavaleNumbers += ", " + dependedGhabzOrHavaleEntities[i].GetFieldValue<int>("GhabzOrHavaleNumber");

                    throw new AfwException("امکان حذف به دلیل رفرنس ریالی بودن رسید/ حواله انتخاب شده وجود ندارد.\r\nابتدا رسید / حواله به {0} : {1} را حذف نمایید.",
                        dependedGhabzOrHavaleEntities.Count > 1 ? "شماره های" : "شماره", ghabzOrHavaleNumbers);
                }
            }
        }

        public override void AfterApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.AfterApplyChanges(dbHelper, entity);

            if (wm.Instance.IsRunningUnvaluation)
                return;

            var ghabzOrHavaleTypeEntity = dbHelper.FetchSingleByID("wm.GhabzOrHavaleType", entity.GetFieldValue<Guid>("GhabzOrHavaleType"), null);
            var vazeyatRiali_SanadShodeID = OptionSetHelper.GetOptionSetItemID("wm.VaziyatRialiAsnadAnbar", "SanadShode");
            var id = entity.GetFieldValue<Guid>("ID");
            var warehouseDocType = ghabzOrHavaleTypeEntity.GetFieldValue<Guid>("WarehouseDocType");

            if (entity.ChangeStatus == EntityChangeTypes.Add)
            {
                if (dbHelper.AdoDbHelper.ExistsRow(string.Format(@"
                    select 1
                    from wm_GhabzOrHavaleha GhabzOrHavaleh
	                    inner join wm_GhabzOrHavaleTypes GhabzOrHavaleType on GhabzOrHavaleType.ID = GhabzOrHavaleh.GhabzOrHavaleType
                    where GhabzOrHavaleType.WarehouseDocType = '{0}' 
	                    and GhabzOrHavaleh.StuffLocation = '{1}'
                        and GhabzOrHavaleh.GhabzOrHavaleNumber = {2}
                        and GhabzOrHavaleh.ID <> '{3}'",
                        warehouseDocType,
                        entity.GetFieldValue<Guid>("StuffLocation"),
                        entity.GetFieldValue<decimal>("GhabzOrHavaleNumber"),
                        id)))
                {
                    throw new AfwException(string.Format("{0} دیگری با این شماره ثبت شده است.",
                        OptionSetHelper.GetOptionSetItemTitle(warehouseDocType)));
                }
                
                if (entity.GetFieldValue<Guid?>("RefDoc_SalesInvoice") != null)
                {
                    var refDoc_SalesInvoiceID = entity.GetFieldValue<Guid>("RefDoc_SalesInvoice");
                    var salesProformaInvoice = dbHelper.FetchSingleByID("ps.SalesInvoice", refDoc_SalesInvoiceID, null);
                    salesProformaInvoice.SetFieldValue("HavaleIssuingStatus", OptionSetHelper.GetOptionSetItemID("cmn.HavaleIssuingStatus", "HavaleShodeh"));
                    dbHelper.UpdateEntity(salesProformaInvoice);
                }
            }
            
            if (entity.ChangeStatus == EntityChangeTypes.Delete)
            {
                if (entity.GetFieldValue<Guid?>("RefDoc_SalesInvoice") != null)
                {
                    var proformaID = entity.GetFieldValue<Guid>("RefDoc_SalesInvoice");

                    if (dbHelper.EntityExists("ps.SalesInvoice", 
                        string.Format("IsProforma = 0 and SourceProforma = '{0}'", proformaID)))
                    {
                        throw new AfwException(string.Format("بدلیل صدور فاکتور امکان حذف حواله وجود ندارد."));
                    }

                    var proforma = dbHelper.FetchSingleByID("ps.SalesInvoice", proformaID, null);
                    proforma.SetFieldValue("HavaleIssuingStatus", OptionSetHelper.GetOptionSetItemID("cmn.HavaleIssuingStatus", "HavaleNashodeh"));
                    dbHelper.UpdateEntity(proforma);
                }
            }

            if (entity.ChangeStatus != EntityChangeTypes.Delete)
            {
                if (entity.FieldExists("GhabzOrHavaleItems") && entity.GetFieldValue<EntityList>("GhabzOrHavaleItems") != null)
                {
                    SaveItems(entity, entity.GetFieldValue<EntityList>("GhabzOrHavaleItems"), ghabzOrHavaleTypeEntity);
                }

                if (!HasItem(id))
                    throw new AfwException("سند انبار فاقد آیتم است.");
            }

            if (!wm.Instance.IsEvaluatingDocsForValuation && !wm.Instance.IsRunningValuation && !wm.Instance.IsRunningUnvaluation
                && entity.GetFieldValue<Guid>("VazeyatRialiShodan") != vazeyatRiali_SanadShodeID)
            {
                if (wm.Instance.InventoryValuationBL.ValuatedDocExistsAfter(
                    entity.GetFieldValue<DateTime>("IssueDate"), entity.GetFieldValue<DateTime>("CreationTime")))
                {
                    throw new AfwException("سند انبار ریالی شده بعد از این سند انبار موجود است.\r\n" + 
                        " ابتدا رسید /حواله های بعد از این سند انبار را به وضعیت ریالی نشده منتقل کنید.");
                }
            }
        }

        private void GetMasterOpInfo(Entity ghabzOrHavale, out string masterOpName, out Guid? masterOpId)
        {
            if (ghabzOrHavale.GetFieldValue<Guid?>("RefDoc_GhetehBardariAzKala") != null)
                masterOpName = "GhetehBardariAzKala";
            else if (ghabzOrHavale.GetFieldValue<Guid?>("RefDoc_StuffStatusChangeAndTransfer") != null)
                masterOpName = "StuffStatusChangeAndTransfer";
            else if (ghabzOrHavale.GetFieldValue<Guid?>("RefDoc_WarehouseHybridOperation") != null)
                masterOpName = "WarehouseHybridOperation";
            else if (ghabzOrHavale.GetFieldValue<Guid?>("RefDoc_MontageOp") != null)
                masterOpName = "MontageOp";
            else if (ghabzOrHavale.GetFieldValue<Guid?>("RefDoc_DemontageOp") != null)
                masterOpName = "DemontageOp";
            else
                masterOpName = null;

            if (masterOpName != null)
                masterOpId = ghabzOrHavale.GetFieldValue<Guid>("RefDoc_" + masterOpName);
            else
                masterOpId = null;
        }

        private void SaveItems(Entity ghabzOrHavale, EntityList ghabzOrHavaleItems, Entity ghabzOrHavaleTypeEntity)
        {
            foreach (var item in ghabzOrHavaleItems.Entities)
            {
                new GhabzOrHavaleItemBL().SaveItem(ghabzOrHavale, item, ghabzOrHavaleTypeEntity);
            }
        }

        public void CheckStuffsStock(List<Entity> ghabzOrHavaleItems, Guid? stuffLocationID,
            DateTime? issueDate, DateTime? creationTime, 
            Guid? salesInvoiceID)
        {
            foreach (var item in ghabzOrHavaleItems)
            {
                if (item.GetFieldValue<Guid?>("Stuff") != null)//بخاطر آیتم های سرویس در پیش فاکتور
                    new GhabzOrHavaleItemBL().CheckStuffStock(item, stuffLocationID, issueDate, creationTime, salesInvoiceID);
            }
        }

        private bool HasItem(Guid id)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            return dbHelper.GetCount("wm.GhabzOrHavaleItem", string.Format("GhabzOrHavale = '{0}'", id)) > 0;
        }

        public EntityList GenerateItems(Guid refDocTypeID, Guid refDocID, Guid ghabzOrHavaleID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var ghabzOrHavaleItems = new EntityList();

            ghabzOrHavaleItems.EntityDefID = CoreComponent.Instance.GetEntityDef("wm.GhabzOrHavaleItem").GetFieldValue<Guid>("ID");

            var refDocItems = GetRemainedItems(refDocTypeID, refDocID)
                .Entities.Where(o => o.GetFieldValue<int>("RemainedQuantity") > 0).ToList();

            for (int i = 0; i < refDocItems.Count; i++)
            {
                var ghabzOrhavaleItem = dbHelper.CreateNewEntity("wm.GhabzOrHavaleItem");

                ghabzOrhavaleItem.SetFieldValue("Stuff", refDocItems[i].GetFieldValue<Guid>("Stuff"));
                ghabzOrhavaleItem.SetFieldValue("Quantity", refDocItems[i].GetFieldValue<int>("RemainedQuantity"));
                ghabzOrhavaleItem.SetFieldValue("RowNumber", i + 1);
                ghabzOrhavaleItem.SetFieldValue("GhabzOrHavale", ghabzOrHavaleID);

                ghabzOrHavaleItems.Entities.Add(ghabzOrhavaleItem);
            }

            return ghabzOrHavaleItems;
        }

        private EntityList GetRemainedItems(Guid refDocTypeID, Guid refDocID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var refDocTypeEntity = dbHelper.FetchSingleByID("wm.ReferenceDocType", refDocTypeID, null);


            var sqlQuery = string.Format(@"
                select RefDocItem.RowNumber,
	                RefDocItem.ID,
	                RefDocItem.Stuff,
	                sum(RefDocItem.Quantity) Quantity,
	                (RefDocItem.Quantity - ReturnedItems.Quantity) RemainedQuantity
                from {0} RefDocItem
	                left join {1} RefDoc on RefDoc.ID = RefDocItem.{2}
	                outer apply(
		                select isnull(sum(GhabzOrHavaleItem.Quantity), 0) Quantity
		                from wm_GhabzOrHavaleItems GhabzOrHavaleItem
			                left join wm_GhabzOrHavaleha GhabzOrHavale on GhabzOrHavale.ID = GhabzOrHavaleItem.GhabzOrHavale 				                
                        where GhabzOrHavaleItem.Stuff = RefDocItem.Stuff and GhabzOrHavale.RefDoc_{2} = RefDoc.ID
		                ) ReturnedItems
                where RefDoc.ID = '{3}'
                    and RefDocItem.Service is null
                group by RefDocItem.RowNumber, 
	                RefDocItem.ID, 
	                RefDocItem.Stuff, 
	                RefDocItem.Quantity, 
	                ReturnedItems.Quantity",
               refDocTypeEntity.GetFieldValue<string>("RefDocItemTableName"),
               refDocTypeEntity.GetFieldValue<string>("RefDocTableName"),
               refDocTypeEntity.GetFieldValue<string>("RefDocFieldName").Replace("RefDoc_", ""),
               refDocID);

            var ghabzOrHvaleItems = dbHelper.FetchMultipleBySqlQuery(sqlQuery);

            return ghabzOrHvaleItems;

        }

        public int GetNewGhabzOrHavaleNumber(Guid warehouseDocType, Guid stuffLocation)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            string sqlQuery = string.Format(@"
                select isnull(max(GhabzOrHavaleh.GhabzOrHavaleNumber) + 1, 1) GhabzOrHavaleNumber
                from wm_GhabzOrHavaleha GhabzOrHavaleh
	                left join wm_GhabzOrHavaleTypes GhabzOrHavaleType on GhabzOrHavaleType.ID = GhabzOrHavaleh.GhabzOrHavaleType
                where GhabzOrHavaleType.WarehouseDocType = '{0}' 
	                and GhabzOrHavaleh.StuffLocation = '{1}'",
                warehouseDocType, stuffLocation);

            return dbHelper.AdoDbHelper.ExecuteScalar<int>(sqlQuery);
        }

        public string GetWareHouseDocRialiReferenceLookupFilterExpression(Entity ghabzOrHavaleEntity)
        {

            var dbHelper = CoreComponent.Instance.MainDbHelper;

            string filterExpression = "";

            var ghabzOrHavaleTypeEntity = wm.Instance.GetGhabzOrHavaleTypeEntity(ghabzOrHavaleEntity.GetFieldValue<Guid>("GhabzOrHavaleType"));
            var rialiReferenceDocTypeID = ghabzOrHavaleTypeEntity.GetFieldValue<Guid?>("WareHouseDocRialiReferenceType");

            if (ghabzOrHavaleTypeEntity.GetFieldValue<string>("Name") == "ReturnFromBuyHavale"
                && ghabzOrHavaleEntity.GetFieldValue<Guid?>("RefDoc_ReturnFromBuy") != null)
            {
                var buyInvoiceID = dbHelper.AdoDbHelper.ExecuteScalar<Guid?>(string.Format(@"
                    select BuyInvoice
                    from ps_ReturnFromBuys
                    where ID = '{0}'", ghabzOrHavaleEntity.GetFieldValue<Guid>("RefDoc_ReturnFromBuy")));

                if (buyInvoiceID == null)
                    throw new AfwException("فاکتور خرید مرتبط یافت نشد.");

                filterExpression = string.Format("RefDoc_BuyInvoice = '{0}'", buyInvoiceID);
            }
            else if (ghabzOrHavaleTypeEntity.GetFieldValue<string>("Name") == "ReturnFromSales_Ghabz"
                && ghabzOrHavaleEntity.GetFieldValue<Guid?>("RefDoc_ReturnFromSale") != null)
            {
                var sourceProformaID = dbHelper.AdoDbHelper.ExecuteScalar<Guid?>(string.Format(@"
                    select SalesInvoice.SourceProforma
                    from ps_ReturnFromSales ReturnFromSale
	                    inner join ps_SalesInvoices SalesInvoice on SalesInvoice.ID = ReturnFromSale.SalesInvoice
                    where ReturnFromSale.ID = '{0}'", ghabzOrHavaleEntity.GetFieldValue<Guid>("RefDoc_ReturnFromSale")));

                if (sourceProformaID == null)
                    throw new AfwException("پیش فاکتور فروش مرتبط یافت نشد.");

                filterExpression = string.Format("RefDoc_SalesInvoice = '{0}'", sourceProformaID);
            }
            else if (ghabzOrHavaleTypeEntity.GetFieldValue<string>("Name") == "ReturnFromAmaniGhabz"
                && ghabzOrHavaleEntity.GetFieldValue<Guid?>("RefDoc_ReturnFromSale") != null)
            {
                var sourceProformaID = dbHelper.AdoDbHelper.ExecuteScalar<Guid?>(string.Format(@"
                    select SalesInvoice.SourceProforma
                    from ps_ReturnFromSales ReturnFromSale
	                    inner join ps_SalesInvoices SalesInvoice on SalesInvoice.ID = ReturnFromSale.SalesInvoice 
                    where ReturnFromSale.ID = '{0}'", ghabzOrHavaleEntity.GetFieldValue<Guid>("RefDoc_ReturnFromSale")));

                if (sourceProformaID == null)
                    throw new AfwException("پیش فاکتور امانی مرتبط یافت نشد.");

                filterExpression = string.Format("RefDoc_SalesInvoice = '{0}'", sourceProformaID);
            }
            //تغییر وضعیت و انتقال
            else if (ghabzOrHavaleTypeEntity.GetFieldValue<string>("Name") == "StuffStatusChangeAndTransferGhabz"
                && ghabzOrHavaleEntity.GetFieldValue<Guid?>("RefDoc_StuffStatusChangeAndTransfer") != null)
            {
                filterExpression = string.Format("RefDoc_StuffStatusChangeAndTransfer = '{0}' and ID <> '{1}'",
                    ghabzOrHavaleEntity.GetFieldValue<Guid>("RefDoc_StuffStatusChangeAndTransfer"),
                    ghabzOrHavaleEntity.GetFieldValue<Guid>("ID"));
            }
            //رسید کاهش ارزش دستگاه قطعه برداری شده
            else if (ghabzOrHavaleTypeEntity.GetFieldValue<string>("Name") == "HavaleKaheshArzesheKalayeGhetehBardariShodeh"
                && ghabzOrHavaleEntity.GetFieldValue<Guid?>("RefDoc_GhetehBardariAzKala") != null)
            {
                filterExpression = string.Format("RefDoc_GhetehBardariAzKala = '{0}' and ID <> '{1}' and GhabzOrHavaleType_Name = '{2}'",
                    ghabzOrHavaleEntity.GetFieldValue<Guid>("RefDoc_GhetehBardariAzKala"),
                    ghabzOrHavaleEntity.GetFieldValue<Guid>("ID"),
                    "GhabzeKalahayeGhetehBardariShodeh");
            }
            //حواله افزایش ارزش دستگاه قطعه برداری شده
            else if (ghabzOrHavaleTypeEntity.GetFieldValue<string>("Name") == "HavaleAfzayeshArzesheKalayeGhetehBardariShodeh"
                && ghabzOrHavaleEntity.GetFieldValue<Guid?>("ReferenceDocType") != null)
            {
                filterExpression = string.Format("ReferenceDocType = '{0}' and ID <> '{1}'",
                    ghabzOrHavaleEntity.GetFieldValue<Guid>("ReferenceDocType"),
                    ghabzOrHavaleEntity.GetFieldValue<Guid>("ID"));
            }

            if (rialiReferenceDocTypeID != null)
            {
                if (!string.IsNullOrEmpty(filterExpression))
                    filterExpression += " and ";

                filterExpression += string.Format("GhabzOrHavaleType = '{0}'", rialiReferenceDocTypeID);
            }

            return filterExpression;
        }

        public string GenerateWarehouseAccDoc(DateTime toDate, Guid financialYearID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var vazeyatRialiShodeID = OptionSetHelper.GetOptionSetItemID("wm.VaziyatRialiAsnadAnbar", "RialiShode");

            var forAccDocsInfosEntities = dbHelper.FetchMultipleBySqlQuery(string.Format(@"
                select  IssueDate , OrganizationUnit , FinancialDocType 
                from wm_GhabzOrHavaleha
                where FinancialYear = '{0}' and IssueDate <= '{2}' and
                    VazeyatRialiShodan = '{1}'
                group by IssueDate, OrganizationUnit, FinancialDocType 
                order by IssueDate", financialYearID, vazeyatRialiShodeID, toDate)).Entities;

            if (forAccDocsInfosEntities.Count == 0)
                throw new AfwException( "رسید/ حواله ریالی شده قبل از تاریخ {0} یافت نشد" , DateTimeHelper.GregorianDateTimeToPersian(toDate).Split(' ')[0]); 
            
            string message = "اسناد حسابداری با شماره های ";

            for (int i = 0; i < forAccDocsInfosEntities.Count; i++)
            {
                Int64 maxDocNo = 0;
                CheckWarehouseDocsHasAccount(financialYearID ,
                    forAccDocsInfosEntities[i].GetFieldValue<Guid>("FinancialDocType"),
                    forAccDocsInfosEntities[i].GetFieldValue<Guid>("OrganizationUnit"),
                    toDate);

                using (var tranManager = new DbTransactionManager(dbHelper))
                {
                    try
                    {
                        Guid? accDocID = null;
                        acc.Instance.InsertAccDocMaster(ref accDocID, "WarehouseDoc", forAccDocsInfosEntities[i].GetFieldValue<DateTime>("IssueDate"), financialYearID,
                            forAccDocsInfosEntities[i].GetFieldValue<Guid>("FinancialDocType"), 
                            forAccDocsInfosEntities[i].GetFieldValue<Guid>("OrganizationUnit"), 
                            "سند انبار", true);

                        CreateWarehouseAccDocItems((Guid)accDocID ,
                            forAccDocsInfosEntities[i].GetFieldValue<Guid>("FinancialDocType") ,
                            forAccDocsInfosEntities[i].GetFieldValue<Guid>("OrganizationUnit") ,
                            financialYearID, forAccDocsInfosEntities[i].GetFieldValue<DateTime>("IssueDate"));
                        
                        maxDocNo = dbHelper.FetchSingle("acc.AccDoc", string.Format("ID = '{0}'", accDocID), null).GetFieldValue<Int64>("DocNo");
                        message += maxDocNo + (i + 1 == forAccDocsInfosEntities.Count ? " " : " ,");

                        tranManager.Commit();
                    }
                    catch (Exception ex)
                    {
                        throw new AfwException("خطا در صدور سند حسابداری.\r\n" + ex.Message);
                    }
                }
            }

            return message + " صادر شدند.\r\n";
        }

        private void CheckWarehouseDocsHasAccount(Guid financialYearID, Guid financialDocType, Guid organizationUnit, DateTime toDate)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;
            var vazeyatRialiShodeID = OptionSetHelper.GetOptionSetItemID("wm.VaziyatRialiAsnadAnbar", "RialiShode");
            
            //1. انبارها
            string queryString = string.Format(@"
                select distinct StuffLocation.Name
                from wm_GhabzOrHavaleha GhabzOrHavale
	                left join cmn_StuffLocations StuffLocation on StuffLocation.ID = GhabzOrHavale.StuffLocation
                    left join cmn_StuffLocationAccSettings AccSetting on AccSetting.StuffLocation = StuffLocation.ID
	            where AccSetting.Account is null and
                    GhabzOrHavale.FinancialYear = '{0}' and
		            GhabzOrHavale.OrganizationUnit = '{1}' and
		            GhabzOrHavale.FinancialDocType = '{2}' and
		            GhabzOrHavale.VazeyatRialiShodan = '{3}' and
                    GhabzOrHavale.IssueDate <= '{4}'",
                financialYearID, organizationUnit, financialDocType, vazeyatRialiShodeID , toDate);

            var entities = dbHelper.FetchMultipleBySqlQuery(queryString).Entities;
            if(entities.Count > 0)
            {
               var stuffLocationsName = "";
               for (int i = 0; i < entities.Count; i++)
                   stuffLocationsName += entities[i].GetFieldValue<string>("Name") + (i+1 == entities.Count ? " " : ", ");

               throw new AfwException("کدینگ حساب برای انبارهای {0} تعیین نشده است.", stuffLocationsName);
            }

            //2. در انواع رسید / حواله
            queryString = string.Format(@"
                select distinct GhabzOrHavaleType.Title
                from wm_GhabzOrHavaleha GhabzOrHavale
                    left join wm_GhabzOrHavaleTypes GhabzOrHavaleType on GhabzOrHavaleType.Id = GhabzOrHavale.GhabzOrHavaleType
	                left join wm_WarehouseDocsAccSettingss Setting on 
						(Setting.GhabzOrHavaleType = GhabzOrHavale.GhabzOrHavaleType
							and Setting.FinancialYear = '{0}'
							)
	            where Setting.TarafHesabeAnbarAccount is null and
                    GhabzOrHavale.FinancialYear = '{0}' and
		            GhabzOrHavale.OrganizationUnit = '{1}' and
		            GhabzOrHavale.FinancialDocType = '{2}' and
		            GhabzOrHavale.VazeyatRialiShodan = '{3}'and
                    GhabzOrHavale.IssueDate <= '{4}'",
                financialYearID, organizationUnit, financialDocType, vazeyatRialiShodeID , toDate);

            entities = dbHelper.FetchMultipleBySqlQuery(queryString).Entities;
            if (entities.Count > 0)
            {
                var ghabzOrhavaleTypesTitle = "";
                for (int i = 0; i < entities.Count; i++)
                    ghabzOrhavaleTypesTitle += entities[i].GetFieldValue<string>("Title") + (i+1 == entities.Count ? " " : ", ");

                throw new AfwException("کدینگ حساب برای {0} تعیین نشده است.", ghabzOrhavaleTypesTitle);
            }
        }

        private void CreateWarehouseAccDocItems(Guid accDocID, Guid financialDocType, Guid organizationUnit, Guid financialYearID, DateTime issueDate)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            using (var tranManager = new DbTransactionManager(dbHelper))
            {
                try
                {
                    acc.Instance.DeleteAccDocItems(accDocID, "", null);
                    CreateGhabzAccDocItems(accDocID, financialDocType, organizationUnit, financialYearID , issueDate);
                    CreateHavaleAccDocItems(accDocID, financialDocType, organizationUnit, financialYearID , issueDate);
                    SetAccDocToWarehouseDocs(accDocID, financialDocType, organizationUnit, financialYearID, issueDate);

                    tranManager.Commit();

                }
                catch (Exception ex)
                {
                    throw new AfwException(ex.Message);
                }
            }        
        }

        private void CreateHavaleAccDocItems(Guid accDocID, Guid financialDocType, Guid organizationUnit, Guid financialYearID, DateTime issueDate)
        {
           var dbHelper = CoreComponent.Instance.MainDbHelper;

            var vazeyatRialiShodeID = OptionSetHelper.GetOptionSetItemID("wm.VaziyatRialiAsnadAnbar", "RialiShode");
            List<Entity> accDocItemList = new List<Entity>();

            //1. سطر بستانکاری انبارها
            string queryString = string.Format(@"
                select GhabzOrHavale.StuffLocation,
                    StuffLocation.Name StuffLocationName, AccSetting.Account ,
                    sum(RialiAmount) RialiAmountSum
                from wm_GhabzOrHavaleha GhabzOrHavale
	                left join wm_GhabzOrHavaleItems GhabzOrHavaleItem on GhabzOrHavaleItem.GhabzOrHavale = GhabzOrHavale.ID
	                left join wm_GhabzOrHavaleTypes GhabzOrHavaleType on GhabzOrHavaleType.Id = GhabzOrHavale.GhabzOrHavaleType
	                left join afw_OptionSetItems WarehouseDocType on WarehouseDocType.ID = GhabzOrHavaleType.WarehouseDocType
	                left join cmn_StuffLocations StuffLocation on StuffLocation.ID = GhabzOrHavale.StuffLocation
                    left join cmn_StuffLocationAccSettings AccSetting on AccSetting.StuffLocation = StuffLocation.ID
	            where WarehouseDocType.Name = 'Havale' and
		                GhabzOrHavale.FinancialYear = '{0}' and
		                AccSetting.FinancialYear = '{0}' and
		                GhabzOrHavale.OrganizationUnit = '{1}' and
		                GhabzOrHavale.FinancialDocType = '{2}' and
		                GhabzOrHavale.VazeyatRialiShodan = '{3}' and
                        GhabzOrHavale.IssueDate = '{4}'
                group by GhabzOrHavale.StuffLocation, StuffLocation.Name, AccSetting.Account ",
                financialYearID, organizationUnit, financialDocType, vazeyatRialiShodeID, issueDate);

            var entityItemsList = dbHelper.FetchMultipleBySqlQuery(queryString).Entities;

            //متن خطا اصلاح شود*************************************
            if (entityItemsList.Count < 1)
                return;
            
            foreach (var entityItem in entityItemsList)
            {
                var entity = new Entity();
                entity.AddField("accountID", entityItem.GetFieldValue<Guid>("Account"));
                entity.AddField("personID", null);
                entity.AddField("costCenterID", null);
                entity.AddField("projectID", null);
                entity.AddField("foreignCurrencyID", null);
                entity.AddField("note",  "جمع بستانکاری انبار " + entityItem.GetFieldValue<string>("StuffLocationName"));
                entity.AddField("creditorAmount", entityItem.GetFieldValue<decimal>("RialiAmountSum"));
                entity.AddField("debtorAmount", 0);
                entity.AddField("isActive", true);
                
                accDocItemList.Add(entity);
            }

            //2. سطر بدهکاری برای هر کدینگ حساب
            queryString = string.Format(@"
				select GhabzOrHavale.GhabzOrHavaleType ,
                    Setting.TarafHesabeAnbarAccount ,
                    GhabzOrHavaleType.Title,
                    sum(RialiAmount) RialiAmountSum
                from wm_GhabzOrHavaleha GhabzOrHavale
	                left join wm_GhabzOrHavaleItems GhabzOrHavaleItem on GhabzOrHavaleItem.GhabzOrHavale = GhabzOrHavale.ID
	                left join wm_GhabzOrHavaleTypes GhabzOrHavaleType on GhabzOrHavaleType.Id = GhabzOrHavale.GhabzOrHavaleType
	                left join afw_OptionSetItems WarehouseDocType on WarehouseDocType.ID = GhabzOrHavaleType.WarehouseDocType
	                left join wm_WarehouseDocsAccSettingss Setting on 
						(Setting.GhabzOrHavaleType = GhabzOrHavale.GhabzOrHavaleType
							and Setting.FinancialYear = '{0}'
							)
	            where WarehouseDocType.Name = 'Havale' and
		                GhabzOrHavale.FinancialYear = '{0}' and
		                GhabzOrHavale.OrganizationUnit = '{1}' and
		                GhabzOrHavale.FinancialDocType = '{2}' and
		                GhabzOrHavale.VazeyatRialiShodan = '{3}' and
                        GhabzOrHavale.IssueDate = '{4}'
                group by GhabzOrHavale.GhabzOrHavaleType,
                    Setting.TarafHesabeAnbarAccount,
                    GhabzOrHavaleType.Title",
                financialYearID, organizationUnit, financialDocType, vazeyatRialiShodeID, issueDate);

            entityItemsList = dbHelper.FetchMultipleBySqlQuery(queryString).Entities;

            //متن خطا اصلاح شود*************************************
            if (entityItemsList.Count < 1)
                throw new AfwException("سطر بستانکاری با شرایط خاص واحد سازمانی ، سال مالی و سند مالی یافت نشد.");

            foreach (var entityItem in entityItemsList)
            {
                var entity = new Entity();
                entity.AddField("accountID", entityItem.GetFieldValue<Guid>("TarafHesabeAnbarAccount"));
                entity.AddField("personID", null);
                entity.AddField("costCenterID", null);
                entity.AddField("projectID", null);
                entity.AddField("foreignCurrencyID", null);
                entity.AddField("note","جمع بدهکاری های " + entityItem.GetFieldValue<string>("Title"));
                entity.AddField("creditorAmount", 0);
                entity.AddField("debtorAmount", entityItem.GetFieldValue<decimal>("RialiAmountSum"));
                entity.AddField("isActive", true);
                
                accDocItemList.Add(entity);
            }

            acc.Instance.InsertAccDocItems(accDocID, "", null, accDocItemList);
        }

        private void CreateGhabzAccDocItems(Guid accDocID, Guid financialDocType, Guid organizationUnit, Guid financialYearID, DateTime issueDate)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var vazeyatRialiShodeID = OptionSetHelper.GetOptionSetItemID("wm.VaziyatRialiAsnadAnbar", "RialiShode");
            List<Entity> accDocItemList = new List<Entity>();

            //1. سطر بدهکاری انبار
            string queryString = string.Format(@"
                select GhabzOrHavale.StuffLocation,
                    StuffLocation.Name StuffLocationName, AccSetting.Account ,
                    sum(RialiAmount) RialiAmountSum
                from wm_GhabzOrHavaleha GhabzOrHavale
	                left join wm_GhabzOrHavaleItems GhabzOrHavaleItem on GhabzOrHavaleItem.GhabzOrHavale = GhabzOrHavale.ID
	                left join wm_GhabzOrHavaleTypes GhabzOrHavaleType on GhabzOrHavaleType.Id = GhabzOrHavale.GhabzOrHavaleType
	                left join afw_OptionSetItems WarehouseDocType on WarehouseDocType.ID = GhabzOrHavaleType.WarehouseDocType
	                left join cmn_StuffLocations StuffLocation on StuffLocation.ID = GhabzOrHavale.StuffLocation
                    left join cmn_StuffLocationAccSettings AccSetting on AccSetting.StuffLocation = StuffLocation.ID
	            where WarehouseDocType.Name = 'Ghabz' and
		            GhabzOrHavale.FinancialYear = '{0}' and
                    AccSetting.FinancialYear = '{0}' and
		            GhabzOrHavale.OrganizationUnit = '{1}' and
		            GhabzOrHavale.FinancialDocType = '{2}' and
		            GhabzOrHavale.VazeyatRialiShodan = '{3}' and
                    GhabzOrHavale.IssueDate = '{4}'
                group by GhabzOrHavale.StuffLocation, StuffLocation.Name, AccSetting.Account",
                financialYearID, organizationUnit, financialDocType, vazeyatRialiShodeID, issueDate);

            var entityItemsList = dbHelper.FetchMultipleBySqlQuery(queryString).Entities;

            //متن خطا اصلاح شود*************************************
            if (entityItemsList.Count < 1)
                return;
            
            foreach (var entityItem in entityItemsList)
            {
                var entity = new Entity();
                entity.AddField("accountID", entityItem.GetFieldValue<Guid>("Account"));
                entity.AddField("personID", null);
                entity.AddField("costCenterID", null);
                entity.AddField("projectID", null);
                entity.AddField("foreignCurrencyID", null);
                entity.AddField("note",  "جمع بدهکاری انبار " + entityItem.GetFieldValue<string>("StuffLocationName"));
                entity.AddField("creditorAmount", 0);
                entity.AddField("debtorAmount", entityItem.GetFieldValue<decimal>("RialiAmountSum"));
                entity.AddField("isActive", true);

                accDocItemList.Add(entity);
            }

            //2. سطر بستانکاری برای هر کدینگ حساب
            queryString = string.Format(@"
				select GhabzOrHavale.GhabzOrHavaleType ,
                    Setting.TarafHesabeAnbarAccount ,
                    GhabzOrHavaleType.Title,
                    sum(RialiAmount) RialiAmountSum
                from wm_GhabzOrHavaleha GhabzOrHavale
	                left join wm_GhabzOrHavaleItems GhabzOrHavaleItem on GhabzOrHavaleItem.GhabzOrHavale = GhabzOrHavale.ID
	                left join wm_GhabzOrHavaleTypes GhabzOrHavaleType on GhabzOrHavaleType.Id = GhabzOrHavale.GhabzOrHavaleType
	                left join afw_OptionSetItems WarehouseDocType on WarehouseDocType.ID = GhabzOrHavaleType.WarehouseDocType
	                left join wm_WarehouseDocsAccSettingss Setting on 
						(Setting.GhabzOrHavaleType = GhabzOrHavale.GhabzOrHavaleType
							and Setting.FinancialYear = '{0}'
							)
	            where WarehouseDocType.Name = 'Ghabz' and
		                GhabzOrHavale.FinancialYear = '{0}' and
		                GhabzOrHavale.OrganizationUnit = '{1}' and
		                GhabzOrHavale.FinancialDocType = '{2}' and
		                GhabzOrHavale.VazeyatRialiShodan = '{3}' and
                        GhabzOrHavale.IssueDate = '{4}'
                group by GhabzOrHavale.GhabzOrHavaleType,
                    Setting.TarafHesabeAnbarAccount,
                    GhabzOrHavaleType.Title",
                financialYearID, organizationUnit, financialDocType, vazeyatRialiShodeID , issueDate);

            entityItemsList = dbHelper.FetchMultipleBySqlQuery(queryString).Entities;

            //متن خطا اصلاح شود*************************************
            if (entityItemsList.Count < 1)
                throw new AfwException("سطر بستانکاری با شرایط خاص واحد سازمانی ، سال مالی و سند مالی یافت نشد.");

            foreach (var entityItem in entityItemsList)
            {
                var entity = new Entity();
                entity.AddField("accountID", entityItem.GetFieldValue<Guid>("TarafHesabeAnbarAccount"));
                entity.AddField("personID", null);
                entity.AddField("costCenterID", null);
                entity.AddField("projectID", null);
                entity.AddField("foreignCurrencyID", null);
                entity.AddField("note",  "جمع بستانکاری های " + entityItem.GetFieldValue<string>("Title"));
                entity.AddField("creditorAmount", entityItem.GetFieldValue<decimal>("RialiAmountSum"));
                entity.AddField("debtorAmount", 0);
                entity.AddField("isActive", true);

                accDocItemList.Add(entity);
            }

            acc.Instance.InsertAccDocItems(accDocID, "", null, accDocItemList);
        }

        private void SetAccDocToWarehouseDocs(Guid accDocID, Guid financialDocType, Guid organizationUnit, Guid financialYearID, DateTime issueDate)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var vazeyatRialiShodeID = OptionSetHelper.GetOptionSetItemID("wm.VaziyatRialiAsnadAnbar", "RialiShode");
            var vazeyatRialiSanadShodeID = OptionSetHelper.GetOptionSetItemID("wm.VaziyatRialiAsnadAnbar", "SanadShode");

            string filterExpression = string.Format(@"FinancialYear = '{0}' and
		                OrganizationUnit = '{1}' and
		                FinancialDocType = '{2}' and
		                VazeyatRialiShodan = '{3}' and
                        IssueDate = '{4}' ",
                financialYearID, organizationUnit, financialDocType, vazeyatRialiShodeID, issueDate);

            var ghabzOrHavaleEntities = dbHelper.FetchMultiple("wm.GhabzOrHavale", filterExpression, null, null, null, null).Entities;

            for (int i = 0; i < ghabzOrHavaleEntities.Count; i++)
            {
                ghabzOrHavaleEntities[i].ChangeStatus = "Modify";
                ghabzOrHavaleEntities[i].SetFieldValue("AccDoc" , accDocID);
                ghabzOrHavaleEntities[i].SetFieldValue("VazeyatRialiShodan", vazeyatRialiSanadShodeID);
                dbHelper.UpdateEntity(ghabzOrHavaleEntities[i]);
            }
        }

        public string DeleteWarehouseAccDoc(DateTime fromDate, Guid financialYearID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;
            var message = "اسناد انبار به شماره های ";

            var vazeyatRialiShodeID = OptionSetHelper.GetOptionSetItemID("wm.VaziyatRialiAsnadAnbar", "RialiShode");
            var vazeyatRialiSanadShodeID = OptionSetHelper.GetOptionSetItemID("wm.VaziyatRialiAsnadAnbar", "SanadShode");
            var accDocEntities = dbHelper.FetchMultipleBySqlQuery(string.Format(@"
                select  AccDoc , AccDoc.DocNo
                from wm_GhabzOrHavaleha GhabzOrHavale
	               left join acc_AccDocs AccDoc on AccDoc.ID = GhabzOrHavale.AccDoc
                where GhabzOrHavale.AccDoc is not null and
	               GhabzOrHavale.IssueDate >= '{0}'
                group by AccDoc , DocNo", fromDate)).Entities;

            for (int i = 0; i < accDocEntities.Count; i++)
            {
                dbHelper.AdoDbHelper.ExecuteNonQuery(string.Format(@"
                    update wm_GhabzOrHavaleha
                    set AccDoc = null,
	                    VazeyatRialiShodan = '{0}'
                    where AccDoc = '{1}'", vazeyatRialiShodeID, accDocEntities[i].GetFieldValue<Guid>("AccDoc")), null);

                message += accDocEntities[i].GetFieldValue<int>("DocNo") + ( i + 1 == accDocEntities.Count ? " " : ", ");
                dbHelper.DeleteEntity(dbHelper.FetchSingleByID("acc.AccDoc", accDocEntities[i].GetFieldValue<Guid>("AccDoc") , null));
            }

            return message+ "حذف شدند.\r\n";
        }

        public void CompareRefDocItemsWithGhabzOrHavaleItems(Entity ghabzOrHavale)
        {
            //در صورتی که یک سند انبار مدرک رفرنس (عملیات مرتبط) دارد، تمام کالاهای موجود در عملیات مرتبط
            //باید با همان تعداد در سند انبار وجود داشته باشند
            //اما این که سند انبار کالاهای اضافه دیگری غیر از کالاهایی که در مدرک رفرنس وجود دارند داشته باشد مجاز است.

            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var ghabzOrHavaleTypeEntity = wm.Instance.GetGhabzOrHavaleTypeEntity(ghabzOrHavale.GetFieldValue<Guid>("GhabzOrHavaleType"));

            if (!ghabzOrHavaleTypeEntity.GetFieldValue<string>("Name").IsIn(
                "SalesProfomaHavale", "ReturnFromSalesGhabz", "AmaniSalesProfomaHavale",
                "ReturnFromAmaniGhabz", "ResideKharideDakheli", "ResideKharideKhareji", "ReturnFromBuyHavale"))
                return;
            
            var refDocTypeEntity = dbHelper.FetchSingleByID("wm.ReferenceDocType", ghabzOrHavaleTypeEntity.GetFieldValue<Guid>("ReferenceDocType"), null);
            var refDocFieldName = refDocTypeEntity.GetFieldValue<string>("RefDocFieldName");

            if (string.IsNullOrEmpty(refDocFieldName))
                return;

            //برای برخی اسناد انبار ایمپورت شده ممکن است عملیات مرجع ست نشده باشد:
            if (ghabzOrHavale.GetFieldValue<Guid?>(refDocFieldName) == null)
                return;

            EntityList ghabzOrHavaleItems = null;

            if (ghabzOrHavale.FieldExists("GhabzOrHavaleItems") && ghabzOrHavale.GetFieldValue<EntityList>("GhabzOrHavaleItems") != null)
                ghabzOrHavaleItems = ghabzOrHavale.GetFieldValue<EntityList>("GhabzOrHavaleItems");
            else
                ghabzOrHavaleItems = dbHelper.FetchMultiple("wm.GhabzOrHavaleItem",
                    string.Format("GhabzOrHavale = '{0}'", ghabzOrHavale.GetFieldValue<Guid>("ID")), null, null, null, null);

            var getRefDocItemsSqlQuery = string.Format(@"
                select RefDocItem.Stuff,
	                sum(RefDocItem.Quantity) Quantity
                from {0} RefDocItem
	                left join {1} RefDoc on RefDoc.ID = RefDocItem.{2}
                where RefDoc.ID = '{3}'
                    and RefDocItem.Stuff is not null
                group by RefDocItem.Stuff",
                refDocTypeEntity.GetFieldValue<string>("RefDocItemTableName"),
                refDocTypeEntity.GetFieldValue<string>("RefDocTableName"),
                refDocFieldName.Replace("RefDoc_", ""),
                ghabzOrHavale.GetFieldValue<Guid>(refDocFieldName));

            var refDocItems = dbHelper.FetchMultipleBySqlQuery(getRefDocItemsSqlQuery).Entities;
            foreach (var refDocItem in refDocItems)
            {
                var stuffID = refDocItem.GetFieldValue<Guid>("Stuff");
                bool stuffExists = false;
                int ghabzOrHavaleItemStuffQuantity = 0;
                
                foreach (var ghabzOrHavaleItem in ghabzOrHavaleItems.Entities.Where(o => o.ChangeStatus != EntityChangeTypes.Delete))
                {
                    if (stuffID == ghabzOrHavaleItem.GetFieldValue<Guid>("Stuff"))
                    {
                        ghabzOrHavaleItemStuffQuantity += ghabzOrHavaleItem.GetFieldValue<int>("Quantity");
                        stuffExists = true;
                    }
                }

                if (!stuffExists)
                    throw new AfwException("کالاها با کالاهای عملیات مرتبط همخوانی ندارند: '{0}' در سند انبار ثبت نشده است.",
                        cmn.Instance.GetStuffTitle(stuffID));

                if (refDocItem.GetFieldValue<int>("Quantity") != ghabzOrHavaleItemStuffQuantity)
                    throw new AfwException("تعداد '{0}' در سند انبار با تعداد آن در عملیات مرتبط برابر نیست.",
                        cmn.Instance.GetStuffTitle(stuffID));
            }
        }
    }
}
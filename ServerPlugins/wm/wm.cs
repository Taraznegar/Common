using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Reflection;
using AppFramework.DataAccess;
using System.Diagnostics;
using AppFramework.Helpers;
using AppFramework.AppServer.WarehouseManagement;
using TarazNegarAppFrameworkPlugin.ServerPlugins;

namespace AppFramework.AppServer
{
    public class wm : ISubsystem
    {
        private GhabzOrHavaleBL _GhabzOrHavaleBL;
        private GhabzOrHavaleItemBL _GhabzOrHavaleItemBL;
        private GhabzOrHavaleTypeBL _GhabzOrHavaleTypeBL;
        public InventoryValuationBL InventoryValuationBL;

        //نگهداری کد عملیات انبار که در حال حذف است 
        //در قبض و حواله های مربوط به عملیات باید چک کنیم که حتما عملیات آن هم حذف شود
        public Guid? DeletingOpID = null;

        public Guid? DeletingGhabzOrHavaleID = null;

        public bool IsRunningValuation = false;
        public bool IsRunningUnvaluation = false;
        public bool IsEvaluatingDocsForValuation = false;
        public bool IsInManualValuation = false;

        List<Entity> _CachedGhabzOrHavaleTypes = null;
        public List<Entity> CachedGhabzOrHavaleTypes
        {
            get
            {
                if (_CachedGhabzOrHavaleTypes == null)
                _CachedGhabzOrHavaleTypes = CoreComponent.Instance.MainDbHelper
                    .FetchMultiple("wm.GhabzOrHavaleType", null, null, null, null, null).Entities;

                return _CachedGhabzOrHavaleTypes;
            }
        }

        public static class SystemGhabzOrHavaleTypes
        {
            public class SystemGhabzOrHavaleType
            {
                public SystemGhabzOrHavaleType(string name)
                {
                    this.Name = name;
                }

                public string Name { get; private set; }
                public Entity Entity { get { return wm.Instance.GetGhabzOrHavaleTypeEntity(Name); } }
                public Guid ID { get { return Entity.GetFieldValue<Guid>("ID"); } }
            }

            public static SystemGhabzOrHavaleType SalesProfomaHavale = new SystemGhabzOrHavaleType("SalesProfomaHavale");
            public static SystemGhabzOrHavaleType HavaleTaghirVaziateKalayeGhetehBardariShodeh = new SystemGhabzOrHavaleType("HavaleTaghirVaziateKalayeGhetehBardariShodeh");
            public static SystemGhabzOrHavaleType HavaleAmaliateMontage = new SystemGhabzOrHavaleType("HavaleAmaliateMontage");
            public static SystemGhabzOrHavaleType ReturnFromBuyHavale = new SystemGhabzOrHavaleType("ReturnFromBuyHavale");
            public static SystemGhabzOrHavaleType ResideKharideKhareji = new SystemGhabzOrHavaleType("ResideKharideKhareji");
            public static SystemGhabzOrHavaleType ReturnFromAmaniGhabz = new SystemGhabzOrHavaleType("ReturnFromAmaniGhabz");
            public static SystemGhabzOrHavaleType GhabzeKalahayeGhetehBardariShodeh = new SystemGhabzOrHavaleType("GhabzeKalahayeGhetehBardariShodeh");
            public static SystemGhabzOrHavaleType ResideKharideDakheli = new SystemGhabzOrHavaleType("ResideKharideDakheli");
            public static SystemGhabzOrHavaleType GhabzeTaghirVaziateKalayeGhetehBardariShodeh = new SystemGhabzOrHavaleType("GhabzeTaghirVaziateKalayeGhetehBardariShodeh");
            public static SystemGhabzOrHavaleType StuffStatusChangeAndTransferGhabz = new SystemGhabzOrHavaleType("StuffStatusChangeAndTransferGhabz");
            public static SystemGhabzOrHavaleType HavaleKaheshArzesheKalayeGhetehBardariShodeh = new SystemGhabzOrHavaleType("HavaleKaheshArzesheKalayeGhetehBardariShodeh");
            public static SystemGhabzOrHavaleType AmaniSalesProfomaHavale = new SystemGhabzOrHavaleType("AmaniSalesProfomaHavale");
            public static SystemGhabzOrHavaleType ReturnFromSales_Ghabz = new SystemGhabzOrHavaleType("ReturnFromSales_Ghabz");
            public static SystemGhabzOrHavaleType StuffStatusChangeAndTransferHavale = new SystemGhabzOrHavaleType("StuffStatusChangeAndTransferHavale");
            public static SystemGhabzOrHavaleType ResideAmaliateMontage = new SystemGhabzOrHavaleType("ResideAmaliateMontage");
            public static SystemGhabzOrHavaleType ResideAmaliateDemontage = new SystemGhabzOrHavaleType("ResideAmaliateDemontage");
            public static SystemGhabzOrHavaleType HavaleAmaliateDemontage = new SystemGhabzOrHavaleType("HavaleAmaliateDemontage");
        }

        public wm()
        {
            if (CoreComponent.Instance.SubsystemObjectExists("wm"))
                throw new AfwException("wm component is already created!");

            _GhabzOrHavaleBL = new GhabzOrHavaleBL();
            _GhabzOrHavaleItemBL = new GhabzOrHavaleItemBL();
            _GhabzOrHavaleTypeBL = new GhabzOrHavaleTypeBL();
            InventoryValuationBL = new InventoryValuationBL();
        }

        public static wm Instance
        {
            get
            {
                return CoreComponent.Instance.GetSubsystemObject("wm") as wm;
            }
        }

        public Entity GetGhabzOrHavaleTypeEntity(Guid id)
        {
            return CachedGhabzOrHavaleTypes.FirstOrDefault(o => o.GetFieldValue<Guid>("ID") == id);
        }

        public Entity GetGhabzOrHavaleTypeEntity(string name)
        {
            var ghabzOrHavaleTypeEntity = CachedGhabzOrHavaleTypes.FirstOrDefault(o => o.GetFieldValue<string>("Name") == name);

            if (ghabzOrHavaleTypeEntity != null)
                return ghabzOrHavaleTypeEntity;
            else
                throw new AfwException("GhabzOrHavaleType with name '{0}' not found.", name);
        }

        public int GetStuffRealStock(Guid stuffID, Guid? stuffLocationID, Guid? stuffStatusID, string batchNumber,
            DateTime? issueDate, DateTime? creationTime)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            try
            {
                string sqlQuery = string.Format(@"select wm.GetStuffRealStock('{0}', {1}, {2}, {3}, {4}, {5})",
                    stuffID,
                    stuffLocationID == null ? "null" : "'" + stuffLocationID + "'",
                    stuffStatusID == null ? "null" : "'" + stuffStatusID + "'",
                    batchNumber == null ? "null" : "'" + batchNumber + "'",
                    issueDate == null ? "null" : "'" + issueDate + "'",
                    creationTime == null ? "null" : "'" + creationTime + "'");

                return dbHelper.AdoDbHelper.ExecuteScalar<int>(sqlQuery);
            }
            catch (Exception ex)
            {
                throw new Exception("Error in GetStuffRealStock.", ex);
            }
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "GhabzOrHavale")]
        public void BeforeApplyGhabzOrHavaleChanges(EntityDbHelper dbHelper, Entity entity)
        {
            if (entity.ChangeStatus == EntityChangeTypes.Delete)
                DeletingGhabzOrHavaleID = entity.GetFieldValue<Guid>("ID");

            _GhabzOrHavaleBL.BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.AfterApplyEntityChanges, "GhabzOrHavale")]
        public void AfterApplyGhabzOrHavaleChanges(EntityDbHelper dbHelper, Entity entity)
        {
            _GhabzOrHavaleBL.AfterApplyChanges(dbHelper, entity);
            DeletingGhabzOrHavaleID = null;
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "GhabzOrHavaleItem")]
        public void BeforeApplyGhabzOrHavaleItemChanges(EntityDbHelper dbHelper, Entity entity)
        {
            _GhabzOrHavaleItemBL.BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.AfterApplyEntityChanges, "GhabzOrHavaleItem")]
        public void AfterApplyGhabzOrHavaleItemChanges(EntityDbHelper dbHelper, Entity entity)
        {
            _GhabzOrHavaleItemBL.AfterApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "GhabzOrHavaleType")]
        public void BeforeApplyGhabzOrHavaleTypeChanges(EntityDbHelper dbHelper, Entity entity)
        {
            _GhabzOrHavaleTypeBL.BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "GhetehBardariAzKala")]
        public void BeforeApplyGhetehBardariAzKalaChanges(EntityDbHelper dbHelper, Entity entity)
        {
            if (entity.ChangeStatus == EntityChangeTypes.Delete)
                DeletingOpID = entity.GetFieldValue<Guid>("ID");

            new GhetehBardariAzKalaBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.AfterApplyEntityChanges, "GhetehBardariAzKala")]
        public void AfterApplyGhetehBardariAzKalaChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new GhetehBardariAzKalaBL().AfterApplyChanges(dbHelper, entity);
            DeletingOpID = null;
        }


        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "StuffStatusChangeAndTransfer")]
        public void BeforeApplyStuffStatusChangeAndTransferChanges(EntityDbHelper dbHelper, Entity entity)
        {
            if (entity.ChangeStatus == EntityChangeTypes.Delete)
                DeletingOpID = entity.GetFieldValue<Guid>("ID");

            new StuffStatusChangeAndTransferBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.AfterApplyEntityChanges, "StuffStatusChangeAndTransfer")]
        public void AfterApplyStuffStatusChangeAndTransferChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new StuffStatusChangeAndTransferBL().AfterApplyChanges(dbHelper, entity);
            DeletingOpID = null;
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "WarehouseHybridOperation")]
        public void BeforeApplyWarehouseHybridOperationChanges(EntityDbHelper dbHelper, Entity entity)
        {
            if (entity.ChangeStatus == EntityChangeTypes.Delete)
                DeletingOpID = entity.GetFieldValue<Guid>("ID");

            new WarehouseHybridOperationBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.AfterApplyEntityChanges, "WarehouseHybridOperation")]
        public void AfterApplyWarehouseHybridOperationChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new WarehouseHybridOperationBL().AfterApplyChanges(dbHelper, entity);
            DeletingOpID = null;
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "MontageOrDemontage")]
        public void BeforeApplyMontageOrDemontageChanges(EntityDbHelper dbHelper, Entity entity)
        {
            if (entity.ChangeStatus == EntityChangeTypes.Delete)
                DeletingOpID = entity.GetFieldValue<Guid>("ID");

            new MontageOrDemontageBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.AfterApplyEntityChanges, "MontageOrDemontage")]
        public void AfterApplyMontageOrDemontageChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new MontageOrDemontageBL().AfterApplyChanges(dbHelper, entity);
            DeletingOpID = null;
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "AuthorizedSystemUser")]
        public void BeforeApplyAuthorizedSystemUserChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new AuthorizedSystemUserBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "ArzeshRialiEstandardKala")]
        public void BeforeApplyArzeshRialiEstandardKalaChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new ArzeshRialiEstandardKalaBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "StuffSerialNumber")]
        public void BeforeApplyStuffSerialNumberChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new StuffSerialNumberBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.AfterApplyEntityChanges, "Sefaresh")]
        public void AfterApplySefareshChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new SefareshBL().AfterApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "WarehouseDocsAccSettings")]
        public void BeforeApplyWarehouseDocsAccSettingsChangeAndTransferChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new WarehouseDocsAccSettingsBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.OnEntityListOfDataListRequested, "StuffsCirculationReport")]
        public void OnEntityListOfStuffsCirculationReportRequested(Entity dataList, string[] parameterNames, string[] parameterValues, string filterExpression, string sortExpression, int? startRecord, int? maxRecords,
            ref EntityList resultEntityList)
        {
            new WMReportsBL().OnEntityListOfStuffsCirculationReportRequested(dataList, parameterNames, parameterValues, filterExpression, sortExpression, startRecord, maxRecords, ref resultEntityList);
        }

        [ServerEvent(ServerEventTypes.OnDataListEntityCountRequested, "StuffsCirculationReport")]
        public void OnStuffsCirculationReportEntityCountRequested(Entity dataList, string[] parameterNames, string[] parameterValues, string filterExpression,
            ref int? entityCount)
        {
            new WMReportsBL().OnStuffsCirculationReportEntityCountRequested(dataList, parameterNames, parameterValues, filterExpression, ref entityCount);
        }

        [ServerEvent(ServerEventTypes.OnEntityListOfDataListRequested, "StuffsStockReport")]
        public void OnEntityListOfStuffsStockReportRequested(Entity dataList, string[] parameterNames, string[] parameterValues, string filterExpression, string sortExpression, int? startRecord, int? maxRecords,
            ref EntityList resultEntityList)
        {
            new WMReportsBL().OnEntityListOfStuffsStockReportRequested(dataList, parameterNames, parameterValues, filterExpression, sortExpression, startRecord, maxRecords, ref resultEntityList);
        }

        [ServerEvent(ServerEventTypes.OnDataListEntityCountRequested, "StuffsStockReport")]
        public void OnStuffsStockReportEntityCountRequested(Entity dataList, string[] parameterNames, string[] parameterValues, string filterExpression,
            ref int? entityCount)
        {
            new WMReportsBL().OnStuffsStockReportEntityCountRequested(dataList, parameterNames, parameterValues, filterExpression, ref entityCount);
        }

        [ServerEvent(ServerEventTypes.AfterApplyEntityChanges, "WarehouseInventoryReserveListItem")]
        public void AfterApplyWarehouseInventoryReserveListItemChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new WarehouseInventoryReserveListItemBL().AfterApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "WarehouseInventoryReserveListItem")]
        public void BeforeApplyWarehouseInventoryReserveListItemChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new WarehouseInventoryReserveListItemBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "OnTheWayStuffReceiveInfo")]
        public void BeforeApplyOnTheWayStuffReceiveInfoChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new OnTheWayStuffReceiveInfoBL().BeforeApplyChanges(dbHelper, entity);
        }

        public EntityList GenerateGhabzOrhavaleItems(Guid refDocTypeID, Guid refDocID, Guid ghabzOrHavaleID)
        {
            return _GhabzOrHavaleBL.GenerateItems(refDocTypeID, refDocID, ghabzOrHavaleID);
        }

        public int GetGhabzOrHavaleItemSavedSerialNumbersCount(Guid ghabzOrHavaleItemID)
        {
            return _GhabzOrHavaleItemBL.GetItemSavedSerialNumbersCount(ghabzOrHavaleItemID);
        }

        public int GetNewGhabzOrHavaleNumber(Guid warehouseDocType, Guid stuffLocation)
        {
            return _GhabzOrHavaleBL.GetNewGhabzOrHavaleNumber(warehouseDocType, stuffLocation);
        }

        public void CheckStuffsStock(List<Entity> items, Guid? stuffLocationID, DateTime? issueDate, DateTime? creationTime, 
            Guid? salesInvoiceID)
        {
            _GhabzOrHavaleBL.CheckStuffsStock(items, stuffLocationID, issueDate, creationTime, salesInvoiceID);
        }

        public int GetNotReceivedStuffNumber(Entity onTheWayStuffInfoEntity)
        {
            return new OnTheWayStuffInfoBL().GetNotReceivedStuffNumber(onTheWayStuffInfoEntity);
        }

        public int GetUnreservedStuffStock(Guid stuffID, Guid? stuffStatus, Guid? warehouseInventoryReserveItemEditedQuantity)
        {
            return new WarehouseInventoryReserveListItemBL().GetUnreservedStuffStock(stuffID, stuffStatus, warehouseInventoryReserveItemEditedQuantity);
        }

        public void SaveStuffSerialNumbers(EntityList stuffSerialNumbers)
        {
            new StuffSerialNumberBL().SaveStuffSerialNumbers(stuffSerialNumbers);
        }

        public void CompareRefDocItemsWithGhabzOrHavaleItems(Entity ghabzOrHavale)
        {
            new GhabzOrHavaleBL().CompareRefDocItemsWithGhabzOrHavaleItems(ghabzOrHavale);
        }

        public void SetRialiNashodeFromDate(DateTime fromDate)
        {
            InventoryValuationBL.SetRialiNashodeFromDate(fromDate);
        }

        public void SaveRialiAmountChanges(Guid ghabzOrHavaleID, Guid ghabzOrHavaleItemID, decimal rialiAmount)
        {
            InventoryValuationBL.SaveRialiAmountChanges(ghabzOrHavaleID, ghabzOrHavaleItemID, rialiAmount);
        }


        public decimal? GetArzeshRialiEstandardKala(Guid stuffID, DateTime date)
        {
            return new ArzeshRialiEstandardKalaBL().GetArzeshRialiEstandardKala(stuffID, date);
        }

        public string GetWareHouseDocRialiReferenceLookupFilterExpression(Entity ghabzOrHavaleEntity)
        {
            return _GhabzOrHavaleBL.GetWareHouseDocRialiReferenceLookupFilterExpression(ghabzOrHavaleEntity);
        }

        public Entity GetWarehouseDocsAccSetting(Guid financialYear, Guid ghabzOrHavaleType)
        {
            return new WarehouseDocsAccSettingsBL().GetWarehouseDocsAccSetting(financialYear , ghabzOrHavaleType);
        }

        public bool ExistWarehouseDocsAccSetting(Guid financialYear, Guid ghabzOrHavaleType)
        {
            return new WarehouseDocsAccSettingsBL().ExistWarehouseDocsAccSetting(financialYear, ghabzOrHavaleType);
        }

        public string GenerateWarehouseAccDoc(DateTime toDate, Guid financialYearID)
        {
            return _GhabzOrHavaleBL.GenerateWarehouseAccDoc(toDate, financialYearID);
        }

        public string DeleteWarehouseAccDoc(DateTime fromDate, Guid financialYearID)
        {
            return _GhabzOrHavaleBL.DeleteWarehouseAccDoc(fromDate, financialYearID);
        }

        public decimal? GetGhabzOrHavaleRialiAmountSum(Guid ghabzOrhavaleID)
        {
            return InventoryValuationBL.GetGhabzOrHavaleRialiAmountSum(ghabzOrhavaleID);
        }

        public void SaveWarehouseDocsAccSettingsCopy(Guid financialYear, Guid ghabzOrHavaleType, Guid tarafHesabeAnbarAccount)
        {
            new WarehouseDocsAccSettingsBL().SaveWarehouseDocsAccSettingsCopy(financialYear , ghabzOrHavaleType , tarafHesabeAnbarAccount);
        }

        public EntityList ValuateWarehouseDocs(DateTime? fromDate, DateTime toDate)
        {
            return InventoryValuationBL.ValuateWarehouseDocs(fromDate, toDate);
        }

        public EntityList GetKarteksTedadiRialiData(string fromDate, string toDate, Guid stuff, Guid? person, Guid? stuffLocation, Guid? organizationUnit, Guid? financialDocType)
        {
            return new WMReportsBL().GetKarteksTedadiRialiData(fromDate, toDate, stuff, person, stuffLocation, organizationUnit, financialDocType);
        }

        public EntityList GetKarteksTedadiData(string fromDate, string toDate, Guid stuff, Guid? person, Guid? stuffLocation, Guid? organizationUnit, Guid? financialDocType)
        {
            return new WMReportsBL().GetKarteksTedadiData(fromDate, toDate, stuff, person, stuffLocation, organizationUnit, financialDocType);
        }

        public void CopyFinancialYearSettings(Guid sourceFinancialYearID, Guid destinationFinancialYearID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            dbHelper.AdoDbHelper.ExecuteNonQuery(string.Format(@"exec wm.CopyFinancialYearSettings '{0}', '{1}'", sourceFinancialYearID, destinationFinancialYearID));                  
        }
    }
}

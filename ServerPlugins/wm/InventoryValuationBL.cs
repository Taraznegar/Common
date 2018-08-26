using AppFramework;
using AppFramework.AppServer;
using AppFramework.DataAccess;
using AppFramework.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;

namespace AppFramework.AppServer.WarehouseManagement
{
    public class InventoryValuationBL
    {
        public static class Valuation_PreviousItemsCheckingMode
        {
            public const string All = "All";
            public const string NoChecking = "NoChecking";
            public const string SameStuffs = "SameStuffs";
        };

        private Guid _ValuationStatus_NotValuated;
        private Guid _ValuationStatus_Valuated;
        private Guid _ValuationStatus_SanadShodeID;

        List<Entity> _WarehouseDocsOfDate = null;
        List<Entity> _WarehouseDocsOfDateInValuationList = null;
        List<Guid> _StuffsWithValuationError = null;

        public bool IsInValuationOperation { 
            get
            {
                return wm.Instance.IsRunningValuation || wm.Instance.IsRunningUnvaluation
                    || wm.Instance.IsEvaluatingDocsForValuation || wm.Instance.IsInManualValuation;
            }
        }

        public InventoryValuationBL()
        {
            _ValuationStatus_NotValuated = OptionSetHelper.GetOptionSetItemID("wm.VaziyatRialiAsnadAnbar", "RialiNashode");
            _ValuationStatus_Valuated = OptionSetHelper.GetOptionSetItemID("wm.VaziyatRialiAsnadAnbar", "RialiShode");
            _ValuationStatus_SanadShodeID = OptionSetHelper.GetOptionSetItemID("wm.VaziyatRialiAsnadAnbar", "SanadShode");
        }

        public void SaveRialiAmountChanges(Guid ghabzOrHavaleID, Guid ghabzOrHavaleItemID, decimal rialiAmount)
        {
            wm.Instance.IsInManualValuation = true;
            try
            {
                var dbHelper = CoreComponent.Instance.MainDbHelper;

                CheckValuationPermission();

                //bool canSetRialiShode = true;

                var ghabzOrHavale = dbHelper.FetchSingleByID("wm.GhabzOrHavale", ghabzOrHavaleID, new string[] { "GhabzOrHavaleItems" });

                if (ghabzOrHavale.GetFieldValue<Guid>("VazeyatRialiShodan") == _ValuationStatus_Valuated)
                    throw new AfwException("برای تغییرات ابتدا رسید/حواله های بعد از سطر انتخاب شده را به حالت 'ریالی نشده' انتقال دهید.");
                else if (ghabzOrHavale.GetFieldValue<Guid>("VazeyatRialiShodan") != _ValuationStatus_NotValuated)
                    throw new AfwException("رسید/حواله انتخاب شده در وضعیت 'سند شده' است.");

                var ghabzOrHavaleItems = ghabzOrHavale.GetFieldValue<EntityList>("GhabzOrHavaleItems").Entities;

                var item = ghabzOrHavaleItems.FirstOrDefault(o => o.GetFieldValue<Guid>("ID") == ghabzOrHavaleItemID);
                item.SetFieldValue("RialiAmount", rialiAmount);
                dbHelper.UpdateEntity(item);

                //if (!ghabzOrHavaleItems.Any(o => o.GetFieldValue<decimal?>("RialiAmount") == null))
                //    SetRialiShodeDasti(ghabzOrHavale);
            }
            finally
            {
                wm.Instance.IsInManualValuation = false;
            }
        }

        private void ValuateWarehouseDoc(Entity ghabzOrHavaleEntity)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var valuationMethod_Dasti = OptionSetHelper.GetOptionSetItemID("wm.NahveRialiNemodan", "Dasti");
            var valuationMethod_MablaghEstandard = OptionSetHelper.GetOptionSetItemID("wm.NahveRialiNemodan", "MablaghEstandard");
            var valuationMethod_MyangineSayyar = OptionSetHelper.GetOptionSetItemID("wm.NahveRialiNemodan", "MyangineSayyar");
            var valuationMethod_Sefr = OptionSetHelper.GetOptionSetItemID("wm.NahveRialiNemodan", "Sefr");
            var valuationMethod_SanadReference = OptionSetHelper.GetOptionSetItemID("wm.NahveRialiNemodan", "SanadReference");
            var valuationMethod_SarjameReference = OptionSetHelper.GetOptionSetItemID("wm.NahveRialiNemodan", "SarjameReference");
            var valuationMethod_BarnameKhas = OptionSetHelper.GetOptionSetItemID("wm.NahveRialiNemodan", "BarnameKhas");

            var warehouseDocValuationMethod = GetValuationMethod(ghabzOrHavaleEntity);

            if (warehouseDocValuationMethod == valuationMethod_Dasti
                || ghabzOrHavaleEntity.GetFieldValue<bool?>("ForceManualRiali") == true)
                SetRialiShodeDasti(ghabzOrHavaleEntity);
            else if (warehouseDocValuationMethod == valuationMethod_MablaghEstandard)
                SetRialiShodeMablaghEstandard(ghabzOrHavaleEntity);
            else if (warehouseDocValuationMethod == valuationMethod_Sefr)
                SetRialiShodeSefr(ghabzOrHavaleEntity);
            else if (warehouseDocValuationMethod == valuationMethod_MyangineSayyar)
                SetRialiShodeMyangineSayyar(ghabzOrHavaleEntity);
            else if (warehouseDocValuationMethod == valuationMethod_SanadReference)
                SetRialiShodeSanadReference(ghabzOrHavaleEntity);
            else if (warehouseDocValuationMethod == valuationMethod_SarjameReference)
                SetRialiShodeSarjameReference(ghabzOrHavaleEntity);
            else if (warehouseDocValuationMethod == valuationMethod_BarnameKhas)
                throw new Exception(string.Format("{0}:\r\n {1}",
                    GetGhabzOrHavalePreviewText(ghabzOrHavaleEntity), "Cannot valuate by 'BarnameKhas' method!"));
            else
                throw new Exception(string.Format("{0}:\r\n valuation method '{1}' is not supported in ValuateWarehouseDoc().",
                    GetGhabzOrHavalePreviewText(ghabzOrHavaleEntity), 
                    OptionSetHelper.GetOptionSetItemTitle(warehouseDocValuationMethod)));
        }

        private Guid GetValuationMethod(Entity ghabzOrHavaleEntity)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var nahveRialiNemodanID = wm.Instance.GetGhabzOrHavaleTypeEntity(ghabzOrHavaleEntity.GetFieldValue<Guid>("GhabzOrHavaleType"))
                .GetFieldValue<Guid?>("NahveRialiNemodan");

            if (nahveRialiNemodanID == null)
                throw new AfwException(
                    string.Format("{0}: نحوه ریالی نمودن در تنظیمات نوع رسید/ حواله تعیین نشده است.",
                        GetGhabzOrHavalePreviewText(ghabzOrHavaleEntity)));

            return (Guid)nahveRialiNemodanID;
        }

        private void SetRialiShodeSarjameReference(Entity ghabzOrHavaleEntity)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            try
            {
                if (ghabzOrHavaleEntity.GetFieldValue<Guid>("VazeyatRialiShodan") != _ValuationStatus_NotValuated)
                    throw new AfwException("رسید در وضعیت 'ریالی نشده' نیست.");

                //عملیات ریالی شدن باعث کند شدن کل سیستم میشد. بنابراین کلیه ترنزکشن ها غیر فعال شدند
                //using (var tranManager = new DbTransactionManager(dbHelper))
                //{
                    var itemsEntities = ghabzOrHavaleEntity.GetFieldValue<EntityList>("GhabzOrHavaleItems").Entities;

                    if (ghabzOrHavaleEntity.GetFieldValue<Guid?>("WareHouseDocRialiReference") == null)
                        throw new AfwException("رفرنس مالی انتخاب نشده است.");

                    var warehouseDocRialiReferenceEntity = dbHelper.FetchSingleByID("wm.GhabzOrHavale",
                        ghabzOrHavaleEntity.GetFieldValue<Guid>("WareHouseDocRialiReference"),
                        new string[] { "GhabzOrHavaleItems" });
                    if (warehouseDocRialiReferenceEntity == null)
                        throw new AfwException("رفرنس مالی یافت نشد.");

                    if (warehouseDocRialiReferenceEntity.GetFieldValue<Guid>("VazeyatRialiShodan") == _ValuationStatus_NotValuated)
                        throw new AfwException("ابتدا {0} را ریالی نمایید.",
                            GetGhabzOrHavalePreviewText(warehouseDocRialiReferenceEntity));

                    var wareHouseDocRialiReferenceItemsEntities = warehouseDocRialiReferenceEntity.GetFieldValue<EntityList>("GhabzOrHavaleItems").Entities;

                    if (itemsEntities.Count != 1)
                        throw new AfwException("رسید/ حواله با نحوه ریالی شدن 'سرجمع رفرنس' نباید بیشتر از یک آیتم داشته باشد.");

                    decimal sum = 0;
                    for (int i = 0; i < wareHouseDocRialiReferenceItemsEntities.Count; i++)
                        sum += wareHouseDocRialiReferenceItemsEntities[i].GetFieldValue<decimal>("RialiAmount");

                    itemsEntities[0].SetFieldValue("RialiAmount", sum);

                    //if (wm.Instance.IsRunningValuation)
                    //    CheckPreviousGhabzOrHavaleItemsHaveValue(ghabzOrHavaleEntity,
                    //        Valuation_PreviousItemsCheckingMode.SameStuffs,
                    //        itemsEntities[0].GetFieldValue<Guid>("Stuff"));

                    dbHelper.UpdateEntity(itemsEntities[0]);

                    ghabzOrHavaleEntity.SetFieldValue("VazeyatRialiShodan", _ValuationStatus_Valuated);
                    dbHelper.UpdateEntity(ghabzOrHavaleEntity);

                    //tranManager.Commit();
                //}
            }
            catch (Exception ex)
            {
                throw new Exception(string.Format("{0}:\r\n {1}",
                    GetGhabzOrHavalePreviewText(ghabzOrHavaleEntity), ex.Message));
            }
        }

        private void SetRialiShodeResideDemontaj(Entity resideDemontage)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            try
            {
                if (resideDemontage.GetFieldValue<Guid>("VazeyatRialiShodan") != _ValuationStatus_NotValuated)
                    throw new AfwException("رسید در وضعیت 'ریالی نشده' نیست.");

                //عملیات ریالی شدن باعث کند شدن کل سیستم میشد. بنابراین کلیه ترنزکشن ها غیر فعال شدند
                //using (var tranManager = new DbTransactionManager(dbHelper))
                //{
                    var resideDemontageItemsEntityList = resideDemontage.GetFieldValue<EntityList>("GhabzOrHavaleItems");

                    if (resideDemontage.GetFieldValue<Guid?>("WareHouseDocRialiReference") == null)
                        throw new AfwException("رفرنس مالی رسید مشخص نشده است.");

                    var havaleDemontage = dbHelper.FetchSingleByID("wm.GhabzOrHavale",
                        resideDemontage.GetFieldValue<Guid>("WareHouseDocRialiReference"),
                        new string[] { "GhabzOrHavaleItems" });

                    if (havaleDemontage == null)
                        throw new AfwException("حواله دمونتاژ یافت نشد.");

                    if (havaleDemontage.GetFieldValue<Guid>("VazeyatRialiShodan") == _ValuationStatus_NotValuated)
                        throw new AfwException("{0} ریالی نشده است.",
                            GetGhabzOrHavalePreviewText(havaleDemontage));

                    var havaleDemontageItems = havaleDemontage.GetFieldValue<EntityList>("GhabzOrHavaleItems").Entities;

                    if (havaleDemontageItems.Count != 1)
                        throw new AfwException("حواله دمونتاژ نباید بیشتر از یک آیتم داشته باشد.");

                    if (resideDemontage.GetFieldValue<Guid?>("RefDoc_DemontageOp") == null)
                        throw new AfwException("عملیات دمونتاژ مشخص نشده است.");

                    var demontageOpItems = dbHelper.FetchMultiple("wm.MontageOrDemontageStuffComponent",
                        string.Format("MontageOrDemontage = '{0}'", resideDemontage.GetFieldValue<Guid>("RefDoc_DemontageOp")),
                        null, null, null, null).Entities;

                    var havaleRialiAmount = havaleDemontageItems[0].GetFieldValue<decimal>("RialiAmount");
                    decimal resideDemontageItemsTotalRialiAmount = 0;

                    foreach (var residItem in resideDemontageItemsEntityList.Entities)
                    {
                        var relatedDemontageItem = demontageOpItems.FirstOrDefault(o => 
                            o.GetFieldValue<Guid>("Stuff") == residItem.GetFieldValue<Guid>("Stuff")
                            && o.GetFieldValue<string>("BatchNumber") == residItem.GetFieldValue<string>("BatchNumber")
                            && o.GetFieldValue<Guid>("StuffStatus") == residItem.GetFieldValue<Guid>("StuffStatus"));

                        if (relatedDemontageItem == null)
                            throw new AfwException("جزء مرتبط با آیتم رسید دمونتاژ '{0}' با شماره بچ '{1}' و وضعیت '{2}' در عملیات دمونتاژ یافت نشد.",
                                cmn.Instance.GetStuffTitle(residItem.GetFieldValue<Guid>("Stuff")),
                                residItem.GetFieldValue<string>("BatchNumber"),
                                dbHelper.FetchSingleByID("wm.StuffStatus", residItem.GetFieldValue<Guid>("StuffStatus"), null).GetFieldValue<string>("Title"));

                        var itemValuationPercent = relatedDemontageItem.GetFieldValue<decimal?>("Demontage_ValuationPercent");

                        if (itemValuationPercent == null)
                            throw new AfwException("درصد ریالی حداقل در یکی از اجزاء محصول در عملیات دمونتاژ مشخص نشده است.");

                        decimal residItemRialiAmount = 0;

                        if (havaleRialiAmount != 0)
                        {
                            residItemRialiAmount = Math.Round(havaleRialiAmount * (decimal)itemValuationPercent / 100);
                            resideDemontageItemsTotalRialiAmount += residItemRialiAmount;
                        }
                        
                        residItem.SetFieldValue("RialiAmount", residItemRialiAmount);
                    }

                    if (resideDemontageItemsTotalRialiAmount != havaleRialiAmount)
                    {
                        var lastResidItem = resideDemontageItemsEntityList.Entities.Last(
                            o => o.GetFieldValue<decimal?>("Demontage_ValuationPercent") != 0);
                        var itemRialiAmount = lastResidItem.GetFieldValue<decimal>("RialiAmount");
                        itemRialiAmount = itemRialiAmount + (havaleRialiAmount - resideDemontageItemsTotalRialiAmount);

                        lastResidItem.SetFieldValue("RialiAmount", itemRialiAmount);
                    }

                    dbHelper.ApplyChanges(resideDemontageItemsEntityList);

                    //if (wm.Instance.IsRunningValuation)
                    //    CheckPreviousGhabzOrHavaleItemsHaveValue(ghabzOrHavaleEntity,
                    //        Valuation_PreviousItemsCheckingMode.SameStuffs,
                    //        itemsEntities[0].GetFieldValue<Guid>("Stuff"));

                    
                    resideDemontage.SetFieldValue("VazeyatRialiShodan", _ValuationStatus_Valuated);
                    dbHelper.UpdateEntity(resideDemontage);

                    //tranManager.Commit();
                //}
            }
            catch (Exception ex)
            {
                throw new Exception(string.Format("{0}:\r\n {1}",
                    GetGhabzOrHavalePreviewText(resideDemontage), ex.Message));
            }
        }

        private void SetRialiShodeSanadReference(Entity ghabzOrHavaleEntity)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            try
            {
                if (ghabzOrHavaleEntity.GetFieldValue<Guid>("VazeyatRialiShodan") != _ValuationStatus_NotValuated)
                    throw new AfwException("رسید/حواله در وضعیت 'ریالی نشده' نیست.");

                //عملیات ریالی شدن باعث کند شدن کل سیستم میشد. بنابراین کلیه ترنزکشن ها غیر فعال شدند
                //using (var tranManager = new DbTransactionManager(dbHelper))
                //{
                    var itemsEntities = ghabzOrHavaleEntity.GetFieldValue<EntityList>("GhabzOrHavaleItems").Entities;

                    if (ghabzOrHavaleEntity.GetFieldValue<Guid?>("WareHouseDocRialiReference") == null)
                        throw new AfwException("رفرنس مالی انتخاب نشده است.");

                    var warehouseDocRialiReferenceEntity = dbHelper.FetchSingleByID("wm.GhabzOrHavale", ghabzOrHavaleEntity.GetFieldValue<Guid>("WareHouseDocRialiReference"),
                        new string[] { "GhabzOrHavaleItems" });
                    if (warehouseDocRialiReferenceEntity == null)
                        throw new AfwException("رفرنس مالی یافت نشد.");

                    var wareHouseDocRialiReferenceItemsEntities = warehouseDocRialiReferenceEntity.GetFieldValue<EntityList>("GhabzOrHavaleItems").Entities;

                    //تنها کافی است همه آیتمهای سند در حال ریالی شدن در سند رفرنس موجود باشند
                    //if (itemsEntities.Count != wareHouseDocRialiReferenceItemsEntities.Count)
                    //    throw new AfwException("تعداد آیتم ها با تعداد آیتم های رفرنس مالی ({0}) برابر نیست.",
                    //        GetGhabzOrHavalePreviewText(warehouseDocRialiReferenceEntity));

                    if (warehouseDocRialiReferenceEntity.GetFieldValue<Guid>("VazeyatRialiShodan") == _ValuationStatus_NotValuated)
                        throw new AfwException("ابتدا {0} را ریالی نمایید.",
                            GetGhabzOrHavalePreviewText(warehouseDocRialiReferenceEntity));

                    foreach (var item in itemsEntities)
                    {
                        var foundReferenceItems = wareHouseDocRialiReferenceItemsEntities.Where(
                            o => o.GetFieldValue<Guid>("Stuff") == item.GetFieldValue<Guid>("Stuff")
                                && o.GetFieldValue<string>("BatchNumber") == item.GetFieldValue<string>("BatchNumber")
                                && o.GetFieldValue<Guid?>("StuffStatus") == item.GetFieldValue<Guid?>("StuffStatus")).ToList();

                        if (foundReferenceItems.Count == 1)
                        {
                            item.SetFieldValue("RialiAmount", foundReferenceItems[0].GetFieldValue<decimal>("RialiAmount"));
                            dbHelper.UpdateEntity(item);
                        }
                        else if (foundReferenceItems.Count == 0)
                            throw new AfwException("آیتم معادل با سطر شماره {0} در سند رفرنس مالی ({1}) یافت نشد.",
                                item.GetFieldValue<int>("RowNumber"),
                                GetGhabzOrHavalePreviewText(warehouseDocRialiReferenceEntity));
                        else if (foundReferenceItems.Count > 1)
                            throw new AfwException("برای سطر شماره {0}، بیش از یک آیتم در سند رفرنس مالی ({1}) یافت شد.",
                                item.GetFieldValue<int>("RowNumber"),
                                GetGhabzOrHavalePreviewText(warehouseDocRialiReferenceEntity));

                        //if (wm.Instance.IsRunningValuation)
                        //    CheckPreviousGhabzOrHavaleItemsHaveValue(ghabzOrHavaleEntity,
                        //        Valuation_PreviousItemsCheckingMode.SameStuffs,
                        //        itemsEntities[i].GetFieldValue<Guid>("Stuff"));
                    }

                    ghabzOrHavaleEntity.SetFieldValue("VazeyatRialiShodan", _ValuationStatus_Valuated);
                    dbHelper.UpdateEntity(ghabzOrHavaleEntity);

                    //tranManager.Commit();
                //}
            }
            catch (Exception ex)
            {
                throw new Exception(string.Format("{0}:\r\n {1}",
                    GetGhabzOrHavalePreviewText(ghabzOrHavaleEntity), ex.Message));
            }
        }

        private void SetRialiShodeMyangineSayyar(Entity ghabzOrHavaleEntity)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            try
            {
                if (ghabzOrHavaleEntity.GetFieldValue<Guid>("VazeyatRialiShodan") != _ValuationStatus_NotValuated)
                    throw new AfwException("رسید/حواله در وضعیت 'ریالی نشده' نیست.");

                //عملیات ریالی شدن باعث کند شدن کل سیستم میشد. بنابراین کلیه ترنزکشن ها غیر فعال شدند
                //using (var tranManager = new DbTransactionManager(dbHelper))
                //{
                    var itemsEntities = ghabzOrHavaleEntity.GetFieldValue<EntityList>("GhabzOrHavaleItems").Entities;
                    for (int i = 0; i < itemsEntities.Count; i++)
                    {
                        try
                        {
                            var mianginSayyar = GetMyangineSayyar(itemsEntities[i].GetFieldValue<Guid>("Stuff"),
                                itemsEntities[i].GetFieldValue<int>("Quantity"),
                                ghabzOrHavaleEntity.GetFieldValue<DateTime>("IssueDate"),
                                ghabzOrHavaleEntity.GetFieldValue<Guid>("ID"));

                            itemsEntities[i].SetFieldValue("RialiAmount", mianginSayyar);

                            //if (wm.Instance.IsRunningValuation)
                            //    CheckPreviousGhabzOrHavaleItemsHaveValue(ghabzOrHavaleEntity,
                            //        Valuation_PreviousItemsCheckingMode.SameStuffs,
                            //        itemsEntities[i].GetFieldValue<Guid>("Stuff"));

                            dbHelper.UpdateEntity(itemsEntities[i]);                        
                        }
                        catch (Exception ex)
                        {
                            throw new AfwException("خطا در ریالی نمودن سطر {0}: \r\n{1}", 
                                itemsEntities[i].GetFieldValue<int>("RowNumber"), ex.Message);
                        }
                    }

                    ghabzOrHavaleEntity.SetFieldValue("VazeyatRialiShodan", _ValuationStatus_Valuated);
                    dbHelper.UpdateEntity(ghabzOrHavaleEntity);

                    //tranManager.Commit();
                //}
            }
            catch (Exception ex)
            {
                throw new Exception(string.Format("{0}:\r\n {1}",
                    GetGhabzOrHavalePreviewText(ghabzOrHavaleEntity), ex.Message));
            }
        }

        private void SetRialiShodeSefr(Entity ghabzOrHavaleEntity)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            try
            {
                if (ghabzOrHavaleEntity.GetFieldValue<Guid>("VazeyatRialiShodan") != _ValuationStatus_NotValuated)
                    throw new AfwException("رسید/حواله در وضعیت 'ریالی نشده' نیست.");

                //using (var tranManager = new DbTransactionManager(dbHelper))
                //{
                    var itemsEntities = ghabzOrHavaleEntity.GetFieldValue<EntityList>("GhabzOrHavaleItems").Entities;
                    for (var i = 0; i < itemsEntities.Count; i++)
                    {
                        itemsEntities[i].SetFieldValue("RialiAmount", 0);

                        //if (wm.Instance.IsRunningValuation)
                        //    CheckPreviousGhabzOrHavaleItemsHaveValue(ghabzOrHavaleEntity,
                        //        Valuation_PreviousItemsCheckingMode.SameStuffs,
                        //        itemsEntities[i].GetFieldValue<Guid>("Stuff"));

                        dbHelper.UpdateEntity(itemsEntities[i]);
                    }

                    ghabzOrHavaleEntity.SetFieldValue("VazeyatRialiShodan", _ValuationStatus_Valuated);
                    dbHelper.UpdateEntity(ghabzOrHavaleEntity);

                    //tranManager.Commit();
                //}
            }
            catch (Exception ex)
            {
                throw new Exception(string.Format("{0}:\r\n {1}",
                    GetGhabzOrHavalePreviewText(ghabzOrHavaleEntity), ex.Message));
            }
        }

        private void SetRialiShodeMablaghEstandard(Entity ghabzOrHavaleEntity)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            try
            {
                if (ghabzOrHavaleEntity.GetFieldValue<Guid>("VazeyatRialiShodan") != _ValuationStatus_NotValuated)
                    throw new AfwException("رسید/حواله در وضعیت 'ریالی نشده' نیست.");

                //عملیات ریالی شدن باعث کند شدن کل سیستم میشد. بنابراین کلیه ترنزکشن ها غیر فعال شدند
                //using (var tranManager = new DbTransactionManager(dbHelper))
                //{
                    var itemsEntities = ghabzOrHavaleEntity.GetFieldValue<EntityList>("GhabzOrHavaleItems").Entities;
                    for (int i = 0; i < itemsEntities.Count; i++)
                    {
                        var stuffMablaghEstandard = wm.Instance.GetArzeshRialiEstandardKala(
                            itemsEntities[i].GetFieldValue<Guid>("Stuff"),
                            ghabzOrHavaleEntity.GetFieldValue<DateTime>("IssueDate"));

                        if (stuffMablaghEstandard == null)
                        {
                            throw new AfwException("ارزش ریالی استاندارد برای کالا ''{0}'' برای بازه تاریخ شامل تاریخ {1} ثبت نشده است.",
                                dbHelper.FetchSingleBySqlQuery(string.Format(@"
                                select StuffDef.Name
                                from cmn_StuffDefs StuffDef
                                    left join cmn_Stuffs Stuff on Stuff.StuffDef = StuffDef.ID
                                where Stuff.ID = '{0}'",
                                    itemsEntities[i].GetFieldValue<Guid>("Stuff"))).GetFieldValue<string>("Name"),
                                    DateTimeHelper.GregorianDateTimeToPersian(ghabzOrHavaleEntity.GetFieldValue<DateTime>("IssueDate")).Split(' ')[0]);
                        }

                        itemsEntities[i].SetFieldValue("RialiAmount", stuffMablaghEstandard * itemsEntities[i].GetFieldValue<decimal>("Quantity"));

                        //if (wm.Instance.IsRunningValuation)
                        //    CheckPreviousGhabzOrHavaleItemsHaveValue(ghabzOrHavaleEntity,
                        //        Valuation_PreviousItemsCheckingMode.SameStuffs,
                        //        itemsEntities[i].GetFieldValue<Guid>("Stuff"));

                        dbHelper.UpdateEntity(itemsEntities[i]);
                    }

                    ghabzOrHavaleEntity.SetFieldValue("VazeyatRialiShodan", _ValuationStatus_Valuated);

                    dbHelper.UpdateEntity(ghabzOrHavaleEntity);

                    //tranManager.Commit();
                //}
            }
            catch (Exception ex)
            {
                throw new Exception(string.Format("{0}:\r\n {1}",
                    GetGhabzOrHavalePreviewText(ghabzOrHavaleEntity), ex.Message));
            }
        }

        private void SetRialiShodeDasti(Entity ghabzOrHavaleEntity)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            try
            {
                if (ghabzOrHavaleEntity.GetFieldValue<Guid>("VazeyatRialiShodan") != _ValuationStatus_NotValuated)
                    throw new AfwException("رسید/حواله در وضعیت 'ریالی نشده' نیست.");

                //عملیات ریالی شدن باعث کند شدن کل سیستم میشد. بنابراین کلیه ترنزکشن ها غیر فعال شدند
                //using (var tranManager = new DbTransactionManager(dbHelper))
                //{
                    var itemsEntities = ghabzOrHavaleEntity.GetFieldValue<EntityList>("GhabzOrHavaleItems").Entities;
                    for (int itemIndex = 0; itemIndex < itemsEntities.Count; itemIndex++)
                    {
                        if (itemsEntities[itemIndex].GetFieldValue<decimal?>("RialiAmount") == null)
                        {
                            throw new AfwException("مبلغ دستی برای سطر {0} وارد نشده است.",
                                itemsEntities[itemIndex].GetFieldValue<int>("RowNumber"));
                        }

                        //if (wm.Instance.IsRunningValuation)
                        //    CheckPreviousGhabzOrHavaleItemsHaveValue(ghabzOrHavaleEntity,
                        //        Valuation_PreviousItemsCheckingMode.SameStuffs,
                        //        itemsEntities[i].GetFieldValue<Guid>("Stuff"));
                    }

                    ghabzOrHavaleEntity.SetFieldValue("VazeyatRialiShodan", _ValuationStatus_Valuated);
                    dbHelper.UpdateEntity(ghabzOrHavaleEntity);

                    //tranManager.Commit();
                //}
            }
            catch (Exception ex)
            {
                throw new Exception(string.Format("{0}:\r\n {1}",
                    GetGhabzOrHavalePreviewText(ghabzOrHavaleEntity), ex.Message));
            }
        }

        private string GetGhabzOrHavalePreviewText(Entity ghabzOrHavaleEntity)
        {
            var ghabzOrHavaleTypeEntity = wm.Instance.GetGhabzOrHavaleTypeEntity(ghabzOrHavaleEntity.GetFieldValue<Guid>("GhabzOrHavaleType"));
            //var warehouseDocTypeTitle = OptionSetHelper.GetOptionSetItemTitle(ghabzOrHavaleTypeEntity.GetFieldValue<Guid>("WarehouseDocType"));

            var warehouseKeeperNotes = ghabzOrHavaleEntity.GetFieldValue<string>("WarehouseKeeperNotes");
            if (warehouseKeeperNotes == null)
                warehouseKeeperNotes = "";

            if (warehouseKeeperNotes.Length > 97)
                warehouseKeeperNotes = warehouseKeeperNotes.Substring(0, 97) + "...";

            return string.Format("{0} شماره {1} {2} (تاریخ صدور: {3}، توضیحات انباردار: {4})",
                //warehouseDocTypeName == "Ghabz" ? "رسید" : "حواله",
                ghabzOrHavaleTypeEntity.GetFieldValue<string>("Title"),
                ghabzOrHavaleEntity.GetFieldValue<int>("GhabzOrHavaleNumber"),
                cmn.Instance.GetStuffLocationEntity(ghabzOrHavaleEntity.GetFieldValue<Guid>("StuffLocation")).GetFieldValue<string>("Name"),
                DateTimeHelper.GregorianDateTimeToPersian(ghabzOrHavaleEntity.GetFieldValue<DateTime>("IssueDate")),
                warehouseKeeperNotes);
        }

        public void SetRialiNashodeFromDate(DateTime? fromDate/*, bool doDeleteRialiAmounts = false*/)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            CheckValuationPermission();

            if (fromDate == null)
                fromDate = DateTime.MinValue;

            var filterExpression = string.Format("IssueDate >= '{0}' and VazeyatRialiShodan <> '{1}'",
                fromDate, _ValuationStatus_NotValuated);

            try
            {
                wm.Instance.IsRunningUnvaluation = true;

                while (true)
                {
                    var ghabzOrHavaleEntities = dbHelper.FetchMultiple("wm.GhabzOrHavale", filterExpression, "IssueDate desc , CreationTime desc",
                        1, 20, new string[] { "GhabzOrHavaleItems" }).Entities;

                    if (ghabzOrHavaleEntities.Count == 0)
                        break;

                    for (int i = 0; i < ghabzOrHavaleEntities.Count; i++)
                    {
                        SetRialiNashode(ghabzOrHavaleEntities[i]/*, doDeleteRialiAmounts*/);

                        Thread.Sleep(100);//برای جلوگیری از کند شدن کل سیستم در هنگام عملیات ریالی نمودن
                    }
                }
            }
            finally
            {
                wm.Instance.IsRunningUnvaluation = false;
            }
        }

        public bool ValuatedDocExistsAfter(DateTime fromDate, DateTime creationTime)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var filterExpression = string.Format(@"VazeyatRialiShodan <> '{2}' and
                    (IssueDate > '{0}' or (IssueDate = '{0}' and creationTime > '{1}'))  ",
                fromDate, creationTime, _ValuationStatus_NotValuated);

            return dbHelper.EntityExists("wm.GhabzOrHavale", filterExpression);
        }

        private void SetRialiNashode(Entity ghabzOrHavaleEntity/*, bool doDeleteRialiAmounts*/)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var stored_IsRunningUnvaluation = wm.Instance.IsRunningUnvaluation;
            try
            {
                wm.Instance.IsRunningUnvaluation = true;

                CheckValuationPermission();

                if (ghabzOrHavaleEntity.GetFieldValue<Guid>("VazeyatRialiShodan") == _ValuationStatus_SanadShodeID)
                {
                    throw new AfwException("رسید/ حواله با شماره {0} دارای سند است. ابتدا سند را باطل نمایید.",
                        ghabzOrHavaleEntity.GetFieldValue<int>("GhabzOrHavaleNumber"));
                }

                var nahveRialiNemodan = GetValuationMethod(ghabzOrHavaleEntity);

                var shouldDeleteRialiAmounts = nahveRialiNemodan != OptionSetHelper.GetOptionSetItemID("wm.NahveRialiNemodan", "Dasti")
                    && ghabzOrHavaleEntity.GetFieldValue<bool?>("ForceManualRiali") != true;

                //عملیات ریالی شدن باعث کند شدن کل سیستم میشد. بنابراین کلیه ترنزکشن ها غیر فعال شدند
                //using (var tranManager = new DbTransactionManager(dbHelper))
                //{
                    if (shouldDeleteRialiAmounts)
                    {
                        var itemsEntities = ghabzOrHavaleEntity.GetFieldValue<EntityList>("GhabzOrHavaleItems").Entities;
                        for (int j = 0; j < itemsEntities.Count; j++)
                        {
                            itemsEntities[j].SetFieldValue("RialiAmount", null);
                            dbHelper.UpdateEntity(itemsEntities[j]);
                        }
                    }

                    ghabzOrHavaleEntity.SetFieldValue("VazeyatRialiShodan", _ValuationStatus_NotValuated);
                    dbHelper.UpdateEntity(ghabzOrHavaleEntity);

                    //tranManager.Commit();
                //}
            }
            catch (Exception ex)
            {
                throw new Exception(string.Format("{0}:\r\n {1}",
                     GetGhabzOrHavalePreviewText(ghabzOrHavaleEntity), ex.Message));
            }
            finally
            {

                wm.Instance.IsRunningUnvaluation = stored_IsRunningUnvaluation;
            }
        }

        private List<Entity> FetchWarehouseDocsOfDate(string date)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            return dbHelper.FetchMultiple("wm.GhabzOrHavale",
                string.Format("IssueDate = '{0}'", date),
                "CreationTime", null, null, null).Entities;
        }

        private void FetchGhabzOrHavaleItemsField(Entity ghabzOrHavale, bool skipIfFetched)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            if (skipIfFetched
                && ghabzOrHavale.FieldExists("GhabzOrHavaleItems")
                && ghabzOrHavale.GetFieldValue<EntityList>("GhabzOrHavaleItems") == null)
                return;

            var items = dbHelper.FetchMultiple("wm.GhabzOrHavaleItem",
                string.Format("GhabzOrHavale = '{0}'", ghabzOrHavale.GetFieldValue<Guid>("ID")), "RowNumber", null, null, null);

            if (ghabzOrHavale.FieldExists("GhabzOrHavaleItems"))
                ghabzOrHavale.SetFieldValue("GhabzOrHavaleItems", items);
            else
                ghabzOrHavale.AddField("GhabzOrHavaleItems", items);
        }

        private List<Entity> GetWarehouseDocsFromWarehouseDocsOfDate(List<Guid> ids)
        {
            var warehouseDocs = new List<Entity>();

            foreach (var id in ids)
            {
                var foundWarehouseDoc = _WarehouseDocsOfDate.FirstOrDefault(o => o.GetFieldValue<Guid>("ID") == id);

                if (foundWarehouseDoc == null)
                    throw new AfwException("WarehouseDoc with ID '{0}' not found in _AllWarehouseDocsOfDate!", id);

                warehouseDocs.Add(foundWarehouseDoc);
            }

            return warehouseDocs;
        }

        private Entity GetWarehouseDocFromWarehouseDocsOfDate(Guid id)
        {
            return GetWarehouseDocsFromWarehouseDocsOfDate(new List<Guid> {id})[0];
        }


        private List<Entity> GetGhabzAndHavaleListWithUndefinedValuationMethod(string date)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var ids = dbHelper.FetchMultipleBySqlQuery(string.Format(@"
                select GhabzOrHavale.ID
                from wm_GhabzOrHavaleha GhabzOrHavale
                    inner join wm_GhabzOrHavaleTypes GhabzOrHavaleType on GhabzOrHavaleType.ID = GhabzOrHavale.GhabzOrHavaleType
                where GhabzOrHavale.IssueDate = '{0}'
	                and GhabzOrHavaleType.NahveRialiNemodan is null
                order by GhabzOrHavale.CreationTime",
                date)).Entities.Select(o => o.GetFieldValue<Guid>("ID")).ToList();

            return GetWarehouseDocsFromWarehouseDocsOfDate(ids);
        }

        private List<Entity> GetGhabzAndHavaleListWithBarnameKhasValuationMethod(string date)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var ids = dbHelper.FetchMultipleBySqlQuery(string.Format(@"
                select GhabzOrHavale.ID
                from wm_GhabzOrHavaleha GhabzOrHavale
                    inner join wm_GhabzOrHavaleTypes GhabzOrHavaleType on GhabzOrHavaleType.ID = GhabzOrHavale.GhabzOrHavaleType
                    inner join afw_OptionSetItems NahveRialiNemodan on NahveRialiNemodan.ID = GhabzOrHavaleType.NahveRialiNemodan   
                where GhabzOrHavale.IssueDate = '{0}'
	                and NahveRialiNemodan.Name in ('BarnameKhas')
                order by GhabzOrHavale.CreationTime",
                date)).Entities.Select(o => o.GetFieldValue<Guid>("ID")).ToList();

            return GetWarehouseDocsFromWarehouseDocsOfDate(ids);
        }

        private List<Entity> GetFirstStepValuableDocsSortedList(string date)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var ids = new List<Guid>();

            //1. اسناد با نوع ریالی اکسترنال (دستی، صفر، استاندارد)
            ids.AddRange(
                dbHelper.FetchMultipleBySqlQuery(string.Format(@"
                    select GhabzOrHavale.ID
                    from wm_GhabzOrHavaleha GhabzOrHavale
                        inner join wm_GhabzOrHavaleTypes GhabzOrHavaleType on GhabzOrHavaleType.ID = GhabzOrHavale.GhabzOrHavaleType
                        inner join afw_OptionSetItems NahveRialiNemodan on NahveRialiNemodan.ID = GhabzOrHavaleType.NahveRialiNemodan   
                    where GhabzOrHavale.IssueDate = '{0}'
	                    and (NahveRialiNemodan.Name in ('Sefr', 'MablaghEstandard', 'Dasti')
                            or isnull(GhabzOrHavale.ForceManualRiali, 0) = 1)
                    order by GhabzOrHavale.CreationTime",
                    date)).Entities.Select(o => o.GetFieldValue<Guid>("ID"))
                );

            //2. اسنادی که رفرنس 1 آنها از نوع اکسترنال است
            //3. اسنادی که رفرنس 1 آنها با تاریخ قبل است
            ids.AddRange(
                dbHelper.FetchMultipleBySqlQuery(string.Format(@"
                    select GhabzOrHavale.ID
                    from wm_GhabzOrHavaleha GhabzOrHavale
	                    inner join wm_GhabzOrHavaleha ReferenceGhabzOrHavale on ReferenceGhabzOrHavale.ID = GhabzOrHavale.WareHouseDocRialiReference
	                    inner join wm_GhabzOrHavaleTypes ReferenceGhabzOrHavaleType on ReferenceGhabzOrHavaleType.ID = ReferenceGhabzOrHavale.GhabzOrHavaleType
	                    inner join afw_OptionSetItems Reference_NahveRialiNemodan on Reference_NahveRialiNemodan.ID = ReferenceGhabzOrHavaleType.NahveRialiNemodan   	
                    where GhabzOrHavale.IssueDate = '{0}'
	                    and (Reference_NahveRialiNemodan.Name in ('Sefr', 'MablaghEstandard', 'Dasti')
		                    or ReferenceGhabzOrHavale.IssueDate < '{0}')
                        and isnull(GhabzOrHavale.ForceManualRiali, 0) <> 1 --these are included in prior query
                    order by GhabzOrHavale.CreationTime",
                    date)).Entities.Select(o => o.GetFieldValue<Guid>("ID"))
                );

            return GetWarehouseDocsFromWarehouseDocsOfDate(ids);
        }

        private void ValuateOrCheckMontageAndDemontageOps(string date/*, bool justCheck*/,
            ref List<string> valuationErrors)
        {
            //الگوریتم ریالی کردن رسید و حواله های مونتاژ و دمونتاژ در یک روز:

            var dbHelper = CoreComponent.Instance.MainDbHelper;

            try
            {
                while (true)
                {
                    //1- پیدا کردن اولین حواله مونتاژ/ دمونتاژ روز جاری که هیچیک از کالاهای موجود در آن 
                    //   در هیچکدام از رسید های مونتاژ/ دمونتاژ روز جاری بصورت ریالی نشده نیستند:
                    var havale = FindFirstMontageAndDemontageHavaleForValuation(date);

                    if (havale == null)
                        return;

                    _WarehouseDocsOfDateInValuationList.Add(havale);

                    var havaleType = wm.Instance.GetGhabzOrHavaleTypeEntity(havale.GetFieldValue<Guid>("GhabzOrHavaleType"));
                    var havaleTypeName = havaleType.GetFieldValue<string>("Name");

                    //--- چک کردن صحت تنظیمات سیستم:
                    if (havaleType.GetFieldValue<Guid?>("NahveRialiNemodan") != OptionSetHelper.GetOptionSetItemID("wm.NahveRialiNemodan", "MyangineSayyar"))
                        throw new AfwException("نحوه ریالی نمودن '{0}' روش 'میانگین سیار' نیست.",
                            havaleType.GetFieldValue<string>("Title"));

                    FetchGhabzOrHavaleItemsField(havale, true);

                    if (havale.GetFieldValue<bool?>("ForceManualRiali") == true)
                        SetRialiShodeDasti(havale);
                    else
                        //2- ریالی کردن حواله (روش میانگین سیار):
                        SetRialiShodeMyangineSayyar(havale);

                    //3- ریالی کردن رسید عملیات از روی حواله آن (روش ریالی کردن رسید مونتاژ و رسید دمونتاژ)

                    if (havaleTypeName == "HavaleAmaliateMontage")
                    {
                        var montageOpID = havale.GetFieldValue<Guid?>("RefDoc_MontageOp");
                        if (montageOpID == null)
                            throw new AfwException("RefDoc_MontageOp of HavaleAmaliateMontage with id '{0}' is null.", havale.GetFieldValue<Guid>("ID"));

                        //--- چک کردن صحت تنظیمات سیستم:
                        var resideAmaliateMontageType = wm.Instance.CachedGhabzOrHavaleTypes.FirstOrDefault(o => o.GetFieldValue<string>("Name") == "ResideAmaliateMontage");
                        if (resideAmaliateMontageType == null)
                            throw new AfwException("Warehouse doc type 'ResideAmaliateMontage' not exists.");
                        if (resideAmaliateMontageType.GetFieldValue<Guid?>("NahveRialiNemodan") != OptionSetHelper.GetOptionSetItemID("wm.NahveRialiNemodan", "SarjameReference"))
                            throw new AfwException("نحوه ریالی نمودن 'رسید عملیات مونتاژ' روش 'سرجمع رفرنس' نیست.");

                        var resid = _WarehouseDocsOfDate.FirstOrDefault(
                            o => o.GetFieldValue<Guid?>("RefDoc_MontageOp") == montageOpID
                                && o.GetFieldValue<Guid>("GhabzOrHavaleType") == resideAmaliateMontageType.GetFieldValue<Guid>("ID"));

                        if (resid == null)
                            throw new AfwException("Resid of HavaleAmaliateMontage with ID '{0}' not found.", havale.GetFieldValue<Guid>("ID"));

                        _WarehouseDocsOfDateInValuationList.Add(resid);

                        FetchGhabzOrHavaleItemsField(resid, true);

                        if (resid.GetFieldValue<bool?>("ForceManualRiali") == true)
                            SetRialiShodeDasti(resid);
                        else
                            SetRialiShodeSarjameReference(resid);
                    }
                    else if (havaleTypeName == "HavaleAmaliateDemontage")
                    {
                        var demontageOpID = havale.GetFieldValue<Guid?>("RefDoc_DemontageOp");
                        if (demontageOpID == null)
                            throw new AfwException("RefDoc_DemontageOp of HavaleAmaliateDemontage with id '{0}' is null.", havale.GetFieldValue<Guid>("ID"));

                        //--- چک کردن صحت تنظیمات سیستم:
                        var resideAmaliateDemontageType = wm.Instance.CachedGhabzOrHavaleTypes.FirstOrDefault(o => o.GetFieldValue<string>("Name") == "ResideAmaliateDemontage");
                        if (resideAmaliateDemontageType == null)
                            throw new AfwException("Warehouse doc type 'ResideAmaliateDemontage' not exists.");

                        if (resideAmaliateDemontageType.GetFieldValue<Guid?>("NahveRialiNemodan") != OptionSetHelper.GetOptionSetItemID("wm.NahveRialiNemodan", "ResideDemontaj"))
                            throw new AfwException("نحوه ریالی نمودن 'رسید عملیات دمونتاژ' روش 'رسید دمونتاژ' نیست.");


                        var resid = _WarehouseDocsOfDate.FirstOrDefault(
                            o => o.GetFieldValue<Guid?>("RefDoc_DemontageOp") == demontageOpID
                                && o.GetFieldValue<Guid>("GhabzOrHavaleType") == resideAmaliateDemontageType.GetFieldValue<Guid>("ID"));

                        if (resid == null)
                            throw new AfwException("Resid of HavaleAmaliateDemontage with ID '{0}' not found.", havale.GetFieldValue<Guid>("ID"));

                        _WarehouseDocsOfDateInValuationList.Add(resid);

                        FetchGhabzOrHavaleItemsField(resid, true);

                        if (resid.GetFieldValue<bool?>("ForceManualRiali") == true)
                            SetRialiShodeDasti(resid);
                        else
                            SetRialiShodeResideDemontaj(resid);
                    }

                    Thread.Sleep(150);//برای جلوگیری از کند شدن کل سیستم در هنگام عملیات ریالی نمودن
                }
            }
            catch (Exception ex)
            {
                valuationErrors.Add(ex.Message);
            }
        }

        private Entity FindFirstMontageAndDemontageHavaleForValuation(string date)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var idEntity = dbHelper.FetchSingleBySqlQuery(string.Format(@"
                select top 1 Havale.ID
                from wm_GhabzOrHavaleha Havale
	                inner join wm_GhabzOrHavaleTypes HavaleType on HavaleType.ID = Havale.GhabzOrHavaleType	
                    inner join afw_OptionSetItems Havale_VazeyatRialiShodan on Havale_VazeyatRialiShodan.ID = Havale.VazeyatRialiShodan
                where Havale.IssueDate = '{0}'
                    and Havale_VazeyatRialiShodan.Name = 'RialiNashode'
	                and HavaleType.Name in ('HavaleAmaliateMontage', 'HavaleAmaliateDemontage')
	                and not exists (
		                select 1
		                from wm_GhabzOrHavaleItems Havale_Item
			                inner join wm_GhabzOrHavaleItems Ghabz_Item on Ghabz_Item.Stuff = Havale_Item.Stuff
				                and Ghabz_Item.BatchNumber = Havale_Item.BatchNumber
				                and Ghabz_Item.StuffStatus = Havale_Item.StuffStatus
			                inner join wm_GhabzOrHavaleha Ghabz on Ghabz_Item.GhabzOrHavale = Ghabz.ID
				                and Ghabz.IssueDate = '{0}'
			                inner join wm_GhabzOrHavaleTypes GhabzType on GhabzType.ID = Ghabz.GhabzOrHavaleType
			                inner join afw_OptionSetItems Ghabz_VazeyatRialiShodan on Ghabz_VazeyatRialiShodan.ID = Ghabz.VazeyatRialiShodan
		                where Havale_Item.GhabzOrHavale = Havale.ID
			                and GhabzType.Name in ('ResideAmaliateMontage', 'ResideAmaliateDemontage')
			                and Ghabz_VazeyatRialiShodan.Name = 'RialiNashode')
                order by Havale.CreationTime",
                date));

            if (idEntity == null)
                return null;
            else
                return GetWarehouseDocFromWarehouseDocsOfDate(idEntity.GetFieldValue<Guid>("ID"));
        }
       
        private void CheckPreviousGhabzOrHavaleItemsHaveValue(Entity ghabzOrHavaleEntity, string previousItemsCheckingMode, Guid? stuffID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            if (previousItemsCheckingMode == Valuation_PreviousItemsCheckingMode.SameStuffs)
            {
                var relativeGhabzOrHavale = dbHelper.FetchSingleBySqlQuery(string.Format(@"
                    select top 1 GhabzOrHavale.*, 
                        GhabzOrHavaleItem.RowNumber
                    from wm_GhabzOrHavaleha GhabzOrHavale
	                    inner join wm_GhabzOrHavaleItems GhabzOrHavaleItem on GhabzOrHavaleItem.GhabzOrHavale = GhabzOrHavale.ID
                    where GhabzOrHavaleItem.Stuff = '{0}' and 
	                    GhabzOrHavaleItem.RialiAmount is null and 
	                    GhabzOrHavale.IssueDate <= '{1}' and 
	                    GhabzOrHavale.CreationTime <= '{2}'",
                    stuffID,
                    ghabzOrHavaleEntity.GetFieldValue<DateTime>("IssueDate"),
                    ghabzOrHavaleEntity.GetFieldValue<DateTime>("CreationTime")));

                if (relativeGhabzOrHavale != null)
                    throw new AfwException("مبلغ برای سطر {0} {1} وارد نشده است.",
                        relativeGhabzOrHavale.GetFieldValue<int>("RowNumber"),
                        GetGhabzOrHavalePreviewText(relativeGhabzOrHavale));
            }
            else if (previousItemsCheckingMode == Valuation_PreviousItemsCheckingMode.All)
            {
                var relativeGhabzOrHavale = dbHelper.FetchSingleBySqlQuery(string.Format(@"
                    select top 1 GhabzOrHavale.*,
                        GhabzOrHavaleItem.RowNumber,
                    from wm_GhabzOrHavaleha GhabzOrHavale
	                    inner join wm_GhabzOrHavaleItems GhabzOrHavaleItem on GhabzOrHavaleItem.GhabzOrHavale = GhabzOrHavale.ID
                    where GhabzOrHavaleItem.RialiAmount is null and 
	                    GhabzOrHavale.IssueDate <= '{0}' and 
	                    GhabzOrHavale.CreationTime <= '{1}'",
                    ghabzOrHavaleEntity.GetFieldValue<DateTime>("IssueDate"),
                    ghabzOrHavaleEntity.GetFieldValue<DateTime>("CreationTime")));

                if (relativeGhabzOrHavale != null)
                    throw new AfwException("مبلغ برای سطر {0} {1} وارد نشده است.",
                        relativeGhabzOrHavale.GetFieldValue<int>("RowNumber"),
                        GetGhabzOrHavalePreviewText(relativeGhabzOrHavale));
            }
        }

        private void ValuateOrCheckRemainedDocsByMianginSayar(string date, ref List<string> valuationErrors)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            //6.	مابقی اسناد این روز همگی به روش میانگین سیار کلی ریالی شوند (بدون توجه به نحوه ریالی شدن ست شده در تنظیمات آنها).

            var remainedDocsForMianginSayarValuation = new List<Entity>();

            foreach (var ghabzOrHavale in _WarehouseDocsOfDate)
            {
                if (!ghabzOrHavale.GetFieldValue<Guid>("GhabzOrHavaleType").IsIn(
                        wm.SystemGhabzOrHavaleTypes.ResideAmaliateMontage.ID,
                        wm.SystemGhabzOrHavaleTypes.HavaleAmaliateMontage.ID,
                        wm.SystemGhabzOrHavaleTypes.ResideAmaliateDemontage.ID,
                        wm.SystemGhabzOrHavaleTypes.HavaleAmaliateDemontage.ID)
                    && !_WarehouseDocsOfDateInValuationList.Any(o => o.GetFieldValue<Guid>("ID") == ghabzOrHavale.GetFieldValue<Guid>("ID")))
                {
                    remainedDocsForMianginSayarValuation.Add(ghabzOrHavale);
                }
            }

            _WarehouseDocsOfDateInValuationList.AddRange(remainedDocsForMianginSayarValuation);

            // باید چک کنیم که اسناد قبلی مرتبط ریالی شده باشند، در غیر اینصورت نتیجه محاسبه ممکن است متفاوت شود.
            //البته فعلا ما نمیدانیم که کدام اسناد این روز باید قبل از این سند ریالی شوند و فقط روز های قبل را چک می کنیم
            //بهترین راه این است که چک کردن ریالی در مرحله جداگانه انجام شود و ریالی کردن نهایی فقط وقتی انجام شود که هیج خطایی در چک کردن وجود نداشته باشد
            var notValuatedPriorItems = dbHelper.FetchMultipleBySqlQuery(string.Format(@"
                select GhabzOrHavaleItem.Stuff, 
                    cast(min(cast(GhabzOrHavaleItem.GhabzOrHavale as varchar(50))) as uniqueidentifier) FirstNotValuatedGhabzOrHavaleID
                from wm_GhabzOrHavaleItems GhabzOrHavaleItem
                    left join wm_GhabzOrHavalehaView GhabzOrHavale on GhabzOrHavale.ID = GhabzOrHavaleItem.GhabzOrHavale 
                where GhabzOrHavale.IssueDate < '{0}'
                    and RialiAmount is null
                group by GhabzOrHavaleItem.Stuff",
                date)).Entities;

            var priorValuatedItemsSum = dbHelper.FetchMultipleBySqlQuery(string.Format(@"
                select GhabzOrHavaleItem.Stuff,
                    sum((case when GhabzOrHavale.WarehouseDocType_Name = 'Ghabz' then 1 else -1 end) * GhabzOrHavaleItem.Quantity) QuantitySum,
                    sum((case when GhabzOrHavale.WarehouseDocType_Name = 'Ghabz' then 1 else -1 end) * GhabzOrHavaleItem.RialiAmount) RialiAmountSum
                from wm_GhabzOrHavaleItemsView GhabzOrHavaleItem
                    left join wm_GhabzOrHavalehaView GhabzOrHavale on GhabzOrHavale.ID = GhabzOrHavaleItem.GhabzOrHavale 
                where GhabzOrHavale.IssueDate < '{0}'
                    and RialiAmount is not null
                group by GhabzOrHavaleItem.Stuff",
                date)).Entities;

            //بخاطر این که از طریق کوئری نمیتوانیم اسناد قبلی همین روز را پیدا کنیم، با کد زیر اضافه می کنیم:
            //اسناد قبلی همین روز آنهایی هستند که مال همین روز هستند و در لیست اسنادی که توسط این متد باید ریالی شوند نیستند 
            //یعنی این اسناد باید قبل از اجرای این متد ریالی شوند
            var priorDocsOfToday = _WarehouseDocsOfDate.Where(o => !remainedDocsForMianginSayarValuation.Contains(o));
            
            foreach (var ghabzOrHavale in priorDocsOfToday)
            {
                foreach (var ghabzOrHavaleItem in ghabzOrHavale.GetFieldValue<EntityList>("GhabzOrHavaleItems").Entities)
                {
                    if (ghabzOrHavaleItem.GetFieldValue<decimal?>("RialiAmount") == null)
                    {
                        if (!notValuatedPriorItems.Any(o => o.GetFieldValue<Guid>("Stuff") == ghabzOrHavaleItem.GetFieldValue<Guid>("Stuff")))
                        {
                            var notValuatedPriorItem = new Entity();
                            notValuatedPriorItem.AddField("Stuff", ghabzOrHavaleItem.GetFieldValue<Guid>("Stuff"));
                            notValuatedPriorItem.AddField("FirstNotValuatedGhabzOrHavaleID", ghabzOrHavale.GetFieldValue<Guid>("ID"));
                            
                            notValuatedPriorItems.Add(notValuatedPriorItem);
                        }
                    }
                    else
                    {
                        var warehouseDocTypeName = OptionSetHelper.GetOptionSetItemName(
                            wm.Instance.GetGhabzOrHavaleTypeEntity(ghabzOrHavale.GetFieldValue<Guid>("GhabzOrHavaleType"))
                                .GetFieldValue<Guid>("WarehouseDocType"));

                        var foundItemInPriorValuatedItemsSum = priorValuatedItemsSum.FirstOrDefault(
                            o => o.GetFieldValue<Guid>("Stuff") == ghabzOrHavaleItem.GetFieldValue<Guid>("Stuff"));

                        if (foundItemInPriorValuatedItemsSum != null)
                        {
                            foundItemInPriorValuatedItemsSum.SetFieldValue("QuantitySum",
                                foundItemInPriorValuatedItemsSum.GetFieldValue<decimal>("QuantitySum")
                                + (ghabzOrHavaleItem.GetFieldValue<decimal>("Quantity") * (warehouseDocTypeName == "Ghabz"? 1: -1)));

                            foundItemInPriorValuatedItemsSum.SetFieldValue("RialiAmountSum",
                                foundItemInPriorValuatedItemsSum.GetFieldValue<decimal>("RialiAmountSum")
                                + (ghabzOrHavaleItem.GetFieldValue<decimal>("RialiAmount") * (warehouseDocTypeName == "Ghabz" ? 1 : -1)));
                        }
                        else
                        {
                            var priorValuatedItemSum = new Entity();
                            priorValuatedItemSum.AddField("Stuff", ghabzOrHavaleItem.GetFieldValue<Guid>("Stuff"));
                            priorValuatedItemSum.AddField("QuantitySum",
                                ghabzOrHavaleItem.GetFieldValue<decimal>("Quantity") * (warehouseDocTypeName == "Ghabz" ? 1 : -1));
                            priorValuatedItemSum.AddField("RialiAmountSum",
                                ghabzOrHavaleItem.GetFieldValue<decimal>("RialiAmount") * (warehouseDocTypeName == "Ghabz" ? 1 : -1));
                            
                            priorValuatedItemsSum.Add(priorValuatedItemSum);
                        }
                    }
                }
            }

            foreach (var ghabzOrHavaleEntity in remainedDocsForMianginSayarValuation)
            {
                try
                {
                    if (ghabzOrHavaleEntity.GetFieldValue<Guid>("VazeyatRialiShodan") != _ValuationStatus_NotValuated)
                        throw new AfwException("رسید/حواله در وضعیت 'ریالی نشده' نیست.");

                    FetchGhabzOrHavaleItemsField(ghabzOrHavaleEntity, true);

                    //عملیات ریالی شدن باعث کند شدن کل سیستم میشد. بنابراین کلیه ترنزکشن ها غیر فعال شدند
                    //using (var tranManager = new DbTransactionManager(dbHelper))
                    //{
                        var itemsEntities = ghabzOrHavaleEntity.GetFieldValue<EntityList>("GhabzOrHavaleItems").Entities;
                        foreach (var itemEntity in itemsEntities)
                        {
                            try
                            {
                                var relatedNotValuatedItem = notValuatedPriorItems.FirstOrDefault(o => o.GetFieldValue<Guid>("Stuff") == itemEntity.GetFieldValue<Guid>("Stuff"));

                                if (relatedNotValuatedItem != null)
                                {
                                    var relatedNotValuatedGhabzOrHavale = dbHelper.FetchSingleByID("wm.GhabzOrHavale",
                                        relatedNotValuatedItem.GetFieldValue<Guid>("FirstNotValuatedGhabzOrHavaleID"), null);

                                    throw new AfwException("'{0}' در '{1}' ریالی نشده است.",
                                        cmn.Instance.GetStuffTitle(relatedNotValuatedItem.GetFieldValue<Guid>("Stuff")),
                                        GetGhabzOrHavalePreviewText(relatedNotValuatedGhabzOrHavale));
                                }

                                var relatedValuatedItemsSum = priorValuatedItemsSum.FirstOrDefault(o => o.GetFieldValue<Guid>("Stuff") == itemEntity.GetFieldValue<Guid>("Stuff"));

                                if (relatedValuatedItemsSum == null)
                                    throw new AfwException("سند انبار ریالی شده ای قبل از این سند برای محاسبه میانگین سیار '{0}' یافت نشد.",
                                        cmn.Instance.GetStuffTitle(itemEntity.GetFieldValue<Guid>("Stuff")));

                                var relatedItemsQuantitySum = relatedValuatedItemsSum.GetFieldValue<decimal>("QuantitySum");
                                var relatedItemsRialiAmountSum = relatedValuatedItemsSum.GetFieldValue<decimal>("RialiAmountSum");

                                if (relatedItemsQuantitySum <= 0)//بدلیل جلوگیری از بوجود آمدن خطای تقسیم بر صفر
                                    throw new AfwException("تعداد محاسبه شده '{0}' در اسناد ریالی شده قبل از این سند کوچکتر یا مساوی صفر است.",
                                        cmn.Instance.GetStuffTitle(itemEntity.GetFieldValue<Guid>("Stuff")));

                                if (relatedItemsRialiAmountSum < 0)
                                    throw new AfwException("ارزش ریالی محاسبه شده '{0}' در اسناد ریالی شده قبل از این سند کوچکتر از صفر است.",
                                        cmn.Instance.GetStuffTitle(itemEntity.GetFieldValue<Guid>("Stuff")));

                                var itemQuantity = itemEntity.GetFieldValue<int>("Quantity");

                                if (relatedItemsQuantitySum == itemQuantity)
                                    itemEntity.SetFieldValue("RialiAmount", relatedItemsRialiAmountSum);
                                else
                                    itemEntity.SetFieldValue("RialiAmount", 
                                        Math.Round((relatedItemsRialiAmountSum / relatedItemsQuantitySum) * itemQuantity));                                

                                dbHelper.UpdateEntity(itemEntity);
                            }
                            catch (Exception ex)
                            {
                                throw new AfwException("خطا در ریالی نمودن سطر {0}: \r\n{1}",
                                    itemEntity.GetFieldValue<int>("RowNumber"), ex.Message);
                            }
                        }

                        ghabzOrHavaleEntity.SetFieldValue("VazeyatRialiShodan", _ValuationStatus_Valuated);
                        dbHelper.UpdateEntity(ghabzOrHavaleEntity);

                        //tranManager.Commit();
                    //}

                    Thread.Sleep(150);//برای جلوگیری از کند شدن کل سیستم در هنگام عملیات ریالی نمودن
                }
                catch (Exception ex)
                {
                    valuationErrors.Add(string.Format("{0}:\r\n {1}",
                        GetGhabzOrHavalePreviewText(ghabzOrHavaleEntity), ex.Message));
                }
            }
        }

        private List<Guid> GetGhabzOrHavaleStuffsIDList(Guid ghabzOrHavaleID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;
            List<Guid> selectedGhabzOrHavaleStuffsIDList = new List<Guid>();

            var selectedGhabzOrHavaleStuffsID = dbHelper.FetchMultipleBySqlQuery(string.Format(@"
                    select GhabzOrHavaleItem.Stuff StuffID
                    from wm_GhabzOrHavaleha GhabzOrHavale
	                    inner join wm_GhabzOrHavaleItems GhabzOrHavaleItem on GhabzOrHavaleItem.GhabzOrHavale = GhabzOrHavale.ID
                    where GhabzOrHavale.ID = '{0}' ", ghabzOrHavaleID));

            for (int i = 0; i < selectedGhabzOrHavaleStuffsID.Entities.Count; i++)
                selectedGhabzOrHavaleStuffsIDList.Add(selectedGhabzOrHavaleStuffsID.Entities[i].GetFieldValue<Guid>("StuffID"));

            return selectedGhabzOrHavaleStuffsIDList;
        }

        public EntityList ValuateWarehouseDocs(DateTime? fromDate, DateTime toDate)
        {
            return ValuateOrCheckWarehouseDocs(fromDate, toDate, false);
        }

        public EntityList CheckWarehouseDocsForValuation(DateTime? fromDate, DateTime toDate)
        {
            return ValuateOrCheckWarehouseDocs(fromDate, toDate, true);
        }

        private EntityList ValuateOrCheckWarehouseDocs(DateTime? fromDate, DateTime toDate, bool justCheck)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var dateEntities = GetIssueDatesForValuation(fromDate, toDate);
            var valuationErrors = new List<string>();

//            _StuffsWithValuationError = dbHelper.FetchSingleBySqlQuery(string.Format(@"
//                select count(1) WarehouseDocsCount,
//                    sum((case when GhabzOrHavale.WarehouseDocType_Name = 'Ghabz' then 1 else -1 end) * GhabzOrHavaleItem.Quantity) QuantitySum,
//                    sum((case when GhabzOrHavale.WarehouseDocType_Name = 'Ghabz' then 1 else -1 end) * GhabzOrHavaleItem.RialiAmount) RialiAmountSum
//                from wm_GhabzOrHavaleItemsView GhabzOrHavaleItem
//                    left join wm_GhabzOrHavalehaView GhabzOrHavale on GhabzOrHavale.ID = GhabzOrHavaleItem.GhabzOrHavale 
//                where GhabzOrHavaleItem.Stuff = '{0}' and GhabzOrHavaleItem.GhabzOrHavale <> '{2}' 
//                    and (GhabzOrHavale.IssueDate < '{1}'
//                        or (GhabzOrHavale.IssueDate = '{1}' and GhabzOrHavaleItem.RialiAmount is not null)--اسناد امروز که قبل از این سند ریالی شده اند
//                    )           
//                    -- بجز سند انباری که رفرنس ریالی اش همین سند انبار است
//                    --and (GhabzOrHavale.WareHouseDocRialiReference is null 
//                    --    or GhabzOrHavale.WareHouseDocRialiReference <> '{2}')",
//                stuffID, toDate, refGhabzOrHavaleID));


            //قبلا بدلیل این که این متد تنها جهت بررسی بود، بعد از ریالی کردن و بدست آمدن خطاها، همه رول بک می شدند.
            //اما این کار باعث کند شدن هم عملیات و هم کل سیستم می شد چون اجرای عملیات خیلی طول می کشید.
            //برای افزایش سرعت و کند نشدن سیستم، اجرای عملیات بصورت بخش بخش شده روی بازه های تاریخ تغییر کرد یعنی این متد چند بار اجرا می شود 
            //بدلیل اجرا بصورت بخش بخش شده، امکان رول بک کردن تراکنش وجود ندارد.
            //چون برای اجرای بازه تاریخ بعدی باید بازه تاریخ قبلی اجرا و ثبت شده باشد چون ترنزکشن آنها جدا است.

            if (justCheck)
                throw new NotImplementedException("justCheck mode is not implemented.");

            SetRialiNashodeFromDate(fromDate);

            wm.Instance.IsEvaluatingDocsForValuation = justCheck;
            wm.Instance.IsRunningValuation = !justCheck;
            try
            {
                for (var i = 0; i < dateEntities.Count; i++)
                {
                    var date = dateEntities[i].GetFieldValue<DateTime>("IssueDate").ToString().Split(' ')[0];

                    try
                    {
                        _WarehouseDocsOfDate = FetchWarehouseDocsOfDate(date);
                        _WarehouseDocsOfDateInValuationList = new List<Entity>();

                        //ابتدا نمایش خطا برای اسناد انبار این روز که نحوه ریالی نمودن آنها تعیین نشده است:
                        var ghabzAndHavaleOfDateWithUndefinedValuationMethod = GetGhabzAndHavaleListWithUndefinedValuationMethod(date);
                        _WarehouseDocsOfDateInValuationList.AddRange(ghabzAndHavaleOfDateWithUndefinedValuationMethod);
                        
                        foreach (var ghabzOrHavale in ghabzAndHavaleOfDateWithUndefinedValuationMethod)
                            valuationErrors.Add(string.Format("{0}: نحوه ریالی نمودن تعیین نشده است.", GetGhabzOrHavalePreviewText(ghabzOrHavale)));

                        //1.	برنامه خاص چک شود (فعلا منظور این است که رسید افتتاحیه سیستمی ریالی شده باشد)
                        //سند های انبار با نحوه ریالی شدن 'برنامه خاص' مواردی مثل رسید افتتاحیه سیستمی هستند 
                        //که توسط سیستم در هنگام ثبت باید ریالی شده باشند:
                        var ghabzAndHavaleListWithBarnameKhasValuationMethod = GetGhabzAndHavaleListWithBarnameKhasValuationMethod(date);
                        _WarehouseDocsOfDateInValuationList.AddRange(ghabzAndHavaleListWithBarnameKhasValuationMethod);
                        
                        foreach (var ghabzOrHavale in ghabzAndHavaleListWithBarnameKhasValuationMethod)
                        {

                            if (ghabzOrHavale.GetFieldValue<Guid>("VazeyatRialiShodan") == _ValuationStatus_NotValuated
                                && ghabzOrHavale.GetFieldValue<bool?>("ForceManualRiali") != true)
                                valuationErrors.Add(string.Format("{0}: سند با برنامه خاص ریالی نشده است.", GetGhabzOrHavalePreviewText(ghabzOrHavale)));
                        }

                        //اگر موردی در این روز پیدا شد که در وضعیت ریالی نشده نیست و نحوه ریالی شدن برنامه خاص هم نیست برای این روز خطای کلی می دهیم.
                        //این بخاطر الگوریتم ریالی کردن عملیات مونتاژ و دمونتاژ است که این مورد را برای حواله چک نمیکند.
                        if (_WarehouseDocsOfDate.Any(o => o.GetFieldValue<Guid>("VazeyatRialiShodan") != _ValuationStatus_NotValuated
                            && !ghabzAndHavaleListWithBarnameKhasValuationMethod.Any(barnameKhas => barnameKhas.GetFieldValue<Guid>("ID") == o.GetFieldValue<Guid>("ID"))))
                        {
                            valuationErrors.Add(
                                string.Format("رسید/حواله ای در تاریخ '{0}' پیدا شد که در وضعیت 'ریالی نشده' نیست. ابتدا اسناد را از وضعیت ریالی شده خارج کنید.",
                                    DateTimeHelper.GregorianDateToPersian(date)));
                            continue;
                        }

                        //2.	نوع ریالی اکسترنال (دستی، صفر، استاندارد)
                        //3.	نوع سندی که رفرنس 1 آن از نوع اکسترنال است
                        //4.	نوع سندی که رفرنس 1 آن با تاریخ قبل باشد
                        var firstStepValuableDocsSortedList = GetFirstStepValuableDocsSortedList(date);
                        _WarehouseDocsOfDateInValuationList.AddRange(firstStepValuableDocsSortedList);

                        foreach (var ghabzOrHavale in firstStepValuableDocsSortedList)
                        {
                            try
                            {
                                FetchGhabzOrHavaleItemsField(ghabzOrHavale, true);
                                ValuateWarehouseDoc(ghabzOrHavale);

                                Thread.Sleep(150);//برای جلوگیری از کند شدن کل سیستم در هنگام عملیات ریالی نمودن
                            }
                            catch (Exception ex)
                            {
                                //معلوم نیست چرا این دو خطا در نظر گرفته نمی شدند:
                                //if (!ex.Message.Contains("مبلغ ریالی / تعداد ندارد.") && !ex.Message.Contains("ریالی نمایید."))
                                //{
                                valuationErrors.Add(ex.Message);
                                //}
                            }
                        }

                        //5.	روتین سورت کردن عملیات مونتاژ و دمونتاژ (هر عملیات مونتاژ و یا دمونتاژ مجموعه ای از اسناد رسید و حواله است)
                        //و سپس ریالی کردن هر یک از عملیات مونتاژ دمونتاژ به ترتیب سورت شده
                        ValuateOrCheckMontageAndDemontageOps(date/*, justCheck*/, ref valuationErrors);

                        //6.	مابقی اسناد این روز همگی به روش میانگین سیار ریالی شوند (بدون توجه به نحوه ریالی شدن ست شده در تنظیمات آنها).
                        ValuateOrCheckRemainedDocsByMianginSayar(date, ref valuationErrors);                       
                    }
                    catch (Exception ex)
                    {
                        valuationErrors.Add(ex.Message);
                    }
                    finally
                    {
                        _WarehouseDocsOfDate = null;
                        _WarehouseDocsOfDateInValuationList = null;
                    }
                }
            }
            finally
            {
                wm.Instance.IsRunningValuation = false;
                wm.Instance.IsEvaluatingDocsForValuation = false;
            }

            var errorsEntityList = new EntityList();
            foreach (var valuationError in valuationErrors)
            {
                var errorItemEntity = new Entity();
                errorItemEntity.AddField("Message", valuationError);
                errorsEntityList.Entities.Add(errorItemEntity);
            }

            return errorsEntityList;
        }

        private decimal GetMyangineSayyar(Guid stuffID, int quantity, DateTime toDate, Guid refGhabzOrHavaleID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            try
            {
                var relatedItemsSum = dbHelper.FetchSingleBySqlQuery(string.Format(@"
                    select count(1) WarehouseDocsCount,
                        sum((case when GhabzOrHavale.WarehouseDocType_Name = 'Ghabz' then 1 else -1 end) * GhabzOrHavaleItem.Quantity) QuantitySum,
                        sum((case when GhabzOrHavale.WarehouseDocType_Name = 'Ghabz' then 1 else -1 end) * GhabzOrHavaleItem.RialiAmount) RialiAmountSum
                    from wm_GhabzOrHavaleItemsView GhabzOrHavaleItem
                        left join wm_GhabzOrHavalehaView GhabzOrHavale on GhabzOrHavale.ID = GhabzOrHavaleItem.GhabzOrHavale 
                    where GhabzOrHavaleItem.Stuff = '{0}' and GhabzOrHavaleItem.GhabzOrHavale <> '{2}' 
                        and (GhabzOrHavale.IssueDate < '{1}'
                            or (GhabzOrHavale.IssueDate = '{1}' and GhabzOrHavaleItem.RialiAmount is not null)--اسناد امروز که قبل از این سند ریالی شده اند
                        )           
                        -- بجز سند انباری که رفرنس ریالی اش همین سند انبار است
                        --and (GhabzOrHavale.WareHouseDocRialiReference is null 
                        --    or GhabzOrHavale.WareHouseDocRialiReference <> '{2}')",
                    stuffID, toDate, refGhabzOrHavaleID));

                if (relatedItemsSum.GetFieldValue<decimal>("WarehouseDocsCount") == 0)
                {
                    throw new AfwException("قبل از تاریخ '{0}' برای کالا سند انباری برای محاسبه میانگین سیار یافت نشد.",
                        DateTimeHelper.GregorianDateTimeToPersian(toDate).Split(' ')[0]);
                }

                // باید چک کنیم که اسناد قبلی مرتبط ریالی شده باشند، در غیر اینصورت نتیجه محاسبه ممکن است متفاوت شود.
                var notValuatedItem = dbHelper.FetchSingleBySqlQuery(string.Format(@"
                    select top 1 GhabzOrHavaleItem.GhabzOrHavale, GhabzOrHavaleItem.RowNumber
                    from wm_GhabzOrHavaleItems GhabzOrHavaleItem
                        left join wm_GhabzOrHavalehaView GhabzOrHavale on GhabzOrHavale.ID = GhabzOrHavaleItem.GhabzOrHavale 
                    where GhabzOrHavaleItem.Stuff = '{0}' and GhabzOrHavaleItem.GhabzOrHavale <> '{2}' 
                        and (GhabzOrHavale.IssueDate < '{1}'
                            or (GhabzOrHavale.IssueDate = '{1}' and GhabzOrHavaleItem.RialiAmount is not null)--اسناد امروز که قبل از این سند هستند
                        )
                        -- بجز سند انباری که رفرنس ریالی اش همین سند انبار است
                        --and (GhabzOrHavale.WareHouseDocRialiReference is null 
                        --    or GhabzOrHavale.WareHouseDocRialiReference <> '{2}')
                        and RialiAmount is null",
                    stuffID, toDate, refGhabzOrHavaleID));

                if (notValuatedItem != null)
                {
                    var ghabzOrHavale = dbHelper.FetchSingleByID("wm.GhabzOrHavale", 
                        notValuatedItem.GetFieldValue<Guid>("GhabzOrHavale"), null);

                    throw new AfwException("سطر {0} در '{1}' ریالی نشده است.",
                        notValuatedItem.GetFieldValue<int>("RowNumber"),
                        GetGhabzOrHavalePreviewText(ghabzOrHavale));
                }

                var relatedItemsQuantitySum = relatedItemsSum.GetFieldValue<decimal>("QuantitySum");
                var relatedItemsRialiAmountSum = relatedItemsSum.GetFieldValue<decimal>("RialiAmountSum");

                if (relatedItemsQuantitySum <= 0)//بدلیل جلوگیری از بوجود آمدن خطای تقسیم بر صفر
                    throw new AfwException("تعداد کالا تا تاریخ '{0}' کوچکتر یا مساوی صفر است.",
                        DateTimeHelper.GregorianDateTimeToPersian(toDate).Split(' ')[0]);

                if (relatedItemsRialiAmountSum < 0)
                    throw new AfwException("ارزش ریالی محاسبه شده کالا به روش میانگین سیار تا تاریخ '{0}' کوچکتر از صفر است.",
                        DateTimeHelper.GregorianDateTimeToPersian(toDate).Split(' ')[0]);

                if (relatedItemsQuantitySum == quantity)
                    return relatedItemsRialiAmountSum;
                else
                    return (relatedItemsRialiAmountSum / relatedItemsQuantitySum) * quantity;
            }
            catch (Exception ex)
            {
                throw new AfwException("خطا در محاسبه ارزش ریالی '{0}' به روش میانگین سیار تا '{1}':\r\n {2}",
                    cmn.Instance.GetStuffTitle(stuffID),
                    DateTimeHelper.GregorianDateTimeToPersian(toDate).Split(' ')[0],
                    ex.Message);
            }
        }

        public decimal? GetGhabzOrHavaleRialiAmountSum(Guid ghabzOrhavaleID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var result = dbHelper.FetchSingleBySqlQuery(string.Format(@"
                select sum(isnull(RialiAmount , 0)) RialiAmountSum
                from wm_GhabzOrHavaleItems
                where GhabzOrHavale = '{0}'
            ", ghabzOrhavaleID)).GetFieldValue<decimal?>("RialiAmountSum");

            return result;
        }

        private List<Entity> GetIssueDatesForValuation(DateTime? fromDate, DateTime toDate)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            if (fromDate == null)
                fromDate = DateTime.MinValue;

            var datesEntityList = dbHelper.FetchMultipleBySqlQuery(string.Format(@"
                select GhabzOrHavale.IssueDate
                from wm_GhabzOrHavaleha GhabzOrHavale
	                left join afw_OptionSetItems VazeyatRialiShodan on GhabzOrHavale.VazeyatRialiShodan = VazeyatRialiShodan.ID
                where VazeyatRialiShodan.Name = 'RialiNashode' and
	                IssueDate between '{0}' and '{1}'
                group by IssueDate
                order by IssueDate", fromDate, toDate));

            return datesEntityList.Entities;
        }

        public void CheckValuationPermission()
        {
            if (!PermissionHelper.UserHasPermissionToItem("wm.TaghirMablaghRialiAsnadAnbar"))
                throw new AfwException("دسترسی تغییر وضعیت ریالی اسناد انبار برای شما وجود ندارد.");
        }
    }
}


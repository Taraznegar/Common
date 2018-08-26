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
    public class InventoryValuationBL
    {
        public static class SetRiali_PreviousItemsCheckingMode
        {
            public const string All = "All";
            public const string NoChecking = "NoChecking";
            public const string Relatives = "Relatives";
        };

        public void SaveRialiAmountChanges(Guid ghabzOrHavaleID, Guid ghabzOrHavaleItemID, decimal rialiAmount)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            if (!PermissionHelper.UserHasPermissionToItem("wm.TaghirMablaghRialiAsnadAnbar"))
                throw new AfwException("دسترسی تغییر مبلغ ریالی اسناد انبار برای شما وجود ندارد. ");

            //bool canSetRialiShode = true;
            var vazeyatRialiNashodeID = OptionSetHelper.GetOptionSetItemID("wm.VaziyatRialiAsnadAnbar", "RialiNashode");
            var vazeyatRialiShodeID = OptionSetHelper.GetOptionSetItemID("wm.VaziyatRialiAsnadAnbar", "RialiShode");

            var entity = dbHelper.FetchSingleByID("wm.GhabzOrHavale", ghabzOrHavaleID, new string[] { "GhabzOrHavaleItems" });
            var itemsEntities = entity.GetFieldValue<EntityList>("GhabzOrHavaleItems").Entities;

            if (entity.GetFieldValue<Guid>("VazeyatRialiShodan") == vazeyatRialiShodeID)
                throw new AfwException("برای تغییرات ابتدا رسید/حواله های بعد از سطر انتخاب شده را به حالت 'ریالی نشده' انتقال دهید.");
            else if (entity.GetFieldValue<Guid>("VazeyatRialiShodan") != vazeyatRialiNashodeID)
                throw new AfwException("رسید/حواله انتخاب شده در وضعیت 'سند شده' است.");

            for (int i = 0; i < itemsEntities.Count; i++)
            {
                if (itemsEntities[i].GetFieldValue<Guid>("ID") == ghabzOrHavaleItemID)
                {
                    //if (itemsEntities[i].GetFieldValue<decimal?>("RialiAmount") == null)
                    //    canSetRialiShode = true;
                    //else
                    //    canSetRialiShode = false;

                    itemsEntities[i].SetFieldValue("RialiAmount", rialiAmount);
                    dbHelper.ApplyChanges(itemsEntities[i]);
                }

                //if (itemsEntities[i].GetFieldValue<decimal?>("RialiAmount") == null)
                //    canSetRialiShode = false;
            }

            //if (canSetRialiShode) 
            //    SetRialiShodeDasti(entity, SetRiali_PreviousItemsCheckingMode.NoChecking);
        }

        /*
        public void SetRialiShodeToSelectedGhabzOrHavale(Guid ghabzOrHavaleID, string previousStatusCheckMode = SetRiali_PreviousItemsCheckingMode.All)
        {

            if (!previousStatusCheckMode.IsIn(
                SetRiali_PreviousItemsCheckingMode.All,
                SetRiali_PreviousItemsCheckingMode.Relatives))
                throw new AfwException("Invalid previousStatusCheckMode!");

            var dbHelper = CoreComponent.Instance.MainDbHelper;

            if (!PermissionHelper.UserHasPermissionToItem("wm.TaghirMablaghRialiAsnadAnbar"))
                throw new AfwException("دسترسی تغییر مبلغ ریالی اسناد انبار برای شما وجود ندارد.");

            try
            {
                wm.Instance.IsRunRialiNemudanList = true;

                var vazeyatRialiNashodeID = OptionSetHelper.GetOptionSetItemID("wm.VaziyatRialiAsnadAnbar", "RialiNashode");

                var toGhabzOrHavaleEntity = dbHelper.FetchSingleByID("wm.GhabzOrHavale", ghabzOrHavaleID, null);

                var filterExpression = string.Format("IssueDate <= '{0}'",
                    toGhabzOrHavaleEntity.GetFieldValue<DateTime>("IssueDate"));

                List<Guid> selectedGhabzOrHavaleStuffsIDList = new List<Guid>();

                if (previousStatusCheckMode == SetRiali_PreviousItemsCheckingMode.Relatives)
                    selectedGhabzOrHavaleStuffsIDList = GetGhabzOrHavaleStuffsIDList(ghabzOrHavaleID);

                var ghabzOrHavaleEntities = dbHelper.FetchMultiple("wm.GhabzOrHavale", filterExpression, "IssueDate , CreationTime",
                    null, null, new string[] { "GhabzOrHavaleItems" }).Entities;

                for (int i = 0; i < ghabzOrHavaleEntities.Count; i++)
                {
                    if (ghabzOrHavaleEntities[i].GetFieldValue<Guid>("VazeyatRialiShodan") != vazeyatRialiNashodeID)
                        continue;

                    if (previousStatusCheckMode == SetRiali_PreviousItemsCheckingMode.Relatives)
                    {
                        EntityList items = ghabzOrHavaleEntities[i].GetFieldValue<EntityList>("GhabzOrHavaleItems");
                        bool isSetRiali = false;

                        for (int j = 0; j < items.Entities.Count; j++)
                        {
                            for (int k = 0; k < selectedGhabzOrHavaleStuffsIDList.Count; k++)
                            {
                                if (items.Entities[j].GetFieldValue<Guid>("Stuff") == selectedGhabzOrHavaleStuffsIDList[k])
                                {
                                    SetRialiShode(ghabzOrHavaleEntities[i], SetRiali_PreviousItemsCheckingMode.NoChecking);

                                    isSetRiali = true;
                                    break;
                                }
                            }

                            if (isSetRiali)
                                break;
                        }
                    }
                    else
                        SetRialiShode(ghabzOrHavaleEntities[i], SetRiali_PreviousItemsCheckingMode.NoChecking);
                }
            }
            finally
            {
                wm.Instance.IsRunRialiNemudanList = false;
            }
        }
        */

        public void SetRialiShodeAutomatic(DateTime toDate)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var datesEntities = GetIssueDatesForValuation(null, toDate);

            wm.Instance.IsRunRialiNemudanList = true;

            for (int i = 0; i < datesEntities.Count; i++)
            {
                var ghabzAndHavaleSortedList = GetGhabzAndHavaleSortedListForRialiCalc(datesEntities[i].GetFieldValue<DateTime>("IssueDate"));

                for (int j = 0; j < ghabzAndHavaleSortedList.Entities.Count; j++)
                    ValuateWarehouseDoc(ghabzAndHavaleSortedList.Entities[j], SetRiali_PreviousItemsCheckingMode.NoChecking);
            }

            wm.Instance.IsRunRialiNemudanList = false;
        }

        private void ValuateWarehouseDoc(Entity ghabzOrHavaleEntity, string previousItemsCheckingMode)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var nahveRialiNemodanDasti = OptionSetHelper.GetOptionSetItemID("wm.NahveRialiNemodan", "Dasti");
            var nahveRialiNemodanMablaghEstandard = OptionSetHelper.GetOptionSetItemID("wm.NahveRialiNemodan", "MablaghEstandard");
            var nahveRialiNemodanMyanginMozun = OptionSetHelper.GetOptionSetItemID("wm.NahveRialiNemodan", "MyanginMozun");
            var nahveRialiNemodanSarJamReference = OptionSetHelper.GetOptionSetItemID("wm.NahveRialiNemodan", "SarJamReference");
            var nahveRialiNemodanSefr = OptionSetHelper.GetOptionSetItemID("wm.NahveRialiNemodan", "Sefr");
            var nahveRialiNemodanSanadReference = OptionSetHelper.GetOptionSetItemID("wm.NahveRialiNemodan", "SanadReference");
            var nahveRialiNemodanBarnameKhas = OptionSetHelper.GetOptionSetItemID("wm.NahveRialiNemodan", "BarnameKhas");

            if (!ghabzOrHavaleEntity.FieldExists("NahveRialiNemodan") || ghabzOrHavaleEntity.GetFieldValue<Guid?>("NahveRialiNemodan") == null)
                SetNahveRialiNemodanField(ghabzOrHavaleEntity);

            if (ghabzOrHavaleEntity.GetFieldValue<Guid>("NahveRialiNemodan") == nahveRialiNemodanDasti
                || ghabzOrHavaleEntity.GetFieldValue<bool?>("ForceManualRiali") == true)
                SetRialiShodeDasti(ghabzOrHavaleEntity, previousItemsCheckingMode);
            else if (ghabzOrHavaleEntity.GetFieldValue<Guid>("NahveRialiNemodan") == nahveRialiNemodanMablaghEstandard)
                SetRialiShodeMablaghEstandard(ghabzOrHavaleEntity, previousItemsCheckingMode);
            else if (ghabzOrHavaleEntity.GetFieldValue<Guid>("NahveRialiNemodan") == nahveRialiNemodanSefr)
                SetRialiShodeSefr(ghabzOrHavaleEntity, previousItemsCheckingMode);
            else if (ghabzOrHavaleEntity.GetFieldValue<Guid>("NahveRialiNemodan") == nahveRialiNemodanMyanginMozun)
                SetRialiShodeMyanginMozun(ghabzOrHavaleEntity, previousItemsCheckingMode);
            else if (ghabzOrHavaleEntity.GetFieldValue<Guid>("NahveRialiNemodan") == nahveRialiNemodanSanadReference)
                SetRialiShodeSanadReference(ghabzOrHavaleEntity, previousItemsCheckingMode);
            else if (ghabzOrHavaleEntity.GetFieldValue<Guid>("NahveRialiNemodan") == nahveRialiNemodanSarJamReference)
                SetRialiShodeSarJamReference(ghabzOrHavaleEntity, previousItemsCheckingMode);
            else if (ghabzOrHavaleEntity.GetFieldValue<Guid>("NahveRialiNemodan") == nahveRialiNemodanBarnameKhas)
                SetRialiShodeBarnameKhas(ghabzOrHavaleEntity, previousItemsCheckingMode);
        }

        private void SetNahveRialiNemodanField(Entity ghabzOrHavaleEntity)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var nahveRialiNemodanID = dbHelper.FetchSingleByID("wm.GhabzOrHavaleType",
                ghabzOrHavaleEntity.GetFieldValue<Guid>("GhabzOrHavaleType"), null).GetFieldValue<Guid?>("NahveRialiNemodan");

            if (nahveRialiNemodanID == null)
                throw new AfwException(
                    string.Format("{0}: نحوه ریالی نمودن در تنظیمات نوع رسید/ حواله تعیین نشده است.",
                        GetGhabzOrHavalePreviewText(ghabzOrHavaleEntity)));

            if (!ghabzOrHavaleEntity.FieldExists("NahveRialiNemodan"))
                ghabzOrHavaleEntity.AddField("NahveRialiNemodan");

            ghabzOrHavaleEntity.SetFieldValue("NahveRialiNemodan", nahveRialiNemodanID);

        }

        private void SetRialiShodeBarnameKhas(Entity ghabzOrHavaleEntity, string previousItemsCheckingMode)
        {
            throw new NotImplementedException();
        }

        private void SetRialiShodeSarJamReference(Entity ghabzOrHavaleEntity, string previousItemsCheckingMode)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var vazeyatRialiNashodeID = OptionSetHelper.GetOptionSetItemID("wm.VaziyatRialiAsnadAnbar", "RialiNashode");
            var vazeyatRialiShodeID = OptionSetHelper.GetOptionSetItemID("wm.VaziyatRialiAsnadAnbar", "RialiShode");

            if (ghabzOrHavaleEntity.GetFieldValue<Guid>("VazeyatRialiShodan") == vazeyatRialiNashodeID)
            {
                try
                {
                    using (var tranManager = new DbTransactionManager(dbHelper))
                    {
                        var itemsEntities = ghabzOrHavaleEntity.GetFieldValue<EntityList>("GhabzOrHavaleItems").Entities;

                        if (ghabzOrHavaleEntity.GetFieldValue<Guid?>("WareHouseDocRialiReference") == null)
                            throw new AfwException("رفرنس مالی انتخاب نشده است.");

                        var warehouseDocRialiReferenceEntity = dbHelper.FetchSingleByID("wm.GhabzOrHavale",
                            ghabzOrHavaleEntity.GetFieldValue<Guid>("WareHouseDocRialiReference"),
                            new string[] { "GhabzOrHavaleItems" });
                        if (warehouseDocRialiReferenceEntity == null)
                            throw new AfwException("رفرنس مالی یافت نشد.");

                        if (warehouseDocRialiReferenceEntity.GetFieldValue<Guid>("VazeyatRialiShodan") == vazeyatRialiNashodeID)
                            throw new AfwException("ابتدا {0} را ریالی نمایید.",
                               GetGhabzOrHavalePreviewText(warehouseDocRialiReferenceEntity));

                        var wareHouseDocRialiReferenceItemsEntities = warehouseDocRialiReferenceEntity.GetFieldValue<EntityList>("GhabzOrHavaleItems").Entities;

                        if (itemsEntities.Count != 1)
                            throw new AfwException("رسید/ حواله با نحوه ریالی شدن 'سرجمع رفرنس' نباید بیشتر از یک آیتم داشته باشد.");

                        decimal sum = 0;
                        for (int i = 0; i < wareHouseDocRialiReferenceItemsEntities.Count; i++)
                            sum += wareHouseDocRialiReferenceItemsEntities[i].GetFieldValue<decimal>("RialiAmount");

                        itemsEntities[0].SetFieldValue("RialiAmount", sum);

                        CheckPreviousGhabzOrHavaleItems(ghabzOrHavaleEntity,
                            !wm.Instance.IsRunRialiNemudanList ? previousItemsCheckingMode : SetRiali_PreviousItemsCheckingMode.NoChecking,
                            itemsEntities[0].GetFieldValue<Guid>("Stuff"));

                        dbHelper.UpdateEntity(itemsEntities[0]);

                        ghabzOrHavaleEntity = dbHelper.FetchSingleByID("wm.GhabzOrHavale", ghabzOrHavaleEntity.GetFieldValue<Guid>("ID"),
                            new string[] { "GhabzOrHavaleItems" });
                        ghabzOrHavaleEntity.SetFieldValue("VazeyatRialiShodan", vazeyatRialiShodeID);

                        dbHelper.UpdateEntity(ghabzOrHavaleEntity);

                        tranManager.Commit();
                    }
                }
                catch (Exception ex)
                {
                    throw new Exception(string.Format("{0}:\n {1}",
                        GetGhabzOrHavalePreviewText(ghabzOrHavaleEntity), ex.Message));
                }
            }
        }

        private void SetRialiShodeSanadReference(Entity ghabzOrHavaleEntity, string previousItemsCheckingMode)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var vazeyatRialiNashodeID = OptionSetHelper.GetOptionSetItemID("wm.VaziyatRialiAsnadAnbar", "RialiNashode");
            var vazeyatRialiShodeID = OptionSetHelper.GetOptionSetItemID("wm.VaziyatRialiAsnadAnbar", "RialiShode");

            if (ghabzOrHavaleEntity.GetFieldValue<Guid>("VazeyatRialiShodan") == vazeyatRialiNashodeID)
            {
                try
                {
                    using (var tranManager = new DbTransactionManager(dbHelper))
                    {
                        var itemsEntities = ghabzOrHavaleEntity.GetFieldValue<EntityList>("GhabzOrHavaleItems").Entities;

                        if (ghabzOrHavaleEntity.GetFieldValue<Guid?>("WareHouseDocRialiReference") == null)
                            throw new AfwException("رفرنس مالی انتخاب نشده است.");

                        var warehouseDocRialiReferenceEntity = dbHelper.FetchSingleByID("wm.GhabzOrHavale", ghabzOrHavaleEntity.GetFieldValue<Guid>("WareHouseDocRialiReference"),
                            new string[] { "GhabzOrHavaleItems" });
                        if (warehouseDocRialiReferenceEntity == null)
                            throw new AfwException("رفرنس مالی یافت نشد.");

                        var wareHouseDocRialiReferenceItemsEntities = warehouseDocRialiReferenceEntity.GetFieldValue<EntityList>("GhabzOrHavaleItems").Entities;

                        if (itemsEntities.Count != wareHouseDocRialiReferenceItemsEntities.Count)
                            throw new AfwException("تعداد آیتم ها با تعداد آیتم های رفرنس مالی ({0}) برابر نیست.",
                                GetGhabzOrHavalePreviewText(warehouseDocRialiReferenceEntity));

                        if (warehouseDocRialiReferenceEntity.GetFieldValue<Guid>("VazeyatRialiShodan") == vazeyatRialiNashodeID)
                            throw new AfwException("ابتدا {0} را ریالی نمایید.",
                               GetGhabzOrHavalePreviewText(warehouseDocRialiReferenceEntity));

                        for (int j = 0; j < itemsEntities.Count; j++)
                        {
                            itemsEntities[j].SetFieldValue("RialiAmount", wareHouseDocRialiReferenceItemsEntities[j].GetFieldValue<decimal>("RialiAmount"));

                            CheckPreviousGhabzOrHavaleItems(ghabzOrHavaleEntity,
                                !wm.Instance.IsRunRialiNemudanList ? previousItemsCheckingMode : SetRiali_PreviousItemsCheckingMode.NoChecking,
                                itemsEntities[j].GetFieldValue<Guid>("Stuff"));

                            dbHelper.UpdateEntity(itemsEntities[j]);
                        }

                        ghabzOrHavaleEntity = dbHelper.FetchSingleByID("wm.GhabzOrHavale", ghabzOrHavaleEntity.GetFieldValue<Guid>("ID"),
                            new string[] { "GhabzOrHavaleItems" });
                        ghabzOrHavaleEntity.SetFieldValue("VazeyatRialiShodan", vazeyatRialiShodeID);

                        dbHelper.UpdateEntity(ghabzOrHavaleEntity);

                        tranManager.Commit();
                    }
                }
                catch (Exception ex)
                {
                    throw new Exception(string.Format("{0}:\n {1}",
                        GetGhabzOrHavalePreviewText(ghabzOrHavaleEntity), ex.Message));
                }
            }
        }

        private void SetRialiShodeMyanginMozun(Entity ghabzOrHavaleEntity, string previousItemsCheckingMode)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var vazeyatRialiNashodeID = OptionSetHelper.GetOptionSetItemID("wm.VaziyatRialiAsnadAnbar", "RialiNashode");
            var vazeyatRialiShodeID = OptionSetHelper.GetOptionSetItemID("wm.VaziyatRialiAsnadAnbar", "RialiShode");

            if (ghabzOrHavaleEntity.GetFieldValue<Guid>("VazeyatRialiShodan") == vazeyatRialiNashodeID)
            {
                try
                {
                    using (var tranManager = new DbTransactionManager(dbHelper))
                    {
                        var itemsEntities = ghabzOrHavaleEntity.GetFieldValue<EntityList>("GhabzOrHavaleItems").Entities;
                        for (int i = 0; i < itemsEntities.Count; i++)
                        {
                            var mianginMozun = GetMyanginMozun(itemsEntities[i].GetFieldValue<Guid>("Stuff"),
                                itemsEntities[i].GetFieldValue<int>("Quantity"),
                                ghabzOrHavaleEntity.GetFieldValue<DateTime>("IssueDate"),
                                ghabzOrHavaleEntity.GetFieldValue<DateTime>("CreationTime"),
                                ghabzOrHavaleEntity.GetFieldValue<Guid>("ID"));

                            if (mianginMozun < 0)
                                throw new AfwException("قبل از تاریخ {0} برای کالای سطر {1} موجودی ایی یافت نشد",
                                    DateTimeHelper.GregorianDateTimeToPersian(ghabzOrHavaleEntity.GetFieldValue<DateTime>("IssueDate")).Split(' ')[0],
                                    itemsEntities[i].GetFieldValue<int>("RowNumber"));

                            itemsEntities[i].SetFieldValue("RialiAmount", mianginMozun);

                            CheckPreviousGhabzOrHavaleItems(ghabzOrHavaleEntity,
                                !wm.Instance.IsRunRialiNemudanList ? previousItemsCheckingMode : SetRiali_PreviousItemsCheckingMode.NoChecking,
                                itemsEntities[i].GetFieldValue<Guid>("Stuff"));

                            dbHelper.UpdateEntity(itemsEntities[i]);
                        }

                        ghabzOrHavaleEntity = dbHelper.FetchSingleByID("wm.GhabzOrHavale", ghabzOrHavaleEntity.GetFieldValue<Guid>("ID"),
                            new string[] { "GhabzOrHavaleItems" });
                        ghabzOrHavaleEntity.SetFieldValue("VazeyatRialiShodan", vazeyatRialiShodeID);

                        dbHelper.UpdateEntity(ghabzOrHavaleEntity);

                        tranManager.Commit();
                    }
                }
                catch (Exception ex)
                {
                    throw new Exception(string.Format("{0}:\n {1}",
                        GetGhabzOrHavalePreviewText(ghabzOrHavaleEntity), ex.Message));
                }
            }
        }

        private void SetRialiShodeSefr(Entity ghabzOrHavaleEntity, string previousItemsCheckingMode)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var vazeyatRialiNashodeID = OptionSetHelper.GetOptionSetItemID("wm.VaziyatRialiAsnadAnbar", "RialiNashode");
            var vazeyatRialiShodeID = OptionSetHelper.GetOptionSetItemID("wm.VaziyatRialiAsnadAnbar", "RialiShode");

            if (ghabzOrHavaleEntity.GetFieldValue<Guid>("VazeyatRialiShodan") == vazeyatRialiNashodeID)
            {
                try
                {
                    using (var tranManager = new DbTransactionManager(dbHelper))
                    {
                        var itemsEntities = ghabzOrHavaleEntity.GetFieldValue<EntityList>("GhabzOrHavaleItems").Entities;
                        for (int j = 0; j < itemsEntities.Count; j++)
                        {
                            itemsEntities[j].SetFieldValue("RialiAmount", 0);

                            CheckPreviousGhabzOrHavaleItems(ghabzOrHavaleEntity,
                                !wm.Instance.IsRunRialiNemudanList ? previousItemsCheckingMode : SetRiali_PreviousItemsCheckingMode.NoChecking,
                                itemsEntities[j].GetFieldValue<Guid>("Stuff"));

                            dbHelper.UpdateEntity(itemsEntities[j]);
                        }

                        ghabzOrHavaleEntity = dbHelper.FetchSingleByID("wm.GhabzOrHavale", ghabzOrHavaleEntity.GetFieldValue<Guid>("ID"),
                            new string[] { "GhabzOrHavaleItems" });
                        ghabzOrHavaleEntity.SetFieldValue("VazeyatRialiShodan", vazeyatRialiShodeID);

                        dbHelper.UpdateEntity(ghabzOrHavaleEntity);

                        tranManager.Commit();
                    }
                }
                catch (Exception ex)
                {
                    throw new Exception(string.Format("{0}:\n {1}",
                        GetGhabzOrHavalePreviewText(ghabzOrHavaleEntity), ex.Message));
                }
            }
        }

        private void SetRialiShodeMablaghEstandard(Entity ghabzOrHavaleEntity, string previousItemsCheckingMode)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var vazeyatRialiNashodeID = OptionSetHelper.GetOptionSetItemID("wm.VaziyatRialiAsnadAnbar", "RialiNashode");
            var vazeyatRialiShodeID = OptionSetHelper.GetOptionSetItemID("wm.VaziyatRialiAsnadAnbar", "RialiShode");

            if (ghabzOrHavaleEntity.GetFieldValue<Guid>("VazeyatRialiShodan") == vazeyatRialiNashodeID)
            {
                try
                {
                    using (var tranManager = new DbTransactionManager(dbHelper))
                    {
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

                            CheckPreviousGhabzOrHavaleItems(ghabzOrHavaleEntity,
                                !wm.Instance.IsRunRialiNemudanList ? previousItemsCheckingMode : SetRiali_PreviousItemsCheckingMode.NoChecking,
                                itemsEntities[i].GetFieldValue<Guid>("Stuff"));

                            dbHelper.UpdateEntity(itemsEntities[i]);
                        }

                        ghabzOrHavaleEntity = dbHelper.FetchSingleByID("wm.GhabzOrHavale", ghabzOrHavaleEntity.GetFieldValue<Guid>("ID"),
                            new string[] { "GhabzOrHavaleItems" });
                        ghabzOrHavaleEntity.SetFieldValue("VazeyatRialiShodan", vazeyatRialiShodeID);

                        dbHelper.UpdateEntity(ghabzOrHavaleEntity);

                        tranManager.Commit();
                    }
                }
                catch (Exception ex)
                {
                    throw new Exception(string.Format("{0}:\n {1}",
                        GetGhabzOrHavalePreviewText(ghabzOrHavaleEntity), ex.Message));
                }
            }
        }

        private void SetRialiShodeDasti(Entity ghabzOrHavaleEntity, string previousItemsCheckingMode)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            using (var tranManager = new DbTransactionManager(dbHelper))
            {
                var vazeyatRialiNashodeID = OptionSetHelper.GetOptionSetItemID("wm.VaziyatRialiAsnadAnbar", "RialiNashode");
                var vazeyatRialiShodeID = OptionSetHelper.GetOptionSetItemID("wm.VaziyatRialiAsnadAnbar", "RialiShode");

                if (ghabzOrHavaleEntity.GetFieldValue<Guid>("VazeyatRialiShodan") == vazeyatRialiNashodeID)
                {
                    try
                    {
                        var itemsEntities = ghabzOrHavaleEntity.GetFieldValue<EntityList>("GhabzOrHavaleItems").Entities;
                        for (int itemIndex = 0; itemIndex < itemsEntities.Count; itemIndex++)
                        {
                            if (itemsEntities[itemIndex].GetFieldValue<decimal?>("RialiAmount") == null)
                            {
                                throw new AfwException("مبلغ دستی برای سطر {0} وارد نشده است.",
                                    itemsEntities[itemIndex].GetFieldValue<int>("RowNumber"));
                            }

                            CheckPreviousGhabzOrHavaleItems(ghabzOrHavaleEntity,
                                !wm.Instance.IsRunRialiNemudanList ? previousItemsCheckingMode : SetRiali_PreviousItemsCheckingMode.NoChecking,
                                itemsEntities[itemIndex].GetFieldValue<Guid>("Stuff"));
                        }

                        ghabzOrHavaleEntity = dbHelper.FetchSingleByID("wm.GhabzOrHavale", ghabzOrHavaleEntity.GetFieldValue<Guid>("ID"),
                            new string[] { "GhabzOrHavaleItems" });
                        ghabzOrHavaleEntity.SetFieldValue("VazeyatRialiShodan", vazeyatRialiShodeID);

                        dbHelper.UpdateEntity(ghabzOrHavaleEntity);
                    }
                    catch (Exception ex)
                    {
                        throw new Exception(string.Format("{0}:\n {1}",
                            GetGhabzOrHavalePreviewText(ghabzOrHavaleEntity), ex.Message));
                    }
                }

                tranManager.Commit();
            }
        }

        private string GetGhabzOrHavalePreviewText(Entity ghabzOrHavaleEntity)
        {
            var ghabzOrHavaleTypeEntity = wm.Instance.GetGhabzOrHavaleTypeEntity(ghabzOrHavaleEntity.GetFieldValue<Guid>("GhabzOrHavaleType"));
            var warehouseDocTypeName = OptionSetHelper.GetOptionSetItemName(ghabzOrHavaleTypeEntity.GetFieldValue<Guid>("WarehouseDocType"));

            var warehouseKeeperNotes = ghabzOrHavaleEntity.GetFieldValue<string>("WarehouseKeeperNotes");
            if (warehouseKeeperNotes == null)
                warehouseKeeperNotes = "";

            if (warehouseKeeperNotes.Length > 97)
                warehouseKeeperNotes = warehouseKeeperNotes.Substring(0, 97) + "...";

            return string.Format("{0} شماره {1} {2} (تاریخ صدور: {3}، توضیحات انباردار: {4})",
                warehouseDocTypeName == "Ghabz" ? "رسید" : "حواله",
                ghabzOrHavaleEntity.GetFieldValue<int>("GhabzOrHavaleNumber"),
                wm.Instance.GetStuffLocationEntity(ghabzOrHavaleEntity.GetFieldValue<Guid>("StuffLocation")).GetFieldValue<string>("Name"),
                DateTimeHelper.GregorianDateTimeToPersian(ghabzOrHavaleEntity.GetFieldValue<DateTime>("IssueDate")),
                warehouseKeeperNotes);
        }

        public void SetRialiNashodeFromDate(DateTime fromDate/*, bool doDeleteRialiAmounts = false*/)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var filterExpression = string.Format("IssueDate >= '{0}' and VazeyatRialiShodan <> '{1}'",
                fromDate, OptionSetHelper.GetOptionSetItemID("wm.VaziyatRialiAsnadAnbar", "RialiNashode"));

            var ghabzOrHavaleEntities = dbHelper.FetchMultiple("wm.GhabzOrHavale", filterExpression, "IssueDate desc , CreationTime desc",
                null, null, new string[] { "GhabzOrHavaleItems" }).Entities;
            try
            {
                wm.Instance.IsRunRialiNemudanList = true;

                for (int i = 0; i < ghabzOrHavaleEntities.Count; i++)
                    SetRialiNashode(ghabzOrHavaleEntities[i]/*, doDeleteRialiAmounts*/);
            }
            finally
            {
                wm.Instance.IsRunRialiNemudanList = false;
            }
        }

        public void CheckHasRialiShode(DateTime fromDate, DateTime creationTime)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var filterExpression = string.Format(@"VazeyatRialiShodan <> '{2}' and
                    (IssueDate > '{0}' or (IssueDate = '{0}' and creationTime > '{1}'))  ",
                fromDate, creationTime,
                OptionSetHelper.GetOptionSetItemID("wm.VaziyatRialiAsnadAnbar", "RialiNashode"));

            if (dbHelper.EntityExists("wm.GhabzOrHavale", filterExpression) == true)
                throw new AfwException("رسید/ حواله ریالی شده پس از تاریخ {0} موجود است.\r\n ابتدا رسید /حواله های بعد از این تاریخ را به وضعیت ریالی نشده منتقل کنید.",
                    DateTimeHelper.GregorianDateTimeToPersian(fromDate));
        }

        private void SetRialiNashode(Entity ghabzOrHavaleEntity/*, bool doDeleteRialiAmounts*/)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var vazeyatRialiSanadShodeID = OptionSetHelper.GetOptionSetItemID("wm.VaziyatRialiAsnadAnbar", "SanadShode");
            var vazeyatRialiNashodeID = OptionSetHelper.GetOptionSetItemID("wm.VaziyatRialiAsnadAnbar", "RialiNashode");

            try
            {
                wm.Instance.IsRunRialiNemudanList = true;

                if (!PermissionHelper.UserHasPermissionToItem("wm.TaghirMablaghRialiAsnadAnbar"))
                    throw new AfwException("دسترسی تغییر وضعیت ریالی اسناد انبار برای شما وجود ندارد. ");

                if (ghabzOrHavaleEntity.GetFieldValue<Guid>("VazeyatRialiShodan") == vazeyatRialiSanadShodeID)
                {
                    throw new AfwException("رسید/ حواله با شماره {0} دارای سند است. ابتدا سند را باطل نمایید.",
                        ghabzOrHavaleEntity.GetFieldValue<int>("GhabzOrHavaleNumber"));
                }

                var nahveRialiNemodan = wm.Instance.GetGhabzOrHavaleTypeEntity(ghabzOrHavaleEntity.GetFieldValue<Guid>("GhabzOrHavaleType"))
                    .GetFieldValue<Guid?>("NahveRialiNemodan");

                if (nahveRialiNemodan == null)
                    throw new AfwException(
                        string.Format("{0}: نحوه ریالی نمودن در تنظیمات نوع رسید/ حواله تعیین نشده است.",
                            GetGhabzOrHavalePreviewText(ghabzOrHavaleEntity)));

                var doDeleteRialiAmounts = nahveRialiNemodan != OptionSetHelper.GetOptionSetItemID("wm.NahveRialiNemodan", "Dasti")
                    && ghabzOrHavaleEntity.GetFieldValue<bool?>("ForceManualRiali") != true;

                using (var tranManager = new DbTransactionManager(dbHelper))
                {
                    if (doDeleteRialiAmounts)
                    {
                        var itemsEntities = ghabzOrHavaleEntity.GetFieldValue<EntityList>("GhabzOrHavaleItems").Entities;
                        for (int j = 0; j < itemsEntities.Count; j++)
                        {
                            itemsEntities[j].SetFieldValue("RialiAmount", null);
                            dbHelper.UpdateEntity(itemsEntities[j]);
                        }
                    }

                    ghabzOrHavaleEntity.SetFieldValue("VazeyatRialiShodan", vazeyatRialiNashodeID);
                    dbHelper.UpdateEntity(ghabzOrHavaleEntity);

                    tranManager.Commit();
                }
            }
            catch (Exception ex)
            {
                throw new Exception(string.Format("{0}:\n {2}",
                     GetGhabzOrHavalePreviewText(ghabzOrHavaleEntity), ex.Message));
            }
            finally
            {
                wm.Instance.IsRunRialiNemudanList = false;
            }
        }

        public EntityList GetGhabzAndHavaleSortedListForRialiCalc(DateTime date)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var ghabzOrHavaleEntityDefID = dbHelper.FetchSingle("afw.EntityDef", "Name = 'GhabzOrHavale'", null).GetFieldValue<Guid>("ID");

            EntityList ghabzAndHavaleSortedList = new EntityList();

            //رسید هایی که برای امروز اند و رفرنس ریالی ندارد یا رفرنس ریالی آنها امروز نیست
            var ghabzEntities = dbHelper.FetchMultipleBySqlQuery(string.Format(@"
                select GhabzOrHavale.*
                from wm_GhabzOrHavaleha GhabzOrHavale
                    left join wm_GhabzOrHavaleTypes GhabzOrHavaleType on GhabzOrHavaleType.ID = GhabzOrHavale.GhabzOrHavaleType
                    left join afw_OptionSetItems GhabzWarehouseDoc on GhabzOrHavaleType.WarehouseDocType = GhabzWarehouseDoc.ID
                where GhabzWarehouseDoc.Name = 'Ghabz' 
                    and (
		                GhabzOrHavale.WareHouseDocRialiReference is null
		                or GhabzOrHavale.WareHouseDocRialiReference not in(
		                        select ID
		                        from wm_GhabzOrHavaleha
		                        where IssueDate = '{0}'
		                        )
	                )
                    and GhabzOrHavale.IssueDate = '{0}'
                order by CreationTime",
                date.ToString().Split(' ')[0])).Entities;

            for (int i = 0; i < ghabzEntities.Count; i++)
            {
                ghabzEntities[i].AddField("GhabzOrHavaleItems", dbHelper.FetchMultiple("wm.GhabzOrHavaleItem",
                    string.Format("GhabzOrHavale = '{0}'", ghabzEntities[i].GetFieldValue<Guid>("ID")),
                    "RowNumber", null, null, null));
                ghabzEntities[i].AddField("EntityDefID", ghabzOrHavaleEntityDefID);
            }

            ghabzAndHavaleSortedList.Entities.AddRange(ghabzEntities);

            //رسید و حواله هایی که برای امروز اند و رفرنس ریالی برای رسید/حواله هایی هستند که امروز ایجاد شده اند.
            var tarkibiEntities = dbHelper.FetchMultipleBySqlQuery(string.Format(@"
                select GhabzOrHavale.*
                from wm_GhabzOrHavaleha GhabzOrHavale
                    left join wm_GhabzOrHavaleTypes GhabzOrHavaleType on GhabzOrHavaleType.ID = GhabzOrHavale.GhabzOrHavaleType
                    left join afw_OptionSetItems WarehouseDocType on GhabzOrHavaleType.WarehouseDocType = WarehouseDocType.ID
                where GhabzOrHavale.IssueDate = '{0}' and
	                GhabzOrHavale.ID in(
		                select WareHouseDocRialiReference
		                from wm_GhabzOrHavaleha
		                where WareHouseDocRialiReference is not null and
			                IssueDate = '{0}'
		                )
                order by GhabzOrHavale.CreationTime",
                date.ToString().Split(' ')[0])).Entities;

            for (int i = 0; i < tarkibiEntities.Count; i++)
            {
                tarkibiEntities[i].AddField("GhabzOrHavaleItems", dbHelper.FetchMultiple("wm.GhabzOrHavaleItem",
                    string.Format("GhabzOrHavale = '{0}'", tarkibiEntities[i].GetFieldValue<Guid>("ID")),
                    "RowNumber", null, null, null));
                tarkibiEntities[i].AddField("EntityDefID", ghabzOrHavaleEntityDefID);
            }

            ghabzAndHavaleSortedList.Entities.AddRange(tarkibiEntities);

            //رسید و حواله هایی که برای امروزند که رفرنس ریالی دارند که برای امروز است یا حواله ایی که رفرنس ریالی رسید / حواله ایی نیست هستند 
            var havaleEntities = dbHelper.FetchMultipleBySqlQuery(string.Format(@"
                 select GhabzOrHavale.*
                from wm_GhabzOrHavaleha GhabzOrHavale
                    left join wm_GhabzOrHavaleTypes GhabzOrHavaleType on GhabzOrHavaleType.ID = GhabzOrHavale.GhabzOrHavaleType
                    left join afw_OptionSetItems GhabzWarehouseDoc on GhabzOrHavaleType.WarehouseDocType = GhabzWarehouseDoc.ID
                where GhabzOrHavale.IssueDate = '{0}'
	                 and ((
                            GhabzWarehouseDoc.Name = 'Havale'
                            and GhabzOrHavale.ID not in(
		                        select WareHouseDocRialiReference
		                        from wm_GhabzOrHavaleha
		                        where WareHouseDocRialiReference is not null and
			                        IssueDate = '{0}'
		                        )  
                            )
						or (
							GhabzWarehouseDoc.Name = 'Ghabz'
			                and GhabzOrHavale.WareHouseDocRialiReference is not null
			                and GhabzOrHavale.WareHouseDocRialiReference in(
		                        select ID
		                        from wm_GhabzOrHavaleha
		                        where IssueDate = '{0}'
		                        )
			                ))
                order by GhabzOrHavale.CreationTime",
                date.ToString().Split(' ')[0])).Entities;

            for (int i = 0; i < havaleEntities.Count; i++)
            {
                havaleEntities[i].AddField("GhabzOrHavaleItems", dbHelper.FetchMultiple("wm.GhabzOrHavaleItem",
                    string.Format("GhabzOrHavale = '{0}'", havaleEntities[i].GetFieldValue<Guid>("ID")),
                    "RowNumber", null, null, null));
                havaleEntities[i].AddField("EntityDefID", ghabzOrHavaleEntityDefID);
            }

            ghabzAndHavaleSortedList.Entities.AddRange(havaleEntities);

            return ghabzAndHavaleSortedList;
        }

        private void CheckPreviousGhabzOrHavaleItems(Entity ghabzOrHavaleEntity, string previousItemsCheckingMode, Guid? stuffID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            if (previousItemsCheckingMode == SetRiali_PreviousItemsCheckingMode.Relatives)
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
            else if (previousItemsCheckingMode == SetRiali_PreviousItemsCheckingMode.All)
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

        private List<Guid> GetGhabzOrHavaleStuffsIDList(Guid ghabzOrHavaleID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;
            List<Guid> selectedGhabzOrHavaleStuffsIDList = new List<Guid>();

            var selectedGhabzOrHavaleStuffsID = dbHelper.FetchMultipleBySqlQuery(string.Format(@"
                    select GhabzOrHavaleItem.Stuff StuffID
                    from wm_GhabzOrHavaleha GhabzOrHavale
	                    inner join wm_GhabzOrHavaleItems GhabzOrHavaleItem on GhabzOrHavaleItem.GhabzOrHavale = GhabzOrHavale.ID
                    where  GhabzOrHavale.ID = '{0}' ", ghabzOrHavaleID));

            for (int i = 0; i < selectedGhabzOrHavaleStuffsID.Entities.Count; i++)
                selectedGhabzOrHavaleStuffsIDList.Add(selectedGhabzOrHavaleStuffsID.Entities[i].GetFieldValue<Guid>("StuffID"));

            return selectedGhabzOrHavaleStuffsIDList;
        }

        public EntityList BarresiAsnadJahatRialiNemudan(DateTime? fromDate, DateTime toDate)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var datesEntities = GetIssueDatesForValuation(fromDate, toDate);
            EntityList problematicGhabzOrHavaleEntities = new EntityList();

            //using (var tranManager = new DbTransactionManager(dbHelper))
            //قبلا بدلیل این که این متد تنها جهت بررسی است، بعد از ریالی کردن و بدست آمدن خطاها، همه رول بک می شدند.
            //اما بدلیل تغییر در متد و ارسال درخواست بررسی بصورت بخش بخش شده روی بازه های تاریخ، امکان رول بک کردن تراکنش وجود ندارد.
            //چون برای بررسی بازه تاریخ بعدی باید بازه تاریخ قبلی بررسی و ریالی شده باشد.
            //{
            wm.Instance.IsRunRialiNemudanList = true;

            for (int i = 0; i < datesEntities.Count; i++)
            {
                try
                {
                    var ghabzAndHavaleSortedList = GetGhabzAndHavaleSortedListForRialiCalc(datesEntities[i].GetFieldValue<DateTime>("IssueDate"));

                    for (int j = 0; j < ghabzAndHavaleSortedList.Entities.Count; j++)
                    {
                        try
                        {
                            ValuateWarehouseDoc(ghabzAndHavaleSortedList.Entities[j], SetRiali_PreviousItemsCheckingMode.NoChecking);
                        }
                        catch (Exception ex)
                        {
                            if (!ex.Message.Contains("مبلغ ریالی / تعداد ندارد.") && !ex.Message.Contains("ریالی نمایید."))
                            {
                                Entity item = new Entity();
                                item.AddField("Message", ex.Message);
                                problematicGhabzOrHavaleEntities.Entities.Add(item);
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    if (!ex.Message.Contains("مبلغ ریالی / تعداد ندارد.") && !ex.Message.Contains("ریالی نمایید."))
                    {
                        Entity item = new Entity();
                        item.AddField("Message", ex.Message);
                        problematicGhabzOrHavaleEntities.Entities.Add(item);
                    }
                }
            }

            wm.Instance.IsRunRialiNemudanList = false;
            //}

            return problematicGhabzOrHavaleEntities;
        }

        private decimal GetMyanginMozun(Guid stuffID, int quantity, DateTime toDate, DateTime refCreationTime, Guid refGhabzOrHavaleID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            string query = string.Format(@"
                select GhabzOrHavaleItem.Quantity,
                    RowNumber,
	                GhabzOrHavaleItem.RialiAmount,
	                GhabzOrHavale.GhabzOrHavaleNumber,
	                WarehouseDocType_Title,                   
	                WarehouseDocType_Name,
	                StuffDef.Name StuffName
                from wm_GhabzOrHavaleItemsView GhabzOrHavaleItem
	                left join wm_GhabzOrHavalehaView GhabzOrHavale on GhabzOrHavale.ID= GhabzOrHavaleItem.GhabzOrHavale 
					left join cmn_StuffDefs StuffDef on StuffDef.ID = GhabzOrHavaleItem.StuffDef      
                where GhabzOrHavaleItem.Stuff = '{0}' and GhabzOrHavaleItem.GhabzOrHavale <> '{2}' 
                    and (GhabzOrHavale.IssueDate < '{1}'
                        or (GhabzOrHavale.IssueDate = '{1}' and GhabzOrHavale.CreationTime < '{3}')
                    )           
                    -- بجز سند انباری که رفرنس ریالی اش همین سند انبار است
                    and (GhabzOrHavale.WareHouseDocRialiReference is null 
                        or GhabzOrHavale.WareHouseDocRialiReference <> '{2}')",
                stuffID, toDate, refGhabzOrHavaleID, refCreationTime);

            var items = dbHelper.FetchMultipleBySqlQuery(query).Entities;
            decimal rialiAmountSum = 0;
            int quantitySum = 0;

            if (items.Count < 1)
                return -1;

            for (int i = 0; i < items.Count; i++)
            {
                if (items[i].GetFieldValue<decimal?>("RialiAmount") == null || items[i].GetFieldValue<int?>("Quantity") == null)
                    throw new AfwException("سطر {0} {1} به شماره {2} مبلغ ریالی / تعداد ندارد.",
                       items[i].GetFieldValue<int?>("RowNumber"),
                       items[i].GetFieldValue<string>("WarehouseDocType_Title"),
                       items[i].GetFieldValue<int?>("GhabzOrHavaleNumber"));

                if (items[i].GetFieldValue<string>("WarehouseDocType_Name") == "Havale")
                {
                    rialiAmountSum -= items[i].GetFieldValue<decimal>("RialiAmount");
                    quantitySum -= items[i].GetFieldValue<int>("Quantity");
                }
                else if (items[i].GetFieldValue<string>("WarehouseDocType_Name") == "Ghabz")
                {
                    rialiAmountSum += items[i].GetFieldValue<decimal>("RialiAmount");
                    quantitySum += items[i].GetFieldValue<int>("Quantity");
                }
                else
                    throw new AfwException("Invalid WarehouseDocType_Name : {0}", items[i].GetFieldValue<string>("WarehouseDocType_Name"));
            }

            if (quantitySum <= 0)
                throw new AfwException("تعداد کالای {0} تا تاریخ {1} کوچکتر مساوی صفر است : {2}.",
                    items[0].GetFieldValue<string>("StuffName"),
                    DateTimeHelper.GregorianDateTimeToPersian(toDate).Split(' ')[0], quantitySum);

            if (rialiAmountSum < 0)
                throw new AfwException("مبلغ ریالی کالای {0} تا تاریخ {1} کوچکتر از صفر است : {2}.",
                    items[0].GetFieldValue<string>("StuffName"),
                    DateTimeHelper.GregorianDateTimeToPersian(toDate).Split(' ')[0], rialiAmountSum);

            if (quantitySum == quantity)
                return rialiAmountSum;
            else
                return (rialiAmountSum / quantitySum) * quantity;
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
    }
}


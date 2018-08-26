using AppFramework;
using AppFramework.AppServer;
using AppFramework.DataAccess;
using AppFramework.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using AppFramework.AppServer.ReceiveAndPay;

namespace AppFramework.AppServer.PurchaseAndSales
{
    public class ReturnFromBuyBL : FinancialOpBaseBL
    {
        public ReturnFromBuyBL() : base("ReturnFromBuy") { }

        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            if (entity.GetFieldValue<decimal>("GeneralDiscount") != 0)
                throw new AfwException("امکان مقدار دهی به فیلد تخفیف کلی پیاده سازی نشده است.");

            if (entity.ChangeStatus == EntityChangeTypes.Add)
            {
                SetReturnFromBuyNumber(dbHelper, entity);
            }

            if (entity.ChangeStatus == EntityChangeTypes.Delete)
                acc.Instance.DeleteAccDocItems(entity.GetFieldValue<Guid?>("AccDoc"), "RefOp_ReturnFromBuy", entity.GetFieldValue<Guid>("ID"));
        }

        public override void AfterApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.AfterApplyChanges(dbHelper, entity);

            var invoiceID = entity.GetFieldValue<Guid>("ID");

            if (entity.ChangeStatus != EntityChangeTypes.Delete)
            {
                if (entity.FieldExists("StuffItems"))
                {
                    var stuffItems = entity.GetFieldValue<EntityList>("StuffItems").Entities;
                    SaveItems(stuffItems);
                }

                if (!HasItem(invoiceID))
                    throw new AfwException("فاکتور آیتم ندارد .");

                if (entity.GetFieldValue<Guid?>("BuyInvoice") != null)
                {
                    var invalidBuyInvoiceItem = GetBuyInvoiceItemsWithRemainedQty(entity.GetFieldValue<Guid>("BuyInvoice"))
                        .Entities.FirstOrDefault(o => o.GetFieldValue<int>("RemainedQuantity") < 0);

                    if (invalidBuyInvoiceItem != null)
                        throw new AfwException("تعداد کالا در سطر {0} بیشتر از حد مجاز است.",
                            invalidBuyInvoiceItem.GetFieldValue<int>("RowNumber"));
                }

                CreateReturnFromBuyAccDoc(entity);
            }

            if (entity.ChangeStatus == EntityChangeTypes.Delete)
                acc.Instance.DeleteAccDocMaster(entity.GetFieldValue<Guid?>("AccDoc"), "ps.ReturnFromBuy", entity.GetFieldValue<Guid>("ID"));
        }

        private bool HasItem(Guid invoiceID)
        {
            var exist = false;

            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var items = dbHelper.FetchMultiple("ps.ReturnFromBuyItem", string.Format("ReturnFromBuy = '{0}'", invoiceID), null, null, null, null).Entities;
            if (items.Count > 0)
                exist = true;

            return exist;
        }

        private void SaveItems(List<Entity> items)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            foreach (var item in items)
            {
                if (item.GetFieldValue<Guid?>("Stuff") == null)
                    continue;

                if (item.GetFieldValue<int>("Quantity") < 0)
                    throw new AfwException("تعدا کالا در سطر " + item.GetFieldValue<int>("RowNumber") + " مجاز نیست");

                if (item.ChangeStatus != EntityChangeTypes.Delete)
                {
                    if (dbHelper.EntityExists("ps.ReturnFromBuyItem", item.GetFieldValue<Guid>("ID")))
                        item.ChangeStatus = "Modify";
                    else
                        item.ChangeStatus = "Add";
                }

                dbHelper.ApplyChanges(item);
            }
        }

        private void SetReturnFromBuyNumber(EntityDbHelper dbHelper, Entity entity)
        {
            var id = entity.GetFieldValue<Guid>("ID");
            var financialGroupID = entity.GetFieldValue<Guid>("FinancialGroup");
            var organizationUnit = entity.GetFieldValue<Guid>("OrganizationUnit");
            var financialYearID = entity.GetFieldValue<Guid>("FinancialYear");

            int? returnFromBuyNumber = cmn.Instance.GetFieldMaxIntValue("ReturnFromBuyNumber", "ps_ReturnFromBuys", string.Format(@"
                OrganizationUnit = '{0}'
                and FinancialGroup = '{1}' 
                and FinancialYear = '{2}'",
                organizationUnit,
                financialGroupID,
                financialYearID));

            if (returnFromBuyNumber != 0)
                returnFromBuyNumber += 1;
            else
            {
                var financialGroupEntity = dbHelper.FetchSingleByID("cmn.FinancialGroup", financialGroupID, null);
                var returnFromBuyStartNumber = financialGroupEntity.GetFieldValue<int?>("ReturnFromBuyStartNumber");
                returnFromBuyNumber = (returnFromBuyStartNumber == null) ? 1 : (int)returnFromBuyStartNumber;
            }

            entity.SetFieldValue("ReturnFromBuyNumber", returnFromBuyNumber);
            entity.SetFieldValue("InternalNumber1", returnFromBuyNumber);
        }

        private EntityList GetBuyInvoiceItemsWithRemainedQty(Guid buyInvoiceID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var buyInvoiceItems = dbHelper.FetchMultipleBySqlQuery(string.Format(@"
                select BuyInvoiceItem.*,
	                (BuyInvoiceItem.Quantity - ReturnedItems.Quantity) RemainedQuantity
                from ps_BuyInvoiceItems BuyInvoiceItem
	                left join ps_BuyInvoices BuyInvoice on BuyInvoice.ID = BuyInvoiceItem.BuyInvoice
	                outer apply(
		                select isnull(sum(ReturnFromBuyItem.Quantity), 0) Quantity
		                from ps_ReturnFromBuyItems ReturnFromBuyItem
		                where ReturnFromBuyItem.BuyInvoiceItem = BuyInvoiceItem.ID
	                ) ReturnedItems
                where BuyInvoiceItem.BuyInvoice = '{0}'",
                 buyInvoiceID));

            return buyInvoiceItems;
        }

        public EntityList GenerateItems(Guid returnFromBuyID, Guid buyInvoiceID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var returnFromBuyEntityList = new EntityList();

            var buyInvoiceItems = GetBuyInvoiceItemsWithRemainedQty(buyInvoiceID)
                .Entities.Where(o => o.GetFieldValue<int>("RemainedQuantity") > 0).ToList();

            for (int i = 0; i < buyInvoiceItems.Count; i++)
            {
                var returnFromBuyEntity = dbHelper.CreateNewEntity("ps.ReturnFromBuyItem");

                returnFromBuyEntity.SetFieldValue("RowNumber", i + 1);
                returnFromBuyEntity.SetFieldValue("Stuff", buyInvoiceItems[i].GetFieldValue<Guid>("Stuff"));
                returnFromBuyEntity.SetFieldValue("MeasurementUnit", buyInvoiceItems[i].GetFieldValue<Guid?>("MeasurementUnit"));
                returnFromBuyEntity.SetFieldValue("Quantity", buyInvoiceItems[i].GetFieldValue<int>("RemainedQuantity"));
                returnFromBuyEntity.SetFieldValue("UnitPrice", buyInvoiceItems[i].GetFieldValue<int>("UnitPrice"));
                returnFromBuyEntity.SetFieldValue("TotalPrice", buyInvoiceItems[i].GetFieldValue<int>("TotalPrice"));
                returnFromBuyEntity.SetFieldValue("ReturnFromBuy", returnFromBuyID);
                returnFromBuyEntity.SetFieldValue("Discount", buyInvoiceItems[i].GetFieldValue<int>("Discount"));
                returnFromBuyEntity.SetFieldValue("TotalPriceAfterDiscount", buyInvoiceItems[i].GetFieldValue<int>("TotalPriceAfterDiscount"));
                returnFromBuyEntity.SetFieldValue("TaxAndToll", buyInvoiceItems[i].GetFieldValue<int>("TaxAndToll"));
                returnFromBuyEntity.SetFieldValue("FinalPrice", buyInvoiceItems[i].GetFieldValue<int>("FinalPrice"));
                returnFromBuyEntity.SetFieldValue("BuyInvoiceItem", buyInvoiceItems[i].GetFieldValue<Guid>("ID"));

                returnFromBuyEntityList.Entities.Add(returnFromBuyEntity);
            }

            return returnFromBuyEntityList;
        }

        private void CreateReturnFromBuyAccDoc(Entity entity)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var automaticAccDocSettingName = rp.Instance.GetAutomaticAccDocSetting("BuyInvoice");
            if (automaticAccDocSettingName == "Disabled")
                return;

            if (String.IsNullOrEmpty(automaticAccDocSettingName))
                throw new AfwException("تنظیمات سند حسابداری اتوماتیک فاکتور خرید تعیین نشده است");

            if (!ValidateAccDocAccounts(entity))
                throw new AfwException("کدینگ حساب های فاکتور در شابلون سند خرید مقداردهی نشده اند.");

            using (var tranManager = new DbTransactionManager(dbHelper))
            {
                try
                {
                    var invoiceID = entity.GetFieldValue<Guid>("ID");
                    var issueDate = entity.GetFieldValue<DateTime>("IssueDate");
                    var financialYear = entity.GetFieldValue<Guid>("FinancialYear");
                    var financialDocTypeID = entity.GetFieldValue<Guid>("FinancialDocType");
                    var organizationUnitID = entity.GetFieldValue<Guid>("OrganizationUnit");
                    var financialGroupID = entity.GetFieldValue<Guid>("FinancialGroup");
                    var desc = "بابت برگشت از خرید به شماره  " + entity.GetFieldValue<string>("ReturnFromBuyNumber");
                    var accDocID = entity.GetFieldValue<Guid?>("AccDoc");

                    if (accDocID == null && automaticAccDocSettingName == "ByDay")
                    {
                        accDocID = acc.Instance.GetTodayAccDoc("ReturnFromBuyInvoice", financialDocTypeID, issueDate, organizationUnitID);
                    }

                    acc.Instance.InsertOrUpdateAccDocMaster(ref accDocID, "ReturnFromBuyInvoice", issueDate, financialYear, financialGroupID, desc, true);

                    if (entity.GetFieldValue<Guid?>("AccDoc") == null)
                    {
                        dbHelper.AdoDbHelper.ExecuteNonQuery(string.Format(@"
                            update ps_ReturnFromBuys set AccDoc = '{0}' where ID = '{1}'", accDocID, invoiceID));
                    }

                    CreateReturnFromBuyAccDocItems(entity, (Guid)accDocID);
                    acc.Instance.UpdateAccDocMasterBalanceStatus((Guid)accDocID);

                    tranManager.Commit();

                }
                catch (Exception ex)
                {
                    throw new Exception("Error In Acc Doc Auto Generate .\r\n" + ex.Message, ex);
                }
            }
        }

        private bool ValidateAccDocAccounts(Entity entity)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            if (entity.GetFieldValue<decimal>("GeneralDiscount") != 0)
                throw new AfwException("GeneralDiscount has value. not Implemented.");

            var financialGroupID = entity.GetFieldValue<Guid>("FinancialGroup");
            var financialGroupEntity = dbHelper.FetchSingleByID("cmn.FinancialGroup", financialGroupID, null);
            if (financialGroupEntity == null)
                return false;

            string docGenerationMethod = OptionSetHelper.GetOptionSetItemName(financialGroupEntity.GetFieldValue<Guid>("BuyDocGenerationMethod"));
            var hesabeBargashtAzKharid = financialGroupEntity.GetFieldValue<Guid?>("ShabloneSanad_HesabeBargashtAzKharid");
            var hesabeTaminKonandegan = financialGroupEntity.GetFieldValue<Guid?>("ShabloneSanad_HesabeTaminKonandegan");
            var hesabeAvarezBarArzeshAfzoode = financialGroupEntity.GetFieldValue<Guid?>("ShabloneSanad_HesabeAvarezBarArzeshAfzoode_Kharid");
            var hesabeMaliatBarArzeshAfzoode = financialGroupEntity.GetFieldValue<Guid?>("ShabloneSanad_HesabeMaliatBarArzeshAfzoode_Kharid");
            var hesabeTakhfifat = financialGroupEntity.GetFieldValue<Guid?>("ShabloneSanad_HesabeTakhfifat_Kharid");

            if ((docGenerationMethod == "TakhfifDarSanadJodaShavad" &&
                    (hesabeBargashtAzKharid == null ||
                    hesabeTaminKonandegan == null ||
                    hesabeAvarezBarArzeshAfzoode == null ||
                    hesabeMaliatBarArzeshAfzoode == null ||
                    hesabeTakhfifat == null))
                || (docGenerationMethod == "TakhfifDarSanadJodaNashavad" &&
                    (hesabeBargashtAzKharid == null ||
                    hesabeTaminKonandegan == null ||
                    hesabeAvarezBarArzeshAfzoode == null ||
                    hesabeMaliatBarArzeshAfzoode == null))
                )
            {
                return false;
            }

            return true;
        }

        private void CreateReturnFromBuyAccDocItems(Entity entity, Guid accDocID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            if (entity.GetFieldValue<decimal>("GeneralDiscount") != 0)
                throw new AfwException("GeneralDiscount has value. not Implemented.");

            var opFieldNameInItemEntity = "RefOp_ReturnFromBuy";
            List<Entity> accDocItemList = new List<Entity>();

            var invoiceID = entity.GetFieldValue<Guid>("ID");
            var returnFromBuyNumber = entity.GetFieldValue<string>("ReturnFromBuyNumber");
            var seller = entity.GetFieldValue<Guid>("Seller");
            var finalAmount = entity.GetFieldValue<decimal>("FinalAmount");
            var totalTaxAndToll = entity.GetFieldValue<decimal>("TotalTaxAndToll");
            var discountAmount = entity.GetFieldValue<decimal>("TotalDiscount");

            var sellerEntity = dbHelper.FetchSingle("cmn.Person", string.Format("ID = '{0}'", seller), null);
            var itemDesc = "برگشت از خرید - خدمات طی فاکتور شماره " + returnFromBuyNumber + " به شخص " + sellerEntity.GetFieldValue<string>("StoredDisplayText");

            var financialGroupID = entity.GetFieldValue<Guid>("FinancialGroup");
            var financialGroupEntity = dbHelper.FetchSingleByID("cmn.FinancialGroup", financialGroupID, null);
            string docGenerationMethod = OptionSetHelper.GetOptionSetItemName(financialGroupEntity.GetFieldValue<Guid>("BuyDocGenerationMethod"));

            var hesabeBargashtAzKharid = financialGroupEntity.GetFieldValue<Guid?>("ShabloneSanad_HesabeBargashtAzKharid");
            var hesabeTaminKonandegan = financialGroupEntity.GetFieldValue<Guid?>("ShabloneSanad_HesabeTaminKonandegan");
            var hesabeAvarezBarArzeshAfzoode = financialGroupEntity.GetFieldValue<Guid?>("ShabloneSanad_HesabeAvarezBarArzeshAfzoode_Kharid");
            var hesabeMaliatBarArzeshAfzoode = financialGroupEntity.GetFieldValue<Guid?>("ShabloneSanad_HesabeMaliatBarArzeshAfzoode_Kharid");
            var hesabeTakhfifat = financialGroupEntity.GetFieldValue<Guid?>("ShabloneSanad_HesabeTakhfifat_Kharid");

            acc.Instance.DeleteAccDocItems(accDocID, opFieldNameInItemEntity, invoiceID);

            //آیتمهای بدهکار**
            //تامین کننده*********************
            {
                var accDocItemEntity = new Entity();
                accDocItemEntity.AddField("accountID", (Guid)hesabeTaminKonandegan);
                accDocItemEntity.AddField("personID", seller);
                accDocItemEntity.AddField("costCenterID", null);
                accDocItemEntity.AddField("projectID", null);
                accDocItemEntity.AddField("foreignCurrencyID", null);
                accDocItemEntity.AddField("note", itemDesc);
                accDocItemEntity.AddField("creditorAmount", 0);
                accDocItemEntity.AddField("debtorAmount", finalAmount);
                accDocItemEntity.AddField("isActive", true);

                accDocItemList.Add(accDocItemEntity);
            }
            //************************/

            //تخفیف******************
            if (docGenerationMethod == "TakhfifDarSanadJodaShavad" && discountAmount > 0)
            {
                var accDocItemEntity = new Entity();
                accDocItemEntity.AddField("accountID", (Guid)hesabeTakhfifat);
                accDocItemEntity.AddField("personID", null);
                accDocItemEntity.AddField("costCenterID", null);
                accDocItemEntity.AddField("projectID", null);
                accDocItemEntity.AddField("foreignCurrencyID", null);
                accDocItemEntity.AddField("note", itemDesc + "(تخفیف)");
                accDocItemEntity.AddField("creditorAmount", 0);
                accDocItemEntity.AddField("debtorAmount", discountAmount);
                accDocItemEntity.AddField("isActive", true);

                accDocItemList.Add(accDocItemEntity);
            }
            //************************/

            //آیتمهای بستانکار*******************************************************************************************************
            //کالاها******************           
            var stuffsEntity = dbHelper.FetchSingleBySqlQuery(string.Format(@"
                    select sum(TotalPrice),
                        sum(Discount) Discount
                    from ps_ReturnFromBuyItems
                    where ReturnFromBuy = '{0}' and Stuff is not null", invoiceID));

            if (stuffsEntity != null && stuffsEntity.GetFieldValue<decimal?>("TotalPrice") != null)
            {
                var stuffsTotalPrice = stuffsEntity.GetFieldValue<decimal>("TotalPrice");
                var stuffsDiscount = stuffsEntity.GetFieldValue<decimal>("Discount");
                var buyAmount = stuffsTotalPrice;

                if (docGenerationMethod == "TakhfifDarSanadJodaNashavad")
                    buyAmount -= discountAmount;

                var accDocItemEntity = new Entity();
                accDocItemEntity.AddField("accountID", (Guid)hesabeBargashtAzKharid);
                accDocItemEntity.AddField("personID", null);
                accDocItemEntity.AddField("costCenterID", null);
                accDocItemEntity.AddField("projectID", null);
                accDocItemEntity.AddField("foreignCurrencyID", null);
                accDocItemEntity.AddField("note", itemDesc + "(کالاها)");
                accDocItemEntity.AddField("creditorAmount", buyAmount);
                accDocItemEntity.AddField("debtorAmount", 0);
                accDocItemEntity.AddField("isActive", true);

                accDocItemList.Add(accDocItemEntity);
            }

            //مالیات عوارض******************
            if (totalTaxAndToll > 0)
            {
                decimal totalTax;
                decimal totalToll;
                GetTotalTaxToll(entity, out totalTax, out totalToll);

                if (totalTax > 0)
                {
                    var accDocItemEntity = new Entity();
                    accDocItemEntity.AddField("accountID", (Guid)hesabeMaliatBarArzeshAfzoode);
                    accDocItemEntity.AddField("personID", null);
                    accDocItemEntity.AddField("costCenterID", null);
                    accDocItemEntity.AddField("projectID", null);
                    accDocItemEntity.AddField("foreignCurrencyID", null);
                    accDocItemEntity.AddField("note", itemDesc + "(مالیات)");
                    accDocItemEntity.AddField("creditorAmount", totalTax);
                    accDocItemEntity.AddField("debtorAmount", 0);
                    accDocItemEntity.AddField("isActive", true);

                    accDocItemList.Add(accDocItemEntity);
                }

                if (totalToll > 0)
                {

                    var accDocItemEntity = new Entity();
                    accDocItemEntity.AddField("accountID", (Guid)hesabeAvarezBarArzeshAfzoode);
                    accDocItemEntity.AddField("personID", null);
                    accDocItemEntity.AddField("costCenterID", null);
                    accDocItemEntity.AddField("projectID", null);
                    accDocItemEntity.AddField("foreignCurrencyID", null);
                    accDocItemEntity.AddField("note", itemDesc + "(عوارض)");
                    accDocItemEntity.AddField("creditorAmount", totalToll);
                    accDocItemEntity.AddField("debtorAmount", 0);
                    accDocItemEntity.AddField("isActive", true);

                    accDocItemList.Add(accDocItemEntity);
                }
            }

            acc.Instance.InsertAccDocItems(accDocID, opFieldNameInItemEntity, invoiceID, accDocItemList);
            //************************/       
        }

        private void GetTotalTaxToll(Entity entity, out decimal totalTax, out decimal totalToll)
        {
            totalTax = 0;
            totalToll = 0;

            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var issueDate = entity.GetFieldValue<DateTime>("IssueDate");
            var id = entity.GetFieldValue<Guid>("ID");

            var taxAndTollPercentEntity = dbHelper.FetchSingle("ps.TaxAndTollPercent", string.Format(
                "'{0}' >= FromDate and '{0}' <= ToDate", issueDate),
                                                                         null);
            if (taxAndTollPercentEntity == null)
                return;

            var taxPercent = taxAndTollPercentEntity.GetFieldValue<decimal>("Tax");
            var tollPercent = taxAndTollPercentEntity.GetFieldValue<decimal>("Toll");

            if (taxPercent == 0 && tollPercent == 0)
                return;

            var items = dbHelper.FetchMultipleBySqlQuery(string.Format(@"
                select ReturnFromBuy.TotalPriceAfterDiscount	
                from ps_ReturnFromBuyItems ReturnFromBuy
                where ReturnFromBuy.ReturnFromBuy = '{0}' and ReturnFromBuy.TaxAndToll > 0",
                id)).Entities;

            foreach (var item in items)
            {
                var totalPriceAfterDiscount = item.GetFieldValue<decimal>("TotalPriceAfterDiscount");

                var totallTaxAndTollPercent = (decimal)taxPercent + (decimal)tollPercent;
                var totallTaxAndToll = Math.Round((totalPriceAfterDiscount * (decimal)totallTaxAndTollPercent) / 100);

                decimal tax = Math.Round((totalPriceAfterDiscount * (decimal)taxPercent) / 100);
                totalTax += tax;
                totalToll += totallTaxAndToll - tax;
            }
        }
    }
}

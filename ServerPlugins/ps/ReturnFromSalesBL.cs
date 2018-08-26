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
    public class ReturnFromSalesBL : FinancialOpBaseBL
    {
        public ReturnFromSalesBL() : base("ReturnFromSales") { }

        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            if (entity.GetFieldValue<decimal>("GeneralDiscount") != 0)
                throw new AfwException("امکان مقدار دهی به فیلد تخفیف کلی پیاده سازی نشده است.");

            if (entity.ChangeStatus == EntityChangeTypes.Add)
            {
                SetReturnFromSalesNumber(dbHelper, entity);
            }

            if (entity.ChangeStatus == EntityChangeTypes.Delete)
                acc.Instance.DeleteAccDocItems(entity.GetFieldValue<Guid?>("AccDoc"), "RefOp_ReturnFromSales", entity.GetFieldValue<Guid>("ID"));
        }

        public override void AfterApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.AfterApplyChanges(dbHelper, entity);

            var invoiceID = entity.GetFieldValue<Guid>("ID");

            if (entity.ChangeStatus != EntityChangeTypes.Delete)
            {
                if (entity.FieldExists("StuffItems"))
                {
                    var StuffItems = entity.GetFieldValue<EntityList>("StuffItems").Entities;
                    SaveItems(StuffItems);
                }

                if (!HasItem(invoiceID))
                    throw new AfwException("فاکتور آیتم ندارد .");

                if (entity.GetFieldValue<Guid?>("SalesInvoice") != null)
                {
                    var invalidSalesInvoiceItem = GetSalesInvoiceItemsWithRemainedQty(entity.GetFieldValue<Guid>("SalesInvoice"))
                        .Entities.FirstOrDefault(o => o.GetFieldValue<int>("RemainedQuantity") < 0);
                    if (invalidSalesInvoiceItem != null)
                        throw new AfwException("تعداد کالا در سطر {0} بیشتر از حد مجاز است.",
                            invalidSalesInvoiceItem.GetFieldValue<int>("RowNumber"));
                }

                CreateReturnFromSalesAccDoc(entity);
            }

            if (entity.ChangeStatus == EntityChangeTypes.Delete)
                acc.Instance.DeleteAccDocMaster(entity.GetFieldValue<Guid?>("AccDoc"), "ps.ReturnFromSales", invoiceID);
        }

        private bool HasItem(Guid invoiceID)
        {
            var exist = false;

            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var items = dbHelper.FetchMultiple("ps.ReturnFromSaleItem", string.Format("ReturnFromSale = '{0}'", invoiceID), null, null, null, null).Entities;
            if (items.Count > 0)
                exist = true;

            return exist;
        }

        private EntityList GetSalesInvoiceItemsWithRemainedQty(Guid salesInvoiceID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var salesInvoiceItems = dbHelper.FetchMultipleBySqlQuery(string.Format(@"
                select SalesInvoiceItem.*,
	                (SalesInvoiceItem.Quantity - ReturnedItems.Quantity) RemainedQuantity
                from ps_SalesInvoiceItems SalesInvoiceItem
	                left join ps_SalesInvoices SalesInvoice on SalesInvoice.ID = SalesInvoiceItem.SalesInvoice
	                outer apply(
		                select isnull(sum(ReturnFromSaleItem.Quantity), 0) Quantity
		                from ps_ReturnFromSaleItems ReturnFromSaleItem
		                where ReturnFromSaleItem.SalesInvoiceItem = SalesInvoiceItem.ID
	                ) ReturnedItems
                where SalesInvoiceItem.SalesInvoice = '{0}'",
                 salesInvoiceID));

            return salesInvoiceItems;
        }

        public EntityList GenerateItems(Guid returnFromSalesID, Guid salesInvoiceID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var returnFromSalesEntityList = new EntityList();

            var salesInvoiceItems = GetSalesInvoiceItemsWithRemainedQty(salesInvoiceID)
                .Entities.Where(o => o.GetFieldValue<int>("RemainedQuantity") > 0).ToList();

            for (int i = 0; i < salesInvoiceItems.Count; i++)
            {
                var returnFromSalesEntity = dbHelper.CreateNewEntity("ps.ReturnFromSaleItem");

                returnFromSalesEntity.SetFieldValue("RowNumber", i + 1);
                returnFromSalesEntity.SetFieldValue("Stuff", salesInvoiceItems[i].GetFieldValue<Guid>("Stuff"));
                returnFromSalesEntity.SetFieldValue("MeasurementUnit", salesInvoiceItems[i].GetFieldValue<Guid?>("MeasurementUnit"));
                returnFromSalesEntity.SetFieldValue("Quantity", salesInvoiceItems[i].GetFieldValue<int>("RemainedQuantity"));
                returnFromSalesEntity.SetFieldValue("UnitPrice", salesInvoiceItems[i].GetFieldValue<int>("UnitPrice"));
                returnFromSalesEntity.SetFieldValue("TotalPrice", salesInvoiceItems[i].GetFieldValue<int>("TotalPrice"));
                returnFromSalesEntity.SetFieldValue("ReturnFromSale", returnFromSalesID);
                returnFromSalesEntity.SetFieldValue("Discount", salesInvoiceItems[i].GetFieldValue<int>("Discount"));
                returnFromSalesEntity.SetFieldValue("TotalPriceAfterDiscount", salesInvoiceItems[i].GetFieldValue<int>("TotalPriceAfterDiscount"));
                returnFromSalesEntity.SetFieldValue("TaxAndToll", salesInvoiceItems[i].GetFieldValue<int>("TaxAndToll"));
                returnFromSalesEntity.SetFieldValue("FinalPrice", salesInvoiceItems[i].GetFieldValue<int>("FinalPrice"));
                returnFromSalesEntity.SetFieldValue("SalesInvoiceItem", salesInvoiceItems[i].GetFieldValue<Guid>("ID"));

                returnFromSalesEntityList.Entities.Add(returnFromSalesEntity);
            }

            return returnFromSalesEntityList;
        }

        private void SaveItems(List<Entity> items)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            foreach (var item in items)
            {
                if (item.GetFieldValue<Guid?>("Stuff") == null)
                    continue;

                if (item.GetFieldValue<int>("Quantity") < 0)
                    throw new AfwException("تعدا کالا در سطر " + item.GetFieldValue<int>("RowNumber") + " مجاز نمی باشد");

                if (item.ChangeStatus != EntityChangeTypes.Delete)
                {
                    if (dbHelper.EntityExists("ps.ReturnFromSaleItem", item.GetFieldValue<Guid>("ID")))
                        item.ChangeStatus = "Modify";
                    else
                        item.ChangeStatus = "Add";
                }

                dbHelper.ApplyChanges(item);
            }
        }

        private void SetReturnFromSalesNumber(EntityDbHelper dbHelper, Entity entity)
        {
            var id = entity.GetFieldValue<Guid>("ID");
            var financialGroupID = entity.GetFieldValue<Guid>("FinancialGroup");
            var financialDocTypeID = entity.GetFieldValue<Guid>("FinancialDocType");
            var organizationUnit = entity.GetFieldValue<Guid>("OrganizationUnit");
            var financialYearID = entity.GetFieldValue<Guid>("FinancialYear");
            var isAmani = entity.GetFieldValue<bool>("IsAmani");

            int? returnFromSalesNumber = cmn.Instance.GetFieldMaxIntValue("ReturnFromSalesNumber", "ps_ReturnFromSales", string.Format(@"
                OrganizationUnit = '{0}' 
                and FinancialDocType = '{1}' 
                and FinancialYear = '{2}'
                and IsAmani = {3}",
                organizationUnit,
                financialDocTypeID,
                financialYearID,
                isAmani == true ? 1 : 0));

            if (returnFromSalesNumber != 0)
                returnFromSalesNumber += 1;
            else
            {
                var financialGroupEntity = dbHelper.FetchSingleByID("cmn.FinancialGroup", financialGroupID, null);
                var returnFromSalesStartNumber = financialGroupEntity.GetFieldValue<int?>("ReturnFromSalesStartNumber");
                var amaniReturnFromSalesStartNumber = financialGroupEntity.GetFieldValue<int?>("AmaniReturnFromSalesStartNumber");

                if (isAmani)
                    returnFromSalesNumber = (amaniReturnFromSalesStartNumber == null) ? 1 : (int)amaniReturnFromSalesStartNumber;
                else
                    returnFromSalesNumber = (returnFromSalesStartNumber == null) ? 1 : (int)returnFromSalesStartNumber;
            }

            entity.SetFieldValue("ReturnFromSalesNumber", returnFromSalesNumber);
            entity.SetFieldValue("InternalNumber1", returnFromSalesNumber);
        }

        public void CreateReturnFromSalesAccDoc(Entity entity)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var automaticAccDocSettingName = rp.Instance.GetAutomaticAccDocSetting("SalesInvoice");
            if (automaticAccDocSettingName == "Disabled")
                return;

            if (String.IsNullOrEmpty(automaticAccDocSettingName))
                throw new AfwException("تنظیمات سند حسابداری اتوماتیک فاکتور فروش تعیین نشده است");

            if (!ValidateAccDocAccounts(entity))
                throw new AfwException("کدینگ حساب های {0} در شابلون سند فروش مقداردهی نشده اند.",
                    entity.GetFieldValue<bool>("IsAmani") == true ? "برگشت از امانی" : "برگشت از فروش");

            using (var tranManager = new DbTransactionManager(dbHelper))
            {
                try
                {
                    var id = entity.GetFieldValue<Guid>("ID");
                    var issueDate = entity.GetFieldValue<DateTime>("IssueDate");
                    var financialYear = entity.GetFieldValue<Guid>("FinancialYear");
                    var financialDocTypeID = entity.GetFieldValue<Guid>("FinancialDocType");
                    var organizationUnitID = entity.GetFieldValue<Guid>("OrganizationUnit");
                    var financialGroupID = entity.GetFieldValue<Guid>("FinancialGroup");
                    var desc = "بابت برگشت از فروش به شماره  " + entity.GetFieldValue<string>("ReturnFromSalesNumber");
                    var accDocID = entity.GetFieldValue<Guid?>("AccDoc");

                    if (accDocID == null && automaticAccDocSettingName == "ByDay")
                    {
                        accDocID = acc.Instance.GetTodayAccDoc("ReturnFromSalesInvoice", financialDocTypeID, issueDate, organizationUnitID);
                    }

                    acc.Instance.InsertOrUpdateAccDocMaster(ref accDocID, "ReturnFromSalesInvoice", issueDate, financialYear, financialGroupID, desc, true);

                    if (entity.GetFieldValue<Guid?>("AccDoc") == null)
                    {
                        dbHelper.AdoDbHelper.ExecuteNonQuery(string.Format(@"
                                update ps_ReturnFromSales set AccDoc = '{0}' where ID = '{1}'", accDocID, id));
                    }

                    CreateReturnFromSalesAccDocItems(entity, (Guid)accDocID);
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

            string docGenerationMethod = OptionSetHelper.GetOptionSetItemName(financialGroupEntity.GetFieldValue<Guid>("SalesDocGenerationMethod"));
            var hesabeBargashtAzForoosh = financialGroupEntity.GetFieldValue<Guid?>("ShabloneSanad_HesabeBargashtAzForoosh");
            var hesabeBargashtAzForooshAmani = financialGroupEntity.GetFieldValue<Guid?>("ShabloneSanad_HesabeBargashtAzForoosheAmani");
            var hesabeMoshtarian = financialGroupEntity.GetFieldValue<Guid?>("ShabloneSanad_HesabeMoshtarian");
            var hesabeMoshtarianAmani = financialGroupEntity.GetFieldValue<Guid?>("ShabloneSanad_HesabeMoshtarianAmani");
            var hesabeAvarezBarArzeshAfzoode = financialGroupEntity.GetFieldValue<Guid?>("ShabloneSanad_HesabeAvarezBarArzeshAfzoode_Foroosh");
            var hesabeMaliatBarArzeshAfzoode = financialGroupEntity.GetFieldValue<Guid?>("ShabloneSanad_HesabeMaliatBarArzeshAfzoode_Foroosh");
            var hesabeTakhfifat = financialGroupEntity.GetFieldValue<Guid?>("ShabloneSanad_HesabeTakhfifat_Foroosh");
            var isAmani = entity.GetFieldValue<bool>("IsAmani");

            if (isAmani)
            {
                if (hesabeBargashtAzForooshAmani == null || hesabeMoshtarianAmani == null)
                    return false;
            }
            else
            {
                if ((docGenerationMethod == "TakhfifDarSanadJodaShavad" &&
                   (hesabeBargashtAzForoosh == null ||
                   hesabeMoshtarian == null ||
                   hesabeAvarezBarArzeshAfzoode == null ||
                   hesabeMaliatBarArzeshAfzoode == null ||
                   hesabeTakhfifat == null))
                   ||
                   (docGenerationMethod == "TakhfifDarSanadJodaNashavad" &&
                   (hesabeBargashtAzForoosh == null ||
                   hesabeMoshtarian == null ||
                   hesabeAvarezBarArzeshAfzoode == null ||
                   hesabeMaliatBarArzeshAfzoode == null))
                   )
                {
                    return false;
                }
            }

            return true;
        }

        private void CreateReturnFromSalesAccDocItems(Entity entity, Guid accDocID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            if (entity.GetFieldValue<decimal>("GeneralDiscount") != 0)
                throw new AfwException("GeneralDiscount has value. not Implemented.");

            var opFieldNameInItemEntity = "RefOp_ReturnFromSales";
            List<Entity> accDocItemList = new List<Entity>();

            var invoiceID = entity.GetFieldValue<Guid>("ID");
            var returnFromSalesNumber = entity.GetFieldValue<string>("ReturnFromSalesNumber");
            var customer = entity.GetFieldValue<Guid>("Customer");
            var finalAmount = entity.GetFieldValue<decimal>("FinalAmount");
            var totalTaxAndToll = entity.GetFieldValue<decimal>("TotalTaxAndToll");
            var discountAmount = entity.GetFieldValue<decimal>("TotalDiscount");

            var customerEntity = dbHelper.FetchSingle("cmn.Person", string.Format("ID = '{0}'", customer), null);
            var itemDesc = "برگشت از فروش - خدمات طی فاکتور شماره " + returnFromSalesNumber + " به شخص " + customerEntity.GetFieldValue<string>("StoredDisplayText");

            var isAmani = entity.GetFieldValue<bool>("IsAmani");
            var financialGroupID = entity.GetFieldValue<Guid>("FinancialGroup");
            var financialGroupEntity = dbHelper.FetchSingleByID("cmn.FinancialGroup", financialGroupID, null);
            var docGenerationMethod = OptionSetHelper.GetOptionSetItemName(financialGroupEntity.GetFieldValue<Guid>("SalesDocGenerationMethod"));

            var hesabeBargashtAzForoosh = financialGroupEntity.GetFieldValue<Guid?>("ShabloneSanad_HesabeBargashtAzForoosh");
            var hesabeBargashtAzForooshAmani = financialGroupEntity.GetFieldValue<Guid?>("ShabloneSanad_HesabeBargashtAzForoosheAmani");
            var hesabeMoshtarian = financialGroupEntity.GetFieldValue<Guid?>("ShabloneSanad_HesabeMoshtarian");
            var hesabeMoshtarianAmani = financialGroupEntity.GetFieldValue<Guid?>("ShabloneSanad_HesabeMoshtarianAmani");
            var hesabeAvarezBarArzeshAfzoode = financialGroupEntity.GetFieldValue<Guid?>("ShabloneSanad_HesabeAvarezBarArzeshAfzoode_Foroosh");
            var hesabeMaliatBarArzeshAfzoode = financialGroupEntity.GetFieldValue<Guid?>("ShabloneSanad_HesabeMaliatBarArzeshAfzoode_Foroosh");
            var hesabeTakhfifat = financialGroupEntity.GetFieldValue<Guid?>("ShabloneSanad_HesabeTakhfifat_Foroosh");

            acc.Instance.DeleteAccDocItems(accDocID, opFieldNameInItemEntity, invoiceID);

            //آیتمهای بدهکار**
            //کالاها******************           
            var stuffsEntity = dbHelper.FetchSingleBySqlQuery(string.Format(@"
                select sum(TotalPrice) TotalPrice,
                    sum(Discount) Discount
                from ps_ReturnFromSaleItems
                where ReturnFromSale = '{0}' and Stuff is not null", invoiceID));

            if (stuffsEntity != null && stuffsEntity.GetFieldValue<decimal?>("TotalPrice") != null)
            {
                var stuffsTotalPrice = stuffsEntity.GetFieldValue<decimal>("TotalPrice");
                var stuffsDiscount = stuffsEntity.GetFieldValue<decimal>("Discount");
                var salesAmount = stuffsTotalPrice;

                if (docGenerationMethod == "TakhfifDarSanadJodaNashavad")
                    salesAmount -= stuffsDiscount;

                var accDocItemEntity = new Entity();
                accDocItemEntity.AddField("accountID",
                    isAmani == true ? (Guid)hesabeBargashtAzForooshAmani : (Guid)hesabeBargashtAzForoosh);
                accDocItemEntity.AddField("personID", null);
                accDocItemEntity.AddField("costCenterID", null);
                accDocItemEntity.AddField("projectID", null);
                accDocItemEntity.AddField("foreignCurrencyID", null);
                accDocItemEntity.AddField("note", itemDesc + "(کالاها)");
                accDocItemEntity.AddField("creditorAmount", 0);
                accDocItemEntity.AddField("debtorAmount", salesAmount);
                accDocItemEntity.AddField("isActive", true);

                accDocItemList.Add(accDocItemEntity);
            }

            if (totalTaxAndToll > 0 && !isAmani)
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
                    accDocItemEntity.AddField("creditorAmount", 0);
                    accDocItemEntity.AddField("debtorAmount", totalTax);
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
                    accDocItemEntity.AddField("creditorAmount", 0);
                    accDocItemEntity.AddField("debtorAmount", totalToll);
                    accDocItemEntity.AddField("isActive", true);

                    accDocItemList.Add(accDocItemEntity);
                }
            }

            //آیتمهای بستانکار*******************************************************************************************************
            //مشتری******************
            {
                var accDocItemEntity = new Entity();
                accDocItemEntity.AddField("accountID",
                    isAmani == true ? (Guid)hesabeMoshtarianAmani : (Guid)hesabeMoshtarian);
                accDocItemEntity.AddField("personID", customer);
                accDocItemEntity.AddField("costCenterID", null);
                accDocItemEntity.AddField("projectID", null);
                accDocItemEntity.AddField("foreignCurrencyID", null);
                accDocItemEntity.AddField("note", itemDesc);
                accDocItemEntity.AddField("creditorAmount", finalAmount);
                accDocItemEntity.AddField("debtorAmount", 0);
                accDocItemEntity.AddField("isActive", true);

                accDocItemList.Add(accDocItemEntity);
            }

            //تخفیف******************
            if (docGenerationMethod == "TakhfifDarSanadJodaShavad" && discountAmount > 0 && !isAmani)
            {
                var accDocItemEntity = new Entity();
                accDocItemEntity.AddField("accountID", (Guid)hesabeTakhfifat);
                accDocItemEntity.AddField("personID", null);
                accDocItemEntity.AddField("costCenterID", null);
                accDocItemEntity.AddField("projectID", null);
                accDocItemEntity.AddField("foreignCurrencyID", null);
                accDocItemEntity.AddField("note", itemDesc + "(تخفیف)");
                accDocItemEntity.AddField("creditorAmount", discountAmount);
                accDocItemEntity.AddField("debtorAmount", 0);
                accDocItemEntity.AddField("isActive", true);

                accDocItemList.Add(accDocItemEntity);
            }

            acc.Instance.InsertAccDocItems(accDocID, opFieldNameInItemEntity, invoiceID, accDocItemList);
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
                select ReturnFromSales.TotalPriceAfterDiscount	
                from ps_ReturnFromSaleItems ReturnFromSales
                where ReturnFromSales.ReturnFromSale = '{0}' and ReturnFromSales.TaxAndToll > 0",
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

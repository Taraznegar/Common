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
    public class BuyInvoiceBL : FinancialOpBaseBL
    {
        public BuyInvoiceBL() : base("BuyInvoice") { }

        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            if (entity.GetFieldValue<decimal>("GeneralDiscount") != 0)
                throw new AfwException("امکان مقدار دهی به فیلد تخفیف کلی پیاده سازی نشده است.");

            var id = entity.GetFieldValue<Guid>("ID");

            if (entity.ChangeStatus == EntityChangeTypes.Add)
                SetInvoiceNumber(entity);

            if (entity.ChangeStatus == EntityChangeTypes.Delete)
                acc.Instance.DeleteAccDocItems(entity.GetFieldValue<Guid?>("AccDoc"), "RefOp_BuyInvoice", id);
        }

        public override void AfterApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.AfterApplyChanges(dbHelper, entity);

            var id = entity.GetFieldValue<Guid>("ID");

            if (entity.ChangeStatus != EntityChangeTypes.Delete)
            {
                if (entity.FieldExists("StuffItems") && entity.GetFieldValue<EntityList>("StuffItems") != null)
                {
                    SaveItems(entity.GetFieldValue<EntityList>("StuffItems"));
                }

                if (!HasItem(id))
                    throw new AfwException("فاکتور آیتم ندارد .");

                CreateBuyInvoiceAccDoc(entity);
            }

            if (entity.ChangeStatus == EntityChangeTypes.Delete)
                acc.Instance.DeleteAccDocMaster(entity.GetFieldValue<Guid?>("AccDoc"), "ps.BuyInvoice", id);
        }

        private void SaveItems(EntityList items)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            foreach (var item in items.Entities)
            {
                if (item.GetFieldValue<Guid?>("Stuff") == null && item.GetFieldValue<Guid?>("Service") == null)
                    continue;

                if (item.GetFieldValue<int>("Quantity") < 0)
                    throw new AfwException("تعدا کالا در سطر " + item.GetFieldValue<int>("RowNumber") + " مجاز نیست");

                if (item.ChangeStatus != EntityChangeTypes.Delete)
                {
                    if (dbHelper.EntityExists("ps.BuyInvoiceItem", item.GetFieldValue<Guid>("ID")))
                        item.ChangeStatus = "Modify";
                    else
                        item.ChangeStatus = "Add";
                }

                dbHelper.ApplyChanges(item);
            }
        }

        private bool HasItem(Guid id)
        {
            var exist = false;

            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var items = dbHelper.FetchMultiple("ps.BuyInvoiceItem",
                string.Format("BuyInvoice = '{0}'", id), null, null, null, null).Entities;
            if (items.Count > 0)
                exist = true;

            return exist;
        }

        public void CreateBuyInvoiceAccDoc(Entity entity)
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
                    var id = entity.GetFieldValue<Guid>("ID");
                    var issueDate = entity.GetFieldValue<DateTime>("IssueDate");
                    var financialYear = entity.GetFieldValue<Guid>("FinancialYear");
                    var financialDocTypeID = entity.GetFieldValue<Guid>("FinancialDocType");
                    var organizationUnitID = entity.GetFieldValue<Guid>("OrganizationUnit");
                    var financialGroupID = entity.GetFieldValue<Guid>("FinancialGroup");
                    var desc = "بابت فاکتور خرید شماره " + entity.GetFieldValue<string>("InvoiceNumber");
                    var accDocID = entity.GetFieldValue<Guid?>("AccDoc");

                    if (accDocID == null && automaticAccDocSettingName == "ByDay")
                    {
                        accDocID = acc.Instance.GetTodayAccDoc("BuyInvoice", financialDocTypeID, issueDate, organizationUnitID);
                    }

                    acc.Instance.InsertOrUpdateAccDocMaster(ref accDocID, "BuyInvoice", issueDate, financialYear, financialGroupID, desc, true);

                    if (entity.GetFieldValue<Guid?>("AccDoc") == null)
                    {
                        dbHelper.AdoDbHelper.ExecuteNonQuery(string.Format(@"update ps_BuyInvoices set AccDoc = '{0}' where ID = '{1}'", accDocID, id));
                    }

                    CreateBuyInvoiceAccDocItems(entity, (Guid)accDocID);
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
            var hesabeKharid = financialGroupEntity.GetFieldValue<Guid?>("ShabloneSanad_HesabeKharid");
            var hesabeTaminKonandegan = financialGroupEntity.GetFieldValue<Guid?>("ShabloneSanad_HesabeTaminKonandegan");
            var hesabeAvarezBarArzeshAfzoode = financialGroupEntity.GetFieldValue<Guid?>("ShabloneSanad_HesabeAvarezBarArzeshAfzoode_Kharid");
            var hesabeMaliatBarArzeshAfzoode = financialGroupEntity.GetFieldValue<Guid?>("ShabloneSanad_HesabeMaliatBarArzeshAfzoode_Kharid");
            var hesabeTakhfifat = financialGroupEntity.GetFieldValue<Guid?>("ShabloneSanad_HesabeTakhfifat_Kharid");

            if ((docGenerationMethod == "TakhfifDarSanadJodaShavad" &&
                (hesabeKharid == null ||
                hesabeTaminKonandegan == null ||
                hesabeAvarezBarArzeshAfzoode == null ||
                hesabeMaliatBarArzeshAfzoode == null ||
                hesabeTakhfifat == null))
                ||
                (docGenerationMethod == "TakhfifDarSanadJodaNashavad" &&
                (hesabeKharid == null ||
                hesabeTaminKonandegan == null ||
                hesabeAvarezBarArzeshAfzoode == null ||
                hesabeMaliatBarArzeshAfzoode == null))
                )
            {
                return false;
            }

            var query = string.Format(@"
                select Service.ID , Service.Name
                from ps_BuyInvoiceItems Item
                    inner join cmn_Services Service on Service.ID = Item.Service
                where Item.BuyInvoice = '{0}' ", entity.GetFieldValue<Guid>("ID"));
            var serviceEntities = dbHelper.FetchMultipleBySqlQuery(query).Entities;

            cmn.Instance.CheckServicesAccSetting(serviceEntities, entity.GetFieldValue<Guid>("FinancialYear"));

            return true;
        }

        private void CreateBuyInvoiceAccDocItems(Entity entity, Guid accDocID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            if (entity.GetFieldValue<decimal>("GeneralDiscount") != 0)
                throw new AfwException("GeneralDiscount has value. not Implemented.");

            var opFieldNameInItemEntity = "RefOp_BuyInvoice";
            List<Entity> accDocItemList = new List<Entity>();

            var invoiceId = entity.GetFieldValue<Guid>("ID");
            var seller = entity.GetFieldValue<Guid>("Seller");
            var finalAmount = entity.GetFieldValue<decimal>("FinalAmount");
            var totalTaxAndToll = entity.GetFieldValue<decimal>("TotalTaxAndToll");
            var discountAmount = entity.GetFieldValue<decimal>("TotalDiscount");

            acc.Instance.DeleteAccDocItems(accDocID, opFieldNameInItemEntity, invoiceId);

            var financialGroupID = entity.GetFieldValue<Guid>("FinancialGroup");
            var financialGroupEntity = dbHelper.FetchSingleByID("cmn.FinancialGroup", financialGroupID, null);
            string docGenerationMethod = OptionSetHelper.GetOptionSetItemName(financialGroupEntity.GetFieldValue<Guid>("BuyDocGenerationMethod"));
            Guid hesabeKharid = financialGroupEntity.GetFieldValue<Guid>("ShabloneSanad_HesabeKharid");
            Guid hesabeTaminKonandegan = financialGroupEntity.GetFieldValue<Guid>("ShabloneSanad_HesabeTaminKonandegan");
            Guid hesabeAvarezBarArzeshAfzoode = financialGroupEntity.GetFieldValue<Guid>("ShabloneSanad_HesabeAvarezBarArzeshAfzoode_Kharid");
            Guid hesabeMaliatBarArzeshAfzoode = financialGroupEntity.GetFieldValue<Guid>("ShabloneSanad_HesabeMaliatBarArzeshAfzoode_Kharid");
            Guid hesabeTakhfifat = financialGroupEntity.GetFieldValue<Guid>("ShabloneSanad_HesabeTakhfifat_Kharid");

            //آیتمهای بدهکار *******************************************************************************************************
            //کالاها******************           
            var stuffsEntity = dbHelper.FetchSingleBySqlQuery(string.Format(@"
                select sum(TotalPrice) TotalPrice,
                    sum(Discount) Discount
                from ps_BuyInvoiceItems
                where BuyInvoice = '{0}' and Stuff is not null", invoiceId));

            if (stuffsEntity != null && stuffsEntity.GetFieldValue<decimal?>("TotalPrice") != null)
            {
                var stuffsTotalPrice = stuffsEntity.GetFieldValue<decimal>("TotalPrice");
                var stuffsDiscount = stuffsEntity.GetFieldValue<decimal>("Discount");
                var buyAmount = stuffsTotalPrice;

                if (docGenerationMethod == "TakhfifDarSanadJodaNashavad")
                    buyAmount -= discountAmount;

                var accDocItemEntity = new Entity();
                accDocItemEntity.AddField("accountID", hesabeKharid);
                accDocItemEntity.AddField("personID", null);
                accDocItemEntity.AddField("costCenterID", null);
                accDocItemEntity.AddField("projectID", null);
                accDocItemEntity.AddField("foreignCurrencyID", null);
                accDocItemEntity.AddField("note", "خرید");
                accDocItemEntity.AddField("creditorAmount", 0);
                accDocItemEntity.AddField("debtorAmount", (decimal)buyAmount);
                accDocItemEntity.AddField("isActive", true);

                accDocItemList.Add(accDocItemEntity);
            }

            //خدمات******************

            var services = dbHelper.FetchMultipleBySqlQuery(
                string.Format(@"
                    select AccSetting.Account Account, 
                        sum(Item.TotalPrice) TotalPrice,
                        sum(Item.Discount) Discount
                    from ps_BuyInvoiceItems Item
                        inner join cmn_Services Service on Service.ID = Item.Service
	                    left join cmn_ServiceAccSettings AccSetting on AccSetting.Service = Service.ID
                    where Item.BuyInvoice = '{0}' and AccSetting.FinancialYear = '{1}'
                    group by AccSetting.Account",
                    entity.GetFieldValue<Guid?>("ID"),
                    entity.GetFieldValue<Guid>("FinancialYear")
                )).Entities;

            foreach (var service in services)
            {
                var serviceTotalPrice = service.GetFieldValue<decimal>("TotalPrice");
                var serviceDiscount = service.GetFieldValue<decimal>("Discount");
                var serviceAmount = serviceTotalPrice;

                if (docGenerationMethod == "TakhfifDarSanadJodaNashavad")
                    serviceAmount -= serviceDiscount;

                var account = service.GetFieldValue<Guid>("Account");

                var accDocItemEntity = new Entity();
                accDocItemEntity.AddField("accountID", account);
                accDocItemEntity.AddField("personID", null);
                accDocItemEntity.AddField("costCenterID", null);
                accDocItemEntity.AddField("projectID", null);
                accDocItemEntity.AddField("foreignCurrencyID", null);
                accDocItemEntity.AddField("note", "خدمات");
                accDocItemEntity.AddField("creditorAmount", 0);
                accDocItemEntity.AddField("debtorAmount", serviceAmount);
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
                    accDocItemEntity.AddField("accountID", hesabeMaliatBarArzeshAfzoode);
                    accDocItemEntity.AddField("personID", null);
                    accDocItemEntity.AddField("costCenterID", null);
                    accDocItemEntity.AddField("projectID", null);
                    accDocItemEntity.AddField("foreignCurrencyID", null);
                    accDocItemEntity.AddField("note", "مالیات");
                    accDocItemEntity.AddField("creditorAmount", 0);
                    accDocItemEntity.AddField("debtorAmount", totalTax);
                    accDocItemEntity.AddField("isActive", true);

                    accDocItemList.Add(accDocItemEntity);
                }

                if (totalToll > 0)
                {
                    var accDocItemEntity = new Entity();
                    accDocItemEntity.AddField("accountID", hesabeAvarezBarArzeshAfzoode);
                    accDocItemEntity.AddField("personID", null);
                    accDocItemEntity.AddField("costCenterID", null);
                    accDocItemEntity.AddField("projectID", null);
                    accDocItemEntity.AddField("foreignCurrencyID", null);
                    accDocItemEntity.AddField("note", "عوارض");
                    accDocItemEntity.AddField("creditorAmount", 0);
                    accDocItemEntity.AddField("debtorAmount", totalToll);
                    accDocItemEntity.AddField("isActive", true);

                    accDocItemList.Add(accDocItemEntity);
                }
            }

            //آیتمهای بستانکار**
            //تامین کننده***
            {
                var accDocItemEntity = new Entity();
                accDocItemEntity.AddField("accountID", hesabeTaminKonandegan);
                accDocItemEntity.AddField("personID", seller);
                accDocItemEntity.AddField("costCenterID", null);
                accDocItemEntity.AddField("projectID", null);
                accDocItemEntity.AddField("foreignCurrencyID", null);
                accDocItemEntity.AddField("note", "فاکتور خرید");
                accDocItemEntity.AddField("creditorAmount", finalAmount);
                accDocItemEntity.AddField("debtorAmount", 0);
                accDocItemEntity.AddField("isActive", true);

                accDocItemList.Add(accDocItemEntity);
            }

            //تخفیف***
            if (docGenerationMethod == "TakhfifDarSanadJodaShavad" && discountAmount > 0)
            {
                var accDocItemEntity = new Entity();
                accDocItemEntity.AddField("accountID", hesabeTakhfifat);
                accDocItemEntity.AddField("personID", null);
                accDocItemEntity.AddField("costCenterID", null);
                accDocItemEntity.AddField("projectID", null);
                accDocItemEntity.AddField("foreignCurrencyID", null);
                accDocItemEntity.AddField("note", "تخفیف");
                accDocItemEntity.AddField("creditorAmount", discountAmount);
                accDocItemEntity.AddField("debtorAmount", 0);
                accDocItemEntity.AddField("isActive", true);

                accDocItemList.Add(accDocItemEntity);
            }

            acc.Instance.InsertAccDocItems(accDocID, opFieldNameInItemEntity, invoiceId, accDocItemList);
        }

        private void GetTotalTaxToll(Entity entity, out decimal totalTax, out decimal totalToll)
        {
            totalTax = 0;
            totalToll = 0;

            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var issueDate = entity.GetFieldValue<DateTime>("IssueDate");
            var id = entity.GetFieldValue<Guid>("ID");

            var taxAndTollPercentEntity = dbHelper.FetchSingle("ps.TaxAndTollPercent",
                string.Format("'{0}' >= FromDate and '{0}' <= ToDate", issueDate),
                null);
            if (taxAndTollPercentEntity == null)
                return;

            var taxPercent = taxAndTollPercentEntity.GetFieldValue<decimal>("Tax");
            var tollPercent = taxAndTollPercentEntity.GetFieldValue<decimal>("Toll");

            if (taxPercent == 0 && tollPercent == 0)
                return;

            var items = dbHelper.FetchMultipleBySqlQuery(
                string.Format(@"
                    select Item.TotalPriceAfterDiscount	
                    from ps_BuyInvoiceItems Item
                    where Item.BuyInvoice = '{0}' and Item.TaxAndToll > 0",
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

        private void SetInvoiceNumber(Entity entity)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var id = entity.GetFieldValue<Guid>("ID");
            var financialGroupID = entity.GetFieldValue<Guid>("FinancialGroup");
            var organizationUnit = entity.GetFieldValue<Guid>("OrganizationUnit");
            var financialYearID = entity.GetFieldValue<Guid>("FinancialYear");

            int? invoiceNumber = cmn.Instance.GetFieldMaxIntValue("InvoiceNumber", "ps_BuyInvoices", string.Format(@"
                OrganizationUnit = '{0}' 
                and FinancialGroup = '{1}' 
                and FinancialYear = '{2}'",
                organizationUnit,
                financialGroupID,
                financialYearID));

            if (invoiceNumber != 0)
                invoiceNumber += 1;
            else
            {
                var financialGroupEntity = dbHelper.FetchSingleByID("cmn.FinancialGroup", financialGroupID, null);
                var buyInvoiceStartNumber = financialGroupEntity.GetFieldValue<int?>("BuyInvoiceStartNumber");
                invoiceNumber = (buyInvoiceStartNumber == null) ? 1 : (int)buyInvoiceStartNumber;
            }

            entity.SetFieldValue("InvoiceNumber", invoiceNumber);
            entity.SetFieldValue("InternalNumber1", invoiceNumber);
        }

        public void OnRunningSalesInvoice1Report(Entity reportEntity, Stimulsoft.Report.StiReport report, Dictionary<string, object> parameters)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var logoImage = report.GetComponentByName("LogoImage") as Stimulsoft.Report.Components.StiImage;
            var invoiceID = Guid.Parse(parameters["InvoiceID"] as string);
            var invoice = dbHelper.FetchSingleByID("ps.BuyInvoice", invoiceID, null);
        }
    }
}

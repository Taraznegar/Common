using AppFramework;
using AppFramework.AppServer;
using AppFramework.DataAccess;
using AppFramework.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using AppFramework.AppServer.WarehouseManagement;
using AppFramework.AppServer.ReceiveAndPay;

namespace AppFramework.AppServer.PurchaseAndSales
{
    public class SalesInvoiceBL : FinancialOpBaseBL
    {
        public SalesInvoiceBL() : base("SalesInvoice") { }

        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            if (entity.GetFieldValue<decimal>("GeneralDiscount") != 0)
                throw new AfwException("امکان مقدار دهی به فیلد تخفیف کلی پیاده سازی نشده است.");

            var invoiceID = entity.GetFieldValue<Guid>("ID");
            var isProforma = entity.GetFieldValue<bool>("IsProforma");
            var financialYearID = entity.GetFieldValue<Guid>("FinancialYear");
            var customerID = entity.GetFieldValue<Guid>("Customer");
            var sourceProformaID = entity.GetFieldValue<Guid?>("SourceProforma");
            var oldEntity = GetOldEntity(entity);
            Guid? previousWorkflowStageID = null;
            var currentWorkflowStageID = entity.GetFieldValue<Guid?>("WorkflowStage");
            var isAmani = entity.GetFieldValue<bool>("IsAmani");
            var changedFieldsExceptHavaleIssuingStatus = true;

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Modify, EntityChangeTypes.Delete))
            {
                changedFieldsExceptHavaleIssuingStatus = cmn.Instance.GetChangedFieldsName(oldEntity, entity,
                    new string[] { "HavaleIssuingStatus", "LastModifyTime", "LastModifierUser", "StuffAndServiceItems", "PayPlanItems", "ValidityDays" }).Any();

                previousWorkflowStageID = oldEntity.GetFieldValue<Guid?>("WorkflowStage");
            }

            Entity workflowStage = null;
            if (currentWorkflowStageID != null)
            {
                workflowStage = dbHelper.FetchSingleByID("cmn.WorkflowStage", (Guid)currentWorkflowStageID, null);
            }

            if (entity.ChangeStatus == EntityChangeTypes.Add)
            {
                if (string.IsNullOrEmpty(entity.GetFieldValue<string>("InvoiceNumber")))
                    SetDefaultNumbers(entity);
            }

            if (!isProforma && entity.ChangeStatus == EntityChangeTypes.Add)
            {
                var invoiceNumberExistsInCanceledSalesInvoiceInfo = dbHelper.EntityExists("ps.CanceledSalesInvoiceInfo",
                    string.Format("OrganizationUnit = '{0}' and FinancialDocType = '{1}' and FinancialYear = '{2}' and InvoiceNumber = '{3}'",
                        entity.GetFieldValue<Guid>("OrganizationUnit"),
                        entity.GetFieldValue<Guid>("FinancialDocType"),
                        entity.GetFieldValue<Guid>("FinancialYear"),
                        entity.GetFieldValue<string>("InvoiceNumber")));

                if (invoiceNumberExistsInCanceledSalesInvoiceInfo)
                    throw new AfwException("این شماره فاکتور قبلا ابطال شده است.");

                var psConfig = dbHelper.FetchSingle("ps.Config", null, null);
                if (!ItemsAreJustServices(entity.GetFieldValue<EntityList>("StuffAndServiceItems"))
                    && !psConfig.GetFieldValue<bool>("EmkaneSodoreFactorGhablAzHavale"))
                {
                    if (sourceProformaID == null || !InvoiceHasHavale((Guid)sourceProformaID))
                        throw new AfwException("قبل از صدور فاکتور باید حواله آن را صادر کنید.");
                }
            }

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify))
            {
                if (isProforma)
                {
                    string workflowName = "";

                    if (isAmani)
                        workflowName = "AmaniProformaInvoice";
                    else
                        workflowName = "SalesProformaInvoice";

                    var workflowDef = cmn.Instance.TryGetWorkflowDefByFormName(workflowName);
                    if (workflowDef != null)
                    {
                        var workflowStages = cmn.Instance.TryGetWorkflowStagesByWorkflowDefID(workflowDef.GetFieldValue<Guid>("ID"));
                        if (workflowStages.Count != 0 && currentWorkflowStageID == null)
                            throw new AfwException("وضعیت پیش فاکتور تعیین نشده است.");
                    }

                    if (currentWorkflowStageID != null)
                    {
                        if (changedFieldsExceptHavaleIssuingStatus)
                        {
                            var userHasAccessToCurrentWorkflowStage = cmn.Instance.UserHasAccessToWorkflowStage(workflowName,
                                (Guid)currentWorkflowStageID);
                            if (!userHasAccessToCurrentWorkflowStage)
                            {
                                var currentWorkflowStage = cmn.Instance.GetWorkflowStageNameByID((Guid)currentWorkflowStageID);
                                throw new AfwException("دسترسی به مرحله گردش کار {0} به شما داده نشده است.",
                                    currentWorkflowStage.GetFieldValue<string>("StageTitle"));
                            }

                            if (previousWorkflowStageID != null)
                            {
                                var userHasAccessToPrevoiusWorkflowStage = cmn.Instance.UserHasAccessToWorkflowStage(workflowName,
                                    (Guid)previousWorkflowStageID);
                                if (!userHasAccessToPrevoiusWorkflowStage)
                                {
                                    var previousWorkflowStage = cmn.Instance.GetWorkflowStageNameByID((Guid)previousWorkflowStageID);
                                    throw new AfwException("دسترسی به مرحله گردش کار {0} به شما داده نشده است.",
                                    previousWorkflowStage.GetFieldValue<string>("StageTitle"));
                                }
                            }
                        }
                    }

                    if (sourceProformaID != null)
                    {
                        var sourceProforma = dbHelper.FetchSingleByID("ps.SalesInvoice", (Guid)sourceProformaID, null);
                        if (financialYearID != sourceProforma.GetFieldValue<Guid>("FinancialYear"))
                            throw new AfwException("امکان تغییر سال مالی وجود ندارد.");

                        if (customerID != sourceProforma.GetFieldValue<Guid>("Customer"))
                            throw new AfwException("امکان تغییر مشتری وجود ندارد.");
                    }
                }

                if (changedFieldsExceptHavaleIssuingStatus)
                    CheckNumbers(entity);//after than SetDefaultNumbers method
            }

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Modify, EntityChangeTypes.Delete))
            {
                if (isProforma)
                {
                    if (changedFieldsExceptHavaleIssuingStatus)
                        if (dbHelper.EntityExists("ps.SalesInvoice", string.Format("SourceProforma = '{0}' and IsProforma = 0", invoiceID)))
                            throw new AfwException("امکان ویرایش و حذف پیش فاکتور دارای فاکتور وجود ندارد.");

                    if (dbHelper.EntityExists("ps.SalesInvoice", string.Format("SourceProforma = '{0}' and IsProforma = 1", invoiceID)))
                        throw new AfwException("امکان ویرایش و حذف پیش فاکتور دارای نسخه جدید تر وجود ندارد.");

                    if (entity.ChangeStatus == EntityChangeTypes.Delete)
                    {
                        if (InvoiceHasHavale(invoiceID))
                            throw new AfwException("امکان حذف پیش فاکتور دارای حواله وجود ندارد.");

                        if (!isAmani && workflowStage != null && workflowStage.GetFieldValue<string>("LatinName").IsIn("ApprovedByCustomer", "FinalApproved"))
                            throw new AfwException("امکان حذف پیش فاکتور در وضعیت {0} وجود ندارد.",
                                workflowStage.GetFieldValue<string>("StageTitle"));

                        DeleteInvoiceWorkflowStageChangeLogs(invoiceID);
                    }

                    if (entity.ChangeStatus == EntityChangeTypes.Modify)
                    {
                        if (InvoiceHasHavale(invoiceID))
                        {
                            if (changedFieldsExceptHavaleIssuingStatus)
                                throw new AfwException("امکان ویرایش پیش فاکتور دارای حواله وجود ندارد.");
                        }

                        if (!isAmani && workflowStage != null && workflowStage.GetFieldValue<string>("LatinName").IsIn("ApprovedByCustomer", "FinalApproved"))
                        {
                            var changedFields = cmn.Instance.GetChangedFieldsName(oldEntity, entity,
                                new string[] { "WorkflowStage", "HavaleIssuingStatus", "RequestNumber",
                                    "LastModifyTime", "LastModifierUser", "StuffAndServiceItems", "PayPlanItems", "ValidityDays" });
                            if (changedFields.Any())
                                throw new AfwException("امکان ویرایش پیش فاکتور در وضعیت {0} وجود ندارد.",
                                workflowStage.GetFieldValue<string>("StageTitle"));
                        }
                    }
                }
            }

            if (entity.ChangeStatus == EntityChangeTypes.Delete)
            {
                acc.Instance.DeleteAccDocItems(entity.GetFieldValue<Guid?>("AccDoc"), "RefOp_SalesInvoice", invoiceID);
            }
        }

        public override void AfterApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.AfterApplyChanges(dbHelper, entity);

            var invoiceID = entity.GetFieldValue<Guid>("ID");
            var isProforma = entity.GetFieldValue<bool>("IsProforma");
            var oldEntity = GetOldEntity(entity);
            var currentWorkflowStageID = entity.GetFieldValue<Guid?>("WorkflowStage");

            Entity workflowStage = null;
            if (currentWorkflowStageID != null)
            {
                workflowStage = dbHelper.FetchSingleByID("cmn.WorkflowStage", (Guid)currentWorkflowStageID, null);
            }

            if (entity.ChangeStatus != EntityChangeTypes.Delete)
            {
                if (entity.FieldExists("StuffAndServiceItems") && entity.GetFieldValue<EntityList>("StuffAndServiceItems") != null)
                {
                    SaveItems(entity.GetFieldValue<EntityList>("StuffAndServiceItems"));
                }

                if (!HasItem(invoiceID))
                    throw new AfwException("فاکتور آیتم ندارد .");

                if (entity.FieldExists("PayPlanItems"))
                {
                    var payPlanItems = entity.GetFieldValue<EntityList>("PayPlanItems").Entities;
                    SavePayPlanItems(payPlanItems);
                }

                var customerID = entity.GetFieldValue<Guid>("Customer");

                if (isProforma)
                {
                    if (workflowStage != null
                        && workflowStage.GetFieldValue<string>("LatinName") != "NotApproved")
                    {
                        if (entity.FieldExists("StuffAndServiceItems") && !InvoiceHasHavale(invoiceID))
                        {
                            wm.Instance.CheckStuffsStock(
                                entity.GetFieldValue<EntityList>("StuffAndServiceItems").Entities,
                                null, null, null,
                                entity.GetFieldValue<Guid>("ID"));
                        }
                    }

                    if (!cmn.Instance.PersonHasRole(customerID, "Customer"))
                        cmn.Instance.AddRoleToPerson(customerID, "PotentialCustomer");
                }
                else
                {
                    cmn.Instance.AddRoleToPerson(customerID, "Customer");
                    CreateSalesInvoiceAccDoc(entity);
                }
            }

            //if (entity.ChangeStatus == EntityChangeTypes.Modify && isProforma)
            //    ExecuteWorkflowSystemAction(entity, "CreateInvoice");

            if (entity.ChangeStatus == EntityChangeTypes.Delete)
                acc.Instance.DeleteAccDocMaster(entity.GetFieldValue<Guid?>("AccDoc"), "ps.SalesInvoice", invoiceID);

            if (entity.ChangeStatus == EntityChangeTypes.Add)
            {
                if (currentWorkflowStageID != null)
                    InsertWorkflowStageChangeLog(oldEntity, entity);
            }

            if (entity.ChangeStatus == EntityChangeTypes.Modify)
            {
                if (oldEntity.GetFieldValue<Guid?>("WorkflowStage") != currentWorkflowStageID)
                    InsertWorkflowStageChangeLog(oldEntity, entity);
            }
        }

        private void InsertWorkflowStageChangeLog(Entity oldEntity, Entity entity)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var salesInvoiceWorkflowStageChangeLog = dbHelper.CreateNewEntity("ps.SalesInvoiceWorkflowStageChangeLog");

            salesInvoiceWorkflowStageChangeLog.SetFieldValue("SalesInvoice", entity.GetFieldValue<Guid>("ID"));
            salesInvoiceWorkflowStageChangeLog.SetFieldValue("PreviousWorkflowStage",
                entity.ChangeStatus == EntityChangeTypes.Add ? null : oldEntity.GetFieldValue<Guid?>("WorkflowStage"));
            salesInvoiceWorkflowStageChangeLog.SetFieldValue("NewWorkflowStage", entity.GetFieldValue<Guid>("WorkflowStage"));

            dbHelper.ApplyChanges(salesInvoiceWorkflowStageChangeLog);
        }

        private void DeleteInvoiceWorkflowStageChangeLogs(Guid InvoiceID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var salesInvoiceWorkflowStageChangeLogEntityList = dbHelper.FetchMultiple("ps.SalesInvoiceWorkflowStageChangeLog",
                string.Format("SalesInvoice = '{0}'", InvoiceID), null, null, null, null);

            foreach (var entity in salesInvoiceWorkflowStageChangeLogEntityList.Entities)
            {
                dbHelper.DeleteEntity(entity);
            }
        }

        private bool InvoiceHasHavale(Guid InvoiceID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            if (dbHelper.EntityExists("wm.GhabzOrHavale", string.Format("RefDoc_SalesInvoice = '{0}'", InvoiceID)))
                return true;

            return false;
        }

        private bool ItemsAreJustServices(EntityList items)
        {
            foreach (var item in items.Entities)
            {
                if (item.GetFieldValue<Guid?>("Stuff") != null)
                    return false;
            }

            return true;
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
                    if (dbHelper.EntityExists("ps.SalesInvoiceItem", item.GetFieldValue<Guid>("ID")))
                        item.ChangeStatus = "Modify";
                    else
                        item.ChangeStatus = "Add";
                }

                dbHelper.ApplyChanges(item);
            }
        }

        private void SetDefaultNumbers(Entity entity)
        {
            var isProforma = entity.GetFieldValue<bool>("IsProforma");
            var financialYearID = entity.GetFieldValue<Guid>("FinancialYear");
            var financialGroupID = entity.GetFieldValue<Guid>("FinancialGroup");
            var organizationUnit = entity.GetFieldValue<Guid>("OrganizationUnit");
            var financialDocTypeID = entity.GetFieldValue<Guid>("FinancialDocType");

            if (isProforma)
            {
                long? internalNumber1 = entity.GetFieldValue<long?>("InternalNumber1");
                long internalNumber2;
                string invoiceNumber;
                GetProformaDefaultNumbers(financialYearID, entity.GetFieldValue<bool>("IsAmani"), ref internalNumber1, out internalNumber2, out invoiceNumber);
                entity.SetFieldValue("InternalNumber1", internalNumber1);
                entity.SetFieldValue("InternalNumber2", internalNumber2);
                entity.SetFieldValue("InvoiceNumber", invoiceNumber);
            }
            else
            {
                var invoiceNumber = GetSalesInvoiceDefaultNumber(organizationUnit, financialYearID, financialGroupID, financialDocTypeID, entity.GetFieldValue<bool>("IsAmani"));
                entity.SetFieldValue("InvoiceNumber", invoiceNumber);
            }
        }

        private bool HasItem(Guid id)
        {
            var exist = false;

            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var items = dbHelper.FetchMultiple("ps.SalesInvoiceItem", string.Format("SalesInvoice = '{0}'", id), null, null, null, null).Entities;
            if (items.Count > 0)
                exist = true;

            return exist;
        }

        private void ExecuteWorkflowSystemAction(Entity entity, string systemActionName)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var oldEntity = GetOldEntity(entity);

            if (oldEntity.GetFieldValue<Guid?>("WorkflowStage") != null)
            {
                var filteredStages = dbHelper.FetchMultipleBySqlQuery(@"
                    select top 2 workflowStage.ID,workflowStage.StageTitle, SystemAction.Title SystemActionTitel, 
                        SystemAction.Name SystemActionName, workflowStage.StageOrder, SystemAction.ID SystemActionID
                    from cmn_WorkflowStages workflowStage 
	                    left join cmn_WorkflowDefs workflowDef on workflowDef.ID = workflowStage.WorkflowDef
	                    left join cmn_WorkfolwSystemActions SystemAction on SystemAction.ID = workflowStage.SystemAction
                    where workflowDef.ID in(
                        select workflowDef.ID
						from cmn_WorkflowStages workflowStage1 
						    left join cmn_WorkflowDefs workflowDef on workflowDef.ID = workflowStage1.WorkflowDef
						    left join cmn_WorkfolwSystemActions SystemAction on SystemAction.ID = workflowStage1.SystemAction
						where SystemAction.Name = '" + systemActionName + @"' and workflowStage.StageOrder >= workflowStage1.StageOrder)
                    order by workflowStage.StageOrder");

                var systemActionID = filteredStages.Entities[0].GetFieldValue<Guid?>("SystemActionID");
                if (filteredStages.Entities[0].GetFieldValue<Guid>("ID") == oldEntity.GetFieldValue<Guid>("WorkflowStage") && systemActionID != null)
                    CreateInvoiceFromProforma(entity.GetFieldValue<Guid>("ID"), oldEntity.GetFieldValue<Guid>("FinancialYear"));
            }
        }

        private void GetProformaDefaultNumbers(Guid financialYearID, bool isAmani, ref long? internalNumber1, out long internalNumber2, out string invoiceNumber)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            if (internalNumber1 == null)
            {
                internalNumber1 = (long)dbHelper.AdoDbHelper.ExecuteScalar(string.Format(@"
                    select isnull(
                        (select max(isnull(InternalNumber1, 0)) + 1 
                        from ps_SalesInvoices 
                        where IsProforma = 1 and FinancialYear = '{0}' and IsAmani = {1}) 
                        , 1)",
                    financialYearID, isAmani == true ? 1 : 0));

                internalNumber2 = 1;
            }
            else
            {
                internalNumber2 = (long)dbHelper.AdoDbHelper.ExecuteScalar(string.Format(@"
                    select max(isnull(InternalNumber2, 0)) + 1 
                    from ps_SalesInvoices 
                    where IsProforma = 1 and InternalNumber1 = {0} and FinancialYear = '{1}' and IsAmani = {2}",
                    internalNumber1, financialYearID, isAmani == true ? 1 : 0));
            }

            invoiceNumber = internalNumber1.ToString() + "/" + internalNumber2.ToString();
        }

        public int GetSalesInvoiceDefaultNumber(Guid organizationUnit, Guid financialYearID, Guid financialGroupID, Guid financialDocTypeID, bool isAmani)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            int? invoiceNumber = cmn.Instance.GetFieldMaxIntValue("InvoiceNumber", "ps_SalesInvoices", string.Format(@"
                IsProforma = 0 
                and OrganizationUnit = '{0}' 
                and FinancialDocType = '{1}'
                and FinancialYear = '{2}'
                and IsAmani = {3}",
                organizationUnit,
                financialDocTypeID,
                financialYearID,
                isAmani == true ? 1 : 0));

            if (invoiceNumber != 0)
                invoiceNumber += 1;
            else
            {
                var financialGroupEntity = dbHelper.FetchSingleByID("cmn.FinancialGroup", financialGroupID, null);
                var saleInvoiceStartNumber = financialGroupEntity.GetFieldValue<int?>("SaleInvoiceStartNumber");
                var amaniInvoiceStartNumber = financialGroupEntity.GetFieldValue<int?>("AmaniSaleInvoiceStartNumber");

                if (isAmani)
                    invoiceNumber = (amaniInvoiceStartNumber == null) ? 1 : (int)amaniInvoiceStartNumber;
                else
                    invoiceNumber = (saleInvoiceStartNumber == null) ? 1 : (int)saleInvoiceStartNumber;
            }

            if (!isAmani)
            {
                while (true)
                {
                    var canceledSalesInvoiceInfoExists = dbHelper.EntityExists("ps.CanceledSalesInvoiceInfo",
                        string.Format(@"OrganizationUnit = '{0}' and FinancialDocType = '{1}' and FinancialYear = '{2}' and InvoiceNumber = '{3}'",
                            organizationUnit,
                            financialDocTypeID,
                            financialYearID,
                            invoiceNumber));

                    if (canceledSalesInvoiceInfoExists)
                        invoiceNumber += 1;
                    else
                        break;
                }
            }

            return (int)invoiceNumber;
        }

        private void CheckNumbers(Entity invoiceOrProforma)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var invoiceOrProformaID = invoiceOrProforma.GetFieldValue<Guid>("ID");
            var sourceProformaID = invoiceOrProforma.GetFieldValue<Guid?>("SourceProforma");
            Guid financialYearID = invoiceOrProforma.GetFieldValue<Guid>("FinancialYear");
            Guid financialDocTypeID = invoiceOrProforma.GetFieldValue<Guid>("FinancialDocType");
            Guid organizationUnitID = invoiceOrProforma.GetFieldValue<Guid>("OrganizationUnit");
            var isProforma = invoiceOrProforma.GetFieldValue<bool>("IsProforma");
            string invoiceNumber = invoiceOrProforma.GetFieldValue<string>("InvoiceNumber");
            string requestNumber = invoiceOrProforma.GetFieldValue<string>("RequestNumber");
            bool isAmani = invoiceOrProforma.GetFieldValue<bool>("IsAmani");

            if (isProforma)
            {
                long internalNumber1 = invoiceOrProforma.GetFieldValue<long>("InternalNumber1");
                long internalNumber2 = invoiceOrProforma.GetFieldValue<long>("InternalNumber2");

                var proformaNumberExists = dbHelper.EntityExists("ps.SalesInvoice", string.Format(@"
                    IsProforma = 1                     
                    and FinancialYear = '{1}' 
                    and ((InternalNumber1 = {2} and InternalNumber2 = {3}) or InvoiceNumber = '{4}') 
                    and ID <> '{5}'
                    and IsAmani = {6}",
                    organizationUnitID, financialYearID, internalNumber1, internalNumber2, invoiceNumber, invoiceOrProformaID, isAmani == true ? 1 : 0));

                if (proformaNumberExists)
                    throw new AfwException("شماره پیش فاکتور تکراری است.");

                if (requestNumber != null)
                {
                    if (dbHelper.AdoDbHelper.ExecuteScalar<bool>(
                        "select ps.SalesProforma_DuplicateRequestNumberExists(@ProformaID, @ProformaOrganizationUnitID, @ProformaRequestNumber, @ProformaInternalNumber1)",
                        new object[] { invoiceOrProformaID, organizationUnitID, requestNumber, internalNumber1 }) == true)
                        throw new AfwException("شماره درخواست تکراری است");
                }
            }
            else
            {
                var invoiceNumberExists = dbHelper.EntityExists("ps.SalesInvoice", string.Format(@"
                    IsProforma = 0                     
                    and OrganizationUnit = '{0}'
                    and FinancialDocType = '{1}' 
                    and FinancialYear = '{2}' 
                    and InvoiceNumber = '{3}' 
                    and ID <> '{4}'
                    and IsAmani = {5}",
                    organizationUnitID, financialDocTypeID, financialYearID, invoiceNumber, invoiceOrProformaID, isAmani == true ? 1 : 0));

                if (invoiceNumberExists)
                    throw new AfwException("شماره فاکتور تکراری است.");

                if (requestNumber != null)
                {
                    if (dbHelper.AdoDbHelper.ExecuteScalar<bool>(
                        "select ps.SalesInvoice_DuplicateRequestNumberExists(@InvoiceID, @InvoiceOrganizationUnitID, @InvoiceRequestNumber, @SourceProformaID)",
                        new object[] { invoiceOrProformaID, organizationUnitID, requestNumber, sourceProformaID }) == true)
                        throw new AfwException("شماره درخواست تکراری است");
                }
            }
        }

        public void OnRunningSalesInvoice1Report(Entity reportEntity, Stimulsoft.Report.StiReport report, Dictionary<string, object> parameters)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var logoImage = report.GetComponentByName("LogoImage") as Stimulsoft.Report.Components.StiImage;
            var invoiceID = Guid.Parse(parameters["InvoiceID"] as string);
            string queryOptionSetItemName = string.Format(@"
                select OptionSetItem.Name 
                from ps_SalesInvoices SalesInvoice
                    inner join cmn_FinancialGroups FinancialGroup
                    on SalesInvoice.FinancialGroup = FinancialGroup.ID
                    inner join afw_OptionSetItems OptionSetItem 
                    on OptionSetItem.ID = FinancialGroup.FinancialDocType
                where SalesInvoice.ID ='{0}'", invoiceID);
            var officialType = dbHelper.AdoDbHelper.ExecuteScalar<string>(queryOptionSetItemName);
            if (officialType == "Main")
            {
                logoImage.Enabled = true;
            }
            else
            {
                logoImage.Enabled = false;
            }
        }

        public string GetFinancialDocTypeName(Guid invoiceID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;
            string queryOptionSetItemName = string.Format(@"
                select OptionSetItem.Name 
                from ps_SalesInvoices SalesInvoice
                    inner join cmn_FinancialGroups FinancialGroup
                    on SalesInvoice.FinancialGroup = FinancialGroup.ID
                    inner join afw_OptionSetItems OptionSetItem 
                    on OptionSetItem.ID = FinancialGroup.FinancialDocType
                where SalesInvoice.ID ='{0}'", invoiceID);
            return dbHelper.AdoDbHelper.ExecuteScalar<string>(queryOptionSetItemName);
        }

        public EntityList GetVosolMotalebat(Guid invoiceID, DateTime todayDate, DateTime tarikh7RozBad)
        {
            using (var dbHelper = DbHelperFactory.CreateMainDbEntityDbHelper())
            {
                var VosolMotaleba = dbHelper.FetchMultipleBySqlQuery(string.Format(
                    @"exec ps.VosolMotalebat '{0}', '{1}', '{2}'", invoiceID, todayDate, tarikh7RozBad));
                return VosolMotaleba;
            }
        }

        public void CreateInvoiceFromProforma(Guid proformaID, Guid financialYearID)
        {
            CreateInvoiceFromProforma(proformaID, null, DateTime.Now.Date, null, financialYearID);
        }

        public void CreateInvoiceFromProforma(Guid proformaID, string invoiceNumber, DateTime issueDate, string requestNumber, Guid financialYearID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var invoice = dbHelper.FetchSingleByID("ps.SalesInvoice", proformaID, new string[] { "StuffAndServiceItems", "PayPlanItems" });

            if (dbHelper.AdoDbHelper.ExistsRow(string.Format(@"
                select 1
                from ps_SalesInvoices OtherProforma
	                left join wm_GhabzOrHavaleha OtherProformaHavaleh on OtherProformaHavaleh.RefDoc_SalesInvoice = OtherProforma.ID
                where OtherProforma.IsProforma = 1
	                and OtherProforma.ID <> '{0}'
                    and OtherProforma.FinancialYear = '{1}'
	                and OtherProformaHavaleh.ID is not null
	                and cast(OtherProformaHavaleh.IssueDate as date) < (select max(cast(IssueDate as date)) from wm_GhabzOrHavaleha where RefDoc_SalesInvoice = '{0}')
                    and OtherProforma.OrganizationUnit = '{1}'
	                and not exists(--فاکتور صادر نشده
		                select 1 
		                from ps_SalesInvoices
		                where SourceProforma = OtherProforma.ID
			                and IsProforma = 0)",
                proformaID,
                invoice.GetFieldValue<Guid>("OrganizationUnit"),
                financialYearID)))
            {
                throw new AfwException("امکان صدور فاکتور وجود ندارد.\r\n " +
                    "پیش فاکتور حواله شده ایی در سیستم موجود است که\r\n " +
                    "تاریخ صدور حواله آن قبل از تاریخ صدور حواله پیش فاکتور\r\n " +
                    "جاری است و هنوز فاکتور برای آن صادر نشده است.");
            }

            var itemsEntityList = invoice.GetFieldValue<EntityList>("StuffAndServiceItems");
            var payPlanItemsEntityList = invoice.GetFieldValue<EntityList>("PayPlanItems");

            var invoiceID = Guid.NewGuid();
            invoice.ChangeStatus = EntityChangeTypes.Add;

            invoice.SetFieldValue("ID", invoiceID);
            invoice.SetFieldValue("IsProforma", 0);
            invoice.SetFieldValue("FinancialYear", new FinancialYearBL().GetUserActiveFinancialYearID());
            invoice.SetFieldValue("InternalNumber1", invoiceNumber);
            invoice.SetFieldValue("InternalNumber2", null);
            invoice.SetFieldValue("InvoiceNumber", invoiceNumber);
            invoice.SetFieldValue("SourceProforma", proformaID);
            invoice.SetFieldValue("IssueDate", issueDate);
            invoice.SetFieldValue("RequestNumber", requestNumber);
            invoice.SetFieldValue("HavaleIssuingStatus", OptionSetHelper.GetOptionSetItemID("cmn.HavaleIssuingStatus", "HavaleNashodeh"));
            invoice.SetFieldValue("WorkflowStage", null);
            invoice.SetFieldValue("IsAmani", invoice.GetFieldValue<bool>("IsAmani"));

            foreach (var item in itemsEntityList.Entities)
            {
                item.ChangeStatus = EntityChangeTypes.Add;
                item.SetFieldValue("ID", Guid.NewGuid());
                item.SetFieldValue("SalesInvoice", invoiceID);
            }

            foreach (var item in payPlanItemsEntityList.Entities)
            {
                item.ChangeStatus = EntityChangeTypes.Add;
                item.SetFieldValue("ID", Guid.NewGuid());
                item.SetFieldValue("SalesInvoice", invoiceID);
            }

            dbHelper.ApplyChanges(invoice);
        }

        public void CreateSalesInvoiceAccDoc(Entity entity)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var automaticAccDocSettingName = rp.Instance.GetAutomaticAccDocSetting("SalesInvoice");
            if (automaticAccDocSettingName == "Disabled")
                return;

            if (String.IsNullOrEmpty(automaticAccDocSettingName))
                throw new AfwException("تنظیمات سند حسابداری اتوماتیک فاکتور فروش تعیین نشده است");

            if (!ValidateAccDocAccounts(entity))
                throw new AfwException("کدینگ حساب های {0} در شابلون سند فروش مقداردهی نشده اند.",
                    entity.GetFieldValue<bool>("IsAmani") == true ? "امانی" : "فاکتور فروش");

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
                    var desc = "بابت فاکتور فروش شماره  " + entity.GetFieldValue<string>("InvoiceNumber");
                    Guid? accDocID = entity.GetFieldValue<Guid?>("AccDoc");

                    if (accDocID == null && automaticAccDocSettingName == "ByDay")
                    {
                        accDocID = acc.Instance.GetTodayAccDoc("SalesInvoice", financialDocTypeID, issueDate, organizationUnitID);
                    }

                    acc.Instance.InsertOrUpdateAccDocMaster(ref accDocID, "SalesInvoice", issueDate, financialYear, financialGroupID, desc, true);

                    if (entity.GetFieldValue<Guid?>("AccDoc") == null)
                    {
                        dbHelper.AdoDbHelper.ExecuteNonQuery(string.Format(@"
                            update ps_SalesInvoices set AccDoc = '{0}' where ID = '{1}'", accDocID, id));
                    }

                    CreateSalesInvoiceAccDocItems(entity, (Guid)accDocID);
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

            var docGenerationMethod = OptionSetHelper.GetOptionSetItemName(financialGroupEntity.GetFieldValue<Guid>("SalesDocGenerationMethod"));
            var hesabeForoosh = financialGroupEntity.GetFieldValue<Guid?>("ShabloneSanad_HesabeForoosh");
            var hesabeForooshAmani = financialGroupEntity.GetFieldValue<Guid?>("ShabloneSanad_HesabeForoosheAmani");
            var hesabeMoshtarian = financialGroupEntity.GetFieldValue<Guid?>("ShabloneSanad_HesabeMoshtarian");
            var hesabeMoshtarianAmani = financialGroupEntity.GetFieldValue<Guid?>("ShabloneSanad_HesabeMoshtarianAmani");
            var hesabeAvarezBarArzeshAfzoode = financialGroupEntity.GetFieldValue<Guid?>("ShabloneSanad_HesabeAvarezBarArzeshAfzoode_Foroosh");
            var hesabeMaliatBarArzeshAfzoode = financialGroupEntity.GetFieldValue<Guid?>("ShabloneSanad_HesabeMaliatBarArzeshAfzoode_Foroosh");
            var hesabeTakhfifat = financialGroupEntity.GetFieldValue<Guid?>("ShabloneSanad_HesabeTakhfifat_Foroosh");
            var isAmani = entity.GetFieldValue<bool>("IsAmani");

            if (isAmani)
            {
                if (hesabeForooshAmani == null || hesabeMoshtarianAmani == null)
                    return false;
            }
            else
            {
                if ((docGenerationMethod == "TakhfifDarSanadJodaShavad" &&
                   (hesabeForoosh == null ||
                   hesabeMoshtarian == null ||
                   hesabeAvarezBarArzeshAfzoode == null ||
                   hesabeMaliatBarArzeshAfzoode == null ||
                   hesabeTakhfifat == null))
                   ||
                   (docGenerationMethod == "TakhfifDarSanadJodaNashavad" &&
                   (hesabeForoosh == null ||
                   hesabeMoshtarian == null ||
                   hesabeAvarezBarArzeshAfzoode == null ||
                   hesabeMaliatBarArzeshAfzoode == null))
                   )
                {
                    return false;
                }

                var query = string.Format(@"
                select Service.ID , Service.Name
                from ps_SalesInvoiceItems Item
                    inner join cmn_Services Service on Service.ID = Item.Service
                where Item.SalesInvoice = '{0}' ", entity.GetFieldValue<Guid>("ID"));
                var serviceEntities = dbHelper.FetchMultipleBySqlQuery(query).Entities;

                cmn.Instance.CheckServicesAccSetting(serviceEntities, entity.GetFieldValue<Guid>("FinancialYear"));
            }

            return true;
        }

        private void CreateSalesInvoiceAccDocItems(Entity entity, Guid accDocID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            if (entity.GetFieldValue<decimal>("GeneralDiscount") != 0)
                throw new AfwException("GeneralDiscount has value. not Implemented.");

            var opFieldNameInItemEntity = "RefOp_SalesInvoice";
            List<Entity> accDocItemList = new List<Entity>();

            var invoiceID = entity.GetFieldValue<Guid>("ID");
            var invoiceNumber = entity.GetFieldValue<string>("InvoiceNumber");
            var customer = entity.GetFieldValue<Guid>("Customer");
            var finalAmount = entity.GetFieldValue<decimal>("FinalAmount");
            var totalTaxAndToll = entity.GetFieldValue<decimal>("TotalTaxAndToll");
            var discountAmount = entity.GetFieldValue<decimal>("TotalDiscount");

            var customerEntity = dbHelper.FetchSingle("cmn.Person", string.Format("ID = '{0}'", customer), null);
            var itemDesc = "فروش - خدمات طی فاکتور شماره " + invoiceNumber + " به شخص " + customerEntity.GetFieldValue<string>("StoredDisplayText");

            var isAmani = entity.GetFieldValue<bool>("IsAmani");
            var financialGroupID = entity.GetFieldValue<Guid>("FinancialGroup");
            var financialGroupEntity = dbHelper.FetchSingleByID("cmn.FinancialGroup", financialGroupID, null);
            var docGenerationMethod = OptionSetHelper.GetOptionSetItemName(financialGroupEntity.GetFieldValue<Guid>("SalesDocGenerationMethod"));

            var hesabeForooshAmani = financialGroupEntity.GetFieldValue<Guid?>("ShabloneSanad_HesabeForoosheAmani");
            var hesabeMoshtarianAmani = financialGroupEntity.GetFieldValue<Guid?>("ShabloneSanad_HesabeMoshtarianAmani");
            var hesabeForoosh = financialGroupEntity.GetFieldValue<Guid?>("ShabloneSanad_HesabeForoosh");
            var hesabeMoshtarian = financialGroupEntity.GetFieldValue<Guid?>("ShabloneSanad_HesabeMoshtarian");
            var hesabeAvarezBarArzeshAfzoode = financialGroupEntity.GetFieldValue<Guid?>("ShabloneSanad_HesabeAvarezBarArzeshAfzoode_Foroosh");
            var hesabeMaliatBarArzeshAfzoode = financialGroupEntity.GetFieldValue<Guid?>("ShabloneSanad_HesabeMaliatBarArzeshAfzoode_Foroosh");
            var hesabeTakhfifat = financialGroupEntity.GetFieldValue<Guid?>("ShabloneSanad_HesabeTakhfifat_Foroosh");

            acc.Instance.DeleteAccDocItems(accDocID, opFieldNameInItemEntity, invoiceID);

            //آیتمهای بدهکار*******************************************************************************************************
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
                accDocItemEntity.AddField("creditorAmount", 0);
                accDocItemEntity.AddField("debtorAmount", finalAmount);
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
                accDocItemEntity.AddField("creditorAmount", 0);
                accDocItemEntity.AddField("debtorAmount", discountAmount);
                accDocItemEntity.AddField("isActive", true);

                accDocItemList.Add(accDocItemEntity);
            }
            //************************/
            //************************/

            //آیتمهای بستانکار*******************************************************************************************************
            //کالاها******************       
            var stuffsEntity = dbHelper.FetchSingleBySqlQuery(string.Format(@"
                select sum(TotalPrice) TotalPrice,
                    sum(Discount) Discount
                from ps_SalesInvoiceItems 
                where SalesInvoice = '{0}' and Stuff is not null", invoiceID));

            if (stuffsEntity != null && stuffsEntity.GetFieldValue<decimal?>("TotalPrice") != null)
            {
                var stuffsTotalPrice = stuffsEntity.GetFieldValue<decimal>("TotalPrice");
                var stuffsDiscount = stuffsEntity.GetFieldValue<decimal>("Discount");
                var salesAmount = stuffsTotalPrice;

                if (docGenerationMethod == "TakhfifDarSanadJodaNashavad")
                    salesAmount -= stuffsDiscount;

                var accDocItemEntity = new Entity();
                accDocItemEntity.AddField("accountID",
                    isAmani == true ? (Guid)hesabeForooshAmani : (Guid)hesabeForoosh);
                accDocItemEntity.AddField("personID", null);
                accDocItemEntity.AddField("costCenterID", null);
                accDocItemEntity.AddField("projectID", null);
                accDocItemEntity.AddField("foreignCurrencyID", null);
                accDocItemEntity.AddField("note", itemDesc + "(کالاها)");
                accDocItemEntity.AddField("creditorAmount", (decimal)salesAmount);
                accDocItemEntity.AddField("debtorAmount", 0);
                accDocItemEntity.AddField("isActive", true);

                accDocItemList.Add(accDocItemEntity);
            }
            //************************/            

            //خدمات******************
            var services = dbHelper.FetchMultipleBySqlQuery(string.Format(@"
                select AccSetting.Account Account, 
                    sum(Item.TotalPrice) TotalPrice,
                    sum(Item.Discount) Discount
                from ps_SalesInvoiceItems Item
                    inner join cmn_Services Service on Service.ID = Item.Service
	                left join cmn_ServiceAccSettings AccSetting on AccSetting.Service = Service.ID
                where Item.SalesInvoice = '{0}' and AccSetting.FinancialYear = '{1}'
                group by AccSetting.Account",
                invoiceID,
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
                accDocItemEntity.AddField("note", itemDesc + "(خدمات)");
                accDocItemEntity.AddField("creditorAmount", serviceAmount);
                accDocItemEntity.AddField("debtorAmount", 0);
                accDocItemEntity.AddField("isActive", true);

                accDocItemList.Add(accDocItemEntity);
            }
            //************************/            

            //مالیات عوارض******************
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
                throw new AfwException("درصد مالیات و عوارض برای این تاریخ در تنظیمات سیستم ثبت نشده است.");

            var taxPercent = taxAndTollPercentEntity.GetFieldValue<decimal>("Tax");
            var tollPercent = taxAndTollPercentEntity.GetFieldValue<decimal>("Toll");

            if (taxPercent == 0 && tollPercent == 0)
                return;

            var items = dbHelper.FetchMultipleBySqlQuery(string.Format(@"
                select Item.TotalPriceAfterDiscount, Item.TaxAndToll
                from ps_SalesInvoiceItems Item
                where Item.SalesInvoice = '{0}' and Item.TaxAndToll > 0",
                id)).Entities;

            foreach (var item in items)
            {
                var totalPriceAfterDiscount = item.GetFieldValue<decimal>("TotalPriceAfterDiscount");

                //**** causes calculation difference with client:
                //var totalTaxAndTollPercent = (decimal)taxPercent + (decimal)tollPercent;
                //var totalTaxAndToll = Math.Round((totalPriceAfterDiscount * (decimal)totalTaxAndTollPercent) / 100);
                //****
                var totalTaxAndToll = item.GetFieldValue<decimal>("TaxAndToll");//calculated in client
                var tax = Math.Round((totalPriceAfterDiscount * (decimal)taxPercent) / 100);
                totalTax += tax;
                totalToll += totalTaxAndToll - tax;
            }
        }

        private void SavePayPlanItems(List<Entity> payPlanItems)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            foreach (var item in payPlanItems)
            {
                if (dbHelper.EntityExists("ps.SalesInvoicePayPlanItem", item.GetFieldValue<Guid>("ID")))
                    item.ChangeStatus = "Modify";
                else
                    item.ChangeStatus = "Add";

                dbHelper.ApplyChanges(item);
            }
        }

        public EntityList GetGardesheKalahayeMoshtari(Guid? type, DateTime? issueDateBegin, DateTime? issueDateEnd, Guid person, Guid? stuffLabel)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var typeName = type == null ? "" : OptionSetHelper.GetOptionSetItemName((Guid)type);

            var entityList = dbHelper.FetchMultipleBySqlQuery(string.Format(
                @"exec ps.GetGardesheKalahayeMoshtari
                    '{0}', {1}, {2}, '{3}', {4}",
                typeName,
                issueDateBegin == null ? "null" : string.Format("'{0}'", issueDateBegin),
                issueDateEnd == null ? "null" : string.Format("'{0}'", issueDateEnd),
                person,
                stuffLabel == null ? "null" : string.Format("'{0}'", stuffLabel)));

            return entityList;
        }

        public long GetMaxRequestNumber(Guid organizationUnit)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            try
            {
                long maxRequetNumber = 0;
                maxRequetNumber = (long)dbHelper.AdoDbHelper.ExecuteScalar(
                    string.Format(@"
                        select max(cast(isnull(RequestNumber,0) as bigint)) + 1 as RequestNumber
                        from ps_SalesInvoices
                        where OrganizationUnit = '{0}'",
                        organizationUnit));
                return maxRequetNumber;
            }
            catch
            {
                return 1;
            }
        }

        public void DeleteSalesInvoiceAndCreateCanceledSalesInvoiceInfo(Guid id)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            if (!PermissionHelper.UserHasPermissionToItem("ps.SalesInvoiceCancellation"))
                throw new AfwException("شما دسترسی لازم برای ابطال فاکتور را ندارید.");

            using (var tranManager = new DbTransactionManager(dbHelper))
            {
                try
                {
                    var salesInvoice = dbHelper.FetchSingleByID("ps.SalesInvoice", id, null);

                    var canceledSalesInvoiceInfo = dbHelper.CreateNewEntity("ps.CanceledSalesInvoiceInfo");
                    canceledSalesInvoiceInfo.SetFieldValue("InvoiceNumber", salesInvoice.GetFieldValue<int>("InvoiceNumber"));
                    canceledSalesInvoiceInfo.SetFieldValue("FinancialYear", salesInvoice.GetFieldValue<Guid>("FinancialYear"));
                    canceledSalesInvoiceInfo.SetFieldValue("OrganizationUnit", salesInvoice.GetFieldValue<Guid>("OrganizationUnit"));
                    canceledSalesInvoiceInfo.SetFieldValue("FinancialDocType", salesInvoice.GetFieldValue<Guid>("FinancialDocType"));

                    dbHelper.DeleteEntity(salesInvoice);

                    dbHelper.ApplyChanges(canceledSalesInvoiceInfo);

                    tranManager.Commit();
                }
                catch (Exception ex)
                {
                    if (ex.Message.Contains("REFERENCE constraint") && ex.Message.Contains("ps_ReturnFromSaleItems"))
                    {
                        throw new AfwException("بدلیل وجود برگشت از فروش امکان ابطال این فاکتور وجود ندارد.");
                    }

                    if (ex.Message.Contains("REFERENCE constraint") && ex.Message.Contains("wm_GhabzOrHavaleha"))
                    {
                        throw new AfwException("بدلیل وجود حواله فروش امکان ابطال این فاکتور وجود ندارد.");
                    }
                }
            }
        }

        public bool IsConvertedToInvoice(int InternalNumber1, bool isAmani, Guid organizationUnit)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;
            bool isInvoice = false;

            var sqlQuery = string.Format(@"
                select count(*) 
                from ps_SalesInvoices Proforma
	                left join ps_SalesInvoices CreatedInvoice on CreatedInvoice.SourceProforma = Proforma.ID 
		                and CreatedInvoice.IsProforma = 0
                where Proforma.InternalNumber1 = '{0}' 
                    and Proforma.IsAmani = {1}
                    and CreatedInvoice.InvoiceNumber is not null 
                    and Proforma.FinancialYear = '{2}'
                    and Proforma.OrganizationUnit = '{3}'",
                    InternalNumber1,
                    isAmani == true ? 1 : 0,
                    new FinancialYearBL().GetUserActiveFinancialYearID(),
                    organizationUnit);
            var result = dbHelper.AdoDbHelper.ExecuteScalar<int>(sqlQuery);

            if (result > 0)
                isInvoice = true;

            return isInvoice;
        }
    }
}

using AppFramework;
using AppFramework.AppServer;
using AppFramework.DataAccess;
using AppFramework.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace AppFramework.AppServer
{
    public class AccDocBL : EntityBL
    {
        List<Entity> _FinancialYears;

        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            var finalDocStatus = OptionSetHelper.GetOptionSetItemID("acc.DocStatus", "Final");
            var checkedDocStatus = OptionSetHelper.GetOptionSetItemID("acc.DocStatus", "Checked");
            var approvedDocStatus = OptionSetHelper.GetOptionSetItemID("acc.DocStatus", "Approved");
            var notCheckedDocStatus = OptionSetHelper.GetOptionSetItemID("acc.DocStatus", "NotChecked");
            var balanceStatus = OptionSetHelper.GetOptionSetItemID("acc.BalanceStatus", "Balance");

            var newDocStatus = entity.GetFieldValue<Guid>("DocStatus");
            Guid? oldDocStatus = null;
            Entity oldAccDocEntity = null;

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Modify, EntityChangeTypes.Delete))
            {
                oldAccDocEntity = dbHelper.FetchSingleByID("acc.AccDoc", entity.GetFieldValue<Guid>("ID"), null);
                oldDocStatus = oldAccDocEntity.GetFieldValue<Guid>("DocStatus");
            }

            if (entity.ChangeStatus == EntityChangeTypes.Add)
            {
                if (entity.GetFieldValue<Guid?>("FinancialDocType") == null)
                {
                    var financialGroup = dbHelper.FetchSingleByID("cmn.FinancialGroup", entity.GetFieldValue<Guid>("FinancialGroup"), null);
                    if (financialGroup != null && financialGroup.GetFieldValue<Guid>("FinancialDocType") != null)
                        entity.SetFieldValue("FinancialDocType", financialGroup.GetFieldValue<Guid>("FinancialDocType"));
                    else
                        throw new AfwException("نوع سند مالی انتخاب نشده است");
                }

                if (entity.GetFieldValue<Guid?>("OrganizationUnit") == null)
                {
                    var financialGroup = dbHelper.FetchSingleByID("cmn.FinancialGroup", entity.GetFieldValue<Guid>("FinancialGroup"), null);

                    if (financialGroup != null && financialGroup.GetFieldValue<Guid>("OrganizationUnit") != null)
                        entity.SetFieldValue("OrganizationUnit", financialGroup.GetFieldValue<Guid>("OrganizationUnit"));
                    else
                        throw new AfwException("واحد سازمانی انتخاب نشده است");
                }

                SetDocReferenceNo(entity);

                if (entity.GetFieldValue<Guid>("BalanceStatus") == balanceStatus && newDocStatus == notCheckedDocStatus)
                {
                    entity.SetFieldValue("DocStatus", checkedDocStatus);
                    entity.SetFieldValue("IsActive", true);
                    entity.SetFieldValue("RemainingAmount", 0);
                }
            }

            if (oldDocStatus != finalDocStatus && newDocStatus == finalDocStatus
                && !acc.Instance.IsInFinalizeDocs)
                throw new AfwException("امکان تغییر وضعیت سند به قطعی شده وجود ندارد.");

            if (oldDocStatus == finalDocStatus && newDocStatus != finalDocStatus
                && !acc.Instance.IsInMakeDocsTemporary)
                throw new AfwException("امکان تغییر وضعیت سند قطعی شده وجود ندارد.");

            if (oldDocStatus == finalDocStatus
                && !acc.Instance.IsInMakeDocsTemporary
                && !acc.Instance.IsTransferingDocs)
                throw new AfwException("امکان تغییر یا حذف سند قطعی شده وجود ندارد.");

            if (entity.ChangeStatus != EntityChangeTypes.None
                && !acc.Instance.IsInFinalizeDocs
                && !acc.Instance.IsInMakeDocsTemporary
                && !acc.Instance.IsTransferingDocs)
            {
                CheckFinalDocExistsAtDates(entity.GetFieldValue<Guid>("FinancialYear"),
                    entity.GetFieldValue<Guid>("FinancialDocType"),
                    entity.GetFieldValue<DateTime>("IssueDate"),
                    (oldAccDocEntity != null ? oldAccDocEntity.GetFieldValue<DateTime>("IssueDate") : null as DateTime?));
            }

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify))
            {
                if (entity.GetFieldValue<Guid?>("FinancialGroup") == null)
                    throw new AfwException("FinancialGroup is not set.(Check in OrgzanizationUnitSetting)");

                var userActiveFinancialYear = new FinancialYearBL().GetUserActiveFinancialYearEntity();
                var userActiveFinancialYearStartDate = userActiveFinancialYear.GetFieldValue<DateTime>("StartDate");
                var userActiveFinancialYearEndDate = userActiveFinancialYear.GetFieldValue<DateTime>("EndDate");

                if (entity.GetFieldValue<DateTime>("IssueDate") < userActiveFinancialYearStartDate
                    || entity.GetFieldValue<DateTime>("IssueDate") > userActiveFinancialYearEndDate)
                    throw new AfwException("تاریخ صدور سند خارج از محدوده سال مالی فعال است.");

                if (entity.GetFieldValue<Guid>("BalanceStatus") != balanceStatus
                    && newDocStatus != notCheckedDocStatus)
                {
                    throw new AfwException("امکان تغییر وضعیت سند شماره {0} بدلیل بالانس نبودن وجود ندارد.", entity.GetFieldValue<int>("DocNo"));
                }

                if (newDocStatus == approvedDocStatus
                    && (oldDocStatus == null || oldDocStatus != approvedDocStatus))
                    if (!PermissionHelper.UserHasPermissionToItem("acc.ApproveDoc"))
                        throw new AfwException("مجوز تصویب سند وجود ندارد.");
            }

            if (oldDocStatus == approvedDocStatus && !acc.Instance.IsInFinalizeDocs)
                if (!PermissionHelper.UserHasPermissionToItem("acc.ApproveDoc"))
                    throw new AfwException("امکان تغییر/حذف سند تصویب شده وجود ندارد. مجوز تصویب سند وجود ندارد.");

            if (entity.ChangeStatus == EntityChangeTypes.Modify)
            {
                if (entity.GetFieldValue<int>("DocNo") != oldAccDocEntity.GetFieldValue<int>("DocNo"))
                    throw new AfwException("امکان تغییر شماره مرجع سند وجود ندارد.");

                if (entity.GetFieldValue<Guid>("FinancialDocType") != oldAccDocEntity.GetFieldValue<Guid>("FinancialDocType"))
                    throw new AfwException("امکان تغییر نوع سند مالی وجود ندارد.");

                if (entity.GetFieldValue<Guid>("DocKind") != oldAccDocEntity.GetFieldValue<Guid>("DocKind"))
                    throw new AfwException("امکان تغییر نوع سند وجود ندارد.");

                if (entity.GetFieldValue<Guid>("FinancialYear") != oldAccDocEntity.GetFieldValue<Guid>("FinancialYear"))
                    throw new AfwException("امکان تغییر سال مالی سند وجود ندارد.");

                if (entity.GetFieldValue<Guid?>("FinancialDocType") == null)
                    throw new AfwException("نوع سند مالی انتخاب نشده است");

                if (entity.GetFieldValue<Guid?>("OrganizationUnit") == null)
                    throw new AfwException("واحد سازمانی انتخاب نشده است");

                if (oldDocStatus != newDocStatus)
                {
                    if ((oldDocStatus == finalDocStatus && (newDocStatus != checkedDocStatus))
                        || (oldDocStatus == approvedDocStatus && !newDocStatus.IsIn(checkedDocStatus, finalDocStatus)))
                    {
                        throw new AfwException("خطا در تغییر وضعیت سند شماره '{0}' : تغییر وضعیت از '{1}' به '{2}' مجاز نیست.",
                            entity.GetFieldValue<int>("DocNo"),
                            OptionSetHelper.GetOptionSetItemTitle((Guid)oldDocStatus),
                            OptionSetHelper.GetOptionSetItemTitle(newDocStatus));
                    }
                }

                if (newDocStatus == finalDocStatus && oldDocStatus == finalDocStatus && !acc.Instance.IsTransferingDocs)//هنگام قطعی شدن سند
                    throw new AfwException("امکان تغییر سند شماره {0} وجود ندارد.\r\nاین سند در وضعیت قطعی شده می باشد.",
                        entity.GetFieldValue<int>("DocNo"));

                if (newDocStatus == finalDocStatus && oldDocStatus != finalDocStatus)//هنگام قطعی شدن سند
                {
                    var foundDocs = dbHelper.FetchMultiple("acc.AccDoc",
                       string.Format("FinancialYear = '{0}' and FinancialDocType = '{1}' and DocStatus = '{2}' and IssueDate > '{3}'",
                           entity.GetFieldValue<Guid>("FinancialYear"),
                           entity.GetFieldValue<Guid>("FinancialDocType"),
                           finalDocStatus,
                           entity.GetFieldValue<DateTime>("IssueDate")), null, 1, 1, null);
                    if (foundDocs.Entities.Count > 0)
                    {
                        throw new AfwException("امکان قطعی نمودن سند شماره {0} وجود ندارد.\r\nسند شماره {1} در وضعیت قطعی، بعد از تاریخ این سند وجود دارد.",
                            entity.GetFieldValue<int>("DocNo"), foundDocs.Entities[0].GetFieldValue<int>("DocNo"));
                    }

                    foundDocs = dbHelper.FetchMultiple("acc.AccDoc",
                        string.Format("FinancialYear = '{0}' and FinancialDocType = '{1}' and DocStatus <> '{2}' and IssueDate < '{3}'",
                            entity.GetFieldValue<Guid>("FinancialYear"),
                            entity.GetFieldValue<Guid>("FinancialDocType"),
                            finalDocStatus,
                            entity.GetFieldValue<DateTime>("IssueDate")), null, 1, 1, null);
                    if (foundDocs.Entities.Count > 0)
                    {
                        throw new AfwException("امکان قطعی نمودن سند شماره {0} وجود ندارد.\r\nسند شماره {1} در وضعیت غیر قطعی، قبل از تاریخ این سند وجود دارد.",
                            entity.GetFieldValue<int>("DocNo"), foundDocs.Entities[0].GetFieldValue<int>("DocNo"));
                    }

                    if (dbHelper.GetCount("acc.AccDocItem",
                        string.Format("AccDoc = '{0}' and IsActive = 0", entity.GetFieldValue<Guid>("ID"))) > 0)
                        throw new AfwException("امکان قطعی نمودن سند شماره {0} وجود ندارد.\r\nآیتم غیر فعال در سند وجود دارد.",
                            entity.GetFieldValue<int>("DocNo"));
                }

                if (entity.GetFieldValue<bool>("IsTransferred") && !oldAccDocEntity.GetFieldValue<bool>("IsTransferred"))//هنگام انتقال سند
                {
                    if (oldDocStatus != finalDocStatus)
                        throw new AfwException("امکان انتقال سند شماره {0} وجود ندارد.\r\nاین سند در وضعیت غیر قطعی می باشد.",
                            entity.GetFieldValue<int>("DocNo"));

                    if (entity.GetFieldValue<Guid>("FinancialDocType") != OptionSetHelper.GetOptionSetItemID("cmn.FinancialDocType", "Main"))
                        throw new AfwException("امکان انتقال سند شماره {0} وجود ندارد.\r\nتنها امکان انتقال اسناد اصلی وجود دارد.",
                            entity.GetFieldValue<int>("DocNo"));

                    var foundDocs = dbHelper.FetchMultiple("acc.AccDoc",
                       string.Format("FinancialYear = '{0}' and FinancialDocType = '{1}' and IsTransferred = 1 and IssueDate > '{2}'",
                           entity.GetFieldValue<Guid>("FinancialYear"),
                           entity.GetFieldValue<Guid>("FinancialDocType"),
                           entity.GetFieldValue<DateTime>("IssueDate")), null, 1, 1, null);
                    if (foundDocs.Entities.Count > 0)
                    {
                        throw new AfwException("امکان انتقال سند شماره {0} وجود ندارد.\r\nسند شماره {1} در وضعیت منتقل شده، بعد از تاریخ این سند وجود دارد.",
                            entity.GetFieldValue<int>("DocNo"), foundDocs.Entities[0].GetFieldValue<int>("DocNo"));
                    }

                    //foundDocs = dbHelper.FetchMultiple("acc.AccDoc",
                    //    string.Format("FinancialYear = '{0}' and FinancialDocType = '{1}' and IsTransferred = 0 and IssueDate < '{2}'",
                    //        entity.GetFieldValue<Guid>("FinancialYear"),
                    //        entity.GetFieldValue<Guid>("FinancialDocType"),
                    //        entity.GetFieldValue<DateTime>("IssueDate")), null, 1, 1, null);
                    //if (foundDocs.Entities.Count > 0)
                    //{
                    //    throw new AfwException("امکان انتقال سند شماره {0} وجود ندارد.\r\nسند شماره {1} در وضعیت منتقل نشده، قبل از تاریخ این سند وجود دارد.",
                    //        entity.GetFieldValue<int>("DocNo"), foundDocs.Entities[0].GetFieldValue<int>("DocNo"));
                    //}
                }
            }
        }

        public override void AfterApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.AfterApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus == EntityChangeTypes.Delete)
            {
                Guid financialDocTypeID = Guid.Empty;

                if (entity.FieldExists("FinancialDocType"))
                    financialDocTypeID = entity.GetFieldValue<Guid>("FinancialDocType");
                else if (entity.FieldExists("FinancialGroup"))
                {
                    financialDocTypeID = dbHelper.FetchSingleByID("cmn.FinancialGroup", entity.GetFieldValue<Guid>("FinancialGroup"), null)
                        .GetFieldValue<Guid>("FinancialDocType");
                }

                var deletedAccDocInfo = dbHelper.CreateNewEntity("acc.DeletedAccDocInfo");
                deletedAccDocInfo.SetFieldValue("DocReferenceNo", entity.GetFieldValue<decimal>("DocNo"));
                deletedAccDocInfo.SetFieldValue("DocFinalNumber", entity.GetFieldValue<decimal?>("FinalNumber"));
                deletedAccDocInfo.SetFieldValue("FinancialYear", entity.GetFieldValue<Guid>("FinancialYear"));
                deletedAccDocInfo.SetFieldValue("FinancialDocType", financialDocTypeID);
                dbHelper.InsertEntity(deletedAccDocInfo);
            }

            if (entity.ChangeStatus != EntityChangeTypes.Delete)
            {
                if (entity.FieldExists("AccDocItems") && entity.GetFieldValue<EntityList>("AccDocItems") != null)
                {
                    for (var i = 0; i < entity.GetFieldValue<EntityList>("AccDocItems").Entities.Count; i++)
                    {
                        var docItem = entity.GetFieldValue<EntityList>("AccDocItems").Entities[i];

                        if (docItem.GetFieldValue<Guid?>("Account") == null)
                            docItem.ChangeStatus = "None";
                    }

                    dbHelper.ApplyChanges(entity.GetFieldValue<EntityList>("AccDocItems"));
                }
            }
        }

        public void InsertOrUpdateAccDocMaster(ref Guid? accDocID, string docKindName, DateTime issueDate, Guid financialYear, Guid financialGroup, string desc, bool isAutoGenerated)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            if (accDocID == null)
            {
                var balanceStatusID = OptionSetHelper.GetOptionSetItemID("acc.BalanceStatus", "Balance");
                var docStatusID = OptionSetHelper.GetOptionSetItemID("acc.DocStatus", "NotChecked");

                var financialDocTypeID = dbHelper.FetchSingleByID("cmn.FinancialGroup", financialGroup, null)
                    .GetFieldValue<Guid>("FinancialDocType");

                var docKindID = new DocKindBL().GetDocKindID(docKindName);

                var entity = dbHelper.CreateNewEntity("acc.AccDoc");
                entity.SetFieldValue("IssueDate", issueDate);
                entity.SetFieldValue("FinancialYear", financialYear);
                entity.SetFieldValue("FinancialGroup", financialGroup);
                entity.SetFieldValue("FinancialDocType", financialDocTypeID);
                entity.SetFieldValue("DocKind", docKindID);
                entity.SetFieldValue("IsAutoGenerated", isAutoGenerated);
                entity.SetFieldValue("BalanceStatus", balanceStatusID);
                entity.SetFieldValue("DocStatus", docStatusID);
                entity.SetFieldValue("RemainingAmount", 0);
                entity.SetFieldValue("IsActive", 1);
                entity.SetFieldValue("IsTransferred", 0);
                entity.SetFieldValue("Description", desc);
                entity.SetFieldValue("IsTransferred", false);
                dbHelper.ApplyChanges(entity);

                accDocID = entity.GetFieldValue<Guid>("ID");

            }
            else
            {
                var fetchedEntity = dbHelper.FetchSingleByID("acc.AccDoc", (Guid)accDocID, null);
                if (OptionSetHelper.GetOptionSetItemName(fetchedEntity.GetFieldValue<Guid>("DocStatus")) != "Final")
                {
                    fetchedEntity.SetFieldValue("IssueDate", issueDate);
                    fetchedEntity.SetFieldValue("FinancialYear", financialYear);
                    fetchedEntity.SetFieldValue("FinancialGroup", financialGroup);
                    fetchedEntity.SetFieldValue("Description", desc);
                    fetchedEntity.ChangeStatus = "Modify";
                    dbHelper.ApplyChanges(fetchedEntity);
                }
            }

        }

        public void InsertAccDocMaster(ref Guid? accDocID, string docKindName, DateTime issueDate, Guid financialYear, Guid financialDocType, Guid organizationUnit, string desc, bool isAutoGenerate)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var balanceStatusID = OptionSetHelper.GetOptionSetItemID("acc.BalanceStatus", "Balance");
            var docStatusID = OptionSetHelper.GetOptionSetItemID("acc.DocStatus", "NotChecked");
            var docKindID = new DocKindBL().GetDocKindID(docKindName);
            var financialGroupID = cmn.Instance.GetFinancialGroupID(organizationUnit, financialYear, financialDocType);
            //var existedAccDocEntity = dbHelper.FetchSingle("acc.AccDoc",
            //    string.Format("FinancialYear = '{0}'", financialYear), null);

            var entity = dbHelper.CreateNewEntity("acc.AccDoc");
            entity.SetFieldValue("IssueDate", issueDate);
            entity.SetFieldValue("FinancialYear", financialYear);
            entity.SetFieldValue("OrganizationUnit", organizationUnit);
            entity.SetFieldValue("FinancialDocType", financialDocType);
            entity.SetFieldValue("FinancialGroup", financialGroupID);
            entity.SetFieldValue("DocKind", docKindID);
            entity.SetFieldValue("IsAutoGenerated", isAutoGenerate);
            entity.SetFieldValue("DocNo", 0);
            entity.SetFieldValue("BalanceStatus", balanceStatusID);
            entity.SetFieldValue("DocStatus", docStatusID);
            entity.SetFieldValue("RemainingAmount", 0);
            entity.SetFieldValue("IsActive", 1);
            entity.SetFieldValue("Description", desc);
            entity.SetFieldValue("IsTransferred", false);

            dbHelper.ApplyChanges(entity);

            accDocID = entity.GetFieldValue<Guid>("ID");
        }

        public void UpdateAccDocMasterBalanceStatus(Guid accDocID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var debtorAndCreditorSum = acc.Instance.GetDebtorAndCreditorSum(accDocID);            
            var debtorAmountSum = debtorAndCreditorSum.GetFieldValue<decimal>("DebtorAmountSum");
            var creditorAmountSum = debtorAndCreditorSum.GetFieldValue<decimal>("CreditorAmountSum");

            var accDocEntity = dbHelper.FetchSingleByID("acc.AccDoc", accDocID, null);
            
            if(debtorAmountSum < creditorAmountSum)
            {
                if (accDocEntity.GetFieldValue<bool>("IsAutoGenerated"))
                    throw new AfwException("Auto Generated AccDoc DocNo:{0} and DocKind :{1} isn't balance." ,
                        accDocEntity.GetFieldValue<int>("DocNo"), acc.Instance.GetDocKindName(accDocEntity.GetFieldValue<Guid>("DocKind")));

                accDocEntity.SetFieldValue("BalanceStatus", OptionSetHelper.GetOptionSetItemID("acc.BalanceStatus", "Creditor"));
                accDocEntity.SetFieldValue("DocStatus", OptionSetHelper.GetOptionSetItemID("acc.DocStatus", "NotChecked"));
                accDocEntity.SetFieldValue("RemainingAmount", debtorAmountSum - creditorAmountSum);                
            }
            else if (debtorAmountSum > creditorAmountSum)
            {
                if (accDocEntity.GetFieldValue<bool>("IsAutoGenerated"))
                    throw new AfwException("Auto Generated AccDoc DocNo:{0} and DocKind :{1} isn't balance.",
                        accDocEntity.GetFieldValue<int>("DocNo"), acc.Instance.GetDocKindName(accDocEntity.GetFieldValue<Guid>("DocKind")));

                accDocEntity.SetFieldValue("BalanceStatus", OptionSetHelper.GetOptionSetItemID("acc.BalanceStatus", "Debtor"));
                accDocEntity.SetFieldValue("DocStatus", OptionSetHelper.GetOptionSetItemID("acc.DocStatus", "NotChecked"));
                accDocEntity.SetFieldValue("RemainingAmount", debtorAmountSum - creditorAmountSum);
            }
            else
            {
                accDocEntity.SetFieldValue("BalanceStatus", OptionSetHelper.GetOptionSetItemID("acc.BalanceStatus", "Balance"));
                accDocEntity.SetFieldValue("DocStatus", OptionSetHelper.GetOptionSetItemID("acc.DocStatus", "Checked"));
                accDocEntity.SetFieldValue("RemainingAmount", 0);            
            }

            dbHelper.ApplyChanges(accDocEntity);
        }

        public void DeleteAccDoc(Guid? accDocID, string docKindEntityFullName, string opFieldNameInItemEntity, Guid opID)
        {
            if (accDocID == null)
                return;

            var dbHelper = CoreComponent.Instance.MainDbHelper;

            using (var tranManager = new DbTransactionManager(dbHelper))
            {
                try
                {
                    acc.Instance.DeleteAccDocItems(accDocID, opFieldNameInItemEntity, opID);

                    DeleteAccDocMaster(accDocID, docKindEntityFullName, opID);

                    tranManager.Commit();
                }
                catch (Exception ex)
                {
                    throw new Exception("خطا در حذف سند حسابداری.\r\n" + ex.Message);
                }
            }
        }

        public void DeleteAccDocMaster(Guid? accDocID, string docKindEntityFullName, Guid opID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            if (accDocID == null)
                return;

            using (var tranManager = new DbTransactionManager(dbHelper))
            {
                try
                {
                    var opEntity = dbHelper.FetchSingleByID(docKindEntityFullName, opID, null);
                    if (opEntity != null)
                    {
                        opEntity.SetFieldValue("AccDoc", null);
                        dbHelper.UpdateEntity(opEntity);
                    }

                    var accDocItemList = dbHelper.FetchMultipleBySqlQuery(
                        string.Format(@"
                                select * 
                                from acc_AccDocItems 
                                where AccDoc = '{0}'", accDocID));
                    if (accDocItemList.Entities.Count == 0)
                    {
                        var fetchedEntity = dbHelper.FetchSingleByID("acc.AccDoc", (Guid)accDocID, null);
                        dbHelper.DeleteEntity(fetchedEntity);
                    }

                    tranManager.Commit();
                }
                catch (Exception ex)
                {
                    throw new Exception("خطا در عملیات ثبت نهایی.\r\n" + ex.Message, ex);
                }
            }
        }

        public void CheckFinalDocExistsAtDates(Guid financialYearID, Guid FinancialDocTypeID, DateTime date, DateTime? date2)
        {
            var lastFinalDocDate = GetLastFinalDocDate(financialYearID, FinancialDocTypeID);

            if (lastFinalDocDate != null
                && (date < lastFinalDocDate || (date2 != null && date2 < lastFinalDocDate)))
            {
                throw new AfwException("امکان انجام عملیات بدلیل وجود سند قطعی وجود ندارد.");
            }
        }

        public DateTime? GetLastFinalDocDate(Guid financialYearID, Guid financialDocTypeID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var sqlQuery = string.Format(@"
                select max(Issuedate)
                from acc_AccDocs
                where FinancialYear = '{0}' and FinancialDocType = '{1}' and DocStatus = '{2}'",
                financialYearID, financialDocTypeID, OptionSetHelper.GetOptionSetItemID("acc.DocStatus", "Final"));

            return dbHelper.AdoDbHelper.ExecuteScalar<DateTime?>(sqlQuery);
        }

        public EntityList GetCountingItems(string filterExpresstion)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            EntityList countingItems = new EntityList();
            Entity tankhah = new Entity();

            tankhah.FieldValues.Add("RowNumber", 1);
            tankhah.FieldValues.Add("OperationType", "Tankhah");
            tankhah.FieldValues.Add("OperationTypeText", "تنخواه گردان");

            var tankhahCounts = dbHelper.FetchSingleBySqlQuery(string.Format("select count(ID) Count from rp_Tankhahha Tankhah {0} ", string.IsNullOrEmpty(filterExpresstion) ? "" : "where " + filterExpresstion)).GetFieldValue<int>("Count");
            tankhah.FieldValues.Add("Quantity", tankhahCounts);

            Entity financialDeclaration = new Entity();

            financialDeclaration.FieldValues.Add("RowNumber", 2);
            financialDeclaration.FieldValues.Add("OperationType", "FinancialDeclaration");
            financialDeclaration.FieldValues.Add("OperationTypeText", "اعلامیه مالی");

            var financialDeclarationCounts = dbHelper.FetchSingleBySqlQuery(string.Format("select count(ID) Count from cc_RecordFinancialDeclarations FinancialDeclaration {0} ", string.IsNullOrEmpty(filterExpresstion) ? "" : "where " + filterExpresstion)).GetFieldValue<int>("Count");
            financialDeclaration.FieldValues.Add("Quantity", financialDeclarationCounts);

            countingItems.Entities.Add(tankhah);
            countingItems.Entities.Add(financialDeclaration);
            return countingItems;
        }

        public EntityList GetOperations(string operarionType, Guid financialYear, string filterExpresstion)
        {
            using (var dbHelper = DbHelperFactory.CreateMainDbEntityDbHelper())
            {
                var operations = new EntityList();

                if (operarionType == "Tankhah")
                {
                    operations = dbHelper.FetchMultipleBySqlQuery(string.Format(
                        @"select Tankhah.ID, afw.GregorianToPersian(Tankhah.CreationTime) CreationTime, 
                            Tankhah.TankhahNo RowNumber, afw.GregorianToPersian(Tankhah.IssueDate) IssueDate, 
                            Customer.FullName CustomerName, Tankhah.Description,
                            OrganizationUnit.Name OrganizationUnitName,
	                        FinancialDocType.Title FinancialDocTypeTitle,	                        
                            isnull(SystemUser.Name, SystemUser.UserName) User_Text, AccDoc.DocNo, Tankhah.AccDoc
                          from rp_Tankhahha Tankhah
                          	inner join dbo.cmn_PersonsLookUpView Customer on Customer.ID = Tankhah.Person
							left join afw_OptionSetItems FinancialDocType on Tankhah.FinancialDocType = FinancialDocType.ID
	                        left join cmn_OrganizationInformations OrganizationUnit on Tankhah.OrganizationUnit = OrganizationUnit.ID
	                        left join afw_SystemUsers SystemUser on SystemUser.ID = Tankhah.CreatorUser
							left join acc_AccDocs AccDoc on AccDoc.ID = Tankhah.AccDoc 
                          where Tankhah.FinancialYear = '{0}' {1}
                          order by RowNumber", financialYear, string.IsNullOrEmpty(filterExpresstion) ? "" : "and " + filterExpresstion));
                }
                else if (operarionType == "FinancialDeclaration")
                {
                    operations = dbHelper.FetchMultipleBySqlQuery(string.Format(
                        @"select FinancialDeclaration.ID, 
	                        row_number() over (order by FinancialDeclaration.IssueDate) RowNumber,
	                        afw.GregorianToPersian(FinancialDeclaration.CreationTime) CreationTime, 
	                        afw.GregorianToPersian(FinancialDeclaration.IssueDate) IssueDate, 
	                        '' CustomerName, '' Description,
                            OrganizationUnit.Name OrganizationUnitName,
	                        FinancialDocType.Title FinancialDocTypeTitle,
	                        isnull(SystemUser.Name, SystemUser.UserName) User_Text, 
	                        AccDoc.DocNo, FinancialDeclaration.AccDoc
                        from cc_RecordFinancialDeclarations FinancialDeclaration
	                        left join afw_OptionSetItems FinancialDocType on FinancialDeclaration.FinancialDocType = FinancialDocType.ID
	                        left join cmn_OrganizationInformations OrganizationUnit on FinancialDeclaration.OrganizationUnit = OrganizationUnit.ID
	                        left join afw_SystemUsers SystemUser on SystemUser.ID = FinancialDeclaration.CreatorUser
	                        left join acc_AccDocs AccDoc on AccDoc.ID = FinancialDeclaration.AccDoc 
                        where FinancialDeclaration.FinancialYear = '{0}' {1}
                        order by RowNumber", financialYear, string.IsNullOrEmpty(filterExpresstion) ? "" : "and " + filterExpresstion));
                }
                else if (operarionType == "Request")
                {
                    operations = dbHelper.FetchMultipleBySqlQuery(string.Format(
                        @"select ConfirmedRequest.ID, afw.GregorianToPersian(ConfirmedRequest.CreationTime) CreationTime,
                            ConfirmedRequest.RequestNumber RowNumber, afw.GregorianToPersian(ConfirmedRequest.RegisterDate) IssueDate,
                            Customer.FullName CustomerName, ConfirmedRequest.Notes Description, 
                            isnull(SystemUser.Name, SystemUser.UserName) User_Text
                          from cdis_ConfirmedSalesRequests ConfirmedRequest
                          	inner join dbo.cmn_PersonsLookUpView Customer on Customer.ID = ConfirmedRequest.Customer
							inner join afw_SystemUsers SystemUser on SystemUser.ID = ConfirmedRequest.CreatorUser  
                          where ConfirmedRequest.FinancialYear = '{0}'", financialYear));
                }
                else if (operarionType == "AmaniRequest")
                {
                    operations = dbHelper.FetchMultipleBySqlQuery(string.Format(
                        @"select StuffRequest.ID, afw.GregorianToPersian(StuffRequest.CreationTime) CreationTime, 
                            StuffRequest.StuffRequestNumber RowNumber, afw.GregorianToPersian(StuffRequest.IssueDate) IssueDate, 
                            Customer.FullName CustomerName, StuffRequest.Description,
                            isnull(SystemUser.Name, SystemUser.UserName) User_Text
                          from ps_StuffRequests StuffRequest
                          	inner join dbo.cmn_PersonsLookUpView Customer on Customer.ID = StuffRequest.Customer
							inner join afw_SystemUsers SystemUser on SystemUser.ID = StuffRequest.CreatorUser  
							inner join ps_RequestTypes RequestType on RequestType.ID = StuffRequest.RequestType
                          where RequestType.Name = 'AmaniRequest' and StuffRequest.FinancialYear = '{0}'", financialYear));
                }
                else if (operarionType == "ConsumableRequest")
                {
                    operations = dbHelper.FetchMultipleBySqlQuery(string.Format(
                        @"select StuffRequest.ID, afw.GregorianToPersian(StuffRequest.CreationTime) CreationTime, 
                            StuffRequest.StuffRequestNumber RowNumber, afw.GregorianToPersian(StuffRequest.IssueDate) IssueDate, 
                            Customer.FullName CustomerName, StuffRequest.Description,
                            isnull(SystemUser.Name, SystemUser.UserName) User_Text
                          from ps_StuffRequests StuffRequest
                          	inner join dbo.cmn_PersonsLookUpView Customer on Customer.ID = StuffRequest.Customer
							inner join afw_SystemUsers SystemUser on SystemUser.ID = StuffRequest.CreatorUser  
							inner join ps_RequestTypes RequestType on RequestType.ID = StuffRequest.RequestType
                          where RequestType.Name = 'ConsumableRequest' and StuffRequest.FinancialYear = '{0}'", financialYear));
                }
                return operations;
            }
        }

        public void FinalizeDocs(Guid financialYearID, Guid financialDocTypeID, DateTime toIssueDate, int toDocReferenceNo)
        {
            acc.Instance.IsInFinalizeDocs = true;
            try
            {
                var dbHelper = CoreComponent.Instance.MainDbHelper;

                var accDocExists = dbHelper.EntityExists("acc.AccDoc", string.Format(@"
                    FinancialDocType = '{0}'
                    and FinancialYear = '{1}'
                    and IssueDate = '{2}' 
                    and DocNo = {3}",
                    financialDocTypeID,
                    financialYearID,
                    toIssueDate,
                    toDocReferenceNo));

                if (!accDocExists)
                    throw new Exception("acc doc not exists.");

                var filterExpression = string.Format(@"
                    FinancialDocType = '{0}'
                    and FinancialYear = '{1}' 
                    and DocStatus <> '{2}'
                    and (IssueDate < '{3}' 
                        or (IssueDate = '{3}' and DocNo <= {4}))",
                    financialDocTypeID,
                    financialYearID,
                    OptionSetHelper.GetOptionSetItemID("acc.DocStatus", "Final"),
                    toIssueDate,
                    toDocReferenceNo);

                using (var tranManager = new DbTransactionManager(dbHelper))
                {
                    var accDocsList = dbHelper.FetchMultiple("acc.AccDoc", filterExpression, "IssueDate, DocNo", null, null, null);
                    var nextFinalNumber = GetNextFinalNumber(financialYearID, financialDocTypeID);
                    var finalStatusID = OptionSetHelper.GetOptionSetItemID("acc.DocStatus", "Final");

                    for (int i = 0; i < accDocsList.Entities.Count; i++)
                    {
                        accDocsList.Entities[i].SetFieldValue("DocStatus", finalStatusID);
                        accDocsList.Entities[i].SetFieldValue("FinalNumber", nextFinalNumber);
                        accDocsList.Entities[i].ChangeStatus = EntityChangeTypes.Modify;

                        nextFinalNumber++;
                    }

                    dbHelper.ApplyChanges(accDocsList);
                    tranManager.Commit();
                }
            }
            finally
            {
                acc.Instance.IsInFinalizeDocs = false;
            }
        }

        public void MakeDocsTemporary(Guid financialYearID, Guid financialDocTypeID, DateTime toIssueDate, int toDocReferenceNo)
        {
            acc.Instance.IsInMakeDocsTemporary = true;
            try
            {
                var dbHelper = CoreComponent.Instance.MainDbHelper;

                var accDocExists = dbHelper.EntityExists("acc.AccDoc", string.Format(@"
                    FinancialDocType = '{0}'
                    and FinancialYear = '{1}'
                    and IssueDate = '{2}' 
                    and DocNo = {3}",
                    financialDocTypeID,
                    financialYearID,
                    toIssueDate,
                    toDocReferenceNo));

                if (!accDocExists)
                    throw new Exception("acc doc not exists.");

                var filterExpression = string.Format(@"
                    FinancialDocType = '{0}'
                    and FinancialYear = '{1}' 
                    and DocStatus = '{2}'
                    and (IssueDate > '{3}' 
                        or (IssueDate = '{3}' and DocNo >= {4}))",
                    financialDocTypeID,
                    financialYearID,
                    OptionSetHelper.GetOptionSetItemID("acc.DocStatus", "Final"),
                    toIssueDate,
                    toDocReferenceNo);

                using (var tranManager = new DbTransactionManager(dbHelper))
                {
                    var accDocsList = dbHelper.FetchMultiple("acc.AccDoc", filterExpression, "IssueDate, DocNo", null, null, null);
                    var checkedDocStatus = OptionSetHelper.GetOptionSetItemID("acc.DocStatus", "Checked");

                    for (int i = 0; i < accDocsList.Entities.Count; i++)
                    {
                        accDocsList.Entities[i].SetFieldValue("DocStatus", checkedDocStatus);
                        accDocsList.Entities[i].SetFieldValue("FinalNumber", null);
                        accDocsList.Entities[i].ChangeStatus = EntityChangeTypes.Modify;
                    }

                    dbHelper.ApplyChanges(accDocsList);
                    tranManager.Commit();
                }
            }
            finally
            {
                acc.Instance.IsInMakeDocsTemporary = false;
            }
        }

        public void TransferAccDocs(Guid financialYearID, Guid financialDocTypeID, DateTime toIssueDate, int toDocReferenceNo, Guid transferDatabaseID)
        {
            acc.Instance.IsTransferingDocs = true;
            try
            {
                var dbHelper = CoreComponent.Instance.MainDbHelper;

                var destinationDatabase = dbHelper.FetchSingleByID("cmn.TransferDatabase", transferDatabaseID, null);
                if (destinationDatabase == null)
                    throw new Exception("Destination database not exists!");

                var destinationDatabaseName = destinationDatabase.GetFieldValue<string>("Name");

                var currentDatabaseVersion = dbHelper.FetchMultiple("afw_InstalledUpgradePackagesView",
                    null, "ComparableVersionNumber desc", 1, 1, null);
                var destinationDatabaseVersion = dbHelper.FetchMultiple(destinationDatabaseName + ".dbo.afw_InstalledUpgradePackagesView",
                    null, "ComparableVersionNumber desc", 1, 1, null);

                if (currentDatabaseVersion.Entities[0].GetFieldValue<string>("VersionNumber") !=
                    destinationDatabaseVersion.Entities[0].GetFieldValue<string>("VersionNumber"))
                    throw new Exception("نسخه دیتابیس مقصد با دیتابیس مبدا یکسان نیست");

                var accDocExists = dbHelper.EntityExists("acc.AccDoc", string.Format(@"
                    FinancialYear = '{0}' 
                    and FinancialDocType = '{1}'
                    and IssueDate = '{2}'
                    and DocNo = {3}", 
                    financialYearID, 
                    financialDocTypeID, 
                    toIssueDate,
                    toDocReferenceNo));

                if (!accDocExists)
                    throw new Exception("Acc doc not exists!");

                var filterExpression = string.Format(@"
                    FinancialYear = '{0}' 
                    and FinancialDocType = '{1}' 
                    and DocStatus = '{2}' 
                    and IsTransferred = 0
                    and (IssueDate < '{3}' 
                        or (IssueDate = '{3}' and DocNo <= {4})) ",
                    financialYearID,
                    financialDocTypeID,
                    OptionSetHelper.GetOptionSetItemID("acc.DocStatus", "Final"),
                    toIssueDate,
                    toDocReferenceNo);

                var lastTransferedAccDocEntityList =
                    dbHelper.FetchMultiple("acc.AccDoc",
                        string.Format(@"
                            FinancialYear = '{0}' 
                            and FinancialDocType = '{1}' 
                            and DocStatus = '{2}' 
                            and IsTransferred = 1",
                            financialYearID,
                            financialDocTypeID,
                            OptionSetHelper.GetOptionSetItemID("acc.DocStatus", "Final")),
                        "IssueDate desc, DocNo desc", 0, 1, null);

                if (lastTransferedAccDocEntityList.Entities.Count != 0)
                {
                    filterExpression += string.Format(@"
                        and (IssueDate > '{0}' 
                            or (IssueDate = '{0}' and DocNo > {1}))",
                        lastTransferedAccDocEntityList.Entities[0].GetFieldValue<DateTime>("IssueDate"),
                        lastTransferedAccDocEntityList.Entities[0].GetFieldValue<int>("DocNo"));
                }

                var accDocsList = dbHelper.FetchMultiple("acc.AccDoc", filterExpression, "IssueDate, DocNo", null, null, null);
                var accDocEntityDefID = CoreComponent.Instance.GetEntityDef("acc.AccDoc").GetFieldValue<Guid>("ID");

                for (int i = 0; i < accDocsList.Entities.Count; i++)
                {
                    using (var tranManager = new DbTransactionManager(dbHelper))
                    {
                        var accDocID = accDocsList.Entities[i].GetFieldValue<Guid>("ID");
                        var accDoc = dbHelper.FetchSingleByID("acc.AccDoc", accDocID, null);//دریافت مجدد رکورد تا مطمئن شویم تغییر نکرده

                        if (accDoc.GetFieldValue<bool>("IsTransferred"))
                            throw new AfwException("مشکل در انتقال سند حسابداری با شماره مرجع {0}. این سند قبلا منتقل شده است.",
                                accDoc.GetFieldValue<int>("DocNo"));

                        cmn.Instance.ExportEntityRecursive(accDocEntityDefID, accDocID, destinationDatabaseName);

                        accDocsList.Entities[i].SetFieldValue("IsTransferred", true);
                        accDocsList.Entities[i].SetFieldValue("TransferDatabase", transferDatabaseID);
                        dbHelper.UpdateEntity(accDocsList.Entities[i]);

                        CoreComponent.Instance.ChangeLogManager.LoggingIsEnabled = false;
                        try
                        {
                            dbHelper.AdoDbHelper.ExecuteNonQuery(string.Format(@"
                                update {0}.dbo.acc_AccDocs
                                set IsTransferred = 0, TransferDatabase = null
                                where ID = '{1}'",
                                destinationDatabaseName, accDocID));
                        }
                        finally
                        {
                            CoreComponent.Instance.ChangeLogManager.LoggingIsEnabled = true;
                        }

                        tranManager.Commit();
                    }
                }
            }
            catch (Exception ex)
            {
                throw new AfwException("خطا در عملیات انتقال اسناد حسابداری.\r\n" + ex.Message, ex);
            }
            finally
            {
                acc.Instance.IsTransferingDocs = false;
            }
        }

        private int GetNewDocReferenceNo(Guid financialYearID, Guid financialDocType)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            int? docReferenceNo = cmn.Instance.GetFieldMaxIntValue("DocNo", "acc_AccDocs",
                    string.Format("FinancialYear = '{0}' and FinancialDocType = '{1}'", financialYearID, financialDocType));

            if (docReferenceNo != 0)           
                docReferenceNo += 1;
            else
            {
                if (financialDocType == OptionSetHelper.GetOptionSetItemID("cmn.FinancialDocType", "Main"))
                    docReferenceNo = GetFinancialYear(financialYearID).GetFieldValue<int?>("AccSetting_ShomareShorooeAsnadeMovaghateAsli");
                else
                    docReferenceNo = GetFinancialYear(financialYearID).GetFieldValue<int?>("AccSetting_ShomareShorooeAsnadeMovaghatePishnevis");

                if (docReferenceNo == null)
                    docReferenceNo = 1;
            }


            while (true)
            {
                var deletedAccDocInfoExists = dbHelper.EntityExists("acc.DeletedAccDocInfo",
                    string.Format(@"FinancialYear = '{0}' and FinancialDocType = '{1}' and DocReferenceNo = {2}",
                        financialYearID,
                        financialDocType,
                        docReferenceNo));

                if (deletedAccDocInfoExists)
                    docReferenceNo += 1;
                else
                    break;
            }

            return (int)docReferenceNo;
        }

        private int GetNextFinalNumber(Guid financialYearID, Guid? financialDocType)
        {
            var shomareDehieMojazaBeAsnadeGhateieAsli = GetFinancialYear(financialYearID).GetFieldValue<bool>("AccSetting_ShomareDehieMojazaBeAsnadeGhateieAsli");

            int? lastDocFinalNumber = null;

            if (shomareDehieMojazaBeAsnadeGhateieAsli)
            {
                if (financialDocType == null)
                    throw new AfwException("ShomareDehieMojazaBeAsnadeGhateieAsli is true but financialDocType is null!");

                lastDocFinalNumber = cmn.Instance.GetFieldMaxIntValue("FinalNumber", "acc_AccDocs",
                    String.Format("FinancialYear = '{0}' and FinancialDocType = '{1}'", financialYearID, financialDocType));
            }
            else
            {
                if (financialDocType != null)
                    throw new AfwException("ShomareDehieMojazaBeAsnadeGhateieAsli is false but financialDocType is not null!");

                lastDocFinalNumber = cmn.Instance.GetFieldMaxIntValue("FinalNumber", "acc_AccDocs",
                    String.Format("FinancialYear = '{0}'", financialYearID));
            }
            if (lastDocFinalNumber != null)
            {
                return (int)lastDocFinalNumber + 1;
            }
            else
            {
                int? finalNumber;

                if (shomareDehieMojazaBeAsnadeGhateieAsli)
                {
                    if (financialDocType == OptionSetHelper.GetOptionSetItemID("cmn.FinancialDocType", "Main"))
                        finalNumber = GetFinancialYear(financialYearID).GetFieldValue<int?>("AccSetting_ShomareShorooeAsnadeGhateieAsli");
                    else
                        finalNumber = GetFinancialYear(financialYearID).GetFieldValue<int?>("AccSetting_ShomareShorooeAsnadeGhateiePishnevis");
                }
                else
                {
                    finalNumber = GetFinancialYear(financialYearID).GetFieldValue<int?>("AccSetting_ShomareShorooeAsnadeGhatei");
                }

                if (finalNumber == null)
                    return 1;
                else
                    return (int)finalNumber;
            }
        }

        private Entity GetFinancialYear(Guid id)
        {
            if (_FinancialYears == null)
            {
                var dbHelper = CoreComponent.Instance.MainDbHelper;
                _FinancialYears = dbHelper.FetchMultiple("cmn.FinancialYear", null, null, null, null, null).Entities;
            }

            return _FinancialYears.First(o => o.GetFieldValue<Guid>("ID") == id);
        }

        private void SetDocReferenceNo(Entity accDoc)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            accDoc.SetFieldValue("DocNo",
                GetNewDocReferenceNo(accDoc.GetFieldValue<Guid>("FinancialYear"), accDoc.GetFieldValue<Guid>("FinancialDocType")));

            var redundantExists =
                dbHelper.EntityExists("acc.AccDoc",
                    string.Format("FinancialYear = '{0}' and FinancialDocType = '{1}' and DocNo = '{2}' and ID <> '{3}'",
                        accDoc.GetFieldValue<Guid>("FinancialYear"),
                        accDoc.GetFieldValue<Guid>("FinancialDocType"),
                        accDoc.GetFieldValue<int>("DocNo"),
                        accDoc.GetFieldValue<Guid>("ID")))
                || dbHelper.EntityExists("acc.DeletedAccDocInfo",
                    string.Format("FinancialYear = '{0}' and FinancialDocType = '{1}' and DocReferenceNo = '{2}'",
                        accDoc.GetFieldValue<Guid>("FinancialYear"),
                        accDoc.GetFieldValue<Guid>("FinancialDocType"),
                        accDoc.GetFieldValue<int>("DocNo")));

            if (redundantExists)
                throw new AfwException("شماره مرجع سند تکراری است.");
        }

        internal Entity CopyAccDoc(Guid sourceAccDocID, Entity destinationAccDocEntity, string[] ignoredFieldNames)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;
            
            Entity sourceAccDocEntity = dbHelper.FetchSingleByID("acc.AccDoc", sourceAccDocID, null);

            List<string> fieldNames = sourceAccDocEntity.FieldValues.Keys.ToList<string>();
            string[] logFieldNames = new string[] { "ID", "CreatorUser", "CreationTime", "LastModifierUser", "LastModifyTime", "OwnerUser", "DocNo"};

            foreach (var fieldName in fieldNames)
            {
                if (fieldName.IsIn(logFieldNames) || fieldName.IsIn(ignoredFieldNames))
                    continue;

                destinationAccDocEntity.FieldValues[fieldName] = sourceAccDocEntity.FieldValues[fieldName];
            }

            dbHelper.ApplyChanges(destinationAccDocEntity);
            
            EntityList accDocItems = dbHelper.FetchMultiple("acc.AccDocItem", String.Format("AccDoc = '{0}'", sourceAccDocID), null , null, null, null);

            for (int i = 0; i < accDocItems.Entities.Count; i++)
            {
                Entity newAccDocItem = dbHelper.CreateNewEntity("acc.AccDocItem");

                newAccDocItem.SetFieldValue("AccDoc", destinationAccDocEntity.GetFieldValue<Guid>("ID"));
                newAccDocItem.SetFieldValue("RowNo", accDocItems.Entities[i].GetFieldValue <int>("RowNo"));
                newAccDocItem.SetFieldValue("Account", accDocItems.Entities[i].GetFieldValue <Guid>("Account"));
                newAccDocItem.SetFieldValue("CreditorAmount", accDocItems.Entities[i].GetFieldValue <decimal>("CreditorAmount"));
                newAccDocItem.SetFieldValue("DebtorAmount", accDocItems.Entities[i].GetFieldValue<decimal>("DebtorAmount"));
                newAccDocItem.SetFieldValue("IsActive", accDocItems.Entities[i].GetFieldValue<bool>("IsActive"));

                newAccDocItem.SetFieldValue("OrganizationUnit", accDocItems.Entities[i].GetFieldValue<Guid?>("OrganizationUnit"));
                newAccDocItem.SetFieldValue("CostCenter", accDocItems.Entities[i].GetFieldValue<Guid?>("CostCenter"));
                newAccDocItem.SetFieldValue("Person", accDocItems.Entities[i].GetFieldValue<Guid?>("Person"));
                newAccDocItem.SetFieldValue("Project", accDocItems.Entities[i].GetFieldValue<Guid?>("Project"));
                newAccDocItem.SetFieldValue("ForeignCurrency", accDocItems.Entities[i].GetFieldValue<Guid?>("ForeignCurrency"));
                newAccDocItem.SetFieldValue("CurrencyCreditorRatio", accDocItems.Entities[i].GetFieldValue<decimal?>("CurrencyCreditorRatio"));
                newAccDocItem.SetFieldValue("CurrencyDebtorRatio", accDocItems.Entities[i].GetFieldValue<decimal?>("CurrencyDebtorRatio"));
                newAccDocItem.SetFieldValue("CurrencyAmount", accDocItems.Entities[i].GetFieldValue<decimal?>("CurrencyAmount"));
                newAccDocItem.SetFieldValue("Note", accDocItems.Entities[i].GetFieldValue<string>("Note"));
                
                dbHelper.ApplyChanges(newAccDocItem);
            }
            return destinationAccDocEntity;
        }
    }
}

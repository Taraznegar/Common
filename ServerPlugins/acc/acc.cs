using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Reflection;
using AppFramework.DataAccess;
using System.Diagnostics;
using AppFramework.Helpers;
using TarazNegarAppFrameworkPlugin.ServerPlugins;

namespace AppFramework.AppServer
{
    //acc subsystem class
    public class acc
    {
        public static EntityList AccountReview1;
        public bool IsInFinalizeDocs;
        public bool IsInMakeDocsTemporary;
        public bool IsTransferingDocs;

        public acc()
        {
            if (CoreComponent.Instance.SubsystemObjectExists("acc"))
                throw new AfwException("acc component is already created!");
        }

        public static acc Instance
        {
            get
            {
                return CoreComponent.Instance.GetSubsystemObject("acc") as acc;
            }
        }

        #region General Methods

        public int? GetAccountCodeMaxIntValue(string tableName, string parent, string year)
        {
            int? maxIntValue = null;
            using (var dbHelper = DbHelperFactory.CreateMainDbEntityDbHelper())
            {
                try
                {
                    string sqlQuery = string.Format(@"select isnull(max(cast(Code as int)), 0) MaxValue from {0}", tableName, parent, year);
                    if (!string.IsNullOrEmpty(parent))
                        sqlQuery += (" where parentAccount = '" + parent + "' ");
                    else if (parent == null)
                        sqlQuery += (" where parentAccount is null ");
                    if (!string.IsNullOrEmpty(year))
                        sqlQuery += (" and FinancialYear = '" + year + "' ");
                    else if (year == null)
                        sqlQuery += (" and FinancialYear is null");
                    maxIntValue = dbHelper.AdoDbHelper.ExecuteScalar<int?>(sqlQuery);
                }
                catch (Exception ex)
                {
                    throw new Exception("Error in GetAccountCodeMaxIntValue.", ex);
                }
            }

            return maxIntValue;
        }

        public Guid? GetTodayAccDoc(string docKindName, Guid financialDocTypeID, DateTime issueDate, Guid organizationUnitID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var docKindID = new DocKindBL().GetDocKindID(docKindName);

            var accDocs = dbHelper.FetchMultiple("acc.accDoc",
                string.Format("FinancialYear = '{0}' and DocKind = '{1}' and FinancialDocType = '{2}' and IssueDate = '{3}' and OrganizationUnit = '{4}'",
                    new FinancialYearBL().GetUserActiveFinancialYearID(), docKindID, financialDocTypeID, issueDate.ToString().Split(' ')[0], organizationUnitID),
                "DocNo", null, null, null).Entities;

            if (accDocs.Count > 1)
                throw new AfwException("بیش از یک سند حسابداری برای این عملیات در روز جاری ثبت شده است.");
            else if (accDocs.Count == 0)
                return null;
            else
                return accDocs[0].GetFieldValue<Guid?>("ID");
        }

        public int AccTestMethod(string param1)
        {
            using (var dbHelper = DbHelperFactory.CreateMainDbEntityDbHelper())
            {
                return dbHelper.GetCount("afw.Acc", null);
            }
        }

        public Guid GetAccountIDInAnotherFinancialYear(Guid accountID, Guid otherFinancialYearID)
        {
            return new AccountBL().GetAccountIDInAnotherFinancialYear(accountID, otherFinancialYearID);
        }

        public Entity CopyAccDoc(Guid sourceAccDocID, Entity destinationAccDocEntity, string[] ignoredFieldNames)
        {
            return new AccDocBL().CopyAccDoc(sourceAccDocID, destinationAccDocEntity, ignoredFieldNames);
        }

        public void InsertOrUpdateAccDocMaster(ref Guid? accDocID, string docKindName, DateTime issueDate, Guid financialYear, Guid financialGroup, string desc, bool autoGenerate)
        {
            new AccDocBL().InsertOrUpdateAccDocMaster(ref accDocID, docKindName, issueDate, financialYear, financialGroup, desc, autoGenerate);
        }

        public void InsertAccDocMaster(ref Guid? accDocID, string docKindName, DateTime issueDate, Guid financialYear, Guid financialDocType, Guid organizationUnit, string desc, bool isAutoGenerate)
        {
            new AccDocBL().InsertAccDocMaster(ref accDocID, docKindName, issueDate, financialYear, financialDocType, organizationUnit, desc, isAutoGenerate);
        }

        public void UpdateAccDocMasterBalanceStatus(Guid accDocID)
        {
            new AccDocBL().UpdateAccDocMasterBalanceStatus(accDocID);
        }

        public void DeleteAccDoc(Guid? accDocID, string docKindEntityFullName, string opFieldNameInItemEntity, Guid opID)
        {
            new AccDocBL().DeleteAccDoc(accDocID, docKindEntityFullName, opFieldNameInItemEntity, opID);
        }

        public void DeleteAccDocMaster(Guid? accDocID, string docKindEntityFullName, Guid opID)
        {
            new AccDocBL().DeleteAccDocMaster(accDocID, docKindEntityFullName, opID);
        }

        public void DeleteAccDocItems(Guid? accDocID, string opFieldNameInItemEntity, Guid? opID)
        {
            new AccDocItemBL().DeleteAccDocItems(accDocID, opFieldNameInItemEntity, opID);
        }

        public void InsertAccDocItems(Guid accDocID, string opFieldNameInItemEntity, Guid? opID, List<Entity> accDocItemList)
        {
            new AccDocItemBL().InsertAccDocItems(accDocID, opFieldNameInItemEntity, opID, accDocItemList);
        }

        public string GetDocKindName(Guid id)
        {
            return new DocKindBL().GetDocKindName(id);
        }

        public Guid GetDocKindID(string name)
        {
            return new DocKindBL().GetDocKindID(name);
        }

        public Entity GetAccConfig()
        {
            var accConfig = new AccConfigBL().GetAccConfig();
            return accConfig;
        }

        #endregion

        #region Entity Acc

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "Account")]
        public void BeforeApplyAccountChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new AccountBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.AfterApplyEntityChanges, "Account")]
        public void AfterApplyEntityAccountChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new AccountBL().AfterApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "AccDoc")]
        public void BeforeApplyAccDocChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new AccDocBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.AfterApplyEntityChanges, "AccDoc")]
        public void AfterApplyAccDocChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new AccDocBL().AfterApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "AccDocItem")]
        public void BeforeApplyAccDocItemChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new AccDocItemBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.AfterApplyEntityChanges, "AccDocItem")]
        public void AfterApplyAccDocItemChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new AccDocItemBL().AfterApplyChanges(dbHelper, entity);
        }

        #endregion

        public EntityList GetAccountsWithParents(Guid financialYearID, string filterExpression)
        {
            return new AccountBL().GetAccountsWithParents(financialYearID, filterExpression);
        }

        public Entity GetAccountWithParents(string id)
        {
            return new AccountBL().GetAccountWithParents(id);
        }

        public Entity GetNote(string id)
        {
            var note = new NoteBL().GetNote(id);
            return note;
        }

        public Guid GetFirstLeafOfAccountTree(Guid accountID)
        {
            var firstLeafAccountID = new AccountBL().GetFirstLeafOfAccountTree(accountID);
            return firstLeafAccountID;
        }

        public EntityList GetAccountFloatGroupsData(Guid accountID)
        {
            var accountFloatGroupsData = new AccountBL().GetAccountFloatGroupsData(accountID);
            return accountFloatGroupsData;
        }

        public void SaveAccountFloatGroupsData(Guid accountID, EntityList accountFloatGroupsData)
        {
            new AccountBL().SaveAccountFloatGroupsData(accountID, accountFloatGroupsData);
        }

        public Entity AccountHasFloats(Guid accountID)
        {
            return new AccountBL().AccountHasFloats(accountID);
        }

        public EntityList GetConnectedAccounts(string shenvarType, Guid shenavarId, Guid financialYear, DateTime? fromDate, DateTime? toDate, int? fromDocRefNo, int? toDocRefNo, Guid? organizationUnit, Guid? financialDocType)
        {
            return new AccountReportsBL().GetConnectedAccounts(shenvarType, shenavarId, financialYear, fromDate, toDate, fromDocRefNo, toDocRefNo, organizationUnit, financialDocType);
        }

        public EntityList GetAccountsBef(string filterExpression)
        {
            return new AccountBL().GetAccountsBef(filterExpression);
        }

        public EntityList GetDafaterReportInfo(string fromDoc, string toDoc, Guid account, Guid financialYear)
        {
            return new AccountReportsBL().GetDafaterReportInfo(fromDoc, toDoc, account, financialYear);
        }

        public EntityList GetCostAndBenefitReportData(Guid financialYear, string fromDate, string toDate)
        {
            return new AccountReportsBL().GetCostAndBenefitReportData(financialYear, fromDate, toDate);
        }

        public EntityList GetDateBaseDaftarRoznameReport(string fromDate, string toDate, Guid financialYear)
        {
            return new AccountReportsBL().GetDateBaseDaftarRoznameReport(fromDate, toDate, financialYear);
        }

        public EntityList GetDocNoBaseDaftarRoznameReport(string fromDoc, string toDoc, Guid financialYear)
        {
            return new AccountReportsBL().GetDocNoBaseDaftarRoznameReport(fromDoc, toDoc, financialYear);
        }

        public EntityList GetShenavarhaEntityList(string fromDate, string toDate, Guid? financialYear, Guid? financialDocType, Guid? organizationUnit, Guid? person, Guid? costCenter, Guid? project, Guid? foreignCurrency, Guid? account)
        {
            return new AccountReportsBL().GetShenavarhaEntityList(fromDate, toDate, financialYear, financialDocType, organizationUnit, person, costCenter, project, foreignCurrency, account);
        }

        public EntityList GetAccDocs(string fromDate, string toDate, Guid financialYear, string accDocType)
        {
            return new AccountReportsBL().GetAccDocs(fromDate, toDate, financialYear, accDocType);
        }

        public EntityList GetCountingItems(string filterExpresstion)
        {
            return new AccDocBL().GetCountingItems(filterExpresstion);
        }

        public EntityList GetOperations(string operarionType, Guid financialYear, string AccDocStatus)
        {
            return new AccDocBL().GetOperations(operarionType, financialYear, AccDocStatus);
        }

        public EntityList GetAccDocItems(Guid financialYearID, string filter)
        {
            return new AccDocItemBL().GetAccDocItems(financialYearID, filter);
        }

        public Entity GetDebtorAndCreditorSum(Guid accDocID)
        {
            return new AccDocItemBL().GetDebtorAndCreditorSum(accDocID);
        }

        public void FinalizeDocs(Guid financialYearID, Guid financialDocTypeID, DateTime toIssueDate, int toDocReferenceNo)
        {
            new AccDocBL().FinalizeDocs(financialYearID, financialDocTypeID, toIssueDate, toDocReferenceNo);
        }

        public void MakeDocsTemporary(Guid financialYearID, Guid financialDocTypeID, DateTime toIssueDate, int toDocReferenceNo)
        {
            new AccDocBL().MakeDocsTemporary(financialYearID, financialDocTypeID, toIssueDate, toDocReferenceNo);
        }

        public void TransferAccDocs(Guid financialYearID, Guid financialDocTypeID, DateTime toIssueDate, int toDocReferenceNo, Guid transferDatabaseID)
        {
            new AccDocBL().TransferAccDocs(financialYearID, financialDocTypeID, toIssueDate, toDocReferenceNo, transferDatabaseID);
        }

        public void CheckFinalDocExistsAtDates(Guid financialYearID, Guid FinancialDocTypeID, DateTime date, DateTime? date2)
        {
            new AccDocBL().CheckFinalDocExistsAtDates(financialYearID, FinancialDocTypeID, date, date2);
        }

        [ServerEvent(ServerEventTypes.OnEntityListOfDataListRequested, "AccountReview")]
        public void OnEntityListOfAccountReviewRequested(Entity dataList, string[] parameterNames, string[] parameterValues, string filterExpression, string sortExpression, int? startRecord, int? maxRecords,
            ref EntityList resultEntityList)
        {
            new AccountReportsBL().OnEntityListOfAccountReviewRequested(dataList, parameterNames, parameterValues, filterExpression, sortExpression, startRecord, maxRecords, ref resultEntityList);
        }

        [ServerEvent(ServerEventTypes.OnDataListEntityCountRequested, "AccountReview")]
        public void OnAccountReviewEntityCountRequested(Entity dataList, string[] parameterNames, string[] parameterValues, string filterExpression,
            ref int? entityCount)
        {
            new AccountReportsBL().OnAccountReviewEntityCountRequested(dataList, parameterNames, parameterValues, filterExpression, ref entityCount);
        }

        [ServerEvent(ServerEventTypes.OnEntityListOfDataListRequested, "AccountReviewShenavar")]
        public void OnEntityListOfAccountReviewShenavarRequested(Entity dataList, string[] parameterNames, string[] parameterValues, string filterExpression, string sortExpression, int? startRecord, int? maxRecords,
            ref EntityList resultEntityList)
        {
            new AccountReportsBL().OnEntityListOfAccountReviewShenavarRequested(dataList, parameterNames, parameterValues, filterExpression, sortExpression, startRecord, maxRecords, ref resultEntityList);
        }

        [ServerEvent(ServerEventTypes.OnDataListEntityCountRequested, "AccountReviewShenavar")]
        public void OnAccountReviewShenavarEntityCountRequested(Entity dataList, string[] parameterNames, string[] parameterValues, string filterExpression,
            ref int? entityCount)
        {
            new AccountReportsBL().OnAccountReviewShenavarEntityCountRequested(dataList, parameterNames, parameterValues, filterExpression, ref entityCount);
        }

        [ServerEvent(ServerEventTypes.OnEntityListOfDataListRequested, "ShenavarhaDataList")]
        public void OnEntityListOfShenavarhaRequested(Entity dataList, string[] parameterNames, string[] parameterValues, string filterExpression, string sortExpression, int? startRecord, int? maxRecords,
            ref EntityList resultEntityList)
        {
            new AccountReportsBL().OnEntityListOfShenavarhaRequested(dataList, parameterNames, parameterValues, filterExpression, sortExpression, startRecord, maxRecords, ref resultEntityList);
        }

        [ServerEvent(ServerEventTypes.OnDataListEntityCountRequested, "ShenavarhaDataList")]
        public void OnShenavarDataListEntityCountRequested(Entity dataList, string[] parameterNames, string[] parameterValues, string filterExpression,
            ref int? entityCount)
        {
            new AccountReportsBL().OnShenavarDataListEntityCountRequested(dataList, parameterNames, parameterValues, filterExpression, ref entityCount);
        }

        [ServerEvent(ServerEventTypes.OnEntityListOfDataListRequested, "DafaterDataList")]
        public void OnEntityListOfDafaterDataListRequested(Entity dataList, string[] parameterNames, string[] parameterValues, string filterExpression, string sortExpression, int? startRecord, int? maxRecords,
            ref EntityList resultEntityList)
        {
            new AccountReportsBL().OnEntityListOfDafaterDataListRequested(dataList, parameterNames, parameterValues, filterExpression, sortExpression, startRecord, maxRecords, ref resultEntityList);
        }

        [ServerEvent(ServerEventTypes.OnDataListEntityCountRequested, "DafaterDataList")]
        public void OnDafaterDataListEntityCountRequested(Entity dataList, string[] parameterNames, string[] parameterValues, string filterExpression,
            ref int? entityCount)
        {
            new AccountReportsBL().OnDafaterDataListEntityCountRequested(dataList, parameterNames, parameterValues, filterExpression, ref entityCount);
        }

        [ServerEvent(ServerEventTypes.OnEntityListOfDataListRequested, "TarazAzmayeshiList")]
        public void OnEntityListOfTarazAzmayeshiListRequested(Entity dataList, string[] parameterNames, string[] parameterValues, string filterExpression, string sortExpression, int? startRecord, int? maxRecords,
            ref EntityList resultEntityList)
        {
            new AccountReportsBL().OnEntityListOfTarazAzmayeshiListRequested(dataList, parameterNames, parameterValues, filterExpression, sortExpression, startRecord, maxRecords, ref resultEntityList);
        }

        [ServerEvent(ServerEventTypes.OnDataListEntityCountRequested, "TarazAzmayeshiList")]
        public void OnTarazAzmayeshiListEntityCountRequested(Entity dataList, string[] parameterNames, string[] parameterValues, string filterExpression,
            ref int? entityCount)
        {
            new AccountReportsBL().OnTarazAzmayeshiListEntityCountRequested(dataList, parameterNames, parameterValues, filterExpression, ref entityCount);
        }

        public void CopyAccountsAndDependencies(Guid sourceFinancialYearID, Guid destinationFinancialYearID)
        {
            new AccountBL().CopyAccountsAndDependencies(sourceFinancialYearID, destinationFinancialYearID);
        }
    }
}

using AppFramework;
using AppFramework.AppServer;
using AppFramework.DataAccess;
using AppFramework.Helpers;
using Stimulsoft.Report.Components;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;

namespace AppFramework.AppServer
{
    public class AccountReportsBL
    {
        public EntityList GetDafaterReportInfo(string fromDoc, string toDoc, Guid account, Guid financialYear)
        {
            //DebugHelper.Break();

            var dbHelper = CoreComponent.Instance.MainDbHelper;
            var accountDaftar = dbHelper.FetchMultipleBySqlQuery(string.Format(
                @"exec acc.GenerateDafaterReportInfo '{0}', '{1}', '{2}', '{3}'", fromDoc, toDoc, account, financialYear));
            return accountDaftar;

        }

        public EntityList GetCostAndBenefitReportData(Guid financialYear, string fromDate, string toDate)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            if (string.IsNullOrEmpty(fromDate))
                fromDate = "null";
            else
                fromDate = string.Format("'{0}'", fromDate);

            if (string.IsNullOrEmpty(toDate))
                toDate = "null";
            else
                toDate = string.Format("'{0}'", toDate);

            return dbHelper.FetchMultipleBySqlQuery(
                string.Format(
                    @"exec acc.GetCostAndBenefitReportData '{0}', {1}, {2}",
                    financialYear, fromDate, toDate));
        }

        public void OnRunningAccountReviewShenavarReport(Entity reportEntity, Stimulsoft.Report.StiReport report, Dictionary<string, object> parameters)
        {

            var dbHelper = CoreComponent.Instance.MainDbHelper;

            EntityList accountReview = new EntityList();

            var test = report.DataSources;

            var query = string.Format("");

            DataTable shenavarReportDataTable = new DataTable("ReportTable");

            var reportParameterAccountReview = new Guid?();

            if (parameters["AccountReview"] != null)
                reportParameterAccountReview = Guid.Parse(parameters["AccountReview"].ToString());

            var shenavarType = parameters["ShenavarType"];

            shenavarReportDataTable.Columns.Add("ShenavarName");
            shenavarReportDataTable.Columns.Add("DebtorAmount_Shenavar");
            shenavarReportDataTable.Columns.Add("CreditorAmount_Shenavar");
            shenavarReportDataTable.Columns.Add("AccountCode");
            shenavarReportDataTable.Columns.Add("FarsiAccountReviewType_Shenavar");
            shenavarReportDataTable.Columns.Add("RemainingDebtorAmount_Shenavar", typeof(decimal));
            shenavarReportDataTable.Columns.Add("RemainingCreditorAmount_Shenavar", typeof(decimal));
            shenavarReportDataTable.Columns.Add("FarsiShenavarType");
            shenavarReportDataTable.Columns.Add("AccountReviewName_Shenavar");

            for (int i = 0; i < acc.AccountReview1.Entities.Count; i++)
            {
                Entity accountReviewEntity = acc.AccountReview1.Entities[i];

                var accountReview_Shenavar = accountReviewEntity.GetFieldValue<Guid?>("AccountReview_Shenavar");

                if (reportParameterAccountReview != null)
                {
                    if (shenavarType as string == "Person")
                    {
                        if (accountReview_Shenavar == reportParameterAccountReview)
                        {
                            if (accountReviewEntity.GetFieldValue<string>("ShenavarType") == "Person")
                            {
                                accountReview.Entities.Add(accountReviewEntity);
                            }

                        }
                    }

                    else if (shenavarType as string == "CostCenter")
                    {
                        if (accountReview_Shenavar == reportParameterAccountReview)
                        {
                            if (accountReviewEntity.GetFieldValue<string>("ShenavarType") == "CostCenter")
                            {
                                accountReview.Entities.Add(accountReviewEntity);
                            }
                        }
                    }

                    else if (shenavarType as string == "Project")
                    {
                        if (accountReview_Shenavar == reportParameterAccountReview)
                        {
                            if (accountReviewEntity.GetFieldValue<string>("ShenavarType") == "Project")
                            {
                                accountReview.Entities.Add(accountReviewEntity);
                            }
                        }
                    }

                }

            }

            foreach (var entity in accountReview.Entities)
            {
                var row = shenavarReportDataTable.NewRow();

                row["ShenavarName"] = entity.GetFieldValue<string>("ShenavarName");
                row["RemainingDebtorAmount_Shenavar"] = entity.GetFieldValue<decimal>("RemainingDebtorAmount_Shenavar");
                row["RemainingCreditorAmount_Shenavar"] = entity.GetFieldValue<decimal>("RemainingCreditorAmount_Shenavar");
                row["FarsiAccountReviewType_Shenavar"] = entity.GetFieldValue<string>("FarsiAccountReviewType_Shenavar");
                row["FarsiShenavarType"] = entity.GetFieldValue<string>("FarsiShenavarType");
                row["AccountReviewName_Shenavar"] = entity.GetFieldValue<string>("AccountReviewName_Shenavar");

                shenavarReportDataTable.Rows.Add(row);
            }

            report.Dictionary.DataSources.Clear();

            report.RegData("DataSource", shenavarReportDataTable);
            report.Dictionary.Synchronize();

            StiDataBand dataBand1 = (StiDataBand)report.GetComponentByName("DataBand1");
            dataBand1.DataSourceName = "ReportTable";
        }

        public EntityList GetConnectedAccounts(string shenvarType, Guid shenavarId, Guid financialYear, DateTime? fromDate, DateTime? toDate, int? fromDocRefNo, int? toDocRefNo, Guid? organizationUnit, Guid? financialDocType)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var shenavar = "";

            if (shenvarType == "Shenavar_Person")
                shenavar = "Person";
            else if (shenvarType == "Shenavar_CostCenter")
                shenavar = "CostCenter";
            else if (shenvarType == "Shenavar_Project")
                shenavar = "Project";
            else if (shenvarType == "Shenavar_OrganizationUnit")
                shenavar = "OrganizationUnit";

            var sqlQuery = string.Format(@"
                   select DocItem.{0} ShenavarID,
                        AccountView.ID AccountID,
                        AccountView.FullName AccountFullName,
                        sum(DebtorAmount) DebtorAmountSum,
                        sum(CreditorAmount) CreditorAmountSum,
                        abs(sum(DebtorAmount) - sum(CreditorAmount)) Mande,
                        case when sum(DebtorAmount) > sum(CreditorAmount) then N'بدهکار' 
                            when sum(DebtorAmount) < sum(CreditorAmount) then N'بستانکار'
                            else N'بی حساب' 
                        end MandeStatus,
                        AccDoc.FinancialYear
                    from acc_AccDocItems DocItem
                        inner join acc_AccDocs AccDoc on AccDoc.ID = DocItem.AccDoc
                        inner join acc_AccountsView AccountView on AccountView.ID = DocItem.Account
                    where (DocItem.{0} is not null and DocItem.{0} = '{1}')
                        and AccDoc.FinancialYear = '{2}'
                        and IssueDate between isnull({3} , IssueDate) and isnull({4} , IssueDate)
                        and AccDoc.DocNo between isnull({5} , AccDoc.DocNo) and isnull({6} , AccDoc.DocNo)
                        and AccDoc.OrganizationUnit = isnull({7} , AccDoc.OrganizationUnit)
                        and AccDoc.FinancialDocType = isnull({8} , AccDoc.FinancialDocType)
                        and AccDoc.DocStatus <> '{9}'--NotChecked
                    group by DocItem.{0},
                        AccountView.FullName,
                        AccountView.ID,
                        AccDoc.FinancialYear",
                shenavar, shenavarId, financialYear,
                fromDate == null ? "null" : "'" + fromDate + "'",
                toDate == null ? "null" : "'" + toDate + "'",
                fromDocRefNo == null ? "null" : "'" + fromDocRefNo + "'",
                toDocRefNo == null ? "null" : "'" + toDocRefNo + "'",
                organizationUnit == null ? "null" : "'" + organizationUnit + "'",
                financialDocType == null ? "null" : "'" + financialDocType + "'",
                OptionSetHelper.GetOptionSetItemID("acc.DocStatus", "NotChecked"));

            var connectedAccounts = dbHelper.FetchMultipleBySqlQuery(sqlQuery);

            return connectedAccounts;
        }

        public void OnRunningConnectedAccountsrReport(Entity reportEntity, Stimulsoft.Report.StiReport report, Dictionary<string, object> parameters)
        {
            DataTable connectedAccountstDataTable = new DataTable("ReportTable");

            var core = CoreComponent.Instance;
            var connectedAccounts = core.TryGetUserSessionKeyValue("acc", "ConnectedAccounts");

            EntityList connectedAccountsEntityList = (EntityList)connectedAccounts;

            //var accountReviewType = parameters["AccountReviewType"];

            connectedAccountstDataTable.Columns.Add("CodeAndName");
            connectedAccountstDataTable.Columns.Add("AccountName");
            connectedAccountstDataTable.Columns.Add("DebtorAmount", typeof(decimal));
            connectedAccountstDataTable.Columns.Add("CreditorAmount", typeof(decimal));
            //connectedAccountstDataTable.Columns.Add("RemainingDebtorAmount", typeof(decimal));
            //connectedAccountstDataTable.Columns.Add("RemainingCreditorAmount", typeof(decimal));


            foreach (var entity in connectedAccountsEntityList.Entities)
            {
                var row = connectedAccountstDataTable.NewRow();

                row["CodeAndName"] = entity.GetFieldValue<string>("CodeAndName");
                row["AccountName"] = entity.GetFieldValue<string>("AccountName");
                //row["DebtorAmount"] = entity.GetFieldValue<string>("AccountCode");
                //row["CreditorAmount"] = entity.GetFieldValue<string>("FarsiAccountReviewType");
                row["DebtorAmount"] = entity.GetFieldValue<decimal>("DebtorAmount");
                row["CreditorAmount"] = entity.GetFieldValue<decimal>("CreditorAmount");
                //row["RemainingDebtorAmount"] = entity.GetFieldValue<decimal>("RemainingDebtorAmount");
                //row["RemainingCreditorAmount"] = entity.GetFieldValue<decimal>("RemainingCreditorAmount");

                connectedAccountstDataTable.Rows.Add(row);
            }

            report.Dictionary.DataSources.Clear();

            report.RegData("ReportTable", connectedAccountstDataTable);
            report.Dictionary.Synchronize();

            StiDataBand dataBand1 = (StiDataBand)report.GetComponentByName("DataBand1");
            dataBand1.DataSourceName = "ReportTable";
        }
        public EntityList GetDateBaseDaftarRoznameReport(string fromDate, string toDate, Guid financialYear)
        {
            //DebugHelper.Break();

            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var accountDaftar = dbHelper.FetchMultipleBySqlQuery(string.Format(
                @"select afw.GregorianToPersian(DaftarRozname.IssueDate) IssueDate, DaftarRozname.DocNo, 
                        	DaftarRozname.OrderElement, DaftarRozname.Code AccountCode,	DaftarRozname.AccDoc,
                        	DaftarRozname.KolAccount, DaftarRozname.DebtorAmount, DaftarRozname.CreditorAmount,
                        	DaftarRozname.Name AccountName, DaftarRozname.Note DocNote
                        	from
                        (select Doc.IssueDate, Doc.DocNo, TempAll.OrderElement, TempAll.Code, TempAll.AccDoc,
                        	TempAll.KolAccount, TempAll.DebtorAmount, TempAll.CreditorAmount, TempAll.Name,
                        	CASE WHEN Doc.Description is null or Doc.Description = '' THEN N'به شرح ضمائم' ELSE N' شرح کل سند: ' + Doc.Description END AS Note
                        	  from
                        (select temp1.DebtorAmount, temp1.CreditorAmount, temp1.KolAccount, temp1.AccDoc, temp1.OrderElement,
                        	Account.Code, Account.Name
                        	from(select sum(DocItem.DebtorAmount) DebtorAmount, 0 CreditorAmount,
                        	       		 acc.GetKolAccountID(DocItem.Account) KolAccount, DocItem.AccDoc, '1' AS OrderElement
                        	       	 from acc_AccDocItems DocItem 
                        	       	 where (CreditorAmount = 0) and(DocItem.IsActive = 1)
                        	       	 group by acc.GetKolAccountID(DocItem.Account), DocItem.AccDoc) temp1
                        	       	inner join acc_Accounts Account on Account.ID = temp1.KolAccount
                        	       where Account.FinancialYear = '{2}'
                        	       union
                        select temp2.DebtorAmount, temp2.CreditorAmount, temp2.KolAccount, temp2.AccDoc, temp2.OrderElement,
                        	Account.Code, Account.Name
                        	from(select 0 DebtorAmount, sum(DocItem.CreditorAmount) CreditorAmount ,
                        	       		 acc.GetKolAccountID(DocItem.Account) KolAccount, DocItem.AccDoc, '2' AS OrderElement
                        	       	 from acc_AccDocItems DocItem 
                        	       	 where (DebtorAmount = 0) and(DocItem.IsActive = 1)
                        	       	 group by acc.GetKolAccountID(DocItem.Account), DocItem.AccDoc) temp2
                        	       	inner join acc_Accounts Account on Account.ID = temp2.KolAccount
                        	       where Account.FinancialYear = '{2}') TempAll
                        	  	inner join acc_AccDocs Doc on Doc.ID = TempAll.AccDoc
                        	  where cast(Doc.IssueDate as date) >= '{0}' and cast(Doc.IssueDate as date) <= '{1}' and Doc.IsActive = 1
                        	  /*order by Doc.IssueDate, Doc.DocNo, TempAll.OrderElement, TempAll.Code*/) as DaftarRozname
                        order by DaftarRozname.IssueDate, DaftarRozname.DocNo, DaftarRozname.OrderElement, DaftarRozname.Code", fromDate, toDate, financialYear));
            return accountDaftar;

        }

        public EntityList GetDocNoBaseDaftarRoznameReport(string fromDoc, string toDoc, Guid financialYear)
        {
            //DebugHelper.Break();

            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var accountDaftar = dbHelper.FetchMultipleBySqlQuery(string.Format(
                @"select Doc.DocNo, afw.GregorianToPersian(Doc.IssueDate) IssueDate, DaftarRozname.OrderElement,
                        	DaftarRozname.Code AccountCode, DaftarRozname.AccDoc, DaftarRozname.KolAccount, DaftarRozname.DebtorAmount,
                        	DaftarRozname.CreditorAmount, DaftarRozname.Name AccountName,
                        	CASE WHEN Doc.Description is null or Doc.Description = '' THEN N'به شرح ضمائم' ELSE N' شرح کل سند: ' + Doc.Description END AS DocNote
                        from
                        (select temp1.DebtorAmount, temp1.CreditorAmount, temp1.KolAccount, temp1.AccDoc, temp1.OrderElement,
                        	Account.Code, Account.Name
                        from(select sum(DocItem.DebtorAmount) DebtorAmount, 0 CreditorAmount,
                             		 acc.GetKolAccountID(DocItem.Account) KolAccount, DocItem.AccDoc, '1' AS OrderElement
                             	 from acc_AccDocItems DocItem 
                             	 where (CreditorAmount = 0) and(DocItem.IsActive = 1)
                             	 group by acc.GetKolAccountID(DocItem.Account), DocItem.AccDoc) temp1
                             	inner join acc_Accounts Account on Account.ID = temp1.KolAccount
                             where Account.FinancialYear = '{2}'
                        union
                        select temp2.DebtorAmount, temp2.CreditorAmount, temp2.KolAccount, temp2.AccDoc, temp2.OrderElement,
                        	Account.Code, Account.Name
                        	from(select 0 DebtorAmount, sum(DocItem.CreditorAmount) CreditorAmount ,
                             		 acc.GetKolAccountID(DocItem.Account) KolAccount, DocItem.AccDoc, '2' AS OrderElement
                             	 from acc_AccDocItems DocItem 
                             	 where (DebtorAmount = 0) and(DocItem.IsActive = 1)
                             	 group by acc.GetKolAccountID(DocItem.Account), DocItem.AccDoc) temp2
                             	inner join acc_Accounts Account on Account.ID = temp2.KolAccount
                             where Account.FinancialYear = '{2}') DaftarRozname
                        	inner join acc_AccDocs Doc on Doc.ID = DaftarRozname.AccDoc
                        where cast(Doc.DocNo as int) >= '{0}' and cast(Doc.DocNo as int) <= '{1}' and Doc.IsActive = 1
                        order by cast(Doc.DocNo as int), DaftarRozname.OrderElement, DaftarRozname.Code", fromDoc, toDoc, financialYear));
            return accountDaftar;

        }

        public EntityList GetShenavarhaEntityList(string fromDate, string toDate, Guid? financialYear, Guid? financialDocType, Guid? organizationUnit, Guid? person, Guid? costCenter, Guid? project, Guid? foreignCurrency, Guid? account)
        {
            //DebugHelper.Break(); 
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            fromDate = string.IsNullOrEmpty(fromDate) ? "null" : string.Format("'{0}'", fromDate);
            toDate = string.IsNullOrEmpty(toDate) ? "null" : string.Format("'{0}'", toDate);
            var financialYearValue = financialYear == null ? "null" : string.Format("'{0}'", financialYear);
            var financialDocTypeValue = financialDocType == null ? "null" : string.Format("'{0}'", financialDocType);
            var organizationUnitValue = organizationUnit == null ? "null" : string.Format("'{0}'", organizationUnit);
            var personValue = person == null ? "null" : string.Format("'{0}'", person);
            var costCenterValue = costCenter == null ? "null" : string.Format("'{0}'", costCenter);
            var projectValue = project == null ? "null" : string.Format("'{0}'", project);
            var foreignCurrencyValue = foreignCurrency == null ? "null" : string.Format("'{0}'", foreignCurrency);
            var accountValue = account == null ? "null" : string.Format("'{0}'", account);

            //filterExpression = string.IsNullOrEmpty(filterExpression) ? "null" :
            //    string.Format("N'{0}'", filterExpression.Replace("'", "''"));

            //sortExpression = string.IsNullOrEmpty(sortExpression) ? "null" : string.Format("'{0}'", sortExpression);

            var query = string.Format("exec acc.GetShenavarhaReports {0}, {1}, {2}, {3}, {4}, {5}, {6}, {7}, {8}, {9}, {10}, {11}, {12}, {13}, {14}",
                                                fromDate, toDate, financialYearValue, financialDocTypeValue, organizationUnitValue, personValue, costCenterValue,
                                                projectValue, foreignCurrencyValue, accountValue, 0,"null", "null", "null", "null");
            var resultEntityList = dbHelper.FetchMultipleBySqlQuery(query);

            return resultEntityList;

        }

        public EntityList GetAccDocs(string fromDate, string toDate, Guid financialYear, string accDocType)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            string sqlString = string.Format(
             @"exec acc.GetAccDocs '{0}', '{1}', '{2}', '{3}'", fromDate, toDate, financialYear, accDocType);
            var accDocs = dbHelper.FetchMultipleBySqlQuery(sqlString);
            return accDocs;

        }

        public void OnAccountReviewEntityCountRequested(Entity dataList, string[] parameterNames, string[] parameterValues, string filterExpression,
            ref int? entityCount)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var noeTaraz = parameterValues[0];
            var fromDate = parameterValues[1];
            var toDate = parameterValues[2];
            var fromDocReferenceNo = parameterValues[3];
            var toDocReferenceNo = parameterValues[4];
            var financialYear = parameterValues[5];
            var financialDocType = parameterValues[6];
            var organizationUnit = parameterValues[7];
            var accountReviewType = parameterValues[8] as string;
            var parentAccountGroup = parameterValues[9];
            var parentAccount = parameterValues[10];
            var shenavarGroupID = parameterValues[11];
            var remainedStatusFilter = parameterValues[12];

            noeTaraz = string.IsNullOrEmpty(noeTaraz) ? "null" : string.Format("'{0}'", noeTaraz);
            fromDate = string.IsNullOrEmpty(fromDate) ? "null" : string.Format("'{0}'", fromDate);
            toDate = string.IsNullOrEmpty(toDate) ? "null" : string.Format("'{0}'", toDate);
            fromDocReferenceNo = string.IsNullOrEmpty(fromDocReferenceNo) ? "null" : string.Format("'{0}'", fromDocReferenceNo);
            toDocReferenceNo = string.IsNullOrEmpty(toDocReferenceNo) ? "null" : string.Format("'{0}'", toDocReferenceNo);
            financialYear = string.IsNullOrEmpty(financialYear) ? "null" : string.Format("'{0}'", financialYear);
            financialDocType = string.IsNullOrEmpty(financialDocType) ? "null" : string.Format("'{0}'", financialDocType);
            organizationUnit = string.IsNullOrEmpty(organizationUnit) ? "null" : string.Format("'{0}'", organizationUnit);
            accountReviewType = string.IsNullOrEmpty(accountReviewType) ? "null" : string.Format("'{0}'", accountReviewType);
            parentAccountGroup = string.IsNullOrEmpty(parentAccountGroup) ? "null" : string.Format("'{0}'", parentAccountGroup);
            parentAccount = string.IsNullOrEmpty(parentAccount) ? "null" : string.Format("'{0}'", parentAccount);
            shenavarGroupID = string.IsNullOrEmpty(shenavarGroupID) ? "null" : string.Format("'{0}'", shenavarGroupID);
            remainedStatusFilter = string.IsNullOrEmpty(remainedStatusFilter) ? "null" : string.Format("'{0}'", remainedStatusFilter);
            
            filterExpression = string.IsNullOrEmpty(filterExpression) ? "null" :
                string.Format("N'{0}'", filterExpression.Replace("'", "''"));

            //var nullExpression =  "null" as string ;

            var query = string.Format("exec acc.GenerateAccountReview {0}, {1}, {2}, {3}, {4}, {5}, {6}, {7}, {8}, {9}, {10}, {11}, {12}, {13}, {14}, {15}, {16}",
                                                noeTaraz, fromDate, toDate, fromDocReferenceNo, toDocReferenceNo, financialYear, financialDocType, organizationUnit,
                                                accountReviewType, parentAccountGroup, parentAccount, shenavarGroupID, remainedStatusFilter, filterExpression, "null", "null", "null");

            var resultEntity = dbHelper.FetchMultipleBySqlQuery(query, 1, 1);

            if (resultEntity.Entities.Count > 0)
                entityCount = resultEntity.Entities[0].GetFieldValue<int>("TotalRecordsCount");
            else
                entityCount = 0;
        }

        public void OnEntityListOfAccountReviewRequested(Entity dataList, string[] parameterNames, string[] parameterValues, string filterExpression, string sortExpression, int? startRecord, int? maxRecords,
            ref EntityList resultEntityList)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var noeTaraz = parameterValues[0];
            var fromDate = parameterValues[1];
            var toDate = parameterValues[2];
            var fromDocReferenceNo = parameterValues[3];
            var toDocReferenceNo = parameterValues[4];
            var financialYear = parameterValues[5];
            var financialDocType = parameterValues[6];
            var organizationUnit = parameterValues[7];
            var accountReviewType = parameterValues[8] as string;
            var parentAccountGroup = parameterValues[9];
            var parentAccount = parameterValues[10];
            var shenavarGroupID = parameterValues[11];
            var remainedStatusFilter = parameterValues[12];

            noeTaraz = string.IsNullOrEmpty(noeTaraz) ? "null" : string.Format("'{0}'", noeTaraz);
            fromDate = string.IsNullOrEmpty(fromDate) ? "null" : string.Format("'{0}'", fromDate);
            toDate = string.IsNullOrEmpty(toDate) ? "null" : string.Format("'{0}'", toDate);
            fromDocReferenceNo = string.IsNullOrEmpty(fromDocReferenceNo) ? "null" : string.Format("'{0}'", fromDocReferenceNo);
            toDocReferenceNo = string.IsNullOrEmpty(toDocReferenceNo) ? "null" : string.Format("'{0}'", toDocReferenceNo);
            financialYear = string.IsNullOrEmpty(financialYear) ? "null" : string.Format("'{0}'", financialYear);
            financialDocType = string.IsNullOrEmpty(financialDocType) ? "null" : string.Format("'{0}'", financialDocType);
            organizationUnit = string.IsNullOrEmpty(organizationUnit) ? "null" : string.Format("'{0}'", organizationUnit);
            accountReviewType = string.IsNullOrEmpty(accountReviewType) ? "null" : string.Format("'{0}'", accountReviewType);
            parentAccountGroup = string.IsNullOrEmpty(parentAccountGroup) ? "null" : string.Format("'{0}'", parentAccountGroup);
            parentAccount = string.IsNullOrEmpty(parentAccount) ? "null" : string.Format("'{0}'", parentAccount);
            shenavarGroupID = string.IsNullOrEmpty(shenavarGroupID) ? "null" : string.Format("'{0}'", shenavarGroupID);
            remainedStatusFilter = string.IsNullOrEmpty(remainedStatusFilter) ? "null" : string.Format("'{0}'", remainedStatusFilter);
           
            filterExpression = string.IsNullOrEmpty(filterExpression) ? "null" :
                string.Format("N'{0}'", filterExpression.Replace("'", "''"));

            sortExpression = string.IsNullOrEmpty(sortExpression) ? "null" : string.Format("'{0}'", sortExpression);

            var query = string.Format(
                "exec acc.GenerateAccountReview {0}, {1}, {2}, {3}, {4}, {5}, {6}, {7}, {8}, {9}, {10}, {11}, {12}, {13}, {14}, {15}, {16}",
                noeTaraz, fromDate, toDate, fromDocReferenceNo, toDocReferenceNo, financialYear, financialDocType, organizationUnit,
                accountReviewType, parentAccountGroup, parentAccount, shenavarGroupID, remainedStatusFilter, filterExpression, sortExpression,
                startRecord != null ? startRecord.ToString() : "null",
                maxRecords != null ? maxRecords.ToString() : "null");

            resultEntityList = dbHelper.FetchMultipleBySqlQuery(query);
        }

        public void OnEntityListOfAccountReviewShenavarRequested(Entity dataList, string[] parameterNames, string[] parameterValues, string filterExpression, string sortExpression, int? startRecord, int? maxRecords,
             ref EntityList resultEntityList)
        {
            OnEntityListOfAccountReviewRequested(dataList, parameterNames, parameterValues, filterExpression, sortExpression, startRecord, maxRecords,
                ref resultEntityList);
        }

        public void OnAccountReviewShenavarEntityCountRequested(Entity dataList, string[] parameterNames, string[] parameterValues, string filterExpression,
            ref int? entityCount)
        {
            OnAccountReviewEntityCountRequested(dataList, parameterNames, parameterValues, filterExpression, ref entityCount);
        }

        public void OnEntityListOfShenavarhaRequested(Entity dataList, string[] parameterNames, string[] parameterValues, string filterExpression, string sortExpression, int? startRecord, int? maxRecords,
             ref EntityList resultEntityList)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var fromDate = parameterValues[0];
            var toDate = parameterValues[1];
            var financialYear = parameterValues[2];
            var financialDocType = parameterValues[3];
            var organizationUnit = parameterValues[4];
            var person = parameterValues[5];
            var costCenter = parameterValues[6];
            var project = parameterValues[7];
            var foreignCurrency = parameterValues[8];
            var account = parameterValues[9];

            fromDate = string.IsNullOrEmpty(fromDate) ? "null" : string.Format("'{0}'", fromDate);
            toDate = string.IsNullOrEmpty(toDate) ? "null" : string.Format("'{0}'", toDate);
            financialYear = string.IsNullOrEmpty(financialYear) ? "null" : string.Format("'{0}'", financialYear);
            financialDocType = string.IsNullOrEmpty(financialDocType) ? "null" : string.Format("'{0}'", financialDocType);
            organizationUnit = string.IsNullOrEmpty(organizationUnit) ? "null" : string.Format("'{0}'", organizationUnit);
            person = string.IsNullOrEmpty(person) ? "null" : string.Format("'{0}'", person);
            costCenter = string.IsNullOrEmpty(costCenter) ? "null" : string.Format("'{0}'", costCenter);
            project = string.IsNullOrEmpty(project) ? "null" : string.Format("'{0}'", project);
            foreignCurrency = string.IsNullOrEmpty(foreignCurrency) ? "null" : string.Format("'{0}'", foreignCurrency);
            account = string.IsNullOrEmpty(account) ? "null" : string.Format("'{0}'", account);

            filterExpression = string.IsNullOrEmpty(filterExpression) ? "null" :
                string.Format("N'{0}'", filterExpression.Replace("'", "''"));

            sortExpression = string.IsNullOrEmpty(sortExpression) ? "null" : string.Format("'{0}'", sortExpression);

            var query = string.Format("exec acc.GetShenavarhaReports {0}, {1}, {2}, {3}, {4}, {5}, {6}, {7}, {8}, {9}, {10}, {11}, {12}, {13}, {14}",
                                                fromDate, toDate, financialYear, financialDocType, organizationUnit, person, costCenter,
                                                project, foreignCurrency, account, 0, filterExpression, sortExpression,  
                                                startRecord != null ? startRecord.ToString() : "null",
                                                maxRecords != null ? maxRecords.ToString() : "null");

            resultEntityList = dbHelper.FetchMultipleBySqlQuery(query);
        }

        public void OnShenavarDataListEntityCountRequested(Entity dataList, string[] parameterNames, string[] parameterValues, string filterExpression,
           ref int? entityCount)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var fromDate = parameterValues[0];
            var toDate = parameterValues[1];
            var financialYear = parameterValues[2];
            var financialDocType = parameterValues[3];
            var organizationUnit = parameterValues[4];
            var person = parameterValues[5];
            var costCenter = parameterValues[6];
            var project = parameterValues[7];
            var foreignCurrency = parameterValues[8];
            var account = parameterValues[9];

            fromDate = string.IsNullOrEmpty(fromDate) ? "null" : string.Format("'{0}'", fromDate);
            toDate = string.IsNullOrEmpty(toDate) ? "null" : string.Format("'{0}'", toDate);
            financialYear = string.IsNullOrEmpty(financialYear) ? "null" : string.Format("'{0}'", financialYear);
            financialDocType = string.IsNullOrEmpty(financialDocType) ? "null" : string.Format("'{0}'", financialDocType);
            organizationUnit = string.IsNullOrEmpty(organizationUnit) ? "null" : string.Format("'{0}'", organizationUnit);
            person = string.IsNullOrEmpty(person) ? "null" : string.Format("'{0}'", person);
            costCenter = string.IsNullOrEmpty(costCenter) ? "null" : string.Format("'{0}'", costCenter);
            project = string.IsNullOrEmpty(project) ? "null" : string.Format("'{0}'", project);
            foreignCurrency = string.IsNullOrEmpty(foreignCurrency) ? "null" : string.Format("'{0}'", foreignCurrency);
            account = string.IsNullOrEmpty(account) ? "null" : string.Format("'{0}'", account);

            filterExpression = string.IsNullOrEmpty(filterExpression) ? "null" :
                string.Format("N'{0}'", filterExpression.Replace("'", "''"));

            var query = string.Format("exec acc.GetShenavarhaReports {0}, {1}, {2}, {3}, {4}, {5}, {6}, {7}, {8}, {9}, {10}, {11}, {12}, {13}, {14}",
                                                fromDate, toDate, financialYear, financialDocType, organizationUnit, person, costCenter,
                                                project, foreignCurrency, account, 0, filterExpression, "null", 1, 1);

            var resultEntity = dbHelper.FetchMultipleBySqlQuery(query);

            if (resultEntity.Entities.Count > 0)
                entityCount = resultEntity.Entities[0].GetFieldValue<int>("TotalRecordsCount");
            else
                entityCount = 0;

        }

        public void OnEntityListOfDafaterDataListRequested(Entity dataList, string[] parameterNames, string[] parameterValues, string filterExpression, string sortExpression, int? startRecord, int? maxRecords,
             ref EntityList resultEntityList)
        {
            //DebugHelper.Break();
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var refAccount = parameterValues[0];
            var financialYear = parameterValues[1];
            var financialDocType = parameterValues[2];
            var organizationUnit = parameterValues[3];
            var fromDate = parameterValues[4];
            var toDate = parameterValues[5];
            var fromDocReferenceNo = parameterValues[6];
            var toDocReferenceNo = parameterValues[7];
            var shenavarType = parameterValues[8];
            var shenavarID = parameterValues[9];
            var beTafkik = parameterValues[10];
            var printMode = 0;

            fromDate = string.IsNullOrEmpty(fromDate) ? "null" : string.Format("'{0}'", fromDate);
            toDate = string.IsNullOrEmpty(toDate) ? "null" : string.Format("'{0}'", toDate);
            fromDocReferenceNo = string.IsNullOrEmpty(fromDocReferenceNo) ? "null" : string.Format("'{0}'", fromDocReferenceNo);
            toDocReferenceNo = string.IsNullOrEmpty(toDocReferenceNo) ? "null" : string.Format("'{0}'", toDocReferenceNo);
            refAccount = string.IsNullOrEmpty(refAccount) ? "null" : string.Format("'{0}'", refAccount);
            financialYear = string.IsNullOrEmpty(financialYear) ? "null" : string.Format("'{0}'", financialYear);
            financialDocType = string.IsNullOrEmpty(financialDocType) ? "null" : "'" + financialDocType + "'";
            organizationUnit = string.IsNullOrEmpty(organizationUnit) ? "null" : "'" + organizationUnit + "'";
            shenavarID = string.IsNullOrEmpty(shenavarID) ? "null" : string.Format("'{0}'", shenavarID);
            shenavarType = string.IsNullOrEmpty(shenavarType) ? "null" : string.Format("'{0}'", shenavarType);

            filterExpression = string.IsNullOrEmpty(filterExpression) ? "null" :
                string.Format("N'{0}'", filterExpression.Replace("'", "''"));

            sortExpression = string.IsNullOrEmpty(sortExpression) ? "null" : string.Format("'{0}'", sortExpression);

            var query = string.Format("exec acc.GetAccountDaftarData {0}, {1}, {2}, {3}, {4}, {5}, {6}, {7}, {8}, {9}, {10}, {11}, {12}, {13}, {14}, {15}",
                                            refAccount, financialYear, financialDocType, organizationUnit, fromDate, toDate, fromDocReferenceNo, toDocReferenceNo, shenavarType,
                                            shenavarID, beTafkik, filterExpression, sortExpression, printMode,
                                            startRecord != null ? startRecord.ToString() : "null",
                                            maxRecords != null ? maxRecords.ToString() : "null");

            resultEntityList = dbHelper.FetchMultipleBySqlQuery(query);
        }

        public void OnDafaterDataListEntityCountRequested(Entity dataList, string[] parameterNames, string[] parameterValues, string filterExpression,
           ref int? entityCount)
        {
            //DebugHelper.Break();
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var refAccount = parameterValues[0];
            var financialYear = parameterValues[1];
            var financialDocType = parameterValues[2];
            var organizationUnit = parameterValues[3];
            var fromDate = parameterValues[4];
            var toDate = parameterValues[5];
            var fromDocReferenceNo = parameterValues[6];
            var toDocReferenceNo = parameterValues[7];
            var shenavarType = parameterValues[8];
            var shenavarID = parameterValues[9];
            var beTafkik = parameterValues[10];
            var printMode = 0;

            fromDate = string.IsNullOrEmpty(fromDate) ? "null" : string.Format("'{0}'", fromDate);
            toDate = string.IsNullOrEmpty(toDate) ? "null" : string.Format("'{0}'", toDate);
            fromDocReferenceNo = string.IsNullOrEmpty(fromDocReferenceNo) ? "null" : string.Format("'{0}'", fromDocReferenceNo);
            toDocReferenceNo = string.IsNullOrEmpty(toDocReferenceNo) ? "null" : string.Format("'{0}'", toDocReferenceNo);
            refAccount = string.IsNullOrEmpty(refAccount) ? "null" : string.Format("'{0}'", refAccount);
            financialYear = string.IsNullOrEmpty(financialYear) ? "null" : string.Format("'{0}'", financialYear);
            financialDocType = string.IsNullOrEmpty(financialDocType) ? "null" : "'" + financialDocType + "'";
            organizationUnit = string.IsNullOrEmpty(organizationUnit) ? "null" : "'" + organizationUnit + "'";
            shenavarID = string.IsNullOrEmpty(shenavarID) ? "null" : string.Format("'{0}'", shenavarID);
            shenavarType = string.IsNullOrEmpty(shenavarType) ? "null" : string.Format("'{0}'", shenavarType);

            filterExpression = string.IsNullOrEmpty(filterExpression) ? "null" :
                string.Format("N'{0}'", filterExpression.Replace("'", "''"));

            var query = string.Format("exec acc.GetAccountDaftarData {0}, {1}, {2}, {3}, {4}, {5}, {6}, {7}, {8}, {9}, {10}, {11} , {12}, {13}, {14}, {15}",
                                            refAccount, financialYear, financialDocType, organizationUnit, fromDate, toDate, fromDocReferenceNo, toDocReferenceNo,
                                            shenavarType, shenavarID, beTafkik, filterExpression, "null", printMode, 1, 1);

            var resultEntity = dbHelper.FetchMultipleBySqlQuery(query);

            if (resultEntity.Entities.Count > 0)
                entityCount = resultEntity.Entities[0].GetFieldValue<int>("TotalRecordsCount");
            else
                entityCount = 0;
        }

        public void OnTarazAzmayeshiListEntityCountRequested(Entity dataList, string[] parameterNames, string[] parameterValues, string filterExpression,
            ref int? entityCount)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var noeTarazAzmayeshi = parameterValues[0];
            var fromDate = parameterValues[1];
            var toDate = parameterValues[2];
            var fromDocReferenceNo = parameterValues[3];
            var toDocReferenceNo = parameterValues[4];
            var financialYear = parameterValues[5];
            var financialDocType = parameterValues[6];
            var organizationUnit = parameterValues[7];

            noeTarazAzmayeshi = string.IsNullOrEmpty(noeTarazAzmayeshi) ? "null" : string.Format("'{0}'", noeTarazAzmayeshi);
            fromDate = string.IsNullOrEmpty(fromDate) ? "null" : string.Format("'{0}'", fromDate);
            toDate = string.IsNullOrEmpty(toDate) ? "null" : string.Format("'{0}'", toDate);
            fromDocReferenceNo = string.IsNullOrEmpty(fromDocReferenceNo) ? "null" : string.Format("'{0}'", fromDocReferenceNo);
            toDocReferenceNo = string.IsNullOrEmpty(toDocReferenceNo) ? "null" : string.Format("'{0}'", toDocReferenceNo);
            financialYear = string.IsNullOrEmpty(financialYear) ? "null" : string.Format("'{0}'", financialYear);
            financialDocType = string.IsNullOrEmpty(financialDocType) ? "null" : string.Format("'{0}'", financialDocType);
            organizationUnit = string.IsNullOrEmpty(organizationUnit) ? "null" : string.Format("'{0}'", organizationUnit);
            /*
            filterExpression = string.IsNullOrEmpty(filterExpression) ? "null" :
                string.Format("N'{0}'", filterExpression.Replace("'", "''"));
            */
            var query = string.Format("exec acc.GenerateTarazAzmayeshi {0}, {1}, {2}, {3}, {4}, {5}, {6}, {7}, {8}, {9}, {10}, {11}",
                                                noeTarazAzmayeshi, fromDate, toDate, fromDocReferenceNo, toDocReferenceNo, financialYear, financialDocType,
                                                organizationUnit, "null", "null", "null", "null");

            var resultEntity = dbHelper.FetchMultipleBySqlQuery(query, 1, 1);

            if (resultEntity.Entities.Count > 0)
                entityCount = resultEntity.Entities[0].GetFieldValue<int>("TotalRecordsCount");
            else
                entityCount = 0;
        }

        public void OnEntityListOfTarazAzmayeshiListRequested(Entity dataList, string[] parameterNames, string[] parameterValues, string filterExpression, string sortExpression, int? startRecord, int? maxRecords,
            ref EntityList resultEntityList)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var noeTarazAzmayeshi = parameterValues[0];
            var fromDate = parameterValues[1];
            var toDate = parameterValues[2];
            var fromDocReferenceNo = parameterValues[3];
            var toDocReferenceNo = parameterValues[4];
            var financialYear = parameterValues[5];
            var financialDocType = parameterValues[6];
            var organizationUnit = parameterValues[7];

            noeTarazAzmayeshi = string.IsNullOrEmpty(noeTarazAzmayeshi) ? "null" : string.Format("'{0}'", noeTarazAzmayeshi);
            fromDate = string.IsNullOrEmpty(fromDate) ? "null" : string.Format("'{0}'", fromDate);
            toDate = string.IsNullOrEmpty(toDate) ? "null" : string.Format("'{0}'", toDate);
            fromDocReferenceNo = string.IsNullOrEmpty(fromDocReferenceNo) ? "null" : string.Format("'{0}'", fromDocReferenceNo);
            toDocReferenceNo = string.IsNullOrEmpty(toDocReferenceNo) ? "null" : string.Format("'{0}'", toDocReferenceNo);
            financialYear = string.IsNullOrEmpty(financialYear) ? "null" : string.Format("'{0}'", financialYear);
            financialDocType = string.IsNullOrEmpty(financialDocType) ? "null" : string.Format("'{0}'", financialDocType);
            organizationUnit = string.IsNullOrEmpty(organizationUnit) ? "null" : string.Format("'{0}'", organizationUnit);
            /*
            filterExpression = string.IsNullOrEmpty(filterExpression) ? "null" :
                string.Format("N'{0}'", filterExpression.Replace("'", "''"));
            */
            sortExpression = string.IsNullOrEmpty(sortExpression) ? "null" : string.Format("'{0}'", sortExpression);

            var query = string.Format("exec acc.GenerateTarazAzmayeshi {0}, {1}, {2}, {3}, {4}, {5}, {6}, {7}, {8}, {9}, {10}, {11}",
                                                noeTarazAzmayeshi, fromDate, toDate, fromDocReferenceNo, toDocReferenceNo, financialYear, financialDocType,
                                                organizationUnit, "null", sortExpression,
                                                startRecord != null ? startRecord.ToString() : "null",
                                                maxRecords != null ? maxRecords.ToString() : "null");

            resultEntityList = dbHelper.FetchMultipleBySqlQuery(query);
        }
    }
}

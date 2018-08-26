using AppFramework;
using AppFramework.AppServer;
using AppFramework.DataAccess;
using AppFramework.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using AppFramework.AppServer.PurchaseAndSales;
using Stimulsoft.Report.Components;
using System.Data;

namespace AppFramework.AppServer
{
    class PSReportsBL
    {
        public EntityList GetKartksNumberOfStuffData(string fromDate, string toDate, Guid stuff, Guid person)
        {
            //DebugHelper.Break(); 

            using (var dbHelper = DbHelperFactory.CreateMainDbEntityDbHelper())
            {
                var tempFromDate = fromDate.Split(' ');
                var tempToDate = toDate.Split(' ');
                fromDate = tempFromDate[0].Replace('/', '-');
                toDate = tempToDate[0].Replace('/', '-');
                var entityList = dbHelper.FetchMultipleBySqlQuery(string.Format(
                    @"exec ps.KarteksTedadiKala '{0}', '{1}', '{2}', '{3}'", fromDate, toDate, stuff, person));
                return entityList;
            }
        }

        public EntityList GetKarteksTedadiRialiData(string fromDate, string toDate, Guid stuff, Guid person)
        {
            //DebugHelper.Break(); 

            using (var dbHelper = DbHelperFactory.CreateMainDbEntityDbHelper())
            {
                var tempFromDate = fromDate.Split(' ');
                var tempToDate = toDate.Split(' ');
                fromDate = tempFromDate[0].Replace('/', '-');
                toDate = tempToDate[0].Replace('/', '-');
                var entityList = dbHelper.FetchMultipleBySqlQuery(string.Format(
                    @"exec ps.KarteksTedadiRialiKala '{0}', '{1}', '{2}', '{3}'", fromDate, toDate, stuff, person));
                return entityList;
            }
        }

        public EntityList GetSalesAndBuyInvoices(string fromDate, string toDate, Guid financialYear, string financialGroup, string person)
        {
            //DebugHelper.Break(); 

            using (var dbHelper = DbHelperFactory.CreateMainDbEntityDbHelper())
            {
                var tempFromDate = fromDate.Split(' ');
                var tempToDate = toDate.Split(' ');
                fromDate = tempFromDate[0].Replace('/', '-');
                toDate = tempToDate[0].Replace('/', '-');


                financialGroup = financialGroup == null ? "null" : "'" + financialGroup + "'";
                person = person == null ? "null" : "'" + person + "'";

                var entityList = dbHelper.FetchMultipleBySqlQuery(string.Format(
                    @"exec ps.GetSalesAndBuyInvoices '{0}', '{1}', '{2}', {3}, {4}", fromDate, toDate, financialYear,
                    financialGroup, person));

                ps.SalesAndBuyInvoices = entityList;

                return entityList;
            }
        }

        public void OnRunningSalesAndBuyInvoicesReport(Entity reportEntity, Stimulsoft.Report.StiReport report, Dictionary<string, object> parameters)
        {
            var reportDataTable = new DataTable("ReportTable");

            var invoiceType = parameters["InvoiceType"] as string;

            EntityList salesAndBuysList = new EntityList();

            //var accountReviewType = parameters["AccountReviewType"];

            reportDataTable.Columns.Add("IssueDate");
            reportDataTable.Columns.Add("DocType_PersianText");
            reportDataTable.Columns.Add("InvoiceNumber");
            reportDataTable.Columns.Add("TotalStuffAndServicesPrice", typeof(decimal));
            reportDataTable.Columns.Add("GeneralDiscount", typeof(decimal));
            reportDataTable.Columns.Add("StuffAndServicesTotalAmountAfterDiscount", typeof(decimal));
            reportDataTable.Columns.Add("TotalTaxAndToll", typeof(decimal));
            reportDataTable.Columns.Add("FinalAmount", typeof(decimal));

            for (int i = 0; i < ps.SalesAndBuyInvoices.Entities.Count; i++)
            {
                Entity saleAndBuyEntity = ps.SalesAndBuyInvoices.Entities[i];

                var docType = saleAndBuyEntity.GetFieldValue<string>("DocType");

                if (docType == invoiceType)
                {
                    salesAndBuysList.Entities.Add(saleAndBuyEntity);
                }
            }

            foreach (var entity in salesAndBuysList.Entities)
            {
                var row = reportDataTable.NewRow();

                row["IssueDate"] = entity.GetFieldValue<string>("IssueDate");
                row["DocType_PersianText"] = entity.GetFieldValue<string>("DocType_PersianText");
                row["InvoiceNumber"] = entity.GetFieldValue<string>("InvoiceNumber");
                row["TotalStuffAndServicesPrice"] = entity.GetFieldValue<decimal>("TotalStuffAndServicesPrice");
                row["GeneralDiscount"] = entity.GetFieldValue<decimal>("GeneralDiscount");
                row["StuffAndServicesTotalAmountAfterDiscount"] = entity.GetFieldValue<decimal>("StuffAndServicesTotalAmountAfterDiscount");
                row["TotalTaxAndToll"] = entity.GetFieldValue<decimal>("TotalTaxAndToll");
                row["FinalAmount"] = entity.GetFieldValue<decimal>("FinalAmount");

                reportDataTable.Rows.Add(row);
            }


            report.Dictionary.DataSources.Clear();

            report.RegData("DataSource1", reportDataTable);
            report.Dictionary.Synchronize();

            StiDataBand dataBand1 = (StiDataBand)report.GetComponentByName("DataBand1");
            dataBand1.DataSourceName = "ReportTable";
            //report.DataSources.Clear();
            //var list = (StiDataBand)report.GetComponentByName("DataBand1"); 
        }

        //internal void OnEntityListOfDataListRequested(Entity dataList, string[] parameterNames, object[] parameterValues, string filterExpression, string sortExpression, int? startRecord, int? maxRecords,
        //    ref EntityList resultEntityList)
        //{

        //}

        public void OnEntityListOfDataListRequested(Entity dataList, string[] parameterNames, string[] parameterValues, string filterExpression, string sortExpression, int? startRecord, int? maxRecords, ref EntityList resultEntityList)
        {
            using (var dbHelper = DbHelperFactory.CreateMainDbEntityDbHelper())
            {
                var invoiceType = parameterValues[5];

                var financialGroup = parameterValues[3] == "" ? "null" : "'" + parameterValues[3] + "'";
                var person = parameterValues[4] == "" ? "null" : "'" + parameterValues[4] + "'";

                filterExpression = string.IsNullOrEmpty(filterExpression) ? "null" :
                    string.Format("N'{0}'", filterExpression.Replace("'", "''"));

                sortExpression = string.IsNullOrEmpty(sortExpression) ? "null" : "'" + sortExpression + "'";

                var query = string.Format("exec ps.GetSalesAndBuyInvoices '{0}','{1}','{2}',{3} ,{4} ,{5} ,{6} ,{7} ,{8} , {9}",
                                                    parameterValues[0], parameterValues[1], parameterValues[2], financialGroup,
                                                    person, invoiceType == null ? "null" : invoiceType, filterExpression, sortExpression, startRecord, maxRecords);

                resultEntityList = dbHelper.FetchMultipleBySqlQuery(query);
            }
        }


        public void OnDataListEntityCountRequested(Entity dataList, string[] parameterNames, string[] parameterValues, string filterExpression, ref int? entityCount)
        {
            using (var dbHelper = DbHelperFactory.CreateMainDbEntityDbHelper())
            {
                if (parameterNames != null)
                {

                    //var financialGroup = parameterValues[3] == "" ? "null" : "'" + parameterValues[3] + "'";
                    //var person = string.IsNullOrEmpty(parameterValues[4])? "null" : string.Format("'{0}'", parameterValues[4]);
                    //var financialYear = parameterValues[3];
                    var financialGroup = parameterValues[3];
                    var person = parameterValues[4];
                    var invoiceType = parameterValues[5];

                    financialGroup = string.IsNullOrEmpty(financialGroup) ? "null" :
                        string.Format("N'{0}'", financialGroup.Replace("'", "''"));

                    filterExpression = string.IsNullOrEmpty(filterExpression) ? "null" :
                        string.Format("N'{0}'", filterExpression.Replace("'", "''"));

                    person = string.IsNullOrEmpty(person) ? "null" :
                        string.Format("N'{0}'", person.Replace("'", "''"));

                    var query = string.Format("exec ps.GetSalesAndBuyInvoices '{0}', '{1}', '{2}', {3}, {4}, {5}, {6}, {7}, {8}, {9}",
                                                        parameterValues[0], parameterValues[1], parameterValues[2], financialGroup,
                                                        person, invoiceType == null ? "null" : invoiceType, filterExpression, "null", "null", "null");

                    var resultEntity = dbHelper.FetchMultipleBySqlQuery(query);

                    if (resultEntity.Entities.Count > 0)
                        entityCount = resultEntity.Entities[0].GetFieldValue<int>("TotalRecordsCount");
                    else
                        entityCount = 0;
                    //var resultEntity = dbHelper.AdoDbHelper.ExecuteScalar(query);

                    //entityCount = (int)resultEntity;
                }
            }
        }

        public Entity GetSalesAndBuyInvoiceReportFormTotalAmounts(string dataListControlFilterExpression)
        {
            var dbHelper = DbHelperFactory.CreateMainDbEntityDbHelper();

            var dataListControlSqlQueryText = dbHelper.FetchSingleBySqlQuery(@"
                select * 
                from afw_DataListsView 
                where FullName = 'ps.SalesAndPurchasesReports'");

            var sqlQuery = string.Format(@"
                select sum(TotalStuffAndServicesPrice) TotalStuffAndServicesPriceSum,
	                sum(TotalTaxAndToll) TotalTaxAndTollSum,
	                sum(Discount) GeneralDiscountSum,
	                sum(StuffAndServicesTotalAmountAfterDiscount) StuffAndServicesTotalAmountAfterDiscountSum,
	                sum(FinalAmount) FinalAmountSum
                from ({0}) SubQuery
                where {1}", dataListControlSqlQueryText.GetFieldValue<string>("SqlQueryText"), dataListControlFilterExpression);

            var resultEntity = dbHelper.FetchSingleBySqlQuery(sqlQuery);

            return resultEntity;
        }

        public Entity GetSeasonalPurchaseAndSalesReportFormTotalAmounts(string dataListControlFilterExpression)
        {
            var dbHelper = DbHelperFactory.CreateMainDbEntityDbHelper();

            var dataListControlSqlQueryText = dbHelper.FetchSingleBySqlQuery(@"
                select * 
                from afw_DataListsView 
                where FullName = 'ps.SeasonalPurchaseAndSalesReports'");

            var sqlQuery = string.Format(@"
                select sum(TotalStuffAndServicesPrice) TotalStuffAndServicesPriceSum,
	                sum(TotalTaxAndToll) TotalTaxAndTollSum,
	                sum(Discount) DiscountSum,
	                sum(StuffAndServicesTotalAmountAfterDiscount) StuffAndServicesTotalAmountAfterDiscountSum,
	                sum(FinalAmount) FinalAmountSum
                from ({0}) SubQuery
                where {1}", dataListControlSqlQueryText.GetFieldValue<string>("SqlQueryText"), dataListControlFilterExpression);

            var resultEntity = dbHelper.FetchSingleBySqlQuery(sqlQuery);

            return resultEntity;
        }

        public Entity GetInvoiceDetailedReportSummaryData(string filterExpression)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            string query = string.Format(@"
                select sum(Quantity) TotalInvoicesStuffQuantity, 
                    sum (TotalPrice) TotalPriceSum,
	                sum (TotalPriceAfterDiscount) TotalPriceAfterDiscountSum,  
	                sum (TaxAndToll) TaxAndTollSum
                from ps_SaleAndBuyInvoiceDetailsReportView 
                where {0}", filterExpression);

            return dbHelper.FetchSingleBySqlQuery(query);
        }
    }
}

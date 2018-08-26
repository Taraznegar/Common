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
    class WMReportsBL
    {

        public void OnEntityListOfStuffsCirculationReportRequested(Entity dataList, string[] parameterNames, string[] parameterValues, 
            string filterExpression, string sortExpression, int? startRecord, int? maxRecords,
            ref EntityList resultEntityList)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            filterExpression = string.IsNullOrEmpty(filterExpression) ? "null" :
                string.Format("N'{0}'", filterExpression.Replace("'", "''"));

            var fromDate = string.IsNullOrEmpty(parameterValues[0]) ? "null" : string.Format("'{0}'", parameterValues[0]);

            var query = string.Format("exec wm.StuffsCirculationReport {0}, {1}, {2}, {3}",
                filterExpression,
                fromDate,
                startRecord != null ? startRecord.ToString() : "null",
                maxRecords != null ? maxRecords.ToString() : "null");

            resultEntityList = dbHelper.FetchMultipleBySqlQuery(query);
        }

        public void OnStuffsCirculationReportEntityCountRequested(Entity dataList, string[] parameterNames, string[] parameterValues, string filterExpression,
           ref int? entityCount)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            filterExpression = string.IsNullOrEmpty(filterExpression) ? "null" :
                string.Format("N'{0}'", filterExpression.Replace("'", "''"));

            var fromDate = string.IsNullOrEmpty(parameterValues[0]) ? "null" : string.Format("'{0}'", parameterValues[0]);

            var query = string.Format("exec wm.StuffsCirculationReport {0}, {1}, {2}, {3}",
                filterExpression, fromDate, 1, 1);

            var resultEntity = dbHelper.FetchMultipleBySqlQuery(query, 1, 1);

            if (resultEntity.Entities.Count > 0)
                entityCount = resultEntity.Entities[0].GetFieldValue<int>("TotalRecordsCount");
            else
                entityCount = 0;
        }


        public void OnEntityListOfStuffsStockReportRequested(Entity dataList, string[] parameterNames, string[] parameterValues,
            string filterExpression, string sortExpression, int? startRecord, int? maxRecords,
            ref EntityList resultEntityList)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            filterExpression = string.IsNullOrEmpty(filterExpression) ? "null" :
                string.Format("N'{0}'", filterExpression.Replace("'", "''"));

            sortExpression = string.IsNullOrEmpty(sortExpression) ? "null" : string.Format("'{0}'", sortExpression);

            var query = string.Format("exec wm.StuffsStockReport {0}, {1}, {2}, {3}, {4}, {5}",
                parameterValues[0],
                parameterValues[1],
                filterExpression, 
                sortExpression,
                startRecord != null ? startRecord.ToString() : "null",
                maxRecords != null ? maxRecords.ToString() : "null");

            resultEntityList = dbHelper.FetchMultipleBySqlQuery(query);
        }

        public void OnStuffsStockReportEntityCountRequested(Entity dataList, string[] parameterNames, string[] parameterValues, string filterExpression,
           ref int? entityCount)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            filterExpression = string.IsNullOrEmpty(filterExpression) ? "null" :
                string.Format("N'{0}'", filterExpression.Replace("'", "''"));

            var query = string.Format("exec wm.StuffsStockReport {0}, {1}, {2}, {3}, {4}, {5}",
                parameterValues[0], parameterValues[1], filterExpression, "null", 1, 1);

            var resultEntity = dbHelper.FetchMultipleBySqlQuery(query, 1, 1);

            if (resultEntity.Entities.Count > 0)
                entityCount = resultEntity.Entities[0].GetFieldValue<int>("TotalRecordsCount");
            else
                entityCount = 0;
        }

        public EntityList GetKarteksTedadiRialiData(string fromDate, string toDate, Guid stuff, Guid? person, Guid? stuffLocation, Guid? organizationUnit, Guid? financialDocType)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var tempFromDate = fromDate.Split(' ');
            var tempToDate = toDate.Split(' ');
            fromDate = tempFromDate[0].Replace('/', '-');
            toDate = tempToDate[0].Replace('/', '-');
            string personQ = person == null ? "null" : string.Format("'{0}'", person);
            string stuffLocationQ = stuffLocation == null ? "null" : string.Format("'{0}'", stuffLocation);
            string organizationUnitQ = organizationUnit == null ? "null" : string.Format("'{0}'", organizationUnit);
            string financialDocTypeQ = financialDocType == null ? "null" : string.Format("'{0}'", financialDocType);
            var entityList = dbHelper.FetchMultipleBySqlQuery(string.Format(
                @"exec wm.KarteksTedadiRialiKala '{0}', '{1}', '{2}', {3}, {4}, {5}, {6}",
                fromDate, toDate, stuff, personQ, stuffLocationQ, organizationUnitQ, financialDocTypeQ));
            return entityList;
        }

        public EntityList GetKarteksTedadiData(string fromDate, string toDate, Guid stuff, Guid? person, Guid? stuffLocation, Guid? organizationUnit, Guid? financialDocType)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var tempFromDate = fromDate.Split(' ');
            var tempToDate = toDate.Split(' ');
            fromDate = tempFromDate[0].Replace('/', '-');
            toDate = tempToDate[0].Replace('/', '-');
            string personQ = person == null ? "null" : string.Format("'{0}'", person);
            string stuffLocationQ = stuffLocation == null ? "null" : string.Format("'{0}'", stuffLocation);
            string organizationUnitQ = organizationUnit == null ? "null" : string.Format("'{0}'", organizationUnit);
            string financialDocTypeQ = financialDocType == null ? "null" : string.Format("'{0}'", financialDocType);
            var entityList = dbHelper.FetchMultipleBySqlQuery(string.Format(
                @"exec wm.KarteksTedadiKala '{0}', '{1}', '{2}', {3}, {4}, {5}, {6}",
                fromDate, toDate, stuff, personQ, stuffLocationQ, organizationUnitQ, financialDocTypeQ));
            return entityList;
        }
    }
}

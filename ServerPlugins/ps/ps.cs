using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Reflection;
using AppFramework.DataAccess;
using System.Diagnostics;
using AppFramework.Helpers;
using AppFramework.AppServer.PurchaseAndSales;
using TarazNegarAppFrameworkPlugin.ServerPlugins;

namespace AppFramework.AppServer
{
    public class ps: ISubsystem
    {
        private SalesInvoiceBL _SalesInvoiceBL;

        public static EntityList SalesAndBuyInvoices;

        public static ps Instance
        {
            get
            {
                return CoreComponent.Instance.GetSubsystemObject("ps") as ps;
            }
        }

        public ps()
        {
            _SalesInvoiceBL = new SalesInvoiceBL();

            if (CoreComponent.Instance.SubsystemObjectExists("ps"))
                throw new AfwException("ps component is already created!");
        }

        public Entity GetInvoiceDetailedReportSummaryData(string filterExpression)
        {
            return new PSReportsBL().GetInvoiceDetailedReportSummaryData(filterExpression);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "TaxAndTollPercent")]
        public void BeforeApplyTaxAndTollPercentChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new TaxAndTollPercentBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "SalesInvoice")]
        public void BeforeApplySalesInvoiceChanges(EntityDbHelper dbHelper, Entity entity)
        {
            //DebugHelper.Break();

            _SalesInvoiceBL.BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.AfterApplyEntityChanges, "SalesInvoice")]
        public void AfterApplySalesInvoiceChanges(EntityDbHelper dbHelper, Entity entity)
        {
            _SalesInvoiceBL.AfterApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "PriceList")]
        public void BeforeApplyPriceListChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new PriceListBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "PriceListStuffItem")]
        public void BeforeApplyPriceListStuffItemChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new PriceListStuffItemBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "PriceListServiceItem")]
        public void BeforeApplyPriceListServiceItemChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new PriceListServiceItemBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.OnRunningReport, "SalesInvoice1")]
        public void OnRunningSalesInvoice1Report(Entity reportEntity, Stimulsoft.Report.StiReport report, Dictionary<string, object> parameters)
        {
            //DebugHelper.Break();

            new SalesInvoiceBL().OnRunningSalesInvoice1Report(reportEntity, report, parameters);
        }

        [ServerEvent(ServerEventTypes.OnRunningReport, "SalesInvoice2")]
        public void OnRunningSalesInvoice2Report(Entity reportEntity, Stimulsoft.Report.StiReport report, Dictionary<string, object> parameters)
        {
            //DebugHelper.Break();

            new SalesInvoiceBL().OnRunningSalesInvoice1Report(reportEntity, report, parameters);
        }

        [ServerEvent(ServerEventTypes.OnRunningReport, "SalesAndBuyInvoicesReport")]
        public void OnRunningSalesAndBuyInvoicesReport(Entity reportEntity, Stimulsoft.Report.StiReport report, Dictionary<string, object> parameters)
        {
            //DebugHelper.Break();

            //new PSReportsBL().OnRunningSalesAndBuyInvoicesReport(reportEntity, report, parameters);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "ReturnFromSales")]
        public void BeforeApplyReturnFromSalesChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new ReturnFromSalesBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.AfterApplyEntityChanges, "ReturnFromSales")]
        public void AfterApplyReturnFromSalesChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new ReturnFromSalesBL().AfterApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "ReturnFromBuy")]
        public void BeforeApplyReturnFromBuyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new ReturnFromBuyBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.AfterApplyEntityChanges, "ReturnFromBuy")]
        public void AfterApplyReturnFromBuyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new ReturnFromBuyBL().AfterApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "StuffRequest")]
        public void BeforeApplyStockTransferChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new StuffRequestBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.AfterApplyEntityChanges, "StuffRequest")]
        public void AfterApplyStockTransferChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new StuffRequestBL().AfterApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "BuyInvoice")]
        public void BeforeApplyBuyInvoiceChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new BuyInvoiceBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.AfterApplyEntityChanges, "BuyInvoice")]
        public void AfterApplyBuyInvoiceChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new BuyInvoiceBL().AfterApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "Config")]
        public void BeforeApplyConfigChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new PsConfigBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "CanceledSalesInvoiceInfo")]
        public void BeforeApplyCanceledSalesInvoiceInfoChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new CanceledSalesInvoiceInfoBL().BeforeApplyChanges(dbHelper, entity);
        }

        public EntityList GetSalesAndBuyInvoices(string fromDate, string toDate, Guid financialYear, string financialGroup, string person)
        {
            return new PSReportsBL().GetSalesAndBuyInvoices(fromDate, toDate, financialYear, financialGroup, person);
        }

        public Entity GetInvoiceItemStuffInfo(Guid stuffID)
        {
            return new SalesInvoiceItemBL().GetStuffInfo(stuffID);
        }

        public int? GetStuffPrice(Guid stuffID)
        {
            //DebugHelper.Break();
            var UnitPrice = new PriceListBL().GetStuffPrice(stuffID);
            return UnitPrice;
        }

        public int? GetServicePrice(Guid serviceID)
        {
            var UnitPrice = new PriceListBL().GetServicePrice(serviceID);
            return UnitPrice;
        }

        public EntityList GetKartksNumberOfStuffData(string fromDate, string toDate, Guid stuff, Guid person)
        {
            var entityList = new PSReportsBL().GetKartksNumberOfStuffData(fromDate, toDate, stuff, person);
            return entityList;
        }

        public EntityList GetKarteksTedadiRialiData(string fromDate, string toDate, Guid stuff, Guid person)
        {
            var entityList = new PSReportsBL().GetKarteksTedadiRialiData(fromDate, toDate, stuff, person);
            return entityList;
        }

        public bool IsConvertedToInvoice(int InternalNumber1, bool isAmani, Guid organizationUnit)
        {
            return new SalesInvoiceBL().IsConvertedToInvoice(InternalNumber1, isAmani, organizationUnit);
        }

        public void CreateInvoiceFromProforma1(Guid proformaID, Guid financialYearID)
        {
            new SalesInvoiceBL().CreateInvoiceFromProforma(proformaID, financialYearID);
        }

        public void CreateInvoiceFromProforma2(Guid proformaID, string saleInvoice_InvoiceNumber, DateTime issueDate, string requestNumber, Guid financialYearID)
        {
            new SalesInvoiceBL().CreateInvoiceFromProforma(proformaID, saleInvoice_InvoiceNumber, issueDate, requestNumber, financialYearID);
        }

        public EntityList GetVosolMotalebat(Guid invoiceID, DateTime todayDate, DateTime Tarikh7RozBad)
        {
            var entityList = new SalesInvoiceBL().GetVosolMotalebat(invoiceID, todayDate, Tarikh7RozBad);
            return entityList;
        }

        public int GetSalesInvoiceDefaultNumber(Guid organizationUnit, Guid financialYearID, Guid financialGroupID, Guid financialDocTypeID, bool isAmani)
        {
            return new SalesInvoiceBL().GetSalesInvoiceDefaultNumber(organizationUnit, financialYearID, financialGroupID, financialDocTypeID, isAmani);
        }

        public EntityList GetGardesheKalahayeMoshtari(Guid? type, DateTime? issueDateBegin, DateTime? issueDateEnd, Guid person, Guid? stuffLabel)
        {
            return new SalesInvoiceBL().GetGardesheKalahayeMoshtari(type, issueDateBegin, issueDateEnd, person, stuffLabel);
        }

        public void DeleteSalesInvoiceAndCreateCanceledSalesInvoiceInfo(Guid id)
        {
            new SalesInvoiceBL().DeleteSalesInvoiceAndCreateCanceledSalesInvoiceInfo(id);
        }

        public string GetSalesInvoiceFinancialDocTypeName(Guid invoiceID)
        {
            return new SalesInvoiceBL().GetFinancialDocTypeName(invoiceID);
        }

        public long GetMaxRequestNumber(Guid organizationUnit)
        {
            return new SalesInvoiceBL().GetMaxRequestNumber(organizationUnit);
        }

        public Entity GetSalesAndBuyInvoiceReportFormTotalAmounts(string dataListControlFilterExpression)
        {
            return new PSReportsBL().GetSalesAndBuyInvoiceReportFormTotalAmounts(dataListControlFilterExpression);
        }

        public Entity GetSeasonalPurchaseAndSalesReportFormTotalAmounts(string dataListControlFilterExpression)
        {
            return new PSReportsBL().GetSeasonalPurchaseAndSalesReportFormTotalAmounts(dataListControlFilterExpression);
        }

        public EntityList GenerateReturnFromSalesItems(Guid returnFromSalesID, Guid salesInvoiceID)
        {
            return new ReturnFromSalesBL().GenerateItems(returnFromSalesID, salesInvoiceID);
        }

        public EntityList GenerateReturnFromBuyItems(Guid returnFromSalesID, Guid salesInvoiceID)
        {
            return new ReturnFromBuyBL().GenerateItems(returnFromSalesID, salesInvoiceID);
        }

        public void CopyFinancialYearSettings(Guid sourceFinancialYearID, Guid destinationFinancialYearID)
        {
        }
    }
}

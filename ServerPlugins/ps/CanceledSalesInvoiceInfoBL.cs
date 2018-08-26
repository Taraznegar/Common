using AppFramework;
using AppFramework.AppServer;
using AppFramework.DataAccess;
using AppFramework.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace AppFramework.AppServer.PurchaseAndSales
{
    public class CanceledSalesInvoiceInfoBL : EntityBL
    {
        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify))
            {
                var canceledSalesInvoiceInfoExists = dbHelper.EntityExists("ps.CanceledSalesInvoiceInfo",
                    string.Format("OrganizationUnit = '{0}' and FinancialDocType = '{1}' and FinancialYear = '{2}' and InvoiceNumber = '{3}' and  ID <> '{4}'",
                        entity.GetFieldValue<Guid>("OrganizationUnit"),
                        entity.GetFieldValue<Guid>("FinancialDocType"),
                        entity.GetFieldValue<Guid>("FinancialYear"),
                        entity.GetFieldValue<int>("InvoiceNumber"),
                        entity.GetFieldValue<Guid>("ID")));

                if (canceledSalesInvoiceInfoExists)
                    throw new AfwException("ابطال این فاکتور قبلا ثبت شده است.");

                var salesInvoiceExists = dbHelper.EntityExists("ps.SalesInvoice",
                    string.Format(@"OrganizationUnit = '{0}' 
                        and FinancialDocType = '{1}' 
                        and FinancialYear = '{2}' 
                        and InvoiceNumber = '{3}' 
                        and IsProforma = 0 
                        and IsAmani = 0",
                        entity.GetFieldValue<Guid>("OrganizationUnit"),
                        entity.GetFieldValue<Guid>("FinancialDocType"),
                        entity.GetFieldValue<Guid>("FinancialYear"),
                        entity.GetFieldValue<int>("InvoiceNumber")));

                if (salesInvoiceExists)
                    throw new AfwException("ابتدا فاکتور را حذف نمایید.");
            }
        }
    }
}

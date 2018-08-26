using AppFramework;
using AppFramework.AppServer;
using AppFramework.DataAccess;
using AppFramework.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace AppFramework.AppServer.ReceiveAndPay
{
    public class SettingBL
    {
        public string GetAutomaticAccDocSettingName(string docKindName)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            Entity automaticAccDocSetting = null;

            if (docKindName.IsIn("ReceiveReceipt", "PayReceipt", "ReceivedChequeStatusChange", "PaidChequeStatusChange"))
                automaticAccDocSetting = dbHelper.FetchSingle("rp.Setting", null, null);

            if (docKindName.IsIn("SalesInvoice", "BuyInvoice"))
                automaticAccDocSetting = dbHelper.FetchSingle("ps.config", null, null);
            
            string automaticAccDocSettingName = "";
            Guid? automaticAccDocSettingValue = null;
            if (automaticAccDocSetting != null)
            {
                switch (docKindName)
                {
                    case "ReceiveReceipt":
                        automaticAccDocSettingValue = automaticAccDocSetting.GetFieldValue<Guid?>("ReceiveReceiptAutomaticAccDocSetting");
                        if (automaticAccDocSettingValue == null)
                            throw new AfwException("تنظیمات سند حسابداری اتوماتیک برای رسید دریافت تعیین نشده است.");

                        automaticAccDocSettingName = 
                            OptionSetHelper.GetOptionSetItemName(automaticAccDocSetting.GetFieldValue<Guid>("ReceiveReceiptAutomaticAccDocSetting"));
                        break;

                    case "PayReceipt":
                        automaticAccDocSettingValue = automaticAccDocSetting.GetFieldValue<Guid?>("PayReceiptAutomaticAccDocSetting");
                        if (automaticAccDocSettingValue == null)
                            throw new AfwException("تنظیمات سند حسابداری اتوماتیک برای رسید پرداخت تعیین نشده است.");

                        automaticAccDocSettingName = 
                            OptionSetHelper.GetOptionSetItemName(automaticAccDocSetting.GetFieldValue<Guid>("PayReceiptAutomaticAccDocSetting"));
                        break;

                    case "ReceivedChequeStatusChange":
                        automaticAccDocSettingValue =automaticAccDocSetting.GetFieldValue<Guid?>("ReceivedChequeStatusChangeAutomaticAccDocSetting");
                        if (automaticAccDocSettingValue == null)
                            throw new AfwException("تنظیمات سند حسابداری اتوماتیک برای تغییر وضعیت چک دریافتی تعیین نشده است.");

                        automaticAccDocSettingName = 
                            OptionSetHelper.GetOptionSetItemName(automaticAccDocSetting.GetFieldValue<Guid>("ReceivedChequeStatusChangeAutomaticAccDocSetting"));
                        break;

                    case "PaidChequeStatusChange":
                        automaticAccDocSettingValue = automaticAccDocSetting.GetFieldValue<Guid?>("PaidChequeStatusChangeAutomaticAccDocSetting");
                        if (automaticAccDocSettingValue == null)
                            throw new AfwException("تنظیمات سند حسابداری اتوماتیک برای تغییر وضعیت چک پرداختی تعیین نشده است.");

                        automaticAccDocSettingName = 
                            OptionSetHelper.GetOptionSetItemName(automaticAccDocSetting.GetFieldValue<Guid>("PaidChequeStatusChangeAutomaticAccDocSetting"));
                        break;

                    case "SalesInvoice":
                        automaticAccDocSettingValue = automaticAccDocSetting.GetFieldValue<Guid?>("SalesInvoiceAutomaticAccDocSetting");
                        if (automaticAccDocSettingValue == null)
                            throw new AfwException("تنظیمات سند حسابداری اتوماتیک برای فاکتور فروش تعیین نشده است.");

                        automaticAccDocSettingName =
                            OptionSetHelper.GetOptionSetItemName(automaticAccDocSetting.GetFieldValue<Guid>("SalesInvoiceAutomaticAccDocSetting"));
                        break;

                    case "BuyInvoice":
                        automaticAccDocSettingValue = automaticAccDocSetting.GetFieldValue<Guid?>("BuyInvoiceAutomaticAccDocSetting");
                        if (automaticAccDocSettingValue == null)
                            throw new AfwException("تنظیمات سند حسابداری اتوماتیک برای فاکتور خرید تعیین نشده است.");

                        automaticAccDocSettingName =
                            OptionSetHelper.GetOptionSetItemName(automaticAccDocSetting.GetFieldValue<Guid>("BuyInvoiceAutomaticAccDocSetting"));
                        break;
                }
            }

            return automaticAccDocSettingName;
        }
    }
}

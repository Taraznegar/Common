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
    public class ChequeStatusChangeAccSettingBL : EntityBL
    {
        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify))
            {
                var chequeTypeName = OptionSetHelper.GetOptionSetItemName(entity.GetFieldValue<Guid>("ChequeType"));

                var filter = "";
                if (chequeTypeName == "Received")
                {
                    filter = string.Format(@"ReceivedChequeStatus is not null and ReceivedChequeStatus = '{0}' and AccountInCoding = '{1}' and FinancialYear = '{2}' and ID <> '{3}'",
                                   entity.GetFieldValue<Guid?>("ReceivedChequeStatus"),
                                   entity.GetFieldValue<Guid>("AccountInCoding"),
                                   entity.GetFieldValue<Guid>("FinancialYear"),
                                   entity.GetFieldValue<Guid>("ID"));
                }
                else if (chequeTypeName == "Paid")
                {
                    filter = string.Format(@"PaidChequeStatus is not null and PaidChequeStatus = '{0}' and AccountInCoding = '{1}' and FinancialYear = '{2}' and ID <> '{3}'",
                                   entity.GetFieldValue<Guid?>("PaidChequeStatus"),
                                   entity.GetFieldValue<Guid>("AccountInCoding"),
                                   entity.GetFieldValue<Guid>("FinancialYear"),
                                   entity.GetFieldValue<Guid>("ID"));
                }

                if (dbHelper.EntityExists("rp.ChequeStatusChangeAccSetting", filter))
                {
                    throw new AfwException("وضعیت تکراری است");
                }


                if ((chequeTypeName == "Received" && entity.GetFieldValue<Guid?>("ReceivedChequeStatus") == null) ||
                    (chequeTypeName == "Paid" && entity.GetFieldValue<Guid?>("PaidChequeStatus") == null))
                    throw new AfwException("وضعیت مقدار ندارد");
            }
        }

        public Guid GetChequeStatusChangeAccSettingAccAccountID(Guid chequeStatusChangeAccSettingAccountID, string accountName)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var chequeStatusChangeAccSettingEntity = dbHelper.FetchSingleByID("rp.ChequeStatusChangeAccSetting", chequeStatusChangeAccSettingAccountID, null);

            if (!chequeStatusChangeAccSettingEntity.FieldExists(accountName))
                throw new AfwException("Invalid ChequeStatusChangeAccSetting account name!");

            var accountID = chequeStatusChangeAccSettingEntity.GetFieldValue<Guid?>(accountName);
            if (accountID == null)
                throw new AfwException("در تنظیمات حساب تغییر وضعیت چک، حساب کدینگ مشخص نشده است.");
            else
                return (Guid)accountID;

        }
    }
}

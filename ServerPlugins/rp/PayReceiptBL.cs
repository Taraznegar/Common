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
    public class PayReceiptBL : FinancialOpBaseBL
    {
        public PayReceiptBL() : base("PayReceipt") { }

        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            var payReceiptID = entity.GetFieldValue<Guid>("ID");

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify))
            {
                if (dbHelper.EntityExists("rp.PayReceipt",
                    string.Format("ReceiptNumber = {0} and FinancialYear = '{1}' and ID <> '{2}'",
                        entity.GetFieldValue<int>("ReceiptNumber"), entity.GetFieldValue<Guid>("FinancialYear"),
                        payReceiptID)))
                {
                    throw new AfwException("شماره این رسید قبلا ثبت شده است");
                }

                if (entity.GetFieldValue<int>("ReceiptNumber") < 1)
                    throw new AfwException("شماره رسید نباید منفی باشد");

                CheckPayeeChangeEnable(entity);
            }

            if (entity.ChangeStatus == EntityChangeTypes.Delete)
                acc.Instance.DeleteAccDocItems(entity.GetFieldValue<Guid?>("AccDoc"), "RefOp_PayReceipt", payReceiptID);
        }

        public override void AfterApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.AfterApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus == EntityChangeTypes.Delete)
                acc.Instance.DeleteAccDocMaster(entity.GetFieldValue<Guid?>("AccDoc"), "rp.PayReceipt", entity.GetFieldValue<Guid>("ID"));
        }
        public void UpdateAccDocItems(Guid payReceiptID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            using (var tranManager = new DbTransactionManager(dbHelper))
            {
                try
                {
                    var automaticAccDocSettingName = rp.Instance.GetAutomaticAccDocSetting("PayReceipt");
                    if (automaticAccDocSettingName != "Disabled")
                    {
                        var payReceiptEntity = dbHelper.FetchSingleByID("rp.PayReceipt", payReceiptID, null);
                        var accDocID = payReceiptEntity.GetFieldValue<Guid?>("AccDoc");

                        CreateOrUpdatePayReceiptAccDocItems(payReceiptEntity, (Guid)accDocID);

                        tranManager.Commit();
                    }
                }
                catch (Exception ex)
                {
                    throw new Exception("مشکل در بروزرسانی سند حسابداری.\r\n", ex);
                }
            }
        }

        public void FinalSavePayReceipt(Entity entity)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            using (var tranManager = new DbTransactionManager(dbHelper))
            {
                try
                {
                    dbHelper.ApplyChanges(entity);

                    var automaticAccDocSettingName = rp.Instance.GetAutomaticAccDocSetting("PayReceipt");
                    if (automaticAccDocSettingName != "Disabled")
                    {
                        var payReceiptID = entity.GetFieldValue<Guid>("ID");
                        var issueDate = entity.GetFieldValue<DateTime>("ReceiptDate");
                        var financialYear = entity.GetFieldValue<Guid>("FinancialYear");
                        var financialDocTypeID = entity.GetFieldValue<Guid>("FinancialDocType");
                        var organizationUnitID = entity.GetFieldValue<Guid>("OrganizationUnit");
                        var financialGroup = entity.GetFieldValue<Guid>("FinancialGroup");
                        var desc = "بابت رسید پرداخت شماره " + entity.GetFieldValue<string>("ReceiptNumber");
                        var accDocID = entity.GetFieldValue<Guid?>("AccDoc");

                        if (accDocID == null && automaticAccDocSettingName == "ByDay")
                        {
                            accDocID = acc.Instance.GetTodayAccDoc("PayReceipt", financialDocTypeID, issueDate, organizationUnitID);
                        }

                        acc.Instance.InsertOrUpdateAccDocMaster(ref accDocID, "PayReceipt", issueDate, financialYear, financialGroup, desc, true);

                        if (entity.GetFieldValue<Guid?>("AccDoc") == null)
                        {
                            entity.SetFieldValue("AccDoc", accDocID);
                            dbHelper.UpdateEntity(entity);
                        }

                        CreateOrUpdatePayReceiptAccDocItems(entity, (Guid)accDocID);

                        tranManager.Commit();

                    }
                }
                catch (Exception ex)
                {
                    throw new Exception("مشکل در عملیات ثبت نهایی.", ex);
                }
            }
        }

        private void CreateOrUpdatePayReceiptAccDocItems(Entity payReceiptEntity, Guid accDocID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var opFieldNameInItemEntity = "RefOp_PayReceipt";

            var payReceiptID = payReceiptEntity.GetFieldValue<Guid>("ID");
            var financialYearID = payReceiptEntity.GetFieldValue<Guid>("FinancialYear");

            using (var tranManager = new DbTransactionManager(dbHelper))
            {
                try
                {
                    acc.Instance.DeleteAccDocItems(accDocID, opFieldNameInItemEntity, payReceiptID);

                    var payReceiptItems = dbHelper.FetchMultiple("rp_PayReceiptItemsView",
                        string.Format("PayReceipt = '{0}'", payReceiptID), null, null, null, null).Entities;
                    List<Entity> accDocItemList = new List<Entity>();

                    foreach (var payReceiptItem in payReceiptItems)
                    {
                        var personID = payReceiptItem.GetFieldValue<Guid>("Payee");
                        var desc = payReceiptItem.GetFieldValue<string>("ItemDescription");
                        var amount = payReceiptItem.GetFieldValue<decimal>("Amount");

                        Guid? creditorAccount = null;
                        Guid? debtorAccount = null;

                        Guid? cashOwnerPerson = payReceiptItem.GetFieldValue<Guid?>("CashOwnerPerson");

                        Guid? debtor_CostCenter = payReceiptItem.GetFieldValue<Guid?>("Debtor_CostCenter");
                        Guid? debtor_Project = payReceiptItem.GetFieldValue<Guid?>("Debtor_Project");

                        GetAccDocItemAccounts(payReceiptItem, financialYearID, out creditorAccount, out debtorAccount);

                        /*بدهکار***/
                        var entity = new Entity();
                        entity.AddField("accountID", (Guid)debtorAccount);
                        entity.AddField("personID", personID);
                        entity.AddField("costCenterID", debtor_CostCenter);
                        entity.AddField("projectID", debtor_Project);
                        entity.AddField("foreignCurrencyID", null);
                        entity.AddField("note", desc);
                        entity.AddField("creditorAmount", 0);
                        entity.AddField("debtorAmount", amount);
                        entity.AddField("isActive", true);

                        accDocItemList.Add(entity);

                        /*بستانکار***/
                        entity = new Entity();
                        entity.AddField("accountID", (Guid)creditorAccount);
                        entity.AddField("personID", cashOwnerPerson);
                        entity.AddField("costCenterID", null);
                        entity.AddField("projectID", null);
                        entity.AddField("foreignCurrencyID", null);
                        entity.AddField("note", desc);
                        entity.AddField("creditorAmount", amount);
                        entity.AddField("debtorAmount", 0);
                        entity.AddField("isActive", true);

                        accDocItemList.Add(entity);
                    }

                    acc.Instance.InsertAccDocItems(accDocID, opFieldNameInItemEntity, payReceiptID, accDocItemList);
                    tranManager.Commit();

                }
                catch (Exception ex)
                {
                    throw new Exception("Error in CreatePayReceiptAccDocItems.", ex);
                }
            }
        }

        private void GetAccDocItemAccounts(Entity payReceiptItem, Guid financialYearID, out Guid? creditorAccount, out Guid? debtorAccount)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            creditorAccount = payReceiptItem.GetFieldValue<Guid?>("CreditorAccount");
            debtorAccount = payReceiptItem.GetFieldValue<Guid?>("DebtorAccount");

            if (creditorAccount == null || debtorAccount == null)
            {
                throw new AfwException("حساب بستانکار یا بدهکار وجود ندارد");
            }
        }

        public void UpdateTotalAmount(Guid payReceiptID)
        {

            var dbHelper = CoreComponent.Instance.MainDbHelper;

            try
            {
                var totalAmount = GetReceiptTotalAmount(payReceiptID);

                var entity = dbHelper.FetchSingle("rp.PayReceipt", string.Format("ID = '{0}'", payReceiptID), null);
                entity.SetFieldValue("TotalAmount", totalAmount);
                dbHelper.UpdateEntity(entity);

            }
            catch (Exception ex)
            {
                throw new Exception(string.Format("خطا در ثبت مبلغ نهایی.", ex));
            }
        }

        private decimal? GetReceiptTotalAmount(Guid payReceiptID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            decimal? totalAmount = null;
            try
            {
                string sqlQuery = string.Format(@"
                    select  SUM( case when PayType.Name = 'Cheque' then Cheque.Amount
			            when PayType.Name = 'Havale' then Havale.Amount
			            when PayType.Name = 'Naghd' then Naghd.Amount
			            when PayType.Name = 'ChekeZemanat' then ChekeZemanat.Amount
		                end
		                )
                    from rp_PayReceiptItems PayReceiptItem
	                    inner join rp_PayTypes PayType on PayType.ID = PayReceiptItem.PayType
	                    left join rp_PaidCheques Cheque on Cheque.ID = PayReceiptItem.FinancialItem_Cheque
	                    left join rp_HavalePardakhti Havale on Havale.ID = PayReceiptItem.FinancialItem_Havale
	                    left join rp_NaghdePardakhti Naghd on Naghd.ID = PayReceiptItem.FinancialItem_Naghd
	                    left join rp_ChekeZemanatePardakhti ChekeZemanat on ChekeZemanat.ID = PayReceiptItem.FinancialItem_ChekeZemanat
                    where PayReceipt = '{0}'", payReceiptID);
                totalAmount = dbHelper.AdoDbHelper.ExecuteScalar<decimal?>(sqlQuery);
                if (totalAmount == null)
                    totalAmount = 0;

            }
            catch (Exception ex)
            {
                throw new Exception("Error in GetReceiptTotalAmount.", ex);
            }

            return totalAmount;
        }

        private string GetFinancialItemEntityName(Entity item)
        {
            string financialItemEntityName = "";

            if (item.GetFieldValue<Guid?>("FinancialItem_Cheque") != null)
                financialItemEntityName = "rp.PaidCheque";
            else
                if (item.GetFieldValue<Guid?>("FinancialItem_Havale") != null)
                    financialItemEntityName = "rp.HavalePardakhti";
                else
                    if (item.GetFieldValue<Guid?>("FinancialItem_Naghd") != null)
                        financialItemEntityName = "rp.NaghdePardakhti";
                    else
                        if (item.GetFieldValue<Guid?>("FinancialItem_ChekeZemanati") != null)
                            financialItemEntityName = "rp.ChekeZemanatePardakhti";

            return financialItemEntityName;
        }

        private string GetFinancialItemIDFieldName(Entity item)
        {
            string financialItemIDFieldName = "";

            if (item.GetFieldValue<Guid?>("FinancialItem_Cheque") != null)
                financialItemIDFieldName = "FinancialItem_Cheque";
            else
                if (item.GetFieldValue<Guid?>("FinancialItem_Havale") != null)
                    financialItemIDFieldName = "FinancialItem_Havale";
                else
                    if (item.GetFieldValue<Guid?>("FinancialItem_Naghd") != null)
                        financialItemIDFieldName = "FinancialItem_Naghd";
                    else
                        if (item.GetFieldValue<Guid?>("FinancialItem_ChekeZemanati") != null)
                            financialItemIDFieldName = "FinancialItem_ChekeZemanati";

            return financialItemIDFieldName;
        }

        private void CheckPayeeChangeEnable(Entity entity)
        {
            if (entity.ChangeStatus == EntityChangeTypes.Add)
                return;

            var newPayee = entity.GetFieldValue<Guid?>("Payee");

            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var preEntity = dbHelper.FetchSingleByID("rp.PayReceipt", entity.GetFieldValue<Guid>("ID"), null);
            var prePayee = preEntity.GetFieldValue<Guid?>("Payee");

            if (newPayee != prePayee)
            {
                var items = dbHelper.FetchMultiple("rp.PayReceiptItem",
                    string.Format("PayReceipt = '{0}'", entity.GetFieldValue<Guid>("ID")), null, null, null, null).Entities;
                if (items.Count > 0)
                    throw new AfwException("به دلیل داشتن آیتم اجازه تغییر دریافت کننده را ندارید");
            }
        }


        public Entity GetPayReportSummaryFields(string filterExpression)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            string query = "select sum(Amount) AmountSum from rp_PayReportView ";

            if (filterExpression != "")
                query += " where " + filterExpression;

            return dbHelper.FetchSingleBySqlQuery(query);
        }

    }
}

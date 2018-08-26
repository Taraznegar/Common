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
    public class ReceiveReceiptBL : FinancialOpBaseBL
    {
        public ReceiveReceiptBL() : base("ReceiveReceipt") { }

        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            var receiveReceiptID = entity.GetFieldValue<Guid>("ID");

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify))
            {
                if (dbHelper.EntityExists("rp.ReceiveReceipt",
                         string.Format("ReceiptNumber = {0} and FinancialYear = '{1}' and ID <> '{2}'",
                             entity.GetFieldValue<int>("ReceiptNumber"), entity.GetFieldValue<Guid>("FinancialYear"),
                             receiveReceiptID)))
                {
                    throw new AfwException("شماره این رسید قبلا ثبت شده است");
                }

                if (entity.GetFieldValue<int>("ReceiptNumber") < 1)
                    throw new AfwException("شماره رسید نباید منفی باشد");

                CheckPayerChangeEnable(entity);
            }

            if (entity.ChangeStatus == EntityChangeTypes.Delete)
            {
                acc.Instance.DeleteAccDocItems(entity.GetFieldValue<Guid?>("AccDoc"), "RefOp_ReceiveReceipt", receiveReceiptID);

                if (!(entity.GetFieldValue<string>("CreatorOpName") == null ||
                    entity.GetFieldValue<string>("CreatorOpName") == ""))
                {
                    if (entity.GetFieldValue<string>("CreatorOpName") == "krf.Registration")
                    {
                        var membershipFileSettlement = dbHelper.FetchSingle("krf.MembershipFileSettlement",
                            string.Format("ReceiveReceipt = '{0}'", receiveReceiptID), null);

                        if (membershipFileSettlement != null)
                            dbHelper.DeleteEntity(membershipFileSettlement);
                    }
                }
            }
        }

        public override void AfterApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.AfterApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus == EntityChangeTypes.Delete)
                acc.Instance.DeleteAccDocMaster(
                    entity.GetFieldValue<Guid?>("AccDoc"), 
                    "rp.ReceiveReceipt",
                    entity.GetFieldValue<Guid>("ID"));
        }

        public void UpdateAccDocItems(Guid receiveReceiptID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            using (var tranManager = new DbTransactionManager(dbHelper))
            {
                try
                {
                    var automaticAccDocSettingName = rp.Instance.GetAutomaticAccDocSetting("ReceiveReceipt");
                    if (automaticAccDocSettingName != "Disabled")
                    {
                        var receiveReceiptEntity = dbHelper.FetchSingleByID("rp.ReceiveReceipt", receiveReceiptID, null);
                        var accDocID = receiveReceiptEntity.GetFieldValue<Guid?>("AccDoc");

                        CreateOrUpdateReceiveReceiptAccDocItems(receiveReceiptEntity, (Guid)accDocID);

                        tranManager.Commit();
                    }
                }
                catch (Exception ex)
                {
                    throw new Exception("خطا در بروزرسانی سند حسابداری.\r\n", ex);
                }
            }
        }

        public void FinalSaveReceiveReceipt(Entity entity)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            using (var tranManager = new DbTransactionManager(dbHelper))
            {
                try
                {
                    dbHelper.ApplyChanges(entity);

                    var automaticAccDocSettingName = rp.Instance.GetAutomaticAccDocSetting("ReceiveReceipt");
                    if (automaticAccDocSettingName != "Disabled")
                    {
                        var receiveReceiptID = entity.GetFieldValue<Guid>("ID");
                        var issueDate = entity.GetFieldValue<DateTime>("ReceiptDate");
                        var financialYear = entity.GetFieldValue<Guid>("FinancialYear");
                        var financialDocTypeID = entity.GetFieldValue<Guid>("FinancialDocType");
                        var organizationUnitID = entity.GetFieldValue<Guid>("OrganizationUnit");
                        var receiptTypeID = entity.GetFieldValue<Guid>("ReceiptType");
                        var receiptTypeName = OptionSetHelper.GetOptionSetItemName(receiptTypeID);
                        var financialGroup = entity.GetFieldValue<Guid>("FinancialGroup");
                        var desc = "بابت رسید دریافت شماره " + entity.GetFieldValue<string>("ReceiptNumber");
                        var accDocID = entity.GetFieldValue<Guid?>("AccDoc");

                        if (accDocID == null && automaticAccDocSettingName == "ByDay")
                        {
                            if (receiptTypeName == "Varzesh")
                                accDocID = acc.Instance.GetTodayAccDoc("SportAutomationReceiveReceipt", financialDocTypeID, issueDate, organizationUnitID);
                            else
                                accDocID = acc.Instance.GetTodayAccDoc("ReceiveReceipt", financialDocTypeID, issueDate, organizationUnitID);
                        }

                        if (receiptTypeName == "Varzesh")
                            acc.Instance.InsertOrUpdateAccDocMaster(ref accDocID, "SportAutomationReceiveReceipt", issueDate, financialYear, financialGroup, desc, true);
                        else
                            acc.Instance.InsertOrUpdateAccDocMaster(ref accDocID, "ReceiveReceipt", issueDate, financialYear, financialGroup, desc, true);

                        if (entity.GetFieldValue<Guid?>("AccDoc") == null)
                        {
                            entity.SetFieldValue("AccDoc", accDocID);
                            dbHelper.UpdateEntity(entity);
                        }

                        CreateOrUpdateReceiveReceiptAccDocItems(entity, (Guid)accDocID);

                        tranManager.Commit();
                    }
                }
                catch (Exception ex)
                {
                    throw new Exception("خطا در عملیات ثبت نهایی.\r\n", ex);
                }
            }
        }

        private void CreateOrUpdateReceiveReceiptAccDocItems(Entity receiveReceiptEntity, Guid accDocID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var receiveReceiptItemBL = new ReceiveReceiptItemBL();
            var opFieldNameInItemEntity = "RefOp_ReceiveReceipt";

            var receiveReceiptID = receiveReceiptEntity.GetFieldValue<Guid>("ID");
            var financialYearID = receiveReceiptEntity.GetFieldValue<Guid>("FinancialYear");

            List<Entity> accDocItemList = new List<Entity>();

            using (var tranManager = new DbTransactionManager(dbHelper))
            {
                try
                {
                    acc.Instance.DeleteAccDocItems(accDocID, opFieldNameInItemEntity, receiveReceiptID);

                    var receiveReceiptItems = dbHelper.FetchMultiple("rp_ReceiveReceiptItemsView",
                        string.Format("ReceiveReceipt = '{0}'", receiveReceiptID), null, null, null, null).Entities;

                    foreach (var receiveReceiptItem in receiveReceiptItems)
                    {
                        var personID = receiveReceiptItem.GetFieldValue<Guid>("Payer");
                        var desc = receiveReceiptItem.GetFieldValue<string>("ItemDescription");

                        var debtorDesc = receiveReceiptItem.GetFieldValue<string>("ItemDebtorDescription");
                        var creditorDesc = receiveReceiptItem.GetFieldValue<string>("ItemCreditorDescription");

                        var amount = receiveReceiptItem.GetFieldValue<decimal>("Amount");

                        Guid? creditorAccount = null;
                        Guid? debtorAccount = null;

                        Guid? cashOwnerPerson = receiveReceiptItem.GetFieldValue<Guid?>("CashOwnerPerson");

                        Guid? creditor_CostCenter = receiveReceiptItem.GetFieldValue<Guid?>("Creditor_CostCenter");
                        Guid? creditor_Project = receiveReceiptItem.GetFieldValue<Guid?>("Creditor_Project");

                        receiveReceiptItemBL.GetAccDocItemAccounts(receiveReceiptItem, out creditorAccount, out debtorAccount);

                        //بدهکار
                        var entity = new Entity();
                        entity.AddField("accountID", (Guid)debtorAccount);
                        entity.AddField("personID", cashOwnerPerson);
                        entity.AddField("costCenterID", null);
                        entity.AddField("projectID", null);
                        entity.AddField("foreignCurrencyID", null);
                        entity.AddField("note", debtorDesc);
                        entity.AddField("creditorAmount", 0);
                        entity.AddField("debtorAmount", amount);
                        entity.AddField("isActive", true);

                        accDocItemList.Add(entity);

                        //بستانکار
                        entity = new Entity();
                        entity.AddField("accountID", (Guid)creditorAccount);
                        entity.AddField("personID", personID);
                        entity.AddField("costCenterID", creditor_CostCenter);
                        entity.AddField("projectID", creditor_Project);
                        entity.AddField("foreignCurrencyID", null);
                        entity.AddField("note", creditorDesc);
                        entity.AddField("creditorAmount", amount);
                        entity.AddField("debtorAmount", 0);
                        entity.AddField("isActive", true);

                        accDocItemList.Add(entity);
                    }

                    acc.Instance.InsertAccDocItems(accDocID, opFieldNameInItemEntity, receiveReceiptID, accDocItemList);
                    tranManager.Commit();
                }
                catch (Exception ex)
                {
                    throw ex;
                }
            }
        }

        public void UpdateTotalAmount(Guid receiveReceiptID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            try
            {
                var totalAmount = GetReceiptTotalAmount(receiveReceiptID);

                var entity = dbHelper.FetchSingle("rp.ReceiveReceipt", string.Format("ID = '{0}'", receiveReceiptID), null);
                entity.SetFieldValue("TotalAmount", totalAmount);
                dbHelper.UpdateEntity(entity);

            }
            catch (Exception ex)
            {
                throw new Exception("Error in UpdateTotalAmount.\r\n", ex);
            }
        }

        private decimal? GetReceiptTotalAmount(Guid receiveReceiptID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            decimal? totalAmount = null;
            try
            {
                string sqlQuery = string.Format(@"
                    select sum(
                        case when ReceiveType.Name = 'Cheque' then Cheque.Amount
			                when ReceiveType.Name = 'Safte' then Safte.Amount
			                when ReceiveType.Name = 'Havale' then Havale.Amount
			                when ReceiveType.Name = 'Naghd' then Naghd.Amount
			                when ReceiveType.Name = 'ChekeZemanat' then ChekeZemanat.Amount
			                when ReceiveType.Name = 'Pos' then Pos.Amount
		                end)
                    from rp_ReceiveReceiptItems ReceiveReceiptItem
	                    inner join rp_ReceiveTypes ReceiveType on ReceiveType.ID = ReceiveReceiptItem.ReceiveType
	                    left join rp_ReceivedCheques Cheque on Cheque.ID = ReceiveReceiptItem.FinancialItem_Cheque
	                    left join rp_SafteDaryafti Safte on Safte.ID = ReceiveReceiptItem.FinancialItem_Safte
	                    left join rp_HavaleDaryafti Havale on Havale.ID = ReceiveReceiptItem.FinancialItem_Havale
	                    left join rp_NaghdeDaryafti Naghd on Naghd.ID = ReceiveReceiptItem.FinancialItem_Naghd
	                    left join rp_ChekeZemanateDaryafti ChekeZemanat on ChekeZemanat.ID = ReceiveReceiptItem.FinancialItem_ChekeZemanat
                        left join rp_ReceivedPoses Pos on Pos.ID = ReceiveReceiptItem.FinancialItem_Pos
                    where ReceiveReceipt = '{0}'", receiveReceiptID);

                totalAmount = dbHelper.AdoDbHelper.ExecuteScalar<decimal?>(sqlQuery);
                if (totalAmount == null)
                    totalAmount = 0;
            }
            catch (Exception ex)
            {
                throw new Exception("Error in GetReceiptTotalAmount.\r\n", ex);
            }

            return totalAmount;
        }

        private string GetFinancialItemEntityName(Entity item)
        {
            string financialItemEntityName = "";

            if (item.GetFieldValue<Guid?>("FinancialItem_Cheque") != null)
                financialItemEntityName = "rp.ReceivedCheque";
            else if (item.GetFieldValue<Guid?>("FinancialItem_Havale") != null)
                financialItemEntityName = "rp.HavaleDaryafti";
            else if (item.GetFieldValue<Guid?>("FinancialItem_Naghd") != null)
                financialItemEntityName = "rp.NaghdeDaryafti";
            else if (item.GetFieldValue<Guid?>("FinancialItem_Safte") != null)
                financialItemEntityName = "rp.SafteDaryafti";
            else if (item.GetFieldValue<Guid?>("FinancialItem_ChekeZemanati") != null)
                financialItemEntityName = "rp.ChekeZemanateDaryafti";
            else if (item.GetFieldValue<Guid?>("FinancialItem_Pos") != null)
                financialItemEntityName = "rp.ReceivedPos";

            return financialItemEntityName;
        }

        private string GetFinancialItemIDFieldName(Entity item)
        {
            string financialItemIDFieldName = "";

            if (item.GetFieldValue<Guid?>("FinancialItem_Cheque") != null)
                financialItemIDFieldName = "FinancialItem_Cheque";
            else if (item.GetFieldValue<Guid?>("FinancialItem_Havale") != null)
                financialItemIDFieldName = "FinancialItem_Havale";
            else if (item.GetFieldValue<Guid?>("FinancialItem_Naghd") != null)
                financialItemIDFieldName = "FinancialItem_Naghd";
            else if (item.GetFieldValue<Guid?>("FinancialItem_Safte") != null)
                financialItemIDFieldName = "FinancialItem_Safte";
            else if (item.GetFieldValue<Guid?>("FinancialItem_ChekeZemanati") != null)
                financialItemIDFieldName = "FinancialItem_ChekeZemanati";
            else if (item.GetFieldValue<Guid?>("FinancialItem_Pos") != null)
                financialItemIDFieldName = "FinancialItem_Pos";

            return financialItemIDFieldName;
        }

        private void CheckPayerChangeEnable(Entity entity)
        {
            if (entity.ChangeStatus == EntityChangeTypes.Add)
                return;

            var newPayer = entity.GetFieldValue<Guid?>("Payer");

            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var preEntity = dbHelper.FetchSingleByID("rp.ReceiveReceipt", entity.GetFieldValue<Guid>("ID"), null);
            var prePayer = preEntity.GetFieldValue<Guid?>("Payer");

            if (newPayer != prePayer)
            {
                var items = dbHelper.FetchMultiple("rp.ReceiveReceiptItem",
                    string.Format("ReceiveReceipt = '{0}'", entity.GetFieldValue<Guid>("ID")), null, null, null, null).Entities;
                if (items.Count > 0)
                    throw new AfwException("به دلیل داشتن آیتم اجازه تغییر پرداخت کننده را ندارید");
            }
        }

        public bool ExistReceiveReceipt(Entity entity)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var receiveReciotEntity = dbHelper.FetchSingle("rp.ReceiveReceipt",
                string.Format("CreatorOp = '{0}'", entity.GetFieldValue<Guid>("CreatorOp")), null);

            if (receiveReciotEntity != null && entity.ChangeStatus == EntityChangeTypes.Add)
                return false;
            else
                return true;
        }

        public void SaveQuickSettelmentEntity(Entity receiveReceiptEntity, Entity fileSettlementEntity, bool isWorkShift)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var organizationUnitID = receiveReceiptEntity.GetFieldValue<Guid>("OrganizationUnit");

            if (receiveReceiptEntity.ChangeStatus == EntityChangeTypes.Delete)
                throw new AfwException("receiveReceiptEntity is in Deleted status.");

            using (var tranManager = new DbTransactionManager(dbHelper))
            {
                dbHelper.ApplyChanges(receiveReceiptEntity);

                try
                {
                    if (receiveReceiptEntity.FieldExists("Items"))
                    {
                        var itemsEntityList = receiveReceiptEntity.GetFieldValue<EntityList>("Items");
                        decimal totalAmount = 0;

                        foreach (Entity itemEntity in itemsEntityList.Entities)
                        {
                            var innerItem = itemEntity.GetFieldValue<Entity>("InnerItem");
                            var itemAmount = innerItem.GetFieldValue<decimal?>("Amount");

                            if (innerItem.FieldExists("ShomareHavale"))
                            {
                                var lastShomareHavale = cmn.Instance.GetFieldMaxIntValue("ShomareHavale", "rp_HavaleDaryafti",
                                    string.Format(@"ID in (
                                        select FinancialItem_Havale  
                                        from rp_ReceiveReceiptItems  
                                        where ReceiveReceipt = '{0}' and FinancialItem_Havale is not null)",
                                        receiveReceiptEntity.GetFieldValue<Guid>("ID")));

                                if (lastShomareHavale == 0)
                                    lastShomareHavale = Convert.ToInt32(receiveReceiptEntity.GetFieldValue<Int64>("ReceiptNumber").ToString() + "100");
                                else
                                    lastShomareHavale++;

                                innerItem.SetFieldValue("ShomareHavale", lastShomareHavale);
                            }

                            if (isWorkShift)
                            {
                                var openedWorkShift = dbHelper.FetchSingle("krf.WorkShift",
                                    string.Format("IsOpen = 1 and OrganizationUnit = '{0}'", organizationUnitID), null);

                                if (openedWorkShift != null)
                                {
                                    var workShiftStatusChange = dbHelper.FetchSingle("krf.WorkShiftStatusChange",
                                        string.Format("WorkShift = '{0}' and CloseDateTime is null",
                                            openedWorkShift.GetFieldValue<Guid>("ID")), null);

                                    itemEntity.SetFieldValue("Krf_WorkShiftStatusChange", workShiftStatusChange.GetFieldValue<Guid>("ID"));
                                    itemEntity.SetFieldValue("Debtor_Project", openedWorkShift.GetFieldValue<Guid>("Project"));
                                }
                            }

                            if (itemAmount == null || itemAmount == 0)
                                itemEntity.ChangeStatus = EntityChangeTypes.None;
                            else
                                totalAmount += (decimal)itemAmount;
                        }

                        dbHelper.ApplyChanges(itemsEntityList);

                        if (fileSettlementEntity != null)
                        {
                            if (fileSettlementEntity.FieldExists("TotalAmount"))
                            {
                                if (fileSettlementEntity.ChangeStatus == EntityChangeTypes.Add)
                                    fileSettlementEntity.SetFieldValue("FirstAmount", totalAmount);
                                fileSettlementEntity.SetFieldValue("TotalAmount", totalAmount);
                            }

                            dbHelper.ApplyChanges(fileSettlementEntity);
                        }
                    }

                    tranManager.Commit();
                }
                catch (Exception ex)
                {
                    throw new AfwException("خطا در ثبت..\r\n {0}", ex.Message);
                }
            }
        }

        public EntityList GetReceivedReceiptOptionSetItem()
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var query = @"
                select optionsetItem.ID OptionsetItem, OptionsetItem.Title
                from afw_optionsetItems OptionsetItem
	                inner join afw_optionsets optionset on optionset.ID = optionsetItem.optionsetID
                where optionset.name = 'ReceiptType' and optionsetItem.ID in (select ReceiptType from rp_ReceiveReceipts)
                order by OptionsetItem.Title desc";

            var optionSetItems = dbHelper.FetchMultipleBySqlQuery(query);

            return optionSetItems;
        }

        public Entity GetReceiveReportSummaryFields(string filterExpression)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            string query = "select sum(Amount) AmountSum from rp_ReceiveReportView InnerQuery ";

            if (filterExpression != "")
                query += " where " + filterExpression;

            return dbHelper.FetchSingleBySqlQuery(query);
        }

    }
}

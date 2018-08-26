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
    public class PaidChequeStatusChangeBL : FinancialOpBaseBL
    {
        public PaidChequeStatusChangeBL() : base("PaidChequeStatusChange") { }

        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            var id = entity.GetFieldValue<Guid>("ID");

            if (entity.ChangeStatus == EntityChangeTypes.Delete)
            {
                ValidateDelete(entity);
                acc.Instance.DeleteAccDocItems(entity.GetFieldValue<Guid?>("AccDoc"), "RefOp_PaidChequeStatusChange", id);
            }
        }

        public override void AfterApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.AfterApplyChanges(dbHelper, entity);

            var id = entity.GetFieldValue<Guid>("ID");

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add))
                UpdateChequeStatus(entity.GetFieldValue<Guid>("Cheque"), entity.GetFieldValue<Guid>("NewStatus"));
            else if (entity.ChangeStatus == EntityChangeTypes.Delete)
            {
                if (entity.GetFieldValue<Guid>("Cheque") != rp.Instance.DeletingChequeID)
                {
                    var lastChange = GetLastChequeStatusChange(entity.GetFieldValue<Guid>("Cheque"));
                    if (lastChange != null)
                        UpdateChequeStatus(entity.GetFieldValue<Guid>("Cheque"), lastChange.GetFieldValue<Guid>("NewStatus"));

                    acc.Instance.DeleteAccDocMaster(entity.GetFieldValue<Guid?>("AccDoc"), "rp.PaidChequeStatusChange", id);
                }
            }
        }

        public void CreateChequeStatusChange(Guid chequeID, Guid newStatusID, Guid financialYearID, Guid? financialGroupID,
            DateTime changeDate, string description, bool generateAccDoc)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            using (var tranManager = new DbTransactionManager(dbHelper))
            {
                Guid? previousChangeID = null;
                var previousChange = GetLastChequeStatusChange(chequeID);
                if (previousChange != null)
                    previousChangeID = previousChange.GetFieldValue<Guid>("ID");

                var paidChequeStatusChange = dbHelper.CreateNewEntity("rp.PaidChequeStatusChange");
                paidChequeStatusChange.SetFieldValue("Cheque", chequeID);
                paidChequeStatusChange.SetFieldValue("NewStatus", newStatusID);
                paidChequeStatusChange.SetFieldValue("PreviousStatusChange", previousChangeID);
                paidChequeStatusChange.SetFieldValue("ChangeDate", changeDate);
                paidChequeStatusChange.SetFieldValue("FinancialYear", financialYearID);
                paidChequeStatusChange.SetFieldValue("FinancialGroup", financialGroupID);
                paidChequeStatusChange.SetFieldValue("Description", description);
                dbHelper.ApplyChanges(paidChequeStatusChange);

                if (generateAccDoc)
                    CreateChequeStatusChangeAccDoc(paidChequeStatusChange);

                tranManager.Commit();
            }
        }

        private void UpdateChequeStatus(Guid chequeID, Guid newStatus)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var cheque = dbHelper.FetchSingleByID("rp.PaidCheque", chequeID, null);
            cheque.SetFieldValue("ChequeStatus", newStatus);
            dbHelper.UpdateEntity(cheque);
        }

        private Entity GetPreviousStatusChange(Entity piadChequeStatusChange)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var previousStatusChangeID = piadChequeStatusChange.GetFieldValue<Guid?>("PreviousStatusChange");

            if (previousStatusChangeID != null)
                return dbHelper.FetchSingleByID("rp.PaidChequeStatusChange", (Guid)previousStatusChangeID, null);
            else
                return null;
        }

        private Entity GetLastChequeStatusChange(Guid chequeID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var paidChequeStatusChange = dbHelper.FetchSingleBySqlQuery(string.Format(@"
                select StatusChange.*
                from rp_PaidChequeStatusChanges StatusChange
                    left join rp_PaidChequeStatusChanges NextChange on NextChange.Cheque = StatusChange.Cheque 
                        and NextChange.PreviousStatusChange = StatusChange.ID
                where StatusChange.Cheque = '{0}' and NextChange.ID is null",
                chequeID));

            return paidChequeStatusChange;
        }

        public void ValidateDelete(Entity entity)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            if (entity.GetFieldValue<Guid>("Cheque") != rp.Instance.DeletingChequeID)
            {
                var lastStatusChange = GetLastChequeStatusChange(entity.GetFieldValue<Guid>("Cheque"));

                if (lastStatusChange.GetFieldValue<Guid>("ID") != entity.GetFieldValue<Guid>("ID"))
                    throw new AfwException("تنها امکان حذف آخرین تغییر وضعیت وجود دارد.");

                if (entity.GetFieldValue<Guid?>("PreviousStatusChange") == null)
                    //is deleting first status record and cheque itself is not deleting
                    throw new AfwException("امکان حذف این تغییر وضعیت وجود ندارد.");
            }
        }
        private Entity GetPreviousPaidChequeStatusChange(Entity paidChequeStatusChange)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var previousStatusChangeID = paidChequeStatusChange.GetFieldValue<Guid?>("PreviousStatusChange");

            if (previousStatusChangeID != null)
                return dbHelper.FetchSingleByID("rp_PaidChequeStatusChangesView", (Guid)previousStatusChangeID, null);
            else
                return null;
        }

        #region Related to AccDoc
        private void CreateChequeStatusChangeAccDoc(Entity entity)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var automaticAccDocSettingName = rp.Instance.GetAutomaticAccDocSetting("PaidChequeStatusChange");
            if (automaticAccDocSettingName != "Disabled")
            {
                try
                {
                    var id = entity.GetFieldValue<Guid>("ID");
                    var issueDate = entity.GetFieldValue<DateTime>("ChangeDate");
                    var financialYear = entity.GetFieldValue<Guid>("FinancialYear");
                    var financialGroupID = entity.GetFieldValue<Guid>("FinancialGroup");
                    //var paidCheque = dbHelper.FetchSingleByID("rp.PaidCheque", entity.GetFieldValue<Guid>("Cheque"), null);
                    var desc = "انتقال چک پرداختی ";//+ paidCheque.GetFieldValue<string>("ChequeNumber") + " مورخ " + issueDate + "";
                    var accDocID = entity.GetFieldValue<Guid?>("AccDoc");

                    if (accDocID == null && automaticAccDocSettingName == "ByDay")
                    {
                        var financialGroup = dbHelper.FetchSingleByID("cmn.FinancialGroup", financialGroupID, null);
                        var financialDocTypeID = financialGroup.GetFieldValue<Guid>("FinancialDocType");
                        var organizationUnitID = financialGroup.GetFieldValue<Guid>("OrganizationUnit");

                        accDocID = acc.Instance.GetTodayAccDoc("PaidChequeStatusChange", financialDocTypeID, issueDate, organizationUnitID);
                    }

                    acc.Instance.InsertOrUpdateAccDocMaster(ref accDocID, "PaidChequeStatusChange", issueDate, financialYear, financialGroupID, desc, true);

                    if (entity.GetFieldValue<Guid?>("AccDoc") == null)
                    {
                        entity.SetFieldValue("AccDoc", accDocID);
                        dbHelper.UpdateEntity(entity);
                    }

                    CreateChequeStatusChangeAccDocItems(id, (Guid)accDocID);
                }
                catch (Exception ex)
                {
                    throw new AfwException("خطا در تولید سند تغییر وضعیت چک:\r\n" + ex.Message, ex);
                }
            }
        }

        private void CreateChequeStatusChangeAccDocItems(Guid chequeStatusChangeID, Guid accDocID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var opFieldNameInItemEntity = "RefOp_PaidChequeStatusChange";

            acc.Instance.DeleteAccDocItems(accDocID, opFieldNameInItemEntity, chequeStatusChangeID);

            var statusChangeEntity = dbHelper.FetchSingleByID("rp_PaidChequeStatusChangesView", chequeStatusChangeID, null);

            var desc = statusChangeEntity.GetFieldValue<string>("Description");
            var amount = statusChangeEntity.GetFieldValue<decimal>("Cheque_Amount");

            Guid? debtorPerson = null;
            Guid? debtorCostCenter = null;
            Guid? debtorProject = null;
            Guid? debtorForeignCurrency = null;

            Guid? creditorPerson = null;
            Guid? creditorCostCenter = null;
            Guid? creditorProject = null;
            Guid? creditorForeignCurrency = null;

            List<Entity> accDocItemList = new List<Entity>();

            var previousStatusChangeEntity = GetPreviousPaidChequeStatusChange(statusChangeEntity);
            var financialYearID = statusChangeEntity.GetFieldValue<Guid>("FinancialYear");

            var debtorAccount = GetStatusChangeAccounts(previousStatusChangeEntity,
                out debtorPerson, out debtorCostCenter, out debtorProject, out debtorForeignCurrency);
            var creditorAccount = GetStatusChangeAccounts(statusChangeEntity,
                out creditorPerson, out creditorCostCenter, out creditorProject, out creditorForeignCurrency);

            creditorAccount = acc.Instance.GetAccountIDInAnotherFinancialYear(creditorAccount, financialYearID);
            debtorAccount = acc.Instance.GetAccountIDInAnotherFinancialYear(debtorAccount, financialYearID);

            /*بدهکار*/
            var entity = new Entity();
            entity.AddField("accountID", (Guid)debtorAccount);
            entity.AddField("personID", debtorPerson);
            entity.AddField("costCenterID", debtorCostCenter);
            entity.AddField("projectID", debtorProject);
            entity.AddField("foreignCurrencyID", debtorForeignCurrency);
            entity.AddField("note", desc);
            entity.AddField("creditorAmount", 0);
            entity.AddField("debtorAmount", amount);
            entity.AddField("isActive", true);

            accDocItemList.Add(entity);

            /*بستانکار*/
            entity = new Entity();
            entity.AddField("accountID", (Guid)creditorAccount);
            entity.AddField("personID", creditorPerson);
            entity.AddField("costCenterID", creditorCostCenter);
            entity.AddField("projectID", creditorProject);
            entity.AddField("foreignCurrencyID", creditorForeignCurrency);
            entity.AddField("note", desc);
            entity.AddField("creditorAmount", amount);
            entity.AddField("debtorAmount", 0);
            entity.AddField("isActive", true);

            accDocItemList.Add(entity);

            acc.Instance.InsertAccDocItems(accDocID, opFieldNameInItemEntity, chequeStatusChangeID, accDocItemList);
        }

        private Guid GetStatusChangeAccounts(Entity statusChangeEntity,
            out Guid? personID, out Guid? costCenterID, out Guid? projectID, out Guid? foreignCurrencyID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            Guid? accountID = null;
            personID = null;
            costCenterID = null;
            projectID = null;
            foreignCurrencyID = null;

            try
            {
                var newStatus = statusChangeEntity.GetFieldValue<Guid>("NewStatus");
                var newStatusName = OptionSetHelper.GetOptionSetItemName(newStatus);
                var newStatusFinancialYear = statusChangeEntity.GetFieldValue<Guid>("FinancialYear");

                if (newStatusName == "PasNashode")
                {
                    //در وضعیت پاس نشده، حسابی که درگیر می شود، همان حساب بستانکار در عملیات پرداخت است
                    //این همان حساب اسناد پرداختنی حساب بانکی چک است
                    var payReceiptItem = dbHelper.FetchSingleByID("rp.PayReceiptItem",
                        statusChangeEntity.GetFieldValue<Guid>("Cheque_PayReceiptItemID"), null);
                    accountID = payReceiptItem.GetFieldValue<Guid>("CreditorAccount");
                }
                else if (newStatusName == "PasShode")
                {
                    var paidCheque = dbHelper.FetchSingleByID("rp.PaidCheque",
                    statusChangeEntity.GetFieldValue<Guid>("Cheque"), null);
                    if (paidCheque.GetFieldValue<Guid?>("BankAccount") == null)
                        throw new AfwException("حساب بانکی در چک ثبت نشده است.");

                    var bankAccount = dbHelper.FetchSingleByID("cmn.BankAccount",
                        paidCheque.GetFieldValue<Guid>("BankAccount"), null);
                    if (bankAccount == null)
                        throw new AfwException("حساب بانکی موجود نمی باشد.");

                    var bankAccountAccSetting = dbHelper.FetchSingle("cmn.BankAccountAccSetting",
                        string.Format("BankAccount = '{0}' and FinancialYear = '{1}'", bankAccount.GetFieldValue<Guid>("ID"), newStatusFinancialYear), null);

                    if (bankAccountAccSetting == null)
                        throw new AfwException("تنظیمات حسابداری حساب بانکی موجود نمی باشد.");

                    if (bankAccountAccSetting.GetFieldValue<Guid?>("AccountInCoding") == null)
                        throw new AfwException("حساب کدینگ در تنظیمات حساب بانکی ثبت نشده است.");

                    accountID = bankAccountAccSetting.GetFieldValue<Guid>("AccountInCoding");
                }
                else if (newStatusName == "Odat")
                {
                    var payReceiptItem = dbHelper.FetchSingleByID("rp.PayReceiptItem",
                        statusChangeEntity.GetFieldValue<Guid>("Cheque_PayReceiptItemID"), null);
                    accountID = payReceiptItem.GetFieldValue<Guid>("DebtorAccount");

                    personID = payReceiptItem.GetFieldValue<Guid?>("Debtor_Person");
                    costCenterID = payReceiptItem.GetFieldValue<Guid?>("Debtor_CostCenter");
                    projectID = payReceiptItem.GetFieldValue<Guid?>("Debtor_Project");
                    //foreignCurrencyID = payReceiptItem.GetFieldValue<Guid?>("Debtor_ForeignCurrency");
                }
                else
                    new NotImplementedException();
            }
            catch (Exception ex)
            {
                throw ex;
            }

            return (Guid)accountID;
        }
        #endregion
    }
}

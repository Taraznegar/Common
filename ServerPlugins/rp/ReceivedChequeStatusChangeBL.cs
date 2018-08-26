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
    public class ReceivedChequeStatusChangeBL : FinancialOpBaseBL
    {
        public ReceivedChequeStatusChangeBL() : base("ReceivedChequeStatusChange") { }

        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            var id = entity.GetFieldValue<Guid>("ID");

            if (entity.ChangeStatus == EntityChangeTypes.Delete)
            {
                ValidateDelete(entity);
                acc.Instance.DeleteAccDocItems(entity.GetFieldValue<Guid?>("AccDoc"), "RefOp_ReceivedChequeStatusChange", id);
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
                }

                acc.Instance.DeleteAccDocMaster(entity.GetFieldValue<Guid?>("AccDoc"), "rp.ReceivedChequeStatusChange", id);
            }
        }

        public void CreateChequeStatusChange(Guid chequeID, Guid newStatusID, Guid financialYearID, Guid? financialGroupID,
            Guid? personID, Guid? bankAccountID,
            Guid? cashID, DateTime changeDate, string description, Guid? chequeStatusChangeAccSetting, bool generateAccDoc)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            Guid? previousChangeID = null;
            var previousChange = GetLastChequeStatusChange(chequeID);
            if (previousChange != null)
                previousChangeID = previousChange.GetFieldValue<Guid>("ID");

            var receivedChequeStatusChange = dbHelper.CreateNewEntity("rp.ReceivedChequeStatusChange");
            receivedChequeStatusChange.SetFieldValue("Cheque", chequeID);
            receivedChequeStatusChange.SetFieldValue("PreviousStatusChange", previousChangeID);
            receivedChequeStatusChange.SetFieldValue("NewStatus", newStatusID);
            receivedChequeStatusChange.SetFieldValue("ChangeDate", changeDate);
            receivedChequeStatusChange.SetFieldValue("FinancialYear", financialYearID);
            receivedChequeStatusChange.SetFieldValue("FinancialGroup", financialGroupID);
            receivedChequeStatusChange.SetFieldValue("BankAccount", bankAccountID);
            receivedChequeStatusChange.SetFieldValue("Cash", cashID);
            receivedChequeStatusChange.SetFieldValue("Person", personID);
            receivedChequeStatusChange.SetFieldValue("Description", description);
            receivedChequeStatusChange.SetFieldValue("ChequeStatusChangeAccSetting", chequeStatusChangeAccSetting);

            dbHelper.ApplyChanges(receivedChequeStatusChange);

            if (generateAccDoc)
                CreateChequeStatusChangeAccDoc(receivedChequeStatusChange);
        }

        private void UpdateChequeStatus(Guid chequeID, Guid newStatus)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var cheque = dbHelper.FetchSingleByID("rp.ReceivedCheque", chequeID, null);
            cheque.SetFieldValue("ChequeStatus", newStatus);
            dbHelper.UpdateEntity(cheque);
        }

        private Entity GetPreviousChequeStatusChange(Entity receivedChequeStatusChange)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var previousStatusChangeID = receivedChequeStatusChange.GetFieldValue<Guid?>("PreviousStatusChange");

            if (previousStatusChangeID != null)
                return dbHelper.FetchSingleByID("rp_ReceivedChequeStatusChangesView", (Guid)previousStatusChangeID, null);
            else
                return null;
        }

        private Entity GetLastChequeStatusChange(Guid chequeID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var receivedChequeStatusChange = dbHelper.FetchSingleBySqlQuery(string.Format(@"
                select StatusChange.*
                from rp_ReceivedChequeStatusChanges StatusChange
                    left join rp_ReceivedChequeStatusChanges NextChange on NextChange.Cheque = StatusChange.Cheque 
                        and NextChange.PreviousStatusChange = StatusChange.ID
                where StatusChange.Cheque = '{0}' and NextChange.ID is null",
                chequeID));

            return receivedChequeStatusChange;
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
                {
                    throw new AfwException("امکان حذف این تغییر وضعیت وجود ندارد.");
                }
            }
        }

        #region Related to AccDoc
        public void CreateChequeStatusChangeAccDoc(Entity entity)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var automaticAccDocSettingName = rp.Instance.GetAutomaticAccDocSetting("ReceivedChequeStatusChange");
            if (automaticAccDocSettingName != "Disabled")
            {
                try
                {
                    var id = entity.GetFieldValue<Guid>("ID");
                    var issueDate = entity.GetFieldValue<DateTime>("ChangeDate");
                    var financialYear = entity.GetFieldValue<Guid>("FinancialYear");
                    var financialGroupID = entity.GetFieldValue<Guid>("FinancialGroup");
                    var receivedCheque = dbHelper.FetchSingleByID("rp.ReceivedCheque", entity.GetFieldValue<Guid>("Cheque"), null);
                    var desc = "انتقال چک دریافتی " /*+ receivedCheque.GetFieldValue<string>("ChequeNumber")*/;
                    var accDocID = entity.GetFieldValue<Guid?>("AccDoc");

                    if (accDocID == null && automaticAccDocSettingName == "ByDay")
                    {
                        var financialGroup = dbHelper.FetchSingleByID("cmn.FinancialGroup", financialGroupID, null);
                        var financialDocTypeID = financialGroup.GetFieldValue<Guid>("FinancialDocType");
                        var organizationUnitID = financialGroup.GetFieldValue<Guid>("OrganizationUnit");

                        accDocID = acc.Instance.GetTodayAccDoc("ReceivedChequeStatusChange", financialDocTypeID, issueDate, organizationUnitID);
                    }

                    acc.Instance.InsertOrUpdateAccDocMaster(ref accDocID, "ReceivedChequeStatusChange", issueDate, financialYear, financialGroupID, desc, true);

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

            var opFieldNameInItemEntity = "RefOp_ReceivedChequeStatusChange";
            var asnadeDaryaftani = OptionSetHelper.GetOptionSetItemID("rp.ReceivedChequeStatus", "AsnadeDaryaftani");

            acc.Instance.DeleteAccDocItems(accDocID, opFieldNameInItemEntity, chequeStatusChangeID);
            List<Entity> accDocItemList = new List<Entity>();

            var statusChangeEntity = dbHelper.FetchSingleByID("rp_ReceivedChequeStatusChangesView", chequeStatusChangeID, null);

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

            var previousStatusChangeEntity = GetPreviousChequeStatusChange(statusChangeEntity);
            var financialYearID = statusChangeEntity.GetFieldValue<Guid>("FinancialYear");

            var creditorAccount = GetStatusChangeAccounts(previousStatusChangeEntity,
                out creditorPerson, out creditorCostCenter, out creditorProject, out creditorForeignCurrency);
            var debtorAccount = GetStatusChangeAccounts(statusChangeEntity,
                out debtorPerson, out debtorCostCenter, out debtorProject, out debtorForeignCurrency);

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
            personID = statusChangeEntity.GetFieldValue<Guid?>("Person");
            costCenterID = statusChangeEntity.GetFieldValue<Guid?>("CostCenter");
            projectID = statusChangeEntity.GetFieldValue<Guid?>("Project");
            foreignCurrencyID = statusChangeEntity.GetFieldValue<Guid?>("ForeignCurrency");

            if (foreignCurrencyID != null)
                throw new NotImplementedException("ForeignCurrency not implemented in GetStatusChangeAccounts");

            try
            {
                var newStatus = statusChangeEntity.GetFieldValue<Guid>("NewStatus");
                var newStatusName = OptionSetHelper.GetOptionSetItemName(newStatus);
                var newStatusFinancialYear = statusChangeEntity.GetFieldValue<Guid>("FinancialYear");

                if (newStatusName == "AsnadeDaryaftani")
                {
                    //در وضعیت اسناد دریافتنی، حسابی که درگیر می شود، همان حساب بدهکار در عملیات دریافت است
                    var receiveReceiptItem = dbHelper.FetchSingleByID("rp.ReceiveReceiptItem",
                        statusChangeEntity.GetFieldValue<Guid>("Cheque_ReceiveReceiptItemID"), null);
                    accountID = receiveReceiptItem.GetFieldValue<Guid>("DebtorAccount");
                    //personID = receiveReceiptItem.GetFieldValue<Guid?>("Debtor_Person");
                    //costCenterID = receiveReceiptItem.GetFieldValue<Guid?>("Debtor_CostCenter");
                    //projectID = receiveReceiptItem.GetFieldValue<Guid?>("Debtor_Project");
                    //foreignCurrencyID = receiveReceiptItem.GetFieldValue<Guid?>("Debtor_ForeignCurrency");
                    //حساب اسناد دریافتنی شناور ندارد
                }
                else if (newStatusName == "DarJaryaneVosol")
                {
                    if (statusChangeEntity.GetFieldValue<Guid?>("BankAccount") == null)
                        throw new AfwException("حساب بانکی در تغییر وضعیت ثبت نشده است.");

                    accountID = new BankAccountBL().GetBankAccountAccAccountID(
                        statusChangeEntity.GetFieldValue<Guid>("BankAccount"), statusChangeEntity.GetFieldValue<Guid>("FinancialYear"),
                        BankAccountBL.AccAccountNames.HesabeAsnadeDarJaryaneVosool);
                }
                else if (newStatusName == "VosoolShode")
                {
                    if (statusChangeEntity.GetFieldValue<Guid?>("BankAccount") == null)
                        throw new AfwException("حساب بانکی در تغییر وضعیت ثبت نشده است.");

                    accountID = new BankAccountBL().GetBankAccountAccAccountID(
                        statusChangeEntity.GetFieldValue<Guid>("BankAccount"), statusChangeEntity.GetFieldValue<Guid>("FinancialYear"),
                        BankAccountBL.AccAccountNames.AccountInCoding);
                }
                else if (newStatusName == "VarizShodeBeSandogh")
                {
                    if (statusChangeEntity.GetFieldValue<Guid?>("Cash") == null)
                        throw new AfwException("صندوق در تغییر وضعیت ثبت نشده است.");

                    var cash = dbHelper.FetchSingleByID("rp.Cash", statusChangeEntity.GetFieldValue<Guid>("Cash"), null);
                    if (cash == null)
                        throw new AfwException("صندوق موجود نمی باشد.");

                    var cashAccSetting = dbHelper.FetchSingle("rp.CashAccSetting",
                        string.Format("Cash = '{0}' and FinancialYear = '{1}'",
                        cash.GetFieldValue<Guid>("ID"), statusChangeEntity.GetFieldValue<Guid>("FinancialYear")), null);

                    if (cashAccSetting == null)
                        throw new AfwException("تنظیمات حسابداری صندوق موجود نمی باشد.");

                    accountID = cashAccSetting.GetFieldValue<Guid>("AccountInCoding");

                    if (cashAccSetting.GetFieldValue<Guid?>("CashOwnerPerson") == null)
                        throw new AfwException("مالک صندوق تعیین نشده است.");

                    personID = cashAccSetting.GetFieldValue<Guid>("CashOwnerPerson");
                }
                else if (newStatusName == "VagozariBeShakhs")
                {
                    if (statusChangeEntity.GetFieldValue<Guid?>("ChequeStatusChangeAccSetting") == null)
                        throw new AfwException("تنظیم حساب تغییر وضعیت چک ثبت نشده است.");

                    accountID = new ChequeStatusChangeAccSettingBL().GetChequeStatusChangeAccSettingAccAccountID(
                        statusChangeEntity.GetFieldValue<Guid>("ChequeStatusChangeAccSetting"), "AccountInCoding");

                    if (personID == null)
                        throw new AfwException("شخص تعیین نشده است.");
                }
                else if (newStatusName == "BargashtBeMalekeCheque")
                {
                    //در حالت خروج از وضعیت اسناد دریافتنی، حسابی که بستانکار می شود، همان حساب بدهکار در عملیات دریافت است
                    var receiveReceiptItem = dbHelper.FetchSingleByID("rp.ReceiveReceiptItem",
                        statusChangeEntity.GetFieldValue<Guid>("Cheque_ReceiveReceiptItemID"), null);
                    accountID = receiveReceiptItem.GetFieldValue<Guid>("CreditorAccount");

                    personID = receiveReceiptItem.GetFieldValue<Guid?>("Creditor_Person");
                    costCenterID = receiveReceiptItem.GetFieldValue<Guid?>("Creditor_CostCenter");
                    projectID = receiveReceiptItem.GetFieldValue<Guid?>("Creditor_Project");
                    //foreignCurrencyID = receiveReceiptItem.GetFieldValue<Guid?>("Creditor_ForeignCurrency");
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

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
    public class ReceiveReceiptItemBL : EntityBL
    {
        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify, EntityChangeTypes.None))
            {
                if (entity.GetFieldValue<Guid>("FinancialOpKind") == Guid.Parse("00000000-0000-0000-0000-000000000000"))
                    entity.SetFieldValue("FinancialOpKind", null);

                var innerEntity = entity.GetFieldValue<Entity>("InnerItem");
                innerEntity.ChangeStatus =
                    entity.ChangeStatus == EntityChangeTypes.None ? EntityChangeTypes.Modify : entity.ChangeStatus;

                dbHelper.ApplyChanges(innerEntity);

                if (entity.ChangeStatus == EntityChangeTypes.Add && entity.GetFieldValue<Guid?>("FinancialItem_Cheque") != null)
                {
                    var receiveReceipt = dbHelper.FetchSingleByID("rp.ReceiveReceipt", entity.GetFieldValue<Guid>("ReceiveReceipt"), null);
                    new ReceivedChequeBL().CreateChequeStatusChange(innerEntity, receiveReceipt);
                }

                entity.FieldValues.Remove("InnerItem");
            }

        }

        public override void AfterApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.AfterApplyChanges(dbHelper, entity);

            //DebugHelper.Break();
            if (entity.GetFieldValue<Guid>("ReceiveReceipt") != null)
                new ReceiveReceiptBL().UpdateTotalAmount(entity.GetFieldValue<Guid>("ReceiveReceipt"));

            if (entity.ChangeStatus == EntityChangeTypes.Delete)
            {
                DeleteFinancialItem(dbHelper, entity);
            }
            else
                CheckPayerInPersonsGroup(entity);
        }

        private void CheckPayerInPersonsGroup(Entity entity)
        {
            var payer = entity.GetFieldValue<Guid?>("Creditor_Person");
            if (payer == null)
                return;

            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var creditorAccount = entity.GetFieldValue<Guid>("CreditorAccount");
            if (creditorAccount == null)
                return;

            var entities = dbHelper.FetchMultipleBySqlQuery(
                string.Format(@"
                    select PersonGroupRelation.Person 
                    from cmn_PersonGroupRelations PersonGroupRelation 
                       inner join acc_PersonGroupAccounts PersonGroupAccount on PersonGroupAccount.PersonGroup = PersonGroupRelation.PersonGroup 
                       inner join rp_ReceiveReceiptItems ReceiveReceiptItem on ReceiveReceiptItem.CreditorAccount = PersonGroupAccount.Account
                    where ReceiveReceiptItem.CreditorAccount = '{0}' and PersonGroupRelation.Person = '{1}'",
                    creditorAccount, payer)).Entities;
            if (entities.Count == 0)
            {
                throw new AfwException("حساب بستانکار انتخاب شده با گروه حساب پرداخت کننده مرتبط نمی باشد");
            }
        }

        public void GetAccDocItemAccounts(Entity receiveReceiptItem, out Guid? creditorAccount, out Guid? debtorAccount)
        {
            //DebugHelper.Break();

            var dbHelper = CoreComponent.Instance.MainDbHelper;

            creditorAccount = receiveReceiptItem.GetFieldValue<Guid>("CreditorAccount");
            debtorAccount = receiveReceiptItem.GetFieldValue<Guid>("DebtorAccount");

            if (creditorAccount == null || debtorAccount == null)
            {
                throw new AfwException("حساب بستانکار یا بدهکار وجود ندارد");
            }
        }

        private void DeleteFinancialItem(EntityDbHelper dbHelper, Entity itemEntity)
        {
            try
            {
                var receiveTypeName = new ReceiveTypeBL().GetReceiveTypeName(itemEntity.GetFieldValue<Guid>("ReceiveType"));
                var fieldName = "";
                var entityFullName = "";
                switch (receiveTypeName)
                {
                    case "Cheque":
                        entityFullName = "rp.ReceivedCheque";
                        fieldName = "FinancialItem_Cheque";
                        break;
                    case "Safte":
                        entityFullName = "rp.SafteDaryafti";
                        fieldName = "FinancialItem_Safte";
                        break;
                    case "Havale":
                        entityFullName = "rp.HavaleDaryafti";
                        fieldName = "FinancialItem_Havale";
                        break;
                    case "Naghd":
                        entityFullName = "rp.NaghdeDaryafti";
                        fieldName = "FinancialItem_Naghd";
                        break;
                    case "ChekeZemanat":
                        entityFullName = "rp.ChekeZemanateDaryafti";
                        fieldName = "FinancialItem_ChekeZemanat";
                        break;
                    case "Pos":
                        entityFullName = "rp.ReceivedPos";
                        fieldName = "FinancialItem_Pos";
                        break;
                }

                var financialItemEntity = dbHelper.FetchSingleByID(entityFullName, itemEntity.GetFieldValue<Guid>(fieldName), null);
                dbHelper.DeleteEntity(financialItemEntity);
            }
            catch (Exception ex)
            {
                throw new Exception("Error in Delete ReceiveReceiptFinancialItem.", ex);
            }
        }
    }
}

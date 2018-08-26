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
    public class PayReceiptItemBL : EntityBL
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
                    var payReceipt = dbHelper.FetchSingleByID("rp.PayReceipt", entity.GetFieldValue<Guid>("PayReceipt"), null);
                    new PaidChequeBL().CreateChequeStatusChange(innerEntity, payReceipt);
                }

                entity.FieldValues.Remove("InnerItem");
            }
        }


        public override void AfterApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.AfterApplyChanges(dbHelper, entity);

            new PayReceiptBL().UpdateTotalAmount(entity.GetFieldValue<Guid>("PayReceipt"));

            if (entity.ChangeStatus == EntityChangeTypes.Delete)
                DeleteFinancialItem(dbHelper, entity);
            else
                CheckPayeeInPersonsGroup(entity);
        }

        private void CheckPayeeInPersonsGroup(Entity entity)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var payee = entity.GetFieldValue<Guid?>("Debtor_Person");
            if (payee == null)
                return;

            var debtorAccount = entity.GetFieldValue<Guid>("DebtorAccount");
            if (debtorAccount == null)
                return;

            var entities = dbHelper.FetchMultipleBySqlQuery(
                string.Format(@"
                    select PersonGroupRelation.Person 
                    from cmn_PersonGroupRelations PersonGroupRelation 
                       inner join acc_PersonGroupAccounts PersonGroupAccount on PersonGroupAccount.PersonGroup = PersonGroupRelation.PersonGroup 
                       inner join rp_PayReceiptItems PayReceiptItem on PayReceiptItem.DebtorAccount = PersonGroupAccount.Account
                    where PayReceiptItem.DebtorAccount = '{0}' and PersonGroupRelation.Person = '{1}'",
                    debtorAccount, payee)).Entities;
            if (entities.Count == 0)
            {
                throw new AfwException("حساب بدهکار انتخاب شده با گروه حساب دریافت کننده مرتبط نمی باشد");
            }
        }

        private void DeleteFinancialItem(EntityDbHelper dbHelper, Entity itemEntity)
        {
            try
            {
                var payTypeName = new PayTypeBL().GetPayTypeName(itemEntity.GetFieldValue<Guid>("PayType"));
                var fieldName = "";
                var entityFullName = "";
                switch (payTypeName)
                {
                    case "Cheque":
                        entityFullName = "rp.PaidCheque";
                        fieldName = "FinancialItem_Cheque";
                        break;
                    case "Havale":
                        entityFullName = "rp.HavalePardakhti";
                        fieldName = "FinancialItem_Havale";
                        break;
                    case "Naghd":
                        entityFullName = "rp.NaghdePardakhti";
                        fieldName = "FinancialItem_Naghd";
                        break;
                    case "ChekeZemanat":
                        entityFullName = "rp.ChekeZemanatePardakhti";
                        fieldName = "FinancialItem_ChekeZemanat";
                        break;
                }

                var financialItemEntity = dbHelper.FetchSingleByID(entityFullName, itemEntity.GetFieldValue<Guid>(fieldName), null);
                dbHelper.DeleteEntity(financialItemEntity);
            }
            catch (Exception ex)
            {
                throw new Exception("Error in Delete PayReceiptFinancialItem.", ex);
            }
        }

    }
}

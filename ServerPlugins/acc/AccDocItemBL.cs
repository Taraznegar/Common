using AppFramework;
using AppFramework.AppServer;
using AppFramework.DataAccess;
using AppFramework.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace AppFramework.AppServer
{
    public class AccDocItemBL : EntityBL
    {
        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            var oldAccDocEntity = dbHelper.FetchSingleByID("acc.AccDoc", entity.GetFieldValue<Guid>("AccDoc"), null);

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Delete, EntityChangeTypes.Modify))
            {
                if (oldAccDocEntity.GetFieldValue<Guid>("DocStatus") == OptionSetHelper.GetOptionSetItemID("acc.DocStatus", "Final"))
                    throw new AfwException("امکان تغییر یا حذف آیتم سند قطعی شده وجود ندارد.");
            }

            var exists = dbHelper.EntityExists("acc.Account",
                string.Format("ID = '{0}' and FinancialYear = '{1}'", entity.GetFieldValue<Guid>("Account"), oldAccDocEntity.GetFieldValue<Guid>("FinancialYear")));

            if (!exists)
                throw new AfwException("کدینگ انتخاب شده با سال مالی جاری تطابق ندارد.");

            var debtorAmount = entity.GetFieldValue<decimal>("DebtorAmount");
            var creditorAmount = entity.GetFieldValue<decimal>("CreditorAmount");

            if (debtorAmount - Math.Truncate(debtorAmount) > 0)
                throw new AfwException("مبلغ بدهکار در ردیف {0} سند {1} دارای اعشار است.{2}",
                    entity.GetFieldValue<int>("RowNo"), oldAccDocEntity.GetFieldValue<int>("DocNo"), debtorAmount);

            if (creditorAmount - Math.Truncate(creditorAmount) > 0)
                throw new AfwException("مبلغ بستانکار در ردیف {0} سند {1} دارای اعشار است.{2}",
                    entity.GetFieldValue<int>("RowNo"), oldAccDocEntity.GetFieldValue<int>("DocNo"), creditorAmount);
        }

        public override void AfterApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.AfterApplyChanges(dbHelper, entity);

            var accDocID = entity.GetFieldValue<Guid>("AccDoc");
            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify))
            {
                var refOpFieldName = GetRefOpFieldName(entity);
                if (refOpFieldName != null)
                {
                    var existingDocItem = dbHelper.FetchMultiple("acc.AccDocItem",
                        string.Format("{0} = '{1}' and ID <> '{2}' and AccDoc <> '{3}'",
                            refOpFieldName,
                            entity.GetFieldValue<Guid>(refOpFieldName),
                            entity.GetFieldValue<Guid>("ID"),
                            accDocID),
                            null, 1, 1, new string[] { "AccDoc" });

                    if (existingDocItem.Entities.Count > 0)
                    {
                        throw new AfwException("سند حسابداری با شماره مرجع {0} برای این عملیات موجود است.",
                            existingDocItem.Entities[0].GetFieldValue<Entity>("AccDoc_Entity").GetFieldValue<int>("DocNo"));
                    }
                }
            }

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Delete))
            {
                var query = string.Format(@"
                    update AccDocItem
                    set RowNo = NewSortedRowNo
                    from (
                           select RowNo, row_number() over(order by CreationTime) as NewSortedRowNo
                           from acc_AccDocItems
	                       where AccDoc = '{0}'
                    ) AccDocItem", accDocID);

                dbHelper.AdoDbHelper.ExecuteNonQuery(query);
            }
        }

        private string GetRefOpFieldName(Entity accDocItem)
        {
            foreach (var fieldName in accDocItem.FieldValues.Keys)
            {
                if (fieldName.StartsWith("RefOp_") && accDocItem.GetFieldValue<Guid?>(fieldName) != null)
                    return fieldName;
            }

            return null;
        }

        public void InsertAccDocItems(Guid accDocID, string opFieldNameInItemEntity, Guid? opID, List<Entity> accDocItemList)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            using (var tranManager = new DbTransactionManager(dbHelper))
            {
                foreach (var item in accDocItemList)
                {
                    var entity = dbHelper.CreateNewEntity("acc.AccDocItem");

                    if (opFieldNameInItemEntity == "RefOp_ClinicInvoice")
                    {
                        var clinicInvoice = dbHelper.FetchSingle("clin.ServiceInvoice", string.Format("ID = '{0}'", opID), null);
                        entity.SetFieldValue("OrganizationUnit", clinicInvoice.GetFieldValue<Guid?>("OrganizationUnit"));
                    }

                    entity.SetFieldValue("AccDoc", accDocID);
                    entity.SetFieldValue("RowNo", 1);
                    entity.SetFieldValue("Account", item.GetFieldValue<Guid>("accountID"));
                    entity.SetFieldValue("Person", item.GetFieldValue<Guid?>("personID"));
                    entity.SetFieldValue("CostCenter", item.GetFieldValue<Guid?>("costCenterID"));
                    entity.SetFieldValue("Project", item.GetFieldValue<Guid?>("projectID"));
                    entity.SetFieldValue("ForeignCurrency", item.GetFieldValue<Guid?>("foreignCurrencyID"));
                    entity.SetFieldValue("Note", item.GetFieldValue<string>("note"));
                    entity.SetFieldValue("CreditorAmount", item.GetFieldValue<decimal>("creditorAmount"));
                    entity.SetFieldValue("DebtorAmount", item.GetFieldValue<decimal>("debtorAmount"));
                    entity.SetFieldValue("IsActive", item.GetFieldValue<bool>("isActive"));

                    if (opID != null)
                        entity.SetFieldValue(opFieldNameInItemEntity, opID);

                    dbHelper.ApplyChanges(entity);
                }

                acc.Instance.UpdateAccDocMasterBalanceStatus(accDocID);

                tranManager.Commit();
            }
        }

        public void DeleteAccDocItems(Guid? accDocID, string opFieldNameInItemEntity, Guid? opID)
        {
            if (accDocID == null)
                return;

            var dbHelper = CoreComponent.Instance.MainDbHelper;

            using (var tranManager = new DbTransactionManager(dbHelper))
            {
                try
                {
                    var entities = dbHelper.FetchMultiple("acc_AccDocItems",
                        string.Format("AccDoc = '{0}' {1}", accDocID, opID == null ? "" : string.Format(" and {0} = '{1}'", opFieldNameInItemEntity, opID))
                        , null, null, null, null).Entities;

                    foreach (var entity in entities)
                    {
                        dbHelper.DeleteEntity(entity);
                    }

                    tranManager.Commit();
                }
                catch (Exception ex)
                {
                    throw new AfwException("Error In DeleteAccDoc", ex);
                }
            }

        }

        public EntityList GetAccDocItems(Guid financialYearID, string filter)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var accDocItems = dbHelper.FetchMultipleBySqlQuery(string.Format(@"
                    select AccDocItem.ID, AccDocItem.AccDoc, AccDoc.DocNo,
                    	afw.GregorianToPersian(AccDoc.IssueDate) IssueDate,
                    	AccDocItem.Note AccDocItemDes, AccDocItem.DebtorAmount, AccDocItem.CreditorAmount,
                    	AccDoc.FinancialGroup, FinancialGroup.Name FinancialGroupName,
                    	AccDoc.CreatorUser, SystemUser.DisplayName SystemUserName,
                    	AccDocItem.Account, AccountView.FullCode AccountFullCode, AccountView.FullName AccountFullName, 
                    	Person.StoredDisplayText PersonName, CostCenter.Name CostCenterName,
                    	Project.Name ProjectName, ForeignCurrency.Name ForeignCurrencyName,
                        AccDocItem.Person, AccDocItem.CostCenter, AccDocItem.Project, AccDocItem.ForeignCurrency,
                    	AccDoc.FinancialYear
                    from acc_AccDocItems AccDocItem
                    	left join acc_AccDocs AccDoc on AccDoc.ID = AccDocItem.AccDoc
                    	left join acc_AccountsView AccountView on AccountView.ID = AccDocItem.Account
                    	left join cmn_FinancialYears FinancialYear on FinancialYear.ID = AccDoc.FinancialYear
                    	left join cmn_FinancialGroups FinancialGroup on FinancialGroup.ID = AccDoc.FinancialGroup
                    	left join afw_SystemUsersView SystemUser on SystemUser.ID = AccDoc.CreatorUser
                    	left join cmn_Persons Person on Person.ID = AccDocItem.Person
                    	left join cmn_CostCenters CostCenter on CostCenter.Id = AccDocItem.CostCenter
                    	left join cmn_Projects Project on Project.ID = AccDocItem.Project
                    	left join cmn_ForeignCurrencies ForeignCurrency on ForeignCurrency.ID = AccDocItem.ForeignCurrency
                    where AccDoc.FinancialYear = '{0}' {1}", financialYearID, filter));
            return accDocItems;
        }

        public Entity GetDebtorAndCreditorSum(Guid accDocID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var debtorAndCreditorSum = dbHelper.FetchSingleBySqlQuery(string.Format(@"
                    select isnull(sum(AccDocItem.DebtorAmount), 0) DebtorAmountSum, 
	                    isnull(sum(AccDocItem.CreditorAmount), 0) CreditorAmountSum
                    from acc_AccDocItems AccDocItem 
                    where AccDocItem.AccDoc = '{0}'", accDocID));
            return debtorAndCreditorSum;
        }
    }
}

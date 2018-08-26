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
    public class AccountBL : EntityBL
    {
        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify))
            {
                string parentAccountCondition = "";

                if (entity.GetFieldValue<Guid?>("ParentAccount") == null)
                    parentAccountCondition = " and ParentAccount is null";
                else
                    parentAccountCondition = " and ParentAccount = '" + entity.GetFieldValue<Guid?>("ParentAccount") + "'";

                var redundantExists = dbHelper.GetCount("acc.account",
                    string.Format("Code = '{0}' and FinancialYear = '{1}' and AccountLevel = '{2}' {3}",
                        entity.GetFieldValue<string>("Code"),
                        entity.GetFieldValue<Guid>("FinancialYear"),
                        entity.GetFieldValue<Guid>("AccountLevel"),
                        parentAccountCondition));

                if (entity.ChangeStatus == EntityChangeTypes.Add)
                {
                    if (redundantExists > 0)
                        throw new AfwException("کد تکراری ، این کد حساب قبلا ثبت شده است.");
                }
                else if (entity.ChangeStatus == EntityChangeTypes.Modify)
                {
                    if (redundantExists > 1)
                        throw new AfwException("کد تکراری ، این کد حساب قبلا ثبت شده است.");
                }
            }
        }

        public override void AfterApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.AfterApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus == EntityChangeTypes.Add)
            {
                UpdateAccDocItemsAccountToNewAccountOfParentAccount(entity);
            }
        }

        //آپدیت حساب آیتم های سندی ک برای این حساب ها سطح جدید در درخت کدینگ حساب، اضافه شده است
        //حساب آیتم های سند به حسابی که در سطح جدید اضافه شده است آپدیت می شود
        private void UpdateAccDocItemsAccountToNewAccountOfParentAccount(Entity entity)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var parentAccountID = entity.GetFieldValue<Guid?>("ParentAccount");
            if (parentAccountID != null)
            {
                var AccountLevelKolID = OptionSetHelper.GetOptionSetItemID("acc.AccountLevel", "Kol");
                var AccountLevelMoinID = OptionSetHelper.GetOptionSetItemID("acc.AccountLevel", "Moin");

                var parentAccountIsKolOrMoin = dbHelper.EntityExists("acc.account",
                    string.Format("ID = '{0}' and AccountLevel in ('{1}', '{2}')", parentAccountID, AccountLevelKolID, AccountLevelMoinID));

                if (parentAccountIsKolOrMoin)
                {
                    var accDocItems = dbHelper.FetchMultiple("acc.accDocItem",
                        string.Format("Account = '{0}'", parentAccountID),
                        null, null, null, null).Entities;

                    foreach (var accDocItem in accDocItems)
                    {
                        accDocItem.ChangeStatus = "Modify";
                        accDocItem.SetFieldValue("Account", entity.GetFieldValue<Guid>("ID"));
                        dbHelper.UpdateEntity(accDocItem);
                    }
                }
            }
        }

        public EntityList GetAccountsBef(string filterExpression)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var query = string.Format(@"
                select ID, 
                    AccountLevel_Name, CodeAndName, 
                    GroupID,KolID, MoinID
                from acc_AccountsView
                where FinancialYear = '{0}'
                order by cast(Code as int)", filterExpression);

            return dbHelper.FetchMultipleBySqlQuery(query);
                
        }

        private EntityList GetAccountsWithParents(string filterExpression)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            return dbHelper.FetchMultiple("acc_AccountsView", filterExpression, "cast(Code as int)", null, null, null);
        }

        public EntityList GetAccountsWithParents(Guid financialYearID, string filterExpression)
        {
            var totalFilterExpression = string.Format("FinancialYear = '{0}'", financialYearID);

            if (!string.IsNullOrEmpty(filterExpression))
                totalFilterExpression += "\r\n and " + filterExpression;

            return GetAccountsWithParents(totalFilterExpression);
        }
        
        public Entity GetAccountWithParents(string id)
        {
            var account = GetAccountsWithParents(string.Format("ID = '{0}'", id));
            
            if (account.Entities.Count == 0)
                throw new AfwException("Account with ID {0} not found.", id);
            
           return account.Entities[0];
        }

        public Guid GetAccountID(Guid financialYearID, string accountFullCode, bool codeContainsGroupCode)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var codeSearchField = codeContainsGroupCode ? "FullCodeWithGroupCode" : "FullCode";

            var account = dbHelper.FetchSingle("acc_AccountsView",
                string.Format("FinancialYear = '{0}' and {1} = '{2}'", financialYearID, codeSearchField, accountFullCode), null);

            if (account == null)
            {
                var financialYearName = dbHelper.FetchSingleByID("cmn.FinancialYear", financialYearID, null).GetFieldValue<string>("YearNo");
                throw new AfwException("حساب {0} در سال مالی {1} تعریف نشده است.", accountFullCode, financialYearName);
            }

            return account.GetFieldValue<Guid>("ID");
        }

        public Guid GetAccountIDInAnotherFinancialYear(Guid accountID, Guid otherFinancialYearID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var accountFullCode = dbHelper.FetchSingleByID("acc_AccountsView", accountID, null)
                .GetFieldValue<string>("FullCode");

            return GetAccountID(otherFinancialYearID, accountFullCode, false);
        }

        public void SaveAccountFloatGroupsData(Guid accountID, EntityList accountFloatGroupsData)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            for (int i = 0; i < accountFloatGroupsData.Entities.Count; i++)
            {
                Entity floatGroupData = accountFloatGroupsData.Entities[i];
                EntityList accountFloatGroupData = floatGroupData.GetFieldValue<EntityList>("AccountFloatGroupData");
                switch (floatGroupData.GetFieldValue<string>("FloatGroupTitle"))
                {
                    case "گروه اشخاص":
                        for (int j = 0; j < accountFloatGroupData.Entities.Count; j++)
                        {
                            Entity accountFloatGroup = accountFloatGroupData.Entities[j];
                            Guid floatGroupID = accountFloatGroup.GetFieldValue<Guid>("FloatGroupID");
                            bool isSelected = accountFloatGroup.GetFieldValue<bool>("IsSelected");
                            Entity personGroupAccount = dbHelper.FetchSingle("acc_PersonGroupAccounts",
                                string.Format(@" Account = '{0}' and PersonGroup = '{1}'", accountID, floatGroupID), null);
                            if (personGroupAccount == null)
                            {
                                if (!isSelected)
                                    continue;

                                personGroupAccount = dbHelper.CreateNewEntity("acc.PersonGroupAccount");
                                personGroupAccount.SetFieldValue("Account", accountID);
                                personGroupAccount.SetFieldValue("PersonGroup", floatGroupID);
                                dbHelper.InsertEntity(personGroupAccount);
                            }
                            else
                            {
                                if (!isSelected)
                                    dbHelper.DeleteEntity(personGroupAccount);
                            }
                        }
                        break;
                    case "گروه های مرکز هزینه":
                        for (int j = 0; j < accountFloatGroupData.Entities.Count; j++)
                        {
                            Entity accountFloatGroup = accountFloatGroupData.Entities[j];
                            Guid floatGroupID = accountFloatGroup.GetFieldValue<Guid>("FloatGroupID");
                            bool isSelected = accountFloatGroup.GetFieldValue<bool>("IsSelected");
                            Entity costCenterGroupAccount = dbHelper.FetchSingle("acc_CostCenterGroupAccounts",
                                string.Format(@" Account = '{0}' and CostCenterGroup = '{1}'", accountID, floatGroupID), null);
                            if (costCenterGroupAccount == null)
                            {
                                if (!isSelected)
                                    continue;

                                costCenterGroupAccount = dbHelper.CreateNewEntity("acc.CostCenterGroupAccount");
                                costCenterGroupAccount.SetFieldValue("Account", accountID);
                                costCenterGroupAccount.SetFieldValue("CostCenterGroup", floatGroupID);
                                dbHelper.InsertEntity(costCenterGroupAccount);
                            }
                            else
                            {
                                if (!isSelected)
                                    dbHelper.DeleteEntity(costCenterGroupAccount);
                            }
                        }
                        break;
                    case "گروه های پروژه":
                        for (int j = 0; j < accountFloatGroupData.Entities.Count; j++)
                        {
                            Entity accountFloatGroup = accountFloatGroupData.Entities[j];
                            Guid floatGroupID = accountFloatGroup.GetFieldValue<Guid>("FloatGroupID");
                            bool isSelected = accountFloatGroup.GetFieldValue<bool>("IsSelected");
                            Entity projectGroupAccount = dbHelper.FetchSingle("acc_ProjectGroupAccounts",
                                string.Format(@" Account = '{0}' and ProjectGroup = '{1}'", accountID, floatGroupID), null);
                            if (projectGroupAccount == null)
                            {
                                if (!isSelected)
                                    continue;
                                projectGroupAccount = dbHelper.CreateNewEntity("acc.ProjectGroupAccount");
                                projectGroupAccount.SetFieldValue("Account", accountID);
                                projectGroupAccount.SetFieldValue("ProjectGroup", floatGroupID);
                                dbHelper.InsertEntity(projectGroupAccount);
                            }
                            else
                            {
                                if (!isSelected)
                                    dbHelper.DeleteEntity(projectGroupAccount);
                            }
                        }
                        break;
                    case "گروه های ارزهای خارجی":
                        for (int j = 0; j < accountFloatGroupData.Entities.Count; j++)
                        {
                            Entity accountFloatGroup = accountFloatGroupData.Entities[j];
                            Guid floatGroupID = accountFloatGroup.GetFieldValue<Guid>("FloatGroupID");
                            bool isSelected = accountFloatGroup.GetFieldValue<bool>("IsSelected");
                            Entity foreignCurrencyGroupAccount = dbHelper.FetchSingle("acc_ForeignCurrencyGroupAccounts",
                                string.Format(@" Account = '{0}' and ForeignCurrencyGroup = '{1}'", accountID, floatGroupID), null);
                            if (foreignCurrencyGroupAccount == null)
                            {
                                if (isSelected)
                                {
                                    foreignCurrencyGroupAccount = dbHelper.CreateNewEntity("acc.ForeignCurrencyGroupAccount");
                                    foreignCurrencyGroupAccount.SetFieldValue("Account", accountID);
                                    foreignCurrencyGroupAccount.SetFieldValue("ForeignCurrencyGroup", floatGroupID);
                                    dbHelper.InsertEntity(foreignCurrencyGroupAccount);
                                }
                            }
                            else
                            {
                                if (!isSelected)
                                    dbHelper.DeleteEntity(foreignCurrencyGroupAccount);
                            }
                        }
                        break;
                    default:
                        throw new AfwException("عنوان {0} برای گروه های شناور موجود نیست.", floatGroupData.GetFieldValue<string>("FloatGroupTitle"));
                }
            }
        }

        public EntityList GetAccountFloatGroupsData(Guid accountID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            EntityList floatGroupsData = new EntityList();
            for (int i = 0; i < 4; i++)
            {
                Entity floatGroupData = new Entity();
                switch (i)
                {
                    case 0:
                        {
                            var query = string.Format(@"
                                    select PersonGroup.ID FloatGroupID,
	                                    PersonGroup.Title,
	                                    case when PersonGroupAccount.ID is not null then 1 else 0 end IsSelected
                                    from cmn_PersonGroups PersonGroup
	                                    left join acc_PersonGroupAccounts PersonGroupAccount 
                                            on PersonGroupAccount.PersonGroup = PersonGroup.ID
		                                    and PersonGroupAccount.Account = '{0}'",
                                accountID);

                            EntityList accountFloatGroupData = dbHelper.FetchMultipleBySqlQuery(query);
                            floatGroupData.AddField("FloatGroupTitle", "گروه اشخاص");
                            floatGroupData.AddField("AccountFloatGroupData", accountFloatGroupData);
                            break;
                        }
                    case 1:
                        {
                            var query = string.Format(@"
                                select CostCenterGroup.ID FloatGroupID,
	                                CostCenterGroup.Title,
	                                case when CostCenterGroupAccount.ID is not null then 1 else 0 end IsSelected
                                from cmn_CostCenterGroups CostCenterGroup
	                                left join acc_CostCenterGroupAccounts CostCenterGroupAccount 
                                        on CostCenterGroupAccount.CostCenterGroup = CostCenterGroup.ID
		                                and CostCenterGroupAccount.Account = '{0}'
                                ", accountID);

                            EntityList accountFloatGroupData = dbHelper.FetchMultipleBySqlQuery(query);
                            floatGroupData.AddField("FloatGroupTitle", "گروه های مرکز هزینه");
                            floatGroupData.AddField("AccountFloatGroupData", accountFloatGroupData);

                            break;
                        }
                    case 2:
                        {
                            var query = string.Format(@"
                                select ProjectGroup.ID FloatGroupID,
	                                ProjectGroup.Title,
	                                case when ProjectGroupAccount.ID is not null then 1 else 0 end IsSelected
                                from cmn_ProjectGroups ProjectGroup
	                                left join acc_ProjectGroupAccounts ProjectGroupAccount 
                                        on ProjectGroupAccount.ProjectGroup = ProjectGroup.ID
		                                and ProjectGroupAccount.Account = '{0}'
                                ", accountID);

                            EntityList accountFloatGroupData = dbHelper.FetchMultipleBySqlQuery(query);
                            floatGroupData.AddField("FloatGroupTitle", "گروه های پروژه");
                            floatGroupData.AddField("AccountFloatGroupData", accountFloatGroupData);

                            break;
                        }
                    case 3:
                        {
                            var query = string.Format(@"
                                select ForeignCurrencyGroup.ID FloatGroupID,
	                                ForeignCurrencyGroup.Title,
	                                case when ForeignCurrencyGroupAccount.ID is not null then 1 else 0 end IsSelected
                                from cmn_ForeignCurrencyGroups ForeignCurrencyGroup
	                                left join acc_ForeignCurrencyGroupAccounts ForeignCurrencyGroupAccount 
                                        on ForeignCurrencyGroupAccount.ForeignCurrencyGroup = ForeignCurrencyGroup.ID
		                                and ForeignCurrencyGroupAccount.Account = '{0}'
                                ", accountID);

                            EntityList accountFloatGroupData = dbHelper.FetchMultipleBySqlQuery(query);
                            floatGroupData.AddField("FloatGroupTitle", "گروه های ارزهای خارجی");
                            floatGroupData.AddField("AccountFloatGroupData", accountFloatGroupData);

                            break;
                        }
                }

                floatGroupsData.Entities.Add(floatGroupData);
            }

            return floatGroupsData;
        }

        public Guid GetFirstLeafOfAccountTree(Guid accountID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var kolLevelID = OptionSetHelper.GetOptionSetItemID("acc.AccountLevel", "Kol");
            var moinLevelID = OptionSetHelper.GetOptionSetItemID("acc.AccountLevel", "Moin");
            var tafsiliLevelID = OptionSetHelper.GetOptionSetItemID("acc.AccountLevel", "Tafsili");

            var accountEntity = dbHelper.FetchSingle("acc.Account", string.Format("ID = '{0}'", accountID), null);

            if (accountEntity.GetFieldValue<Guid>("AccountLevel") == kolLevelID)
            {
                var moinAccounts = dbHelper.FetchMultiple("acc.Account",
                    string.Format("ParentAccount = '{0}' and AccountLevel = '{1}'", accountID, moinLevelID), null, null, null, null);

                if (moinAccounts.Entities.Count == 0)
                    return accountID;

                var moinAccountID = moinAccounts.Entities[0].GetFieldValue<Guid>("ID");

                for (var i = 0; i < moinAccounts.Entities.Count; i++)
                {
                    moinAccountID = moinAccounts.Entities[i].GetFieldValue<Guid>("ID");
                    var tafsiliAccounts = dbHelper.FetchMultiple("acc.Account",
                        string.Format("ParentAccount = '{0}' and AccountLevel = '{1}'", moinAccountID, tafsiliLevelID), null, null, null, null);

                    if (tafsiliAccounts.Entities.Count > 0)
                    {
                        var tafsiliAccountID = tafsiliAccounts.Entities[0].GetFieldValue<Guid>("ID");
                        return tafsiliAccountID;
                    }
                }

                return moinAccountID;
            }
            else if (accountEntity.GetFieldValue<Guid>("AccountLevel") == moinLevelID)
            {
                var tafsiliAccounts = dbHelper.FetchMultiple("acc.Account",
                       string.Format("ParentAccount = '{0}' and AccountLevel = '{1}'", accountID, tafsiliLevelID), null, null, null, null);

                if (tafsiliAccounts.Entities.Count == 0)
                    return accountID;

                var tafsiliAccountID = tafsiliAccounts.Entities[0].GetFieldValue<Guid>("ID");
                return tafsiliAccountID;
            }
            else
                return accountID;
        }
        
        public Entity AccountHasFloats( Guid accountID) {
           var dbHelper = CoreComponent.Instance.MainDbHelper;

            if (accountID == null)
                throw new AfwException("invalid accountID");

            var query = "";

            var floatQueryTemplate = String.Format(" (" +
                "select top 1 1 " +
                "from cmn_[FloatName]Groups FloatGroup " +
                "    inner join acc_[FloatName]GroupAccounts FloatGroupAccount on FloatGroupAccount.[FloatName]Group = FloatGroup.ID " +
                "where FloatGroupAccount.Account = '{0}')", accountID);

                query = string.Format(@"select
                        {0} HasPerson,
                        {1} HasCostCenter,
                        {2} HasProject,
                        {3} HasForeignCurrency"
                    , floatQueryTemplate.Replace("[FloatName]", "Person")
                    ,floatQueryTemplate.Replace("[FloatName]", "CostCenter")
                    , floatQueryTemplate.Replace("[FloatName]", "Project")
                    ,floatQueryTemplate.Replace("[FloatName]", "ForeignCurrency"));

                return dbHelper.FetchSingleBySqlQuery(query);
        }

        public void CopyAccountsAndDependencies(Guid sourceFinancialYearID, Guid destinationFinancialYearID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;
            
            dbHelper.AdoDbHelper.ExecuteNonQuery(string.Format(
               @"exec acc.CopyAccountsAndDependencies '{0}', '{1}'", sourceFinancialYearID, destinationFinancialYearID));            
        }
    }
}

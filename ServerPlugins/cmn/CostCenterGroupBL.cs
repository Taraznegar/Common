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
    public class CostCenterGroupBL : EntityBL
    {
        public EntityList GetCostCenterGroupAccounts(Guid costCenterGroupID, Guid financialYearID)
        {
            //DebugHelper.Break();
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var costCenterGroupAccounts = dbHelper.FetchMultipleBySqlQuery(string.Format(@"
                    select CostCenterGroupAcc.ID, CostCenterGroupAcc.Account, CostCenterGroupAcc.CostCenterGroup,
                    	coalesce(PPAccount.Code + ' - ', '') + coalesce(PAccount.Code + ' - ', '') + isnull(Account.Code, '') Code,
                    	coalesce(PPAccount.Name + ' - ', '') + coalesce(PAccount.Name + ' - ', '') + isnull(Account.Name, '') Name
                    from acc_CostCenterGroupAccounts CostCenterGroupAcc
                    	inner join acc_Accounts Account on Account.ID = CostCenterGroupAcc.Account
                    	inner join cmn_CostCenterGroups CostCenterGroup on CostCenterGroup.ID = CostCenterGroupAcc.CostCenterGroup 
                    	left join acc_Accounts PAccount on PAccount.ID = Account.ParentAccount
                    	left join acc_Accounts PPAccount on PPAccount.ID = PAccount.ParentAccount 
                    where CostCenterGroupAcc.CostCenterGroup = '{0}' and Account.FinancialYear = '{1}'", costCenterGroupID, financialYearID));

            return costCenterGroupAccounts;

        }

        public void SeveCostCenterGroupAccounts(Guid accountID, Guid costCenterGroupID, Guid financialYearID)
        {
            //DebugHelper.Break();  
            using (var dbHelper = DbHelperFactory.CreateMainDbEntityDbHelper())
            {
                var kolLevelID = OptionSetHelper.GetOptionSetItemID("acc.AccountLevel", "Kol");
                var moinLevelID = OptionSetHelper.GetOptionSetItemID("acc.AccountLevel", "Moin");
                var tafsiliLevelID = OptionSetHelper.GetOptionSetItemID("acc.AccountLevel", "Tafsili");
                 
                var accountEntity = dbHelper.FetchSingle("acc.Account", string.Format("ID = '{0}'", accountID), null);

                if (accountEntity.GetFieldValue<Guid>("AccountLevel") == kolLevelID)
                {
                    var moinAccounts = dbHelper.FetchMultiple("acc.Account",
                        string.Format("ParentAccount = '{0}' and AccountLevel = '{1}'", accountID, moinLevelID), null, null, null, null);
                    if (moinAccounts.Entities.Count > 0)
                    {
                        for (var i = 0; i < moinAccounts.Entities.Count; i++)
                        {
                            var moinAccountID = moinAccounts.Entities[i].GetFieldValue<Guid>("ID");
                            var tafsiliAccounts = dbHelper.FetchMultiple("acc.Account",
                                string.Format("ParentAccount = '{0}' and AccountLevel = '{1}'", moinAccountID, tafsiliLevelID), null, null, null, null);
                            if (tafsiliAccounts.Entities.Count > 0)
                            {
                                for (var j = 0; j < tafsiliAccounts.Entities.Count; j++)
                                {
                                    var tafsiliAccountID = tafsiliAccounts.Entities[j].GetFieldValue<Guid>("ID");
                                    SeveCostCenterGroupAccount(tafsiliAccountID, costCenterGroupID, financialYearID);
                                }
                            }
                            else
                                SeveCostCenterGroupAccount(moinAccountID, costCenterGroupID, financialYearID);
                        }
                    }
                    else
                        SeveCostCenterGroupAccount(accountID, costCenterGroupID, financialYearID);
                }
                else if (accountEntity.GetFieldValue<Guid>("AccountLevel") == moinLevelID)
                {
                    var tafsiliAccounts = dbHelper.FetchMultiple("acc.Account",
                           string.Format("ParentAccount = '{0}' and AccountLevel = '{1}'", accountID, tafsiliLevelID), null, null, null, null);
                    if (tafsiliAccounts.Entities.Count > 0)
                    {
                        for (var j = 0; j < tafsiliAccounts.Entities.Count; j++)
                        {
                            var tafsiliAccountID = tafsiliAccounts.Entities[j].GetFieldValue<Guid>("ID");
                            SeveCostCenterGroupAccount(tafsiliAccountID, costCenterGroupID, financialYearID);
                        }
                    }
                    else
                        SeveCostCenterGroupAccount(accountID, costCenterGroupID, financialYearID);
                }
                else
                    SeveCostCenterGroupAccount(accountID, costCenterGroupID, financialYearID);
            }
        }

        public void SeveCostCenterGroupAccount(Guid accountID, Guid costCenterGroupID, Guid financialYearID)
        {
            //DebugHelper.Break();  
            using (var dbHelper = DbHelperFactory.CreateMainDbEntityDbHelper())
            {
                var costCenterGroupAccountEntity = dbHelper.FetchSingle("acc.CostCenterGroupAccount",
                    string.Format("Account = '{0}' and CostCenterGroup = '{1}'", accountID, costCenterGroupID), null);
                if (costCenterGroupAccountEntity == null)
                {
                    var costCenterGroupAccountNewEntity = dbHelper.CreateNewEntity("acc.CostCenterGroupAccount");
                    costCenterGroupAccountNewEntity.SetFieldValue("Account", accountID);
                    costCenterGroupAccountNewEntity.SetFieldValue("CostCenterGroup", costCenterGroupID);
                    costCenterGroupAccountNewEntity.ChangeStatus = "Add";

                    dbHelper.ApplyChanges(costCenterGroupAccountNewEntity);

                    var account = costCenterGroupAccountNewEntity.GetFieldValue<Guid>("Account");
                    var floatPriority = dbHelper.FetchSingle("cmn.FloatPriority", string.Format("Account = '{0}' and FinancialYear = '{1}'", account, financialYearID), null);
                    if (floatPriority == null)
                    {
                        floatPriority = dbHelper.CreateNewEntity("cmn.FloatPriority");
                        floatPriority.SetFieldValue("Account", account);
                        floatPriority.SetFieldValue("PersonPriority", 0);
                        floatPriority.SetFieldValue("CostCenterPriority", 1);
                        floatPriority.SetFieldValue("ProjectPriority", 0);
                        floatPriority.SetFieldValue("ForeignCurrencyPriority", 0);
                        floatPriority.SetFieldValue("FinancialYear", financialYearID);

                        dbHelper.ApplyChanges(floatPriority);
                    }
                    else
                    {
                        if (floatPriority.GetFieldValue<int>("CostCenterPriority") == 0)
                        {
                            floatPriority.ChangeStatus = "Modify";

                            int maxPriority = cmn.Instance.GetPrioriryMaxValue(account, financialYearID);

                            floatPriority.SetFieldValue("CostCenterPriority", maxPriority + 1);

                            dbHelper.ApplyChanges(floatPriority);
                        }
                    }
                }
            }
        }

        public void DeleteCostCenterGroupAccount(Guid accountID, Guid costCenterGroupID)
        {
            //DebugHelper.Break();  
            using (var dbHelper = DbHelperFactory.CreateMainDbEntityDbHelper())
            {
                var costCenterGroupAccountEntity = dbHelper.FetchSingle("acc.CostCenterGroupAccount",
                    string.Format("Account = '{0}' and CostCenterGroup = '{1}'", accountID, costCenterGroupID), null);
                if (costCenterGroupAccountEntity != null)
                    dbHelper.DeleteEntity(costCenterGroupAccountEntity);
            } 
        }
    }
}

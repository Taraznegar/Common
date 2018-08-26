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
    public class ForeignCurrencyGroupBL : EntityBL
    {
        public EntityList GetForeignCurrencyGroupAccounts(Guid foreignCurrencyGroupID, Guid financialYearID)
        {
            //DebugHelper.Break();

            using (var dbHelper = DbHelperFactory.CreateMainDbEntityDbHelper())
            {
                var foreignCurrencyGroupAccounts = dbHelper.FetchMultipleBySqlQuery(string.Format(@"
                    select ForeignCurrencyGroupAcc.ID, ForeignCurrencyGroupAcc.Account, ForeignCurrencyGroupAcc.ForeignCurrencyGroup,
                    	coalesce(PPAccount.Code + ' - ', '') + coalesce(PAccount.Code + ' - ', '') + isnull(Account.Code, '') Code,
                    	coalesce(PPAccount.Name + ' - ', '') + coalesce(PAccount.Name + ' - ', '') + isnull(Account.Name, '') Name
                    from acc_ForeignCurrencyGroupAccounts ForeignCurrencyGroupAcc
                    	inner join acc_Accounts Account on Account.ID = ForeignCurrencyGroupAcc.Account
                    	inner join cmn_ForeignCurrencyGroups ForeignCurrencyGroup on ForeignCurrencyGroup.ID = ForeignCurrencyGroupAcc.ForeignCurrencyGroup 
                    	left join acc_Accounts PAccount on PAccount.ID = Account.ParentAccount
                    	left join acc_Accounts PPAccount on PPAccount.ID = PAccount.ParentAccount 
                    where ForeignCurrencyGroupAcc.ForeignCurrencyGroup = '{0}' and Account.FinancialYear = '{1}'", foreignCurrencyGroupID, financialYearID));

                return foreignCurrencyGroupAccounts;
            }
        }

        public void SeveForeignCurrencyGroupAccounts(Guid accountID, Guid foreignCurrencyGroupID, Guid financialYearID)
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
                                    SeveForeignCurrencyGroupAccount(tafsiliAccountID, foreignCurrencyGroupID, financialYearID);
                                }
                            }
                            else
                                SeveForeignCurrencyGroupAccount(moinAccountID, foreignCurrencyGroupID, financialYearID);
                        }
                    }
                    else
                        SeveForeignCurrencyGroupAccount(accountID, foreignCurrencyGroupID, financialYearID);
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
                            SeveForeignCurrencyGroupAccount(tafsiliAccountID, foreignCurrencyGroupID, financialYearID);
                        }
                    }
                    else
                        SeveForeignCurrencyGroupAccount(accountID, foreignCurrencyGroupID, financialYearID);
                }
                else
                    SeveForeignCurrencyGroupAccount(accountID, foreignCurrencyGroupID, financialYearID);
            }
        }

        public void SeveForeignCurrencyGroupAccount(Guid accountID, Guid foreignCurrencyGroupID, Guid financialYearID)
        {
            //DebugHelper.Break();  
            using (var dbHelper = DbHelperFactory.CreateMainDbEntityDbHelper())
            {
                var foreignCurrencyGroupAccountEntity = dbHelper.FetchSingle("acc.ForeignCurrencyGroupAccount",
                    string.Format("Account = '{0}' and ForeignCurrencyGroup = '{1}'", accountID, foreignCurrencyGroupID), null);
                if (foreignCurrencyGroupAccountEntity == null)
                {
                    var foreignCurrencyGroupAccountNewEntity = dbHelper.CreateNewEntity("acc.ForeignCurrencyGroupAccount");
                    foreignCurrencyGroupAccountNewEntity.SetFieldValue("Account", accountID);
                    foreignCurrencyGroupAccountNewEntity.SetFieldValue("ForeignCurrencyGroup", foreignCurrencyGroupID);
                    foreignCurrencyGroupAccountNewEntity.ChangeStatus = "Add";

                    dbHelper.ApplyChanges(foreignCurrencyGroupAccountNewEntity);

                    var account = foreignCurrencyGroupAccountNewEntity.GetFieldValue<Guid>("Account");
                    var floatPriority = dbHelper.FetchSingle("cmn.FloatPriority", string.Format("Account = '{0}' and FinancialYear = '{1}'", account, financialYearID), null);
                    if (floatPriority == null)
                    {
                        floatPriority = dbHelper.CreateNewEntity("cmn.FloatPriority");
                        floatPriority.SetFieldValue("Account", account);
                        floatPriority.SetFieldValue("PersonPriority", 0);
                        floatPriority.SetFieldValue("CostCenterPriority", 0);
                        floatPriority.SetFieldValue("ProjectPriority", 0);
                        floatPriority.SetFieldValue("ForeignCurrencyPriority", 1);
                        floatPriority.SetFieldValue("FinancialYear", financialYearID);

                        dbHelper.ApplyChanges(floatPriority);
                    }
                    else
                    {
                        if (floatPriority.GetFieldValue<int>("ForeignCurrencyPriority") == 0)
                        {
                            floatPriority.ChangeStatus = "Modify";

                            int maxPriority = cmn.Instance.GetPrioriryMaxValue(account, financialYearID);

                            floatPriority.SetFieldValue("ForeignCurrencyPriority", maxPriority + 1);
                             
                            dbHelper.ApplyChanges(floatPriority);
                        }
                    }
                }
            }
        }

        public void DeleteForeignCurrencyGroupAccount(Guid accountID, Guid foreignCurrencyGroupID)
        {
            //DebugHelper.Break();  
            using (var dbHelper = DbHelperFactory.CreateMainDbEntityDbHelper())
            {
                var foreignCurrencyGroupAccountEntity = dbHelper.FetchSingle("acc.ForeignCurrencyGroupAccount",
                    string.Format("Account = '{0}' and ForeignCurrencyGroup = '{1}'", accountID, foreignCurrencyGroupID), null);
                if (foreignCurrencyGroupAccountEntity != null)
                    dbHelper.DeleteEntity(foreignCurrencyGroupAccountEntity);
            } 
        }
    }
}

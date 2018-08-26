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
    public class ProjectGroupBL : EntityBL
    {
        public EntityList GetProjectGroupAccounts(Guid projectGroupID, Guid financialYearID)
        {
            //DebugHelper.Break();

            using (var dbHelper = DbHelperFactory.CreateMainDbEntityDbHelper())
            {
                var projectGroupAccounts = dbHelper.FetchMultipleBySqlQuery(string.Format(@"
                    select ProjectGroupAcc.ID, ProjectGroupAcc.Account, ProjectGroupAcc.ProjectGroup,
                    	coalesce(PPAccount.Code + ' - ', '') + coalesce(PAccount.Code + ' - ', '') + isnull(Account.Code, '') Code,
                    	coalesce(PPAccount.Name + ' - ', '') + coalesce(PAccount.Name + ' - ', '') + isnull(Account.Name, '') Name
                    from acc_ProjectGroupAccounts ProjectGroupAcc
                    	inner join acc_Accounts Account on Account.ID = ProjectGroupAcc.Account
                    	inner join cmn_ProjectGroups ProjectGroup on ProjectGroup.ID = ProjectGroupAcc.ProjectGroup 
                    	left join acc_Accounts PAccount on PAccount.ID = Account.ParentAccount
                    	left join acc_Accounts PPAccount on PPAccount.ID = PAccount.ParentAccount 
                    where ProjectGroupAcc.ProjectGroup = '{0}' and Account.FinancialYear = '{1}'", projectGroupID, financialYearID));

                return projectGroupAccounts;
            }
        }

        public void SeveProjectGroupAccounts(Guid accountID, Guid projectGroupID, Guid financialYearID)
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
                                    SeveProjectGroupAccount(tafsiliAccountID, projectGroupID, financialYearID);
                                }
                            }
                            else
                                SeveProjectGroupAccount(moinAccountID, projectGroupID, financialYearID);
                        }
                    }
                    else
                        SeveProjectGroupAccount(accountID, projectGroupID, financialYearID);
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
                            SeveProjectGroupAccount(tafsiliAccountID, projectGroupID, financialYearID);
                        }
                    }
                    else
                        SeveProjectGroupAccount(accountID, projectGroupID, financialYearID);
                }
                else
                    SeveProjectGroupAccount(accountID, projectGroupID, financialYearID);
            }
        }

        public void SeveProjectGroupAccount(Guid accountID, Guid projectGroupID, Guid financialYearID)
        {
            //DebugHelper.Break();  
            using (var dbHelper = DbHelperFactory.CreateMainDbEntityDbHelper())
            { 
                var projectGroupAccountEntity = dbHelper.FetchSingle("acc.ProjectGroupAccount",
                    string.Format("Account = '{0}' and ProjectGroup = '{1}'", accountID, projectGroupID), null);
                if (projectGroupAccountEntity == null)
                {
                    var projectGroupAccountNewEntity = dbHelper.CreateNewEntity("acc.ProjectGroupAccount");
                    projectGroupAccountNewEntity.SetFieldValue("Account", accountID);
                    projectGroupAccountNewEntity.SetFieldValue("ProjectGroup", projectGroupID);
                    projectGroupAccountNewEntity.ChangeStatus = "Add";

                    dbHelper.ApplyChanges(projectGroupAccountNewEntity);

                    var account = projectGroupAccountNewEntity.GetFieldValue<Guid>("Account");
                    var floatPriority = dbHelper.FetchSingle("cmn.FloatPriority", string.Format("Account = '{0}' and FinancialYear = '{1}'", account, financialYearID), null);
                    if (floatPriority == null)
                    {
                        floatPriority = dbHelper.CreateNewEntity("cmn.FloatPriority");
                        floatPriority.SetFieldValue("Account", account);
                        floatPriority.SetFieldValue("PersonPriority", 0);
                        floatPriority.SetFieldValue("CostCenterPriority", 0);
                        floatPriority.SetFieldValue("ProjectPriority", 1);
                        floatPriority.SetFieldValue("ForeignCurrencyPriority", 0);
                        floatPriority.SetFieldValue("FinancialYear", financialYearID);

                        dbHelper.ApplyChanges(floatPriority);
                    }
                    else
                    {
                        if (floatPriority.GetFieldValue<int>("ProjectPriority") == 0)
                        {
                            floatPriority.ChangeStatus = "Modify";

                            int maxPriority = cmn.Instance.GetPrioriryMaxValue(account, financialYearID);

                            floatPriority.SetFieldValue("ProjectPriority", maxPriority + 1);
  
                            dbHelper.ApplyChanges(floatPriority);
                        }
                    }
                }
            }
        }

        public void DeleteProjectGroupAccount(Guid accountID, Guid projectGroupID)
        {
            //DebugHelper.Break();  
            using (var dbHelper = DbHelperFactory.CreateMainDbEntityDbHelper())
            {
                var projectGroupAccountEntity = dbHelper.FetchSingle("acc.ProjectGroupAccount",
                    string.Format("Account = '{0}' and ProjectGroup = '{1}'", accountID, projectGroupID), null);
                if (projectGroupAccountEntity != null)
                    dbHelper.DeleteEntity(projectGroupAccountEntity);
            } 
        }
    }
}

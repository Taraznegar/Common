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
    public class PersonGroupBL : EntityBL
    {
        public EntityList GetPersonGroupAccounts(Guid personGroupID, Guid financialYearID)
        {
            //DebugHelper.Break();

            using (var dbHelper = DbHelperFactory.CreateMainDbEntityDbHelper())
            {
                var personGroupAccounts = dbHelper.FetchMultipleBySqlQuery(string.Format(@"
                    select PersonGroupAcc.ID, PersonGroupAcc.Account, PersonGroupAcc.PersonGroup,
                    	coalesce(PPAccount.Code + ' - ', '') + coalesce(PAccount.Code + ' - ', '') + isnull(Account.Code, '') Code,
                    	coalesce(PPAccount.Name + ' - ', '') + coalesce(PAccount.Name + ' - ', '') + isnull(Account.Name, '') Name
                    from acc_PersonGroupAccounts PersonGroupAcc
                    	inner join acc_Accounts Account on Account.ID = PersonGroupAcc.Account
                    	inner join cmn_PersonGroups PersonGroup on PersonGroup.ID = PersonGroupAcc.PersonGroup 
                    	left join acc_Accounts PAccount on PAccount.ID = Account.ParentAccount
                    	left join acc_Accounts PPAccount on PPAccount.ID = PAccount.ParentAccount 
                    where PersonGroupAcc.PersonGroup = '{0}' and Account.FinancialYear = '{1}'", personGroupID, financialYearID));

                return personGroupAccounts;
            }
        }

        public void SevePersonGroupAccounts(Guid accountID, Guid personGroupID, Guid financialYearID)
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
                                    SevePersonGroupAccount(tafsiliAccountID, personGroupID, financialYearID);
                                }
                            }
                            else
                                SevePersonGroupAccount(moinAccountID, personGroupID, financialYearID);
                        }
                    }
                    else
                        SevePersonGroupAccount(accountID, personGroupID, financialYearID);
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
                            SevePersonGroupAccount(tafsiliAccountID, personGroupID, financialYearID);
                        }
                    }
                    else
                        SevePersonGroupAccount(accountID, personGroupID, financialYearID);
                }
                else
                    SevePersonGroupAccount(accountID, personGroupID, financialYearID);
            }
        }

        public void SevePersonGroupAccount(Guid accountID, Guid personGroupID, Guid financialYearID)
        {
            //DebugHelper.Break();  
            using (var dbHelper = DbHelperFactory.CreateMainDbEntityDbHelper())
            { 
                var personGroupAccountEntity = dbHelper.FetchSingle("acc.PersonGroupAccount",
                    string.Format("Account = '{0}' and PersonGroup = '{1}'", accountID, personGroupID), null);
                if (personGroupAccountEntity == null)
                {
                    var personGroupAccountNewEntity = dbHelper.CreateNewEntity("acc.PersonGroupAccount");
                    personGroupAccountNewEntity.SetFieldValue("Account", accountID);
                    personGroupAccountNewEntity.SetFieldValue("PersonGroup", personGroupID);
                    personGroupAccountNewEntity.ChangeStatus = "Add";

                    dbHelper.ApplyChanges(personGroupAccountNewEntity);

                    var account = personGroupAccountNewEntity.GetFieldValue<Guid>("Account");
                    var floatPriority = dbHelper.FetchSingle("cmn.FloatPriority", string.Format("Account = '{0}' and FinancialYear = '{1}'", account, financialYearID), null);
                    if (floatPriority == null)
                    {
                        floatPriority = dbHelper.CreateNewEntity("cmn.FloatPriority");
                        floatPriority.SetFieldValue("Account", account);
                        floatPriority.SetFieldValue("PersonPriority", 1);
                        floatPriority.SetFieldValue("CostCenterPriority", 0);
                        floatPriority.SetFieldValue("ProjectPriority", 0);
                        floatPriority.SetFieldValue("ForeignCurrencyPriority", 0);
                        floatPriority.SetFieldValue("FinancialYear", financialYearID);

                        dbHelper.ApplyChanges(floatPriority);
                    }
                    else
                    {
                        if (floatPriority.GetFieldValue<int>("PersonPriority") == 0)
                        {
                            floatPriority.ChangeStatus = "Modify";

                            int maxPriority = cmn.Instance.GetPrioriryMaxValue(account, financialYearID);

                            floatPriority.SetFieldValue("PersonPriority", maxPriority + 1);
 
                            dbHelper.ApplyChanges(floatPriority);
                        }
                    }
                }
            }
        }

        public void DeletePersonGroupAccount(Guid accountID, Guid personGroupID/*, Guid financialYearID*/)
        {
            //DebugHelper.Break();  
            using (var dbHelper = DbHelperFactory.CreateMainDbEntityDbHelper())
            {
                var personGroupAccountEntity = dbHelper.FetchSingle("acc.PersonGroupAccount",
                    string.Format("Account = '{0}' and PersonGroup = '{1}'", accountID, personGroupID), null);
                if (personGroupAccountEntity != null)
                    dbHelper.DeleteEntity(personGroupAccountEntity);

                //var floatPriority = dbHelper.FetchSingle("cmn.FloatPriority", string.Format("Account = '{0}' and FinancialYear = '{1}'", accountID, financialYearID), null);
                //if (floatPriority != null)
                //{  
                //    floatPriority.SetFieldValue("PersonPriority", 0);

                //    floatPriority.SetFieldValue("CostCenterPriority", 0);
                //    floatPriority.SetFieldValue("ProjectPriority", 0);
                //    floatPriority.SetFieldValue("ForeignCurrencyPriority", 0); 

                //    dbHelper.ApplyChanges(floatPriority);
                //}
            } 
        }
    }
}

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
    public class ForeignCurrencyBL : EntityBL
    {
        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify))
            {
                var redundantExists = dbHelper.EntityExists("cmn.ForeignCurrency",
                    string.Format("Code = '{0}' and ForeignCurrencyGroup = '{1}'",
                        entity.GetFieldValue<string>("Code"),
                        entity.GetFieldValue<Guid>("ForeignCurrencyGroup")));

                if (redundantExists)
                    throw new AfwException(string.Format("کد تکراری! کد {0} در این گروه ارزی قبلا ثبت شده است.", entity.GetFieldValue<string>("Code")));

                redundantExists = dbHelper.EntityExists("cmn.ForeignCurrency",
                    string.Format("ForeignCurrencyGroup = '{0}' and Name = N'{1}'",
                        entity.GetFieldValue<Guid>("ForeignCurrencyGroup"),
                        entity.GetFieldValue<string>("Name")));

                if (redundantExists)
                    throw new AfwException(string.Format("نام تکراری! {0} در این گروه ارزی قبلا ثبت شده است.", entity.GetFieldValue<string>("Name")));
            }

        }


        internal EntityList GetForeignCurrencyAccounts(Guid foreignCurrencyID, Guid financialYearID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            string query = string.Format(@"
            select Account.ID AccountID,
	            Account.FullCodeAndFullName AccountCodeAndName
            from acc_ForeignCurrencyGroupAccounts ForeignCurrencyGroupAccount
	            left join acc_AccountsView Account on Account.ID = ForeignCurrencyGroupAccount.Account
	            left join cmn_ForeignCurrencies ForeignCurrency on ForeignCurrency.ForeignCurrencyGroup = ForeignCurrencyGroupAccount.ForeignCurrencyGroup
            where ForeignCurrency.ID = '{0}' and Account.FinancialYear = '{1}'", foreignCurrencyID, financialYearID);

            return dbHelper.FetchMultipleBySqlQuery(query);
        }
    }
}

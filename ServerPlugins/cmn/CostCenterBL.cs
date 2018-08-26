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
    public class CostCenterBL : EntityBL
    {
        public EntityList GetCostCenterAccounts(Guid costCenterID, Guid financialYearID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            string query = string.Format(@"
            select Account.ID AccountID,
	            Account.FullCodeAndFullName AccountCodeAndName
            from acc_CostCenterGroupAccounts CostCenterGroupAccount
	            left join acc_AccountsView Account on Account.ID = CostCenterGroupAccount.Account
	            left join cmn_CostCenters CostCenter on CostCenter.CostCenterGroup = CostCenterGroupAccount.CostCenterGroup
            where CostCenter.ID = '{0}' and Account.FinancialYear = '{1}'", costCenterID, financialYearID);

            return dbHelper.FetchMultipleBySqlQuery(query);
        }

        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify))
            {
                var redundantExists = dbHelper.EntityExists("cmn.CostCenter",
                    string.Format("Code = '{0}' and CostCenterGroup = '{1}'",
                        entity.GetFieldValue<string>("Code"),
                        entity.GetFieldValue<Guid>("CostCenterGroup")));

                if (redundantExists)
                    throw new AfwException(string.Format("کد تکراری! کد {0} در این گروه مرکز هزینه قبلا ثبت شده است.", entity.GetFieldValue<string>("Code")));

                redundantExists = dbHelper.EntityExists("cmn.CostCenter",
                    string.Format("CostCenterGroup = '{0}' and Name = N'{1}'",
                        entity.GetFieldValue<Guid>("CostCenterGroup"),
                        entity.GetFieldValue<string>("Name")));

                if (redundantExists)
                    throw new AfwException(string.Format("نام تکراری! {0} در این گروه مرکز هزینه قبلا ثبت شده است.", entity.GetFieldValue<string>("Name")));
            }

        }


    }
}

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
    public class ProjectBL : EntityBL
    {
        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify))
            {
                var redundantExists = dbHelper.EntityExists("cmn.Project",
                    string.Format("Code = '{0}' and ProjectGroup = '{1}'",
                        entity.GetFieldValue<string>("Code"),
                        entity.GetFieldValue<Guid>("ProjectGroup")));

                if (redundantExists)
                    throw new AfwException(string.Format("کد تکراری! کد {0} در این گروه پروژه قبلا ثبت شده است.", entity.GetFieldValue<string>("Code")));

                redundantExists = dbHelper.EntityExists("cmn.Project",
                    string.Format("ProjectGroup = '{0}' and Name = N'{1}'",
                        entity.GetFieldValue<Guid>("ProjectGroup"),
                        entity.GetFieldValue<string>("Name")));

                if (redundantExists)
                    throw new AfwException(string.Format("نام تکراری! {0} در این گروه پروژه قبلا ثبت شده است.", entity.GetFieldValue<string>("Name")));
            }

        }


        internal EntityList GetProjectAccounts(Guid projectID, Guid financialYearID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            string query = string.Format(@"
            select Account.ID AccountID,
	            Account.FullCodeAndFullName AccountCodeAndName
            from acc_ProjectGroupAccounts ProjectGroupAccount
	            left join acc_AccountsView Account on Account.ID = ProjectGroupAccount.Account
	            left join cmn_Projects Project on Project.ProjectGroup = ProjectGroupAccount.ProjectGroup
            where Project.ID = '{0}' and Account.FinancialYear = '{1}'", projectID, financialYearID);

            return dbHelper.FetchMultipleBySqlQuery(query);
        }
    }
}

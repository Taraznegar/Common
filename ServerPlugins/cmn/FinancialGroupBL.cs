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
    public class FinancialGroupBL : EntityBL
    {
        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            //DebugHelper.Break();

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify))
            {
                var redundantExists = dbHelper.EntityExists("cmn.FinancialGroup",
                    string.Format("Title = '{0}' and ID <> '{1}'",
                        entity.GetFieldValue<string>("Title"),
                        entity.GetFieldValue<Guid>("ID")));

                if (redundantExists)
                    throw new AfwException("این گروه مالی قبلا ثبت شده است.");

                var isDefaultFinancialGroupExists = dbHelper.EntityExists("cmn.FinancialGroup",
                    string.Format("IsDefault = 1 and ID <> '{0}'",
                        entity.GetFieldValue<Guid>("ID")));

                if (isDefaultFinancialGroupExists && entity.GetFieldValue<bool>("IsDefault"))
                    throw new AfwException("قبلا گروه مالی پیش فرض تعیین شده است.");

                if (entity.GetFieldValue<bool>("IsDefault") == true)
                {
                    var isCurrentYearExists = dbHelper.EntityExists("cmn.FinancialGroup",
                        string.Format("IsDefault = '{0}' and ID <> '{1}'",
                            entity.GetFieldValue<bool>("IsDefault"),
                            entity.GetFieldValue<Guid>("ID")));

                    if (isCurrentYearExists)
                    {
                        var financialYearEntity = dbHelper.FetchSingle("cmn.FinancialGroup",
                            string.Format("IsDefault = '{0}' and ID <> '{1}'",
                        entity.GetFieldValue<bool>("IsDefault"),
                        entity.GetFieldValue<Guid>("ID")), null);

                        financialYearEntity.ChangeStatus = "Modify";
                        financialYearEntity.SetFieldValue("IsDefault", false);
                        dbHelper.ApplyChanges(financialYearEntity);
                    }
                }
            }
        }

        public Guid GetFinancialGroupID(Guid? organizationUnitID, Guid? financialYearID, Guid? financialDocTypeID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            if (organizationUnitID == null)
                throw new AfwException("organizationUnitID parameter is not set!");
            if (financialYearID == null)
                throw new AfwException("financialYearID parameter is not set!");
            if (financialDocTypeID == null)
                throw new AfwException("financialDocTypeID parameter is not set!");

            Entity financialGroupEntity = dbHelper.FetchSingleBySqlQuery(string.Format(@"
                select ID 
                from cmn_FinancialGroups 
                where FinancialYear = '{0}' and OrganizationUnit = '{1}' and FinancialDocType = '{2}'
                ", financialYearID, organizationUnitID, financialDocTypeID)
                );

            if (financialGroupEntity == null)
            {

                throw new AfwException("تنظیمات واحد سازمانی برای واحد سازمانی، سال مالی و نوع سند مالی موجود نیست.");
            }
            else
                return financialGroupEntity.GetFieldValue<Guid>("ID");
        }

        public EntityList GetUsedFinancialGroups(string entityTableName)
        {
            //DebugHelper.Break();

            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var financialGroupEntityList = dbHelper.FetchMultipleBySqlQuery(
                string.Format(@"
                        select * 
                        from cmn_FinancialGroups FinancialGroup 
                        where FinancialGroup.ID 
	                        in (
                                select FinancialGroup 
		                        from {0}
                            )",
                    entityTableName)
               );
            return financialGroupEntityList;
        }

        public Guid GetDefaultFinancialGroupID(Guid financialDocTypeID, Guid financialYearID, Guid organizationUnitID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var financialGroupEntity = dbHelper.FetchSingle("cmn.FinancialGroup",
                string.Format(@"FinancialDocType = '{0}' and FinancialYear = '{1}' and OrganizationUnit = '{2}'",
                    financialDocTypeID, financialYearID, organizationUnitID), null);

            if (financialGroupEntity == null)
            {
                var financialDocType = OptionSetHelper.GetOptionSetItemTitle(financialDocTypeID);
                var financialYear = dbHelper.FetchSingleByID("cmn.FinancialYear", financialYearID, null);
                var organizationUnit = dbHelper.FetchSingleByID("cmn.OrganizationInformation", organizationUnitID, null);
                throw new AfwException("تنظیمات واحد سازمانی برای واحد {0} در سال مالی {1} و نوع سند مالی {2} موجود نیست.",
                    organizationUnit.GetFieldValue<string>("Name"), financialYear.GetFieldValue<string>("YearNo"), financialDocType);
            }

            return financialGroupEntity.GetFieldValue<Guid>("ID");
        }
    }
}

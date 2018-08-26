using AppFramework;
using AppFramework.AppServer;
using AppFramework.DataAccess;
using AppFramework.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace AppFramework.AppServer.WarehouseManagement
{
    class WarehouseDocsAccSettingsBL : EntityBL
    {
        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify))
            {
                var redundantExists = dbHelper.EntityExists("wm.WarehouseDocsAccSettings",
                    string.Format(@"
                        FinancialYear = '{0}'
                        and GhabzOrHavaleType = '{1}'
                        and ID <> '{2}'",
                        entity.GetFieldValue<Guid>("FinancialYear"),
                        entity.GetFieldValue<Guid>("GhabzOrHavaleType"),
                        entity.GetFieldValue<Guid>("ID")));

                if (redundantExists)
                    throw new AfwException("این مورد قبلا ثبت شده است.");

                redundantExists = dbHelper.EntityExists("acc.Account",
                    string.Format("ID = '{0}' and FinancialYear = '{1}'", entity.GetFieldValue<Guid>("TarafHesabeAnbarAccount"), entity.GetFieldValue<Guid>("FinancialYear")));

                if (!redundantExists)
                    throw new AfwException("کدینگ انتخاب شده با سال مالی تطابق ندارد.");
            
            }
        }

        public bool ExistWarehouseDocsAccSetting(Guid financialYear, Guid ghabzOrHavaleType)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;
            var result = dbHelper.EntityExists("wm.WarehouseDocsAccSettings",
                    string.Format(@"
                        FinancialYear = '{0}'
                        and GhabzOrHavaleType = '{1}'",
                        financialYear,
                        ghabzOrHavaleType));

            return result;
        }

        public Entity GetWarehouseDocsAccSetting(Guid financialYear, Guid ghabzOrHavaleType)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;
            var result = dbHelper.FetchSingle("wm.WarehouseDocsAccSettings",
                    string.Format(@"
                        FinancialYear = '{0}'
                        and OrganizationUnit = '{1}'
                        and FinancialDocType = '{2}'
                        and GhabzOrHavaleType = '{3}'",
                        financialYear,
                        ghabzOrHavaleType) ,null);

            return result;
        }

        internal void SaveWarehouseDocsAccSettingsCopy(Guid financialYear, Guid ghabzOrHavaleType, Guid tarafHesabeAnbarAccount)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var entity = dbHelper.CreateNewEntity("wm.WarehouseDocsAccSettings");

            entity.SetFieldValue("FinancialYear", financialYear);
            entity.SetFieldValue("GhabzOrHavaleType", ghabzOrHavaleType);
            entity.SetFieldValue("TarafHesabeAnbarAccount", tarafHesabeAnbarAccount);

            dbHelper.ApplyChanges(entity);

        }
    }
}

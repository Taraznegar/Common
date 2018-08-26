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
    public abstract class EntityBL
    {
        protected Entity _OldEntity;

        protected bool LoadOldEntityOnBeforeApplyChanges = true;

        public EntityBL()
        {

        }

        public virtual void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            _OldEntity = null;

            if (entity.EntityDefID == null)
                throw new AfwException("entity.EntityDefID is not set.");

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Modify, EntityChangeTypes.Delete))
            {
                if (LoadOldEntityOnBeforeApplyChanges)
                    _OldEntity = dbHelper.FetchSingleByID((Guid)entity.EntityDefID, entity.GetFieldValue<Guid>("ID"), null);
            }

            if (entity.FieldExists("IssueDate") && entity.FieldExists("FinancialYear"))
                CheckIssueDateAndFinancialYearConsistency(entity);
        }

        public virtual void AfterApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {

        }

        protected Entity GetOldEntity(Entity entity)
        {
            if (_OldEntity == null)
                return null;

            if (_OldEntity.GetFieldValue<Guid>("ID") != entity.GetFieldValue<Guid>("ID"))
                throw new AfwException("OldEntity ID is different with entity ID.");//OldEntity should fetch in BeforeApplyChanges
            else
                return _OldEntity;
        }

        private void CheckIssueDateAndFinancialYearConsistency(Entity entity)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var financialYearEntity = cmn.Instance.GetFinancialYearEntity(entity.GetFieldValue<Guid>("FinancialYear"));
            var financialYearStartDate = financialYearEntity.GetFieldValue<DateTime>("StartDate");
            var financialYearEndDate = financialYearEntity.GetFieldValue<DateTime>("EndDate");

            if (entity.GetFieldValue<DateTime>("IssueDate") < financialYearStartDate
                || entity.GetFieldValue<DateTime>("IssueDate") > financialYearEndDate)
                throw new AfwException("تاریخ در محدوده سالی مالی نیست.");
        }
    }
}

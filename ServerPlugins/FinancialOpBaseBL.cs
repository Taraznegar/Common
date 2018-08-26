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
    public abstract class FinancialOpBaseBL: EntityBL
    {
        private string _OpEntityFullName;
        private string _OpDateFieldName;

        protected FinancialOpBaseBL(string opKindName)
        {
            var financialOpKind = GetFinanialOpKind(opKindName);
            _OpEntityFullName = financialOpKind.GetFieldValue<string>("OpEntityFullName");
            _OpDateFieldName = financialOpKind.GetFieldValue<string>("OpDateFieldName");
        }

        public Entity GetFinanialOpKind(string Name)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var financialOpKinds = CoreComponent.Instance.TryGetApplicationKeyValue("cmn", "FinancialOpKinds");
            
            if( financialOpKinds == null)
            {
                financialOpKinds = dbHelper.FetchMultiple("cmn.FinancialOpKind", null, null, null, null, null);
                    CoreComponent.Instance.SetApplicationKeyValue("cmn", "FinancialOpKinds", financialOpKinds);
            }
            EntityList financialOpKindsEntityList = (EntityList)financialOpKinds;

            Entity financialOpKind = financialOpKindsEntityList.Entities.Find(x => x.GetFieldValue<string>("Name") == Name);                
            return financialOpKind;
        }

        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify))
            {
                if (entity.GetFieldValue<Guid?>("FinancialGroup") == null)
                    throw new AfwException("FinancialGroup is not set.(Check in OrgzanizationUnitSetting)");

                ValidateOpDate(entity);
            }

            if (entity.ChangeStatus != EntityChangeTypes.None)
            {
                Guid financialDocTypeID = Guid.Empty;

                if (entity.FieldExists("FinancialDocType"))
                    financialDocTypeID = entity.GetFieldValue<Guid>("FinancialDocType");
                else if (entity.FieldExists("FinancialGroup"))
                    financialDocTypeID = dbHelper.FetchSingleByID("cmn.FinancialGroup", entity.GetFieldValue<Guid>("FinancialGroup"), null)
                        .GetFieldValue<Guid>("FinancialDocType");

                acc.Instance.CheckFinalDocExistsAtDates(entity.GetFieldValue<Guid>("FinancialYear"),
                    financialDocTypeID,
                    entity.GetFieldValue<DateTime>(GetOpDateFieldName()),
                    (_OldEntity != null ? _OldEntity.GetFieldValue<DateTime>(GetOpDateFieldName()) : null as DateTime?));
            }
        }

        public override void AfterApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.AfterApplyChanges(dbHelper, entity);
        }

        protected virtual string GetOpEntityFullName()
        {
            if (_OpEntityFullName == null)
                throw new AfwException("OpEntityFullName is not set!");

            return _OpEntityFullName;
        }
        protected virtual string GetOpDateFieldName()
        {
            if (_OpDateFieldName == null)
                throw new AfwException("OpDateFieldName is not set!");

            return _OpDateFieldName;
        }

        protected void ValidateOpDate(Entity entity)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var financialYearEntity = dbHelper.FetchSingleByID("cmn.FinancialYear", entity.GetFieldValue<Guid>("FinancialYear"), null);
            var financialYearStartDate = financialYearEntity.GetFieldValue<DateTime>("StartDate");
            var financialYearEndDate = financialYearEntity.GetFieldValue<DateTime>("EndDate");

            if (entity.GetFieldValue<DateTime>(_OpDateFieldName) < financialYearStartDate
                || entity.GetFieldValue<DateTime>(_OpDateFieldName) > financialYearEndDate)
                throw new AfwException("تاریخ در محدوده سالی مالی نیست.");
        }
    }
}

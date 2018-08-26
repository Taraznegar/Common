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
    public class OrganizationInformationBL : EntityBL
    {
        public bool IsMegaModavem
        {
            get
            {
                return GetOrganizationInformation().GetFieldValue<string>("LatinName") == "MegaModavem";
            }
        }

        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            //DebugHelper.Break();
            if (entity.ChangeStatus == EntityChangeTypes.Add)
            {
                if (entity.GetFieldValue<Guid?>("ParentOrganizationUnit") == null
                    && dbHelper.EntityExists("cmn.OrganizationInformation", "ParentOrganizationUnit is null"))
                    throw new AfwException("اطلاعات سازمان قبلا ثبت شده است.");
            }
        }

        public override void AfterApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.AfterApplyChanges(dbHelper, entity);

            var id = entity.GetFieldValue<Guid>("ID");

            if (entity.ChangeStatus == EntityChangeTypes.Add)
            {
                var afwOrganizationUnit = dbHelper.CreateNewEntity("afw.OrganizationUnit");
                afwOrganizationUnit.SetFieldValue("ID", id);
                afwOrganizationUnit.SetFieldValue("Name", entity.GetFieldValue<string>("Name"));
                afwOrganizationUnit.SetFieldValue("ParentOrganizationUnit", entity.GetFieldValue<Guid>("ParentOrganizationUnit"));

                dbHelper.InsertEntity(afwOrganizationUnit);
            }
            if (entity.ChangeStatus == EntityChangeTypes.Modify)
            {
                var afwOrganizationUnit = dbHelper.FetchSingleByID("afw.OrganizationUnit", id, null);

                if (afwOrganizationUnit == null)
                    throw new AfwException("afwOrganizationUnit not found!");

                afwOrganizationUnit.SetFieldValue("Name", entity.GetFieldValue<string>("Name"));
                afwOrganizationUnit.SetFieldValue("ParentOrganizationUnit", entity.GetFieldValue<Guid>("ParentOrganizationUnit"));

                dbHelper.UpdateEntity(afwOrganizationUnit);
            }
            if (entity.ChangeStatus == EntityChangeTypes.Delete)
            {
                var afwOrganizationUnit = dbHelper.FetchSingleByID("afw.OrganizationUnit", id, null);

                if (afwOrganizationUnit == null)
                    throw new AfwException("afwOrganizationUnit not found!");

                dbHelper.DeleteEntity(afwOrganizationUnit);
            }
        }

        public List<Entity> GetOrganizationUnits()
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            return dbHelper.FetchMultiple("cmn.OrganizationInformation", null, null, null, null, null).Entities;
        }

        public Entity GetOrganizationInformation()
        {
            var orgUnits = GetOrganizationUnits();

            if (orgUnits.Count == 0)
                throw new AfwException("اطلاعات سازمان در تنظیمات سیستم ثبت نشده است.");

            return orgUnits.First(o => o.GetFieldValue<Guid?>("ParentOrganizationUnit") == null);
        }
    }
}

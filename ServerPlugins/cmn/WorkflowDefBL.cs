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
    class WorkflowDefBL : EntityBL
    {
        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus == EntityChangeTypes.Delete)
            {
                var workflowDefID = entity.GetFieldValue<Guid>("ID");
                var workflowStageOrgPostions = dbHelper.FetchMultiple("cmn.WorkflowStageOrgPostion",
                    string.Format("WorkflowDef = '{0}'", workflowDefID.ToString()), null, null, null, null).Entities;

                foreach (Entity workflowStageOrgPostion in workflowStageOrgPostions)
                {
                    dbHelper.DeleteEntity(workflowStageOrgPostion);
                }
            }

            if (entity.ChangeStatus != EntityChangeTypes.Delete)
            {
                var workflowFormID = entity.GetFieldValue<Guid>("WorkflowForm");

                if (dbHelper.EntityExists("cmn.WorkflowDef",
                    string.Format("WorkflowForm = '{0}' and ID <> '{1}'",
                        workflowFormID, entity.GetFieldValue<Guid>("ID"))))
                    throw new AfwException("برای این فرم، گردش کار دیگری تعریف شده است.");
            }
        }
    }
}

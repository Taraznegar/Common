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
    public class WorkflowStageOrgPostionBL : EntityBL
    {
        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus != EntityChangeTypes.Delete)
            {
                var workflowStageID = entity.GetFieldValue<Guid>("WorkflowStage");
                var orgPostionID = entity.GetFieldValue<Guid>("OrgPostion");

                var workflowStageOrgPostions = dbHelper.FetchMultiple("cmn.WorkflowStageOrgPostion",
                    string.Format("WorkflowStage = '{0}'", workflowStageID), null, null, null, null).Entities;

                if (workflowStageOrgPostions.Any(o => o.GetFieldValue<Guid>("WorkflowStage") == workflowStageID
                    && o.GetFieldValue<Guid>("OrgPostion") == orgPostionID
                    && o.GetFieldValue<Guid>("ID") != entity.GetFieldValue<Guid>("ID")))
                    throw new AfwException("این رکورد قبلا ثبت شده است.");
            }
        }
    }
}

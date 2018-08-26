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
    class WorkflowStageBL : EntityBL
    {
        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            //DebugHelper.Break();

            if (entity.ChangeStatus != EntityChangeTypes.Delete)
            {
                var workflowDefID = entity.GetFieldValue<Guid>("WorkflowDef");
                var stageOrder = entity.GetFieldValue<int>("StageOrder");
                var systemActionID = entity.GetFieldValue<Guid?>("SystemAction");

                var workflowStages = dbHelper.FetchMultiple("cmn.WorkflowStage",
                    string.Format("WorkflowDef = '{0}'", workflowDefID), null, null, null, null).Entities;

                if (workflowStages.Any(o => o.GetFieldValue<int>("StageOrder") == stageOrder
                    && o.GetFieldValue<Guid>("ID") != entity.GetFieldValue<Guid>("ID")))
                    throw new AfwException("شماره مرحله تکراری است.");

                if (systemActionID != null &&
                    workflowStages.Any(o => o.GetFieldValue<Guid?>("SystemAction") == systemActionID
                        && o.GetFieldValue<Guid>("ID") != entity.GetFieldValue<Guid>("ID")))
                    throw new AfwException("این عمیلات سیستمی برای مرحله دیگری انتخاب شده است.");
            }
        }
    }
}

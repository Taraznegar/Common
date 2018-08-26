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
    class WorkflowBL
    {
        public List<Entity> GetWorkflowForms()
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            return dbHelper.FetchMultiple("cmn.WorkflowForm", null, null, null, null, null).Entities;
        }

        public Entity GetWorkflowFormByName(string workflowFormName)
        {
            var workflowForms = GetWorkflowForms();
            var foundWorkflowForms = workflowForms.FindAll(o => o.GetFieldValue<string>("Name") == workflowFormName);

            if (foundWorkflowForms.Count == 0)
                throw new AfwException("WorkflowForm with Name '{0}' not exists!", workflowFormName);
            else
                return foundWorkflowForms[0];
        }

        public Guid GetWorkflowFormID(string workflowFormName)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            return GetWorkflowFormByName(workflowFormName).GetFieldValue<Guid>("ID");
        }

        public List<Entity> GetWorkflowDefs()
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            return dbHelper.FetchMultiple("cmn.WorkflowDef", null, null, null, null, new string[] { "Stages" }).Entities;
        }

        public Entity TryGetWorkflowDefByFormName(string workflowFormName)
        {
            var workflowFormID = GetWorkflowFormID(workflowFormName);
            var workflowDefs = GetWorkflowDefs();
            var foundWorkflowDefs = workflowDefs.FindAll(o => o.GetFieldValue<Guid>("WorkflowForm") == workflowFormID);

            if (foundWorkflowDefs.Count == 0)
                return null;

            return foundWorkflowDefs[0];
        }

        public Entity GetWorkflowDefByFormName(string workflowFormName)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var workflowDef = TryGetWorkflowDefByFormName(workflowFormName);

            if (workflowDef == null)
                throw new AfwException("WorkflowDef for Form '{0}' not exists!", workflowFormName);

            return workflowDef;
        }

        public List<Entity> GetWorkflowStages()
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            return dbHelper.FetchMultiple("cmn.WorkflowStage", null, "StageOrder", null, null, null).Entities;
        }

        public List<Entity> TryGetWorkflowStagesByWorkflowDefID(Guid workflowDefID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var workflowStages = GetWorkflowStages();

            var foundWorkflowStages = workflowStages.FindAll(o => o.GetFieldValue<Guid>("WorkflowDef") == workflowDefID);

            return foundWorkflowStages;
        }
    }
}

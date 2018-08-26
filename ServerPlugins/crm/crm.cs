using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Reflection;
using AppFramework.DataAccess;
using System.Diagnostics;
using AppFramework.Helpers;

namespace AppFramework.AppServer
{
    public class crm
    {
        public crm()
        {

        }

        #region WarningsPopup
        public int GetUserTotalWarningItemsCount()
        {
            return new WarningPopupBL().GetUserTotalWarningItemsCount();
        }

        public Entity GetUserWarningItemsCount()
        {
            return new WarningPopupBL().GetUserWarningItemsCount();
        }
        
        #endregion

        #region SalesCase
        public void SaveSalesCase(Entity salesCase)
        {
            new SalesCaseBL().SaveSalesCase(salesCase);
        }
         
        public void SetSalesCaseStage(Guid salesCaseID, Guid newStageId)
        {
            new SalesCaseBL().SetSalesCaseStage(salesCaseID, newStageId);
        }

        public void QualifyLead(Guid leadID)
        {
            new LeadBL().QualifyLead(leadID);
        }
        
        public void DisqualifyLead(Entity disqualifyInfo)
        {
            new LeadBL().DisqualifyLead(disqualifyInfo);
        }

        #endregion 

        [ServerEvent(ServerEventTypes.OneMinuteClientSyncRequested)]
        public void OneMinuteClientSyncRequested(Entity syncResultEntity)
        {
            var userWarningPopupItemsCount = new WarningPopupBL().GetUserTotalWarningItemsCount();
            syncResultEntity.AddField("crm_UserWarningPopupItemsCount", userWarningPopupItemsCount);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "Lead")]
        public void BeforeApplyLeadChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new LeadBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "SalesCase")]
        public void BeforeApplySalesCaseChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new SalesCaseBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.AfterApplyEntityChanges, "SalesCaseLoseInfo")]
        public void AfterApplySalesCaseLoseInfoChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new SalesCaseLoseInfoBL().AfterApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.AfterApplyEntityChanges, "SalesCaseNote")]
        public void AfterApplySalesCaseNoteChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new SalesCaseNoteBL().AfterApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.AfterApplyEntityChanges, "SalesCaseAttachedFile")]
        public void AfterApplySalesCaseAttachedFileChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new SalesCaseAttachedFileBL().AfterApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.AfterApplyEntityChanges, "SalesCaseConnectedPerson")]
        public void AfterApplySalesCaseConnectedPersonChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new SalesCaseConnectedPersonBL().AfterApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.AfterApplyEntityChanges, "SalesCaseRequestedStuff")]
        public void AfterApplySalesCaseRequestedStuffChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new SalesCaseRequestedStuffBL().AfterApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.AfterApplyEntityChanges, "SalesCaseRequestedService")]
        public void AfterApplySalesCaseRequestedServiceChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new SalesCaseRequestedServiceBL().AfterApplyChanges(dbHelper, entity);
        }
    }
}

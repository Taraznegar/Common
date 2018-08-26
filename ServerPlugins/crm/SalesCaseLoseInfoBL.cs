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
    public class SalesCaseLoseInfoBL : EntityBL
    {
        public override void AfterApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.AfterApplyChanges(dbHelper, entity);

            var salesCase = dbHelper.FetchSingleByID("crm.SalesCase", entity.GetFieldValue<Guid>("SalesCase"), null);

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add))
            {
                var salesCaseStatus_LostID = OptionSetHelper.GetOptionSetItemID("crm.SalesCaseStatuses", "Lost");
                salesCase.FieldValues["Status"] = salesCaseStatus_LostID;
            }
                
            salesCase.FieldValues["LastActionTime"] = CoreComponent.Instance.GetServerDateTime();
            salesCase.ChangeStatus = EntityChangeTypes.Modify;

            dbHelper.ApplyChanges(salesCase);
        }   
    }
}

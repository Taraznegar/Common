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
    public class SalesCaseRequestedStuffBL : EntityBL
    {
        public override void AfterApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.AfterApplyChanges(dbHelper, entity);

            new SalesCaseBL().UpdateSalesCaseLastActionTime(entity.GetFieldValue<Guid>("SalesCase"));
        }
    }
}

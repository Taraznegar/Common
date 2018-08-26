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
    public class QuickSettlementPosItemBL : EntityBL
    {
        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify))
            {
                var redundantExists = dbHelper.EntityExists("rp.QuickSettlementPosItem",
                    string.Format("PosDevice = '{0}' and FinancialOpKind = '{1}' and ID <> '{2}'",
                        entity.GetFieldValue<Guid>("PosDevice"),
                        entity.GetFieldValue<Guid>("FinancialOpKind"), 
                        entity.GetFieldValue<Guid>("ID")));

                if (redundantExists)
                    throw new AfwException("این آیتم پوز در تسویه سریع قبلا ثبت شده است.");
            } 
        }  
    }
}

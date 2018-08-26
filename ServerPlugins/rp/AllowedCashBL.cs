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
    public class AllowedCashBL : EntityBL
    {
        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify))
            {
                var redundantExists = dbHelper.EntityExists("rp.AllowedCash",
                    string.Format("Cash = '{0}' and Gender = '{1}' and ID <> '{2}'",
                        entity.GetFieldValue<Guid>("Cash"),
                        entity.GetFieldValue<Guid>("Gender"),
                        entity.GetFieldValue<Guid>("ID")));

                if (redundantExists)
                    throw new AfwException("این صندوق قبلا ثبت شده است.");
            } 
        }  
    }
}

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
    public class AllowedPosDeviceBL : EntityBL
    {
        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify))
            {
                var redundantExists = dbHelper.EntityExists("rp.AllowedPosDevice",
                    string.Format("PosDevice = '{0}' and ID <> '{1}'",
                        entity.GetFieldValue<Guid>("PosDevice"), 
                        entity.GetFieldValue<Guid>("ID")));

                if (redundantExists)
                    throw new AfwException("این دستگاه پوز قبلا ثبت شده است.");
            } 
        }  
    }
}

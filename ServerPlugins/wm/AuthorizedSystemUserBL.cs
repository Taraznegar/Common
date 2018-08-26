using AppFramework;
using AppFramework.DataAccess;
using AppFramework.DataAccess.Utils;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace AppFramework.AppServer.WarehouseManagement
{
    class AuthorizedSystemUserBL: EntityBL
    {
        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify))
            {
                var redundantExists = dbHelper.EntityExists("wm.AuthorizedSystemUser",
                    string.Format("GhabzOrHavaleType = '{0}' and SystemUser = '{1}' and ID <> '{2}'",
                        entity.GetFieldValue<Guid>("GhabzOrHavaleType"),
                        entity.GetFieldValue<Guid>("SystemUser"),
                        entity.GetFieldValue<Guid>("ID")));

                if (redundantExists)
                    throw new AfwException("این شخص قبلا ثبت شده است.");
            }
        }
    }
}

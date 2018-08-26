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
    class PsConfigBL : EntityBL
    {
        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            //DebugHelper.Break();

            if (entity.ChangeStatus == "Add")
            {
                var configs = dbHelper.GetCount("ps.Config", "");
                if (configs > 0)
                {
                    throw new AfwException("امکان ثبت بیش از یک رکورد نیست.");
                }
            }
        }
    }
}

using AppFramework;
using AppFramework.AppServer;
using AppFramework.DataAccess;
using AppFramework.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace AppFramework.AppServer.ReceiveAndPay
{
    public class SafteDaryaftiBL : EntityBL
    {
        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            //DebugHelper.Break();

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify) )
            {
                if (dbHelper.EntityExists("rp.SafteDaryafti",
                    string.Format("ShomareSafte = '{0}' and ID <> '{1}'",
                        entity.GetFieldValue<string>("ShomareSafte"),
                        entity.GetFieldValue<Guid>("ID")))) {
                            throw new AfwException("ShomareSafteVojoodDarad");
                }
                
            }            

        }
       
        
    }
}

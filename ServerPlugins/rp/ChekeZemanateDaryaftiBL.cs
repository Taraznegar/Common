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
    public class ChekeZemanateDaryaftiBL : EntityBL
    {
        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            //DebugHelper.Break();

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify))
            {
                if (dbHelper.EntityExists("rp.ChekeZemanateDaryafti",
                    string.Format("Number = '{0}' and ID <> '{1}'",
                        entity.GetFieldValue<string>("Number"),
                        entity.GetFieldValue<Guid>("ID"))))
                {
                    throw new AfwException("ShomareChekeZemanatVojoodDarad");
                }

                if (dbHelper.EntityExists("rp.ChekeZemanateDaryafti",
                    string.Format("RadifeDaftareChek = '{0}' and ID <> '{1}'",
                        entity.GetFieldValue<string>("RadifeDaftareChek"),
                        entity.GetFieldValue<Guid>("ID"))))
                {
                    throw new AfwException("RadifeDaftareChekeZemanatVojoodDarad");
                }
            }

        }


    }
}

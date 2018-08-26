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
    public class StuffLabelBL : EntityBL
    {
        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            var id = entity.GetFieldValue<Guid>("ID");

            if (entity.ChangeStatus != EntityChangeTypes.Delete)
            {
                if (dbHelper.EntityExists("cmn.StuffLabel",
                        string.Format("Name = N'{0}' and ID <> '{1}'",
                            entity.GetFieldValue<string>("Name"), id)))
                {
                    throw new AfwException("این برچسب قبلا ثبت شده است");
                }
            }
        }
    }
}

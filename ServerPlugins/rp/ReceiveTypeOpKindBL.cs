﻿using AppFramework;
using AppFramework.AppServer;
using AppFramework.DataAccess;
using AppFramework.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace AppFramework.AppServer.ReceiveAndPay
{
    public class ReceiveTypeOpKindBL : EntityBL
    {
        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            //DebugHelper.Break();

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify))
            {
                if (entity.GetFieldValue<bool>("IsDefault") &&
                    dbHelper.EntityExists("rp.ReceiveTypeOpKind",
                     string.Format("ReceiveType = '{0}' and IsDefault = 1 and ID <> '{1}'",
                        entity.GetFieldValue<Guid>("ReceiveType"),
                        entity.GetFieldValue<Guid>("ID"))))
                {
                    throw new AfwException("IsDefaultExist");
                }

                if (dbHelper.EntityExists("rp.ReceiveTypeOpKind",
                     string.Format("FinancialOpKind = '{0}' and ID <> '{1}'",
                        entity.GetFieldValue<Guid>("FinancialOpKind"),
                        entity.GetFieldValue<Guid>("ID"))))
                {
                    throw new AfwException("OpKindExist");
                }
            }
        }

        public override void AfterApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.AfterApplyChanges(dbHelper, entity);

        }


    }
}

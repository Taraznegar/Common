﻿using AppFramework;
using AppFramework.AppServer;
using AppFramework.DataAccess;
using AppFramework.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace AppFramework.AppServer.WarehouseManagement
{
    class GhabzOrHavaleTypeBL : EntityBL
    {
        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify))
            {
                var redundantExists = dbHelper.EntityExists("wm.GhabzOrHavaleType",
                    string.Format("ReferenceDocType = '{0}' and WarehouseDocType = '{1}' and RefDocName {2} and ID <> '{3}'",
                        entity.GetFieldValue<Guid>("ReferenceDocType"),
                        entity.GetFieldValue<Guid>("WarehouseDocType"),
                        entity.GetFieldValue<string>("RefDocName") == null ? "is not null" : "<> '" + entity.GetFieldValue<string>("RefDocName") + "'",
                        entity.GetFieldValue<Guid>("ID")));

                if (redundantExists)
                    throw new AfwException("این نوع عملیات مرتبط قبلا ثبت شده است.");
            }
        }
    }
}

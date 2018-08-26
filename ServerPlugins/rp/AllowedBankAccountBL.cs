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
    public class AllowedBankAccountBL : EntityBL
    {
        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify))
            {
                var redundantExists = dbHelper.EntityExists("rp.AllowedBankAccount",
                    string.Format("BankAccount = '{0}' and Gender = '{1}' and ID <> '{2}'",
                        entity.GetFieldValue<Guid>("BankAccount"),
                        entity.GetFieldValue<Guid>("Gender"),
                        entity.GetFieldValue<Guid>("ID")));

                if (redundantExists)
                    throw new AfwException("این حساب بانکی قبلا ثبت شده است.");
            } 
        }  
    }
}

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
    public class QuickSettlementHavaleItemBL : EntityBL
    {
        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify))
            {
                var redundantExists = dbHelper.EntityExists("rp.QuickSettlementHavaleItem",
                    string.Format("BankAccount = '{0}' and Gender = '{1}' and FinancialOpKind = '{2}' and ID <> '{3}'",
                        entity.GetFieldValue<Guid>("BankAccount"),
                        entity.GetFieldValue<Guid>("Gender"),
                        entity.GetFieldValue<Guid>("FinancialOpKind"),
                        entity.GetFieldValue<Guid>("ID")));

                if (redundantExists)
                    throw new AfwException("این آیتم حواله در تسویه سریع قبلا ثبت شده است.");

                if (entity.GetFieldValue<bool>("IsDefault") == true)
                {
                    var isDefaultExists = dbHelper.EntityExists("rp.QuickSettlementHavaleItem",
                        string.Format("IsDefault = {0} and ID <> '{1}'",
                            entity.GetFieldValue<bool>("IsDefault") == true ? 1 : 0,
                            entity.GetFieldValue<Guid>("Gender"),
                            entity.GetFieldValue<Guid>("ID")));

                    if (isDefaultExists)
                    {
                        var beforeQuickSettlementHavaleItemEntity = dbHelper.FetchSingle("rp.QuickSettlementHavaleItem",
                            string.Format("IsDefault = {0} and Gender = '{1}' and ID <> '{2}'",
                        entity.GetFieldValue<bool>("IsDefault") == true ? 1 : 0,
                        entity.GetFieldValue<Guid>("Gender"),
                        entity.GetFieldValue<Guid>("ID")), null);

                        beforeQuickSettlementHavaleItemEntity.ChangeStatus = "Modify";
                        beforeQuickSettlementHavaleItemEntity.SetFieldValue("IsDefault", false);
                        dbHelper.ApplyChanges(beforeQuickSettlementHavaleItemEntity);
                    }
                }
            }
        }
    }
}

using AppFramework;
using AppFramework.AppServer;
using AppFramework.DataAccess;
using AppFramework.DataAccess.Utils;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace AppFramework.AppServer.WarehouseManagement
{
    class WarehouseHybridOperationBL : EntityBL
    {
        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus == EntityChangeTypes.Add)
            {
                var lastOpNumber = cmn.Instance.GetFieldMaxIntValue("OpNumber", "wm_WarehouseHybridOperations", null);
                entity.SetFieldValue("OpNumber", lastOpNumber + 1);
            }

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify))
            {
                foreach (var ghabzOrHavaleItem in entity.GetFieldValue<EntityList>("WarehouseHybridOperationItems").Entities)
                {
                    if (ghabzOrHavaleItem.FieldExists("Stuff_Entity"))
                        ghabzOrHavaleItem.RemoveField("Stuff_Entity");
                }
            }

            if (entity.ChangeStatus == EntityChangeTypes.Delete)
            {
                var ghabzOrHavaleList = dbHelper.FetchMultiple("wm.GhabzOrHavale",
                    string.Format("RefDoc_WarehouseHybridOperation = '{0}'", entity.GetFieldValue<Guid>("ID")),
                    null, null, null, null);

                foreach (var ghabzOrHavale in ghabzOrHavaleList.Entities)
                {
                    dbHelper.DeleteEntity(ghabzOrHavale);
                }
            }
        }

        public override void AfterApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.AfterApplyChanges(dbHelper, entity);

            var id = entity.GetFieldValue<Guid>("ID");

            if (entity.ChangeStatus != EntityChangeTypes.Delete)
            {
                if (entity.FieldExists("WarehouseHybridOperationItems") && entity.GetFieldValue<EntityList>("WarehouseHybridOperationItems") != null)
                {
                    dbHelper.ApplyChanges(entity.GetFieldValue<EntityList>("WarehouseHybridOperationItems"));
                }

                if (!HasItem(id))
                    throw new AfwException("عملیات ترکیبی هیچ آیتمی ندارد .");
            }

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify))
            {
                CreateWarehouseDocs(entity);
            }
        }

        private bool HasItem(Guid id)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var items = dbHelper.FetchMultiple("wm.WarehouseHybridoperationItem",
                string.Format("WarehouseHybridoperation = '{0}'", id), null, null, null, null).Entities;

            return items.Count > 0;
        }

        private void CreateWarehouseDocs(Entity warehouseHybridOperation)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var refDocTypeEntity = dbHelper.FetchSingle("wm.ReferenceDocType", "RefDocName = N'WarehouseHybridOperation'", null);
            if (refDocTypeEntity == null)
                throw new AfwException("RefDocName(WarehouseHybridOperation) is invalid or not exists.");

            if (warehouseHybridOperation.ChangeStatus == EntityChangeTypes.Modify)
            {
                var ghabzOrHavaleList = dbHelper.FetchMultiple("wm.GhabzOrHavale",
                    string.Format("RefDoc_WarehouseHybridOperation = '{0}'", warehouseHybridOperation.GetFieldValue<Guid>("ID")),
                    null, null, null, null);

                foreach (var ghabzOrHavale in ghabzOrHavaleList.Entities)
                {
                    dbHelper.DeleteEntity(ghabzOrHavale);
                }
            }

            var warehouseHybridOperationItems = warehouseHybridOperation.GetFieldValue<EntityList>("WarehouseHybridOperationItems").Entities;
            var groupsLists = GroupItemsByStuffLocationAndGhabzOrHavaleType(warehouseHybridOperationItems);

            //برای جلوگیری از منفی شدن موجودی در حین ثبت عملیات باید ابتدا قبض ها ایجاد شوند و بعد حواله ها
            var sortedGroups = groupsLists.Where(o => o.GetFieldValue<bool>("IsGhabz")).ToList();
            sortedGroups.AddRange(groupsLists.Where(o => !o.GetFieldValue<bool>("IsGhabz")));

            foreach (var group in sortedGroups)
            {
                Guid? warehouseDocTypeID = null;
                if (group.GetFieldValue<bool>("IsGhabz"))
                    warehouseDocTypeID = OptionSetHelper.GetOptionSetItemID("cmn.WarehouseDocType", "Ghabz");
                else
                    warehouseDocTypeID = OptionSetHelper.GetOptionSetItemID("cmn.WarehouseDocType", "Havale");


                var ghabzOrHavaleEntity = dbHelper.CreateNewEntity("wm.GhabzOrHavale");
                ghabzOrHavaleEntity.SetFieldValue("RefDoc_WarehouseHybridOperation", warehouseHybridOperation.GetFieldValue<Guid>("ID"));

                var ghabzOrHavaleNo = wm.Instance.GetNewGhabzOrHavaleNumber((Guid)warehouseDocTypeID, group.GetFieldValue<Guid>("StuffLocation"));

                //GhabzOrHavale Master
                ghabzOrHavaleEntity.SetFieldValue("ReferenceDocType", refDocTypeEntity.GetFieldValue<Guid>("ID"));
                ghabzOrHavaleEntity.SetFieldValue("FinancialYear", warehouseHybridOperation.GetFieldValue<Guid>("FinancialYear"));
                ghabzOrHavaleEntity.SetFieldValue("FinancialDocType", warehouseHybridOperation.GetFieldValue<Guid>("FinancialDocType"));
                ghabzOrHavaleEntity.SetFieldValue("OrganizationUnit", warehouseHybridOperation.GetFieldValue<Guid>("OrganizationUnit"));
                ghabzOrHavaleEntity.SetFieldValue("GhabzOrHavaleType", group.GetFieldValue<Guid>("GhabzOrHavaleType"));
                ghabzOrHavaleEntity.SetFieldValue("StuffLocation", group.GetFieldValue<Guid>("StuffLocation"));
                ghabzOrHavaleEntity.SetFieldValue("IssueDate", warehouseHybridOperation.GetFieldValue<DateTime>("IssueDate"));
                ghabzOrHavaleEntity.SetFieldValue("GhabzOrHavaleNumber", ghabzOrHavaleNo);
                ghabzOrHavaleEntity.SetFieldValue("VazeyatRialiShodan", OptionSetHelper.GetOptionSetItemID("wm.VaziyatRialiAsnadAnbar", "RialiNashode"));
                /////

                ////GhabzOrHavale Items
                int rowNumber = 1;
                var ghabzOrHavaleItems = new EntityList();
                ghabzOrHavaleItems.EntityDefID = CoreComponent.Instance.GetEntityDef("wm.GhabzOrHavaleItem").GetFieldValue<Guid>("ID");

                var groupItems = group.GetFieldValue<List<Entity>>("Items");

                foreach (var groupItem in groupItems)
                {
                    var ghabzOrhavaleItem = dbHelper.CreateNewEntity("wm.GhabzOrHavaleItem");

                    ghabzOrhavaleItem.SetFieldValue("RowNumber", rowNumber++);
                    ghabzOrhavaleItem.SetFieldValue("GhabzOrHavale", ghabzOrHavaleEntity.GetFieldValue<Guid>("ID"));
                    ghabzOrhavaleItem.SetFieldValue("Stuff", groupItem.GetFieldValue<Guid>("Stuff"));
                    ghabzOrhavaleItem.SetFieldValue("BatchNumber", groupItem.GetFieldValue<string>("BatchNumber"));
                    ghabzOrhavaleItem.SetFieldValue("StuffStatus", groupItem.GetFieldValue<Guid>("StuffStatus"));

                    if (group.GetFieldValue<bool>("IsGhabz"))
                        ghabzOrhavaleItem.SetFieldValue("Quantity", groupItem.GetFieldValue<int>("TedadeVaredeh"));
                    else
                        ghabzOrhavaleItem.SetFieldValue("Quantity", groupItem.GetFieldValue<int>("TedadeSadereh"));

                    ghabzOrHavaleItems.Entities.Add(ghabzOrhavaleItem);
                }

                ghabzOrHavaleEntity.SetFieldValue("GhabzOrHavaleItems", ghabzOrHavaleItems);

                dbHelper.ApplyChanges(ghabzOrHavaleEntity);
            }
        }

        private List<Entity> GroupItemsByStuffLocationAndGhabzOrHavaleType(List<Entity> warehouseHybridOperationItems)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            List<Entity> groupsList = new List<Entity>();

            var stuffLocations = dbHelper.FetchMultiple("cmn.StuffLocation", null, null, null, null, null).Entities;
            var ghabzOrHavaleTypes = wm.Instance.CachedGhabzOrHavaleTypes;

            foreach (var stuffLocation in stuffLocations)
            {
                foreach (var ghabzOrHavaleType in ghabzOrHavaleTypes)
                {
                    var groupItems = warehouseHybridOperationItems.FindAll(o =>
                        o.GetFieldValue<Guid>("StuffLocation") == stuffLocation.GetFieldValue<Guid>("ID")
                        && o.GetFieldValue<Guid>("GhabzOrHavaleType") == ghabzOrHavaleType.GetFieldValue<Guid>("ID"));

                    if (groupItems.Count > 0)
                    {
                        var group = new Entity();

                        var isGhabz = wm.Instance.GetGhabzOrHavaleTypeEntity(ghabzOrHavaleType.GetFieldValue<Guid>("ID"))
                            .GetFieldValue<Guid>("WarehouseDocType") == OptionSetHelper.GetOptionSetItemID("cmn.WarehouseDocType", "Ghabz");

                        group.AddField("IsGhabz", isGhabz);
                        group.AddField("StuffLocation", stuffLocation.GetFieldValue<Guid>("ID"));
                        group.AddField("GhabzOrHavaleType", ghabzOrHavaleType.GetFieldValue<Guid>("ID"));                       
                        group.AddField("Items", groupItems);

                        groupsList.Add(group);
                    }
                }
            }

            return groupsList;
        }

        public void CreateWarehouseHybridOperationBLAccDoc(Entity entity)
        {
            //acc.Instance.InsertOrUpdateAccDocMaster(ref accDocID, "WarehouseHybridOperation", issueDate, financialYear, financialGroup, desc, true);
        }

        private void CreateSalesInvoiceAccDocItems(Entity entity, Guid accDocID)
        {

        }
    }
}

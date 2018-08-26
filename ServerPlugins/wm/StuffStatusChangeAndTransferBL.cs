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
    class StuffStatusChangeAndTransferBL : EntityBL
    {
        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus == EntityChangeTypes.Add)
            {
                var lastOpNumber = cmn.Instance.GetFieldMaxIntValue("OpNumber", "wm_StuffStatusChangeAndTransfers", null);
                entity.SetFieldValue("OpNumber", lastOpNumber + 1);
            }

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify))
            {
                foreach (var ghabzOrHavaleItem in entity.GetFieldValue<EntityList>("StuffStatusChangeAndTransferItems").Entities)
                {
                    if (ghabzOrHavaleItem.FieldExists("Stuff_Entity"))
                        ghabzOrHavaleItem.RemoveField("Stuff_Entity");
                }
            }

            if (entity.ChangeStatus == EntityChangeTypes.Delete)
            {
                var ghabzOrHavaleEntityList = dbHelper.FetchMultiple("wm.GhabzOrHavale",
                    string.Format("RefDoc_StuffStatusChangeAndTransfer = '{0}'", entity.GetFieldValue<Guid>("ID")), null, null, null, null).Entities;
                foreach (var ghabzOrHavale in ghabzOrHavaleEntityList)
                {
                    dbHelper.DeleteEntity(ghabzOrHavale);
                }
            }

            if (entity.ChangeStatus == EntityChangeTypes.Delete)
            {
                //acc.Instance.DeleteAccDocDetail(entity.GetFieldValue<Guid?>("AccDoc"), "RefOp_StuffStatusChangeAndTransfer", invoiceID);
            }
        }

        public override void AfterApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.AfterApplyChanges(dbHelper, entity);

            //DebugHelper.Break();
            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify))
            {
                CreateGhabzOrHavale(entity, "Havale", entity.ChangeStatus);
                CreateGhabzOrHavale(entity, "Ghabz", entity.ChangeStatus);
            }

            if (entity.ChangeStatus != EntityChangeTypes.Delete)
            {
                if (entity.FieldExists("StuffStatusChangeAndTransferItems") &&
                    entity.GetFieldValue<EntityList>("StuffStatusChangeAndTransferItems") != null)
                {
                    dbHelper.ApplyChanges(entity.GetFieldValue<EntityList>("StuffStatusChangeAndTransferItems"));
                }

                var stuffStatusChangeAndTransferType = dbHelper.FetchSingleByID("wm.StuffStatusChangeAndTransferType", entity.GetFieldValue<Guid>("StuffStatusChangeAndTransferType"), null);
                if (stuffStatusChangeAndTransferType.GetFieldValue<bool>("AccDocIssuing"))
                    CreateStuffStatusChangeAndTransferAccDoc(entity);
            }

            if (entity.ChangeStatus == EntityChangeTypes.Delete)
            {
                //acc.Instance.DeleteAccDocMaster(entity.GetFieldValue<Guid?>("AccDoc"), "wm.StuffStatusChangeAndTransfer", invoiceID);
            }
        }

        private void CreateGhabzOrHavale(Entity stuffStatusChangeAndTransfer, string ghabzOrHavaleType, string changeStatus)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var stuffStatus = ghabzOrHavaleType == "Havale" ? "PrimaryStatus" : "SeconderyStatus";

            var refDocTypeEntity = dbHelper.FetchSingle("wm.ReferenceDocType", "RefDocName = N'StuffStatusChangeAndTransfer'", null);
            if (refDocTypeEntity == null)
                throw new AfwException("RefDocName(StuffStatusChangeAndTransfer) is invalid or not exists.");

            var ghabzOrHavaleTypeOptionSet = dbHelper.FetchSingle("afw.OptionSetItem", string.Format("Name = '{0}'", ghabzOrHavaleType), null);

            var ghabzOrHavaleTypeEntity = dbHelper.FetchSingle("wm.GhabzOrHavaleType",
                string.Format("RefDocName = '{0}' and WarehouseDocType = '{1}'",
                    refDocTypeEntity.GetFieldValue<string>("RefDocName"), ghabzOrHavaleTypeOptionSet.GetFieldValue<Guid>("ID")), null);
            if (ghabzOrHavaleTypeEntity == null)
                throw new AfwException("GhabzOrHavaleType for RefDocName(StuffStatusChangeAndTransfer) is not defined.");

            var warehouseDocTypeID = ghabzOrHavaleTypeEntity.GetFieldValue<Guid>("WarehouseDocType");


            Guid? stuffLocation = null;
            if (ghabzOrHavaleType == "Havale")
                stuffLocation = stuffStatusChangeAndTransfer.GetFieldValue<Guid>("SourceStuffLocation");
            else
                stuffLocation = stuffStatusChangeAndTransfer.GetFieldValue<Guid>("DestinationStuffLocation");


            Entity ghabzOrHavaleEntity = null;

            if (changeStatus == EntityChangeTypes.Add)
            {
                ghabzOrHavaleEntity = dbHelper.CreateNewEntity("wm.GhabzOrHavale");
                var ghabzOrHavaleNo = wm.Instance.GetNewGhabzOrHavaleNumber(warehouseDocTypeID, (Guid)stuffLocation);
                ghabzOrHavaleEntity.SetFieldValue("GhabzOrHavaleNumber", ghabzOrHavaleNo);
            }
            else
            {
                ghabzOrHavaleEntity = dbHelper.FetchSingle("wm.GhabzOrHavale",
                    string.Format("RefDoc_StuffStatusChangeAndTransfer = '{0}' and GhabzOrHavaleType = '{1}'",
                        stuffStatusChangeAndTransfer.GetFieldValue<Guid>("ID"),
                        ghabzOrHavaleTypeEntity.GetFieldValue<Guid>("ID")), new string[] { "GhabzOrHavaleItems" });
            }
           
            ghabzOrHavaleEntity.SetFieldValue("RefDoc_StuffStatusChangeAndTransfer", stuffStatusChangeAndTransfer.GetFieldValue<Guid>("ID"));
            ghabzOrHavaleEntity.SetFieldValue("StuffLocation", stuffLocation);
            ghabzOrHavaleEntity.SetFieldValue("ReferenceDocType", refDocTypeEntity.GetFieldValue<Guid>("ID"));
            ghabzOrHavaleEntity.SetFieldValue("GhabzOrHavaleType", ghabzOrHavaleTypeEntity.GetFieldValue<Guid>("ID"));
            ghabzOrHavaleEntity.SetFieldValue("FinancialYear", stuffStatusChangeAndTransfer.GetFieldValue<Guid>("FinancialYear"));
            ghabzOrHavaleEntity.SetFieldValue("FinancialDocType", stuffStatusChangeAndTransfer.GetFieldValue<Guid>("FinancialDocType"));
            ghabzOrHavaleEntity.SetFieldValue("OrganizationUnit", stuffStatusChangeAndTransfer.GetFieldValue<Guid>("OrganizationUnit"));
            ghabzOrHavaleEntity.SetFieldValue("IssueDate", stuffStatusChangeAndTransfer.GetFieldValue<DateTime>("IssueDate"));
            ghabzOrHavaleEntity.SetFieldValue("VazeyatRialiShodan", OptionSetHelper.GetOptionSetItemID("wm.VaziyatRialiAsnadAnbar", "RialiNashode"));

            var stuffStatusChangeAndTransferItems = stuffStatusChangeAndTransfer.GetFieldValue<EntityList>("StuffStatusChangeAndTransferItems").Entities;

            var ghabzOrHavaleItems = new EntityList();
            ghabzOrHavaleItems.EntityDefID = CoreComponent.Instance.GetEntityDef("wm.GhabzOrHavaleItem").GetFieldValue<Guid>("ID");

            if (changeStatus == EntityChangeTypes.Modify)
            {
                var oldGhabzOrHavaleItems = dbHelper.FetchMultiple("wm.GhabzOrHavaleItem",
                    string.Format("GhabzOrHavale = '{0}'", ghabzOrHavaleEntity.GetFieldValue<Guid>("ID")), null, null, null, null).Entities;
                foreach (var ghabzOrHavaleItem in oldGhabzOrHavaleItems)
                {
                    ghabzOrHavaleItem.ChangeStatus = EntityChangeTypes.Delete;
                    dbHelper.ApplyChanges(ghabzOrHavaleItem);
                }
            }

            int rowNumber = 1;
            foreach (var stuffStatusChangeAndTransferItem in stuffStatusChangeAndTransferItems)
            {
                var ghabzOrhavaleItem = dbHelper.CreateNewEntity("wm.GhabzOrHavaleItem");

                ghabzOrhavaleItem.SetFieldValue("RowNumber", rowNumber++);
                ghabzOrhavaleItem.SetFieldValue("GhabzOrHavale", ghabzOrHavaleEntity.GetFieldValue<Guid>("ID"));
                ghabzOrhavaleItem.SetFieldValue("Stuff", stuffStatusChangeAndTransferItem.GetFieldValue<Guid>("Stuff"));
                ghabzOrhavaleItem.SetFieldValue("BatchNumber", stuffStatusChangeAndTransferItem.GetFieldValue<string>("BatchNumber"));
                ghabzOrhavaleItem.SetFieldValue("StuffStatus", stuffStatusChangeAndTransfer.GetFieldValue<Guid>(stuffStatus));
                ghabzOrhavaleItem.SetFieldValue("Quantity", stuffStatusChangeAndTransferItem.GetFieldValue<int>("Quantity"));

                ghabzOrHavaleItems.Entities.Add(ghabzOrhavaleItem);


            }
            ghabzOrHavaleEntity.SetFieldValue("GhabzOrHavaleItems", ghabzOrHavaleItems);

            if (ghabzOrHavaleType == "Ghabz")
            {
                var stuffStatusChangeAndTransferHavale = dbHelper.FetchSingle("wm.GhabzOrHavaleType", "Name = 'StuffStatusChangeAndTransferHavale'", null);

                if (stuffStatusChangeAndTransferHavale == null)
                    throw new AfwException("Can't fount StuffStatusChangeAndTransferHavale type!");

             var filter = string.Format(@"
                    ReferenceDocType = '{0}' and
                    RefDoc_StuffStatusChangeAndTransfer = '{1}' and 
                    GhabzOrHavaleType = '{2}' and
                    IssueDate = '{3}'",
                    refDocTypeEntity.GetFieldValue<Guid>("ID"),
                    stuffStatusChangeAndTransfer.GetFieldValue<Guid>("ID"),
                    stuffStatusChangeAndTransferHavale.GetFieldValue<Guid>("ID"),
                    stuffStatusChangeAndTransfer.GetFieldValue<DateTime>("IssueDate"));

                var wareHouseDocRialiReference = dbHelper.FetchMultiple("wm.GhabzOrHavale", filter, null, null, null, null);

                if (wareHouseDocRialiReference.Entities.Count < 1)
                    throw new AfwException("Cann't fount StuffStatusChangeAndTransferHavale  for this Operation before StuffStatusChangeAndTransferGhabz");

                ghabzOrHavaleEntity.SetFieldValue("WareHouseDocRialiReference", wareHouseDocRialiReference.Entities[0].GetFieldValue<Guid>("ID"));                                    
            }

            dbHelper.ApplyChanges(ghabzOrHavaleEntity);
        }

        public void CreateStuffStatusChangeAndTransferAccDoc(Entity entity)
        {
            //acc.Instance.InsertOrUpdateAccDocMaster(ref accDocID, "StuffStatusChangeAndTransfer", issueDate, financialYear, financialGroup, desc, true);
        }

        private void CreateSalesInvoiceAccDocItems(Entity entity, Guid accDocID)
        {

        }
    }
}

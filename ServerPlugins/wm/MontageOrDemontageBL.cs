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
    class MontageOrDemontageBL: EntityBL
    {
        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus == EntityChangeTypes.Add)
            {
                var lastOpNumber = cmn.Instance.GetFieldMaxIntValue("OpNumber", "wm_MontageOrDemontages",
                    string.Format("OpType = '{0}'", entity.GetFieldValue<Guid>("OpType")));
                entity.SetFieldValue("OpNumber", lastOpNumber + 1);
            }

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify))
            {
                var stuffComponents = entity.GetFieldValue<EntityList>("StuffComponents").Entities;

                foreach (var stuffComponent in stuffComponents)
                {
                    if (stuffComponent.FieldExists("Stuff_Entity"))
                        stuffComponent.RemoveField("Stuff_Entity");
                }

                if (entity.GetFieldValue<Guid>("OpType") == OptionSetHelper.GetOptionSetItemID("wm.MontageOrDemontage", "Demontage"))
                {
                    int valuationPercentSum = 0;
                    foreach (var stuffComponent in stuffComponents)
                    {
                        if (stuffComponent.GetFieldValue<int?>("Demontage_ValuationPercent") == null)
                            throw new AfwException("درصد ریالی برای سطر {0} وارد نشده است.\r\nدرصد ریالی یا باید برای همه سطر ها وارد شود و یا برای هیچ سطری وارد نشود.", stuffComponent.GetFieldValue<int>("RowNumber"));

                        valuationPercentSum += stuffComponent.GetFieldValue<int>("Demontage_ValuationPercent");
                    }

                    if (valuationPercentSum != 100)
                        throw new AfwException("مجموع درصد ریالی اجزاء باید برابر با 100 باشد.");
                }
            }

            if (entity.ChangeStatus == EntityChangeTypes.Delete)
            {
                var ghabzOrHavaleEntities = dbHelper.FetchMultiple("wm.GhabzOrHavale",
                    string.Format("RefDoc_MontageOp = '{0}' or RefDoc_DemontageOp = '{0}'",
                        entity.GetFieldValue<Guid>("ID")), null, null, null, null).Entities;

                var resid = ghabzOrHavaleEntities.FirstOrDefault(o => o.GetFieldValue<Guid?>("WareHouseDocRialiReference") != null);
                if (resid == null)
                    throw new AfwException("resid of montage or demontage op not found.");
                dbHelper.DeleteEntity(resid);

                var havale = ghabzOrHavaleEntities.FirstOrDefault(o => o.GetFieldValue<Guid?>("WareHouseDocRialiReference") == null);
                if (havale == null)
                    throw new AfwException("havale of montage or demontage op not found.");
                dbHelper.DeleteEntity(havale);
            }        
        }

        public override void AfterApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.AfterApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify))
            {
                if (entity.GetFieldValue<Guid>("OpType") == OptionSetHelper.GetOptionSetItemID("wm.MontageOrDemontage", "Montage"))
                {
                    //حواله مونتاژ
                    CreateGhabzOrHavale(entity, "HavaleAmaliateMontage");

                    //رسید مونتاژ
                    CreateGhabzOrHavale(entity, "ResideAmaliateMontage");
                }
                else if (entity.GetFieldValue<Guid>("OpType") == OptionSetHelper.GetOptionSetItemID("wm.MontageOrDemontage", "Demontage"))
                {
                    //حواله دمونتاژ
                    CreateGhabzOrHavale(entity, "HavaleAmaliateDemontage");

                    //رسید دمونتاژ
                    CreateGhabzOrHavale(entity, "ResideAmaliateDemontage");
                }

            }

            if (entity.ChangeStatus != EntityChangeTypes.Delete)
            {
                if (entity.FieldExists("StuffComponents") && entity.GetFieldValue<EntityList>("StuffComponents") != null)
                {
                    dbHelper.ApplyChanges(entity.GetFieldValue<EntityList>("StuffComponents"));
                }
            }
        }

        private void CreateGhabzOrHavale(Entity montageOrDemontage, string ghabzOrHavaleTypeName)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;
            var opTypeName = OptionSetHelper.GetOptionSetItemName(montageOrDemontage.GetFieldValue<Guid>("OpType"));//possible values: 'Montage' and 'Demontage'
            var refDocName = opTypeName + "Op";

            var refDocTypeEntity = dbHelper.FetchSingle("wm.ReferenceDocType",
                string.Format("RefDocName = '{0}'", refDocName), null);
            if (refDocTypeEntity == null)
                throw new AfwException("ReferenceDocType '{0}' not exists.", refDocName);

            var ghabzOrHavaleTypeEntity = dbHelper.FetchSingle("wm.GhabzOrHavaleType",
                string.Format("Name = '{0}'", ghabzOrHavaleTypeName), null);
            if (ghabzOrHavaleTypeEntity == null)
                throw new AfwException("GhabzOrHavaleType '{0}' is not defined.", ghabzOrHavaleTypeName);

            var warehouseDocTypeID = ghabzOrHavaleTypeEntity.GetFieldValue<Guid>("WarehouseDocType");

            Entity ghabzOrHavaleEntity = null;
            EntityList ghabzOrHavaleItems = null;

            if (montageOrDemontage.ChangeStatus == EntityChangeTypes.Add)
            {
                ghabzOrHavaleEntity = dbHelper.CreateNewEntity("wm.GhabzOrHavale");
                var ghabzOrHavaleNo = wm.Instance.GetNewGhabzOrHavaleNumber(warehouseDocTypeID, montageOrDemontage.GetFieldValue<Guid>("StuffLocation"));
                ghabzOrHavaleEntity.SetFieldValue("GhabzOrHavaleNumber", ghabzOrHavaleNo);
                ghabzOrHavaleItems = new EntityList();
            }
            else
            {
                ghabzOrHavaleEntity = dbHelper.FetchSingle("wm.GhabzOrHavale",
                    string.Format("RefDoc_{0} = '{1}' and GhabzOrHavaleType = '{2}'",
                        refDocName,
                        montageOrDemontage.GetFieldValue<Guid>("ID"),
                        ghabzOrHavaleTypeEntity.GetFieldValue<Guid>("ID")), 
                    null);

                if (ghabzOrHavaleEntity == null)
                    throw new AfwException("Saved '{0}' of '{1}' with ID '{2}' not found.", 
                        ghabzOrHavaleTypeName, opTypeName, montageOrDemontage.GetFieldValue<Guid>("ID"));

                ghabzOrHavaleItems = dbHelper.FetchMultiple("wm.GhabzOrHavaleItem",
                    string.Format("GhabzOrHavale = '{0}'", ghabzOrHavaleEntity.GetFieldValue<Guid>("ID")),
                    null, null, null, null);

                foreach (var ghabzOrHavaleItem in ghabzOrHavaleItems.Entities)
                    dbHelper.DeleteEntity(ghabzOrHavaleItem);

                ghabzOrHavaleItems.Entities.Clear();
            }

            ghabzOrHavaleEntity.SetFieldValue(string.Format("RefDoc_{0}", refDocName), montageOrDemontage.GetFieldValue<Guid>("ID"));
            ghabzOrHavaleEntity.SetFieldValue("StuffLocation", montageOrDemontage.GetFieldValue<Guid>("StuffLocation"));
            ghabzOrHavaleEntity.SetFieldValue("ReferenceDocType", refDocTypeEntity.GetFieldValue<Guid>("ID"));
            ghabzOrHavaleEntity.SetFieldValue("GhabzOrHavaleType", ghabzOrHavaleTypeEntity.GetFieldValue<Guid>("ID"));
            ghabzOrHavaleEntity.SetFieldValue("FinancialYear", montageOrDemontage.GetFieldValue<Guid>("FinancialYear"));
            ghabzOrHavaleEntity.SetFieldValue("FinancialDocType", montageOrDemontage.GetFieldValue<Guid>("FinancialDocType"));
            ghabzOrHavaleEntity.SetFieldValue("OrganizationUnit", montageOrDemontage.GetFieldValue<Guid>("OrganizationUnit"));
            ghabzOrHavaleEntity.SetFieldValue("IssueDate", montageOrDemontage.GetFieldValue<DateTime>("IssueDate"));
            ghabzOrHavaleEntity.SetFieldValue("VazeyatRialiShodan", OptionSetHelper.GetOptionSetItemID("wm.VaziyatRialiAsnadAnbar", "RialiNashode"));

            if (ghabzOrHavaleTypeName.StartsWith("Resid"))
            {
                var opHavaleTypeName = string.Format("HavaleAmaliate{0}", opTypeName);

                var opHavaleType = dbHelper.FetchSingle("wm.GhabzOrHavaleType",
                    string.Format("Name = '{0}'", opHavaleTypeName), null);
                if (opHavaleType == null)
                    throw new AfwException("GhabzOrHavaleType '{0}' is not defined.", opHavaleTypeName);

                var referencedHavale = dbHelper.FetchSingle("wm.GhabzOrHavale",
                    string.Format("RefDoc_{0} = '{1}' and GhabzOrHavaleType = '{2}'",
                        refDocName,
                        montageOrDemontage.GetFieldValue<Guid>("ID"),
                        opHavaleType.GetFieldValue<Guid>("ID")),
                    null);

                if (referencedHavale == null)
                    throw new AfwException("Error creating Reside{0}: related Havale{0} not found!", opTypeName);

                ghabzOrHavaleEntity.SetFieldValue("WareHouseDocRialiReference",
                    referencedHavale.GetFieldValue<Guid>("ID"));
            }

            if (ghabzOrHavaleTypeName.IsIn("ResideAmaliateMontage", "HavaleAmaliateDemontage"))
            {
                int rowNumber = 1;

                var ghabzOrhavaleItem = dbHelper.CreateNewEntity("wm.GhabzOrHavaleItem");

                ghabzOrhavaleItem.SetFieldValue("RowNumber", rowNumber++);
                ghabzOrhavaleItem.SetFieldValue("GhabzOrHavale", ghabzOrHavaleEntity.GetFieldValue<Guid>("ID"));
                ghabzOrhavaleItem.SetFieldValue("Stuff", montageOrDemontage.GetFieldValue<Guid>("MainStuff"));
                ghabzOrhavaleItem.SetFieldValue("BatchNumber", montageOrDemontage.GetFieldValue<string>("MainStuffBatchNumber"));
                ghabzOrhavaleItem.SetFieldValue("StuffStatus", montageOrDemontage.GetFieldValue<Guid>("MainStuffStatus"));
                ghabzOrhavaleItem.SetFieldValue("Quantity", montageOrDemontage.GetFieldValue<decimal>("Quantity"));

                ghabzOrHavaleItems.Entities.Add(ghabzOrhavaleItem);
            }
            else if (ghabzOrHavaleTypeName.IsIn("HavaleAmaliateMontage", "ResideAmaliateDemontage"))
            {
                int rowNumber = 1;

                var stuffComponents = montageOrDemontage.GetFieldValue<EntityList>("StuffComponents").Entities;
                foreach (var stuffComponent in stuffComponents)
                {
                    var ghabzOrhavaleItem = dbHelper.CreateNewEntity("wm.GhabzOrHavaleItem");

                    ghabzOrhavaleItem.SetFieldValue("RowNumber", rowNumber++);
                    ghabzOrhavaleItem.SetFieldValue("GhabzOrHavale", ghabzOrHavaleEntity.GetFieldValue<Guid>("ID"));
                    ghabzOrhavaleItem.SetFieldValue("Stuff", stuffComponent.GetFieldValue<Guid>("Stuff"));
                    ghabzOrhavaleItem.SetFieldValue("BatchNumber", stuffComponent.GetFieldValue<string>("BatchNumber"));
                    ghabzOrhavaleItem.SetFieldValue("StuffStatus", stuffComponent.GetFieldValue<Guid>("StuffStatus"));
                    ghabzOrhavaleItem.SetFieldValue("Quantity", stuffComponent.GetFieldValue<int>("TotalQuantity"));

                    ghabzOrHavaleItems.Entities.Add(ghabzOrhavaleItem);
                }
            }

            ghabzOrHavaleEntity.AddField("GhabzOrHavaleItems", ghabzOrHavaleItems);

            dbHelper.ApplyChanges(ghabzOrHavaleEntity);
        }
    }
}

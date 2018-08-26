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
    public class GhetehBardariAzKalaBL : EntityBL
    {
        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus == EntityChangeTypes.Add)
            {
                var lastOpNumber = cmn.Instance.GetFieldMaxIntValue("OpNumber", "wm_GhetehBardariAzKalaha", null);
                entity.SetFieldValue("OpNumber", lastOpNumber + 1);
            }

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify))
            {
                foreach (var ghabzOrHavaleItem in entity.GetFieldValue<EntityList>("GhetehBardariAzKalaItems").Entities)
                {
                    if (ghabzOrHavaleItem.FieldExists("Stuff_Entity"))
                        ghabzOrHavaleItem.RemoveField("Stuff_Entity");
                }
            }

            if (entity.ChangeStatus == EntityChangeTypes.Delete)
            {
                var ghabzOrHavaleEntityList = dbHelper.FetchMultiple("wm.GhabzOrHavale",
                    string.Format("RefDoc_GhetehBardariAzKala = '{0}'", entity.GetFieldValue<Guid>("ID")), null, null, null, null).Entities;
                foreach (var ghabzOrHavale in ghabzOrHavaleEntityList)
                {
                    dbHelper.DeleteEntity(ghabzOrHavale);
                }
            }
        }

        public override void AfterApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.AfterApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify))
            {
                //حواله تغییر وضعیت کالای قطعه برداری شده
                CreateGhabzOrHavale(entity, "Havale", "HavaleTaghirVaziateKalayeGhetehBardariShodeh");
                
                //رسید تغییر وضعیت کالای قطعه برداری شده
                CreateGhabzOrHavale(entity, "Ghabz", "GhabzeTaghirVaziateKalayeGhetehBardariShodeh");

                //رسید قطعه برداری
                CreateGhabzOrHavale(entity, "Ghabz", "GhabzeKalahayeGhetehBardariShodeh");

                //حواله اصلاح ارزش کالای قطعه برداری شده
                CreateGhabzOrHavale(entity, "Havale", "HavaleKaheshArzesheKalayeGhetehBardariShodeh");

            }

            if (entity.ChangeStatus != EntityChangeTypes.Delete)
            {
                if (entity.FieldExists("GhetehBardariAzKalaItems") && entity.GetFieldValue<EntityList>("GhetehBardariAzKalaItems") != null)
                {
                    dbHelper.ApplyChanges(entity.GetFieldValue<EntityList>("GhetehBardariAzKalaItems"));
                }
            }
        }

        private void CreateGhabzOrHavale(Entity ghetehBardariAzKala, string warehouseDocTypeName, string ghabzOrHavaleTypeName)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var warehouseDocTypeID = OptionSetHelper.GetOptionSetItemID("cmn.WarehouseDocType", warehouseDocTypeName);

            var refDocTypeEntity = dbHelper.FetchSingle("wm.ReferenceDocType", "RefDocName = 'GhetehBardariAzKala'", null);
            if (refDocTypeEntity == null)
                throw new AfwException("RefDocName(GhetehBardariAzKala) is invalid or not exists.");


            var ghabzOrHavaleTypeEntity = dbHelper.FetchSingle("wm.GhabzOrHavaleType",
                string.Format("Name = '{0}'", ghabzOrHavaleTypeName), null);
            if (ghabzOrHavaleTypeEntity == null)
                throw new AfwException("GhabzOrHavaleType with RefDocName(GhetehBardariAzKala) is not defined.");


            Guid? stuffLocation = null;

            if (ghabzOrHavaleTypeName.IsIn("HavaleTaghirVaziateKalayeGhetehBardariShodeh", "GhabzeTaghirVaziateKalayeGhetehBardariShodeh" ,
                    "HavaleKaheshArzesheKalayeGhetehBardariShodeh"))
                stuffLocation = ghetehBardariAzKala.GetFieldValue<Guid>("SourceStuffLocation");
            else if (ghabzOrHavaleTypeName == "GhabzeKalahayeGhetehBardariShodeh")
                stuffLocation = ghetehBardariAzKala.GetFieldValue<Guid>("ComponentsDestinationStuffLocation");


            var ghabzOrHavaleEntity = new Entity();
            if (ghetehBardariAzKala.ChangeStatus == EntityChangeTypes.Add)
            {
                ghabzOrHavaleEntity = dbHelper.CreateNewEntity("wm.GhabzOrHavale");
                var ghabzOrHavaleNo = wm.Instance.GetNewGhabzOrHavaleNumber(warehouseDocTypeID, (Guid)stuffLocation);
                ghabzOrHavaleEntity.SetFieldValue("GhabzOrHavaleNumber", ghabzOrHavaleNo);
            }
            else
            {
                ghabzOrHavaleEntity = dbHelper.FetchSingle("wm.GhabzOrHavale",
                    string.Format("RefDoc_GhetehBardariAzKala = '{0}' and GhabzOrHavaleType = '{1}'",
                        ghetehBardariAzKala.GetFieldValue<Guid>("ID"),
                        ghabzOrHavaleTypeEntity.GetFieldValue<Guid>("ID")), new string[] { "GhabzOrHavaleItems" });
            }

            
            ghabzOrHavaleEntity.SetFieldValue("RefDoc_GhetehBardariAzKala", ghetehBardariAzKala.GetFieldValue<Guid>("ID"));
            ghabzOrHavaleEntity.SetFieldValue("StuffLocation", stuffLocation);
            ghabzOrHavaleEntity.SetFieldValue("ReferenceDocType", refDocTypeEntity.GetFieldValue<Guid>("ID"));
            ghabzOrHavaleEntity.SetFieldValue("GhabzOrHavaleType", ghabzOrHavaleTypeEntity.GetFieldValue<Guid>("ID"));
            ghabzOrHavaleEntity.SetFieldValue("FinancialYear", ghetehBardariAzKala.GetFieldValue<Guid>("FinancialYear"));
            ghabzOrHavaleEntity.SetFieldValue("FinancialDocType", ghetehBardariAzKala.GetFieldValue<Guid>("FinancialDocType"));
            ghabzOrHavaleEntity.SetFieldValue("OrganizationUnit", ghetehBardariAzKala.GetFieldValue<Guid>("OrganizationUnit"));
            ghabzOrHavaleEntity.SetFieldValue("IssueDate", ghetehBardariAzKala.GetFieldValue<DateTime>("IssueDate"));
            ghabzOrHavaleEntity.SetFieldValue("VazeyatRialiShodan", OptionSetHelper.GetOptionSetItemID("wm.VaziyatRialiAsnadAnbar", "RialiNashode"));

            var ghabzOrHavaleItems = new EntityList();
            ghabzOrHavaleItems.EntityDefID = CoreComponent.Instance.GetEntityDef("wm.GhabzOrHavaleItem").GetFieldValue<Guid>("ID");

            if (ghetehBardariAzKala.ChangeStatus == EntityChangeTypes.Modify)
            {
                var oldGhabzOrHavaleItems = ghabzOrHavaleEntity.GetFieldValue<EntityList>("GhabzOrHavaleItems").Entities;
                foreach (var ghabzOrHavaleItem in oldGhabzOrHavaleItems)
                {
                    ghabzOrHavaleItem.ChangeStatus = EntityChangeTypes.Delete;
                    dbHelper.ApplyChanges(ghabzOrHavaleItem);
                }
            }

            var ghabzOrhavaleItem = dbHelper.CreateNewEntity("wm.GhabzOrHavaleItem");

            int rowNumber = 1;

            if (ghabzOrHavaleTypeName.IsIn(
                "HavaleTaghirVaziateKalayeGhetehBardariShodeh", 
                "GhabzeTaghirVaziateKalayeGhetehBardariShodeh" ,
                "HavaleKaheshArzesheKalayeGhetehBardariShodeh"))
            {
                ghabzOrhavaleItem.SetFieldValue("RowNumber", rowNumber++);
                ghabzOrhavaleItem.SetFieldValue("GhabzOrHavale", ghabzOrHavaleEntity.GetFieldValue<Guid>("ID"));
                ghabzOrhavaleItem.SetFieldValue("Stuff", ghetehBardariAzKala.GetFieldValue<Guid>("MainStuff"));

                if (ghabzOrHavaleTypeName != "HavaleKaheshArzesheKalayeGhetehBardariShodeh")
                {
                    ghabzOrhavaleItem.SetFieldValue("BatchNumber", ghetehBardariAzKala.GetFieldValue<string>("BatchNumber"));
                    ghabzOrhavaleItem.SetFieldValue("StuffsSerialNumbers", ghetehBardariAzKala.GetFieldValue<string>("StuffSerialNumbers"));
                }

                if (ghabzOrHavaleTypeName == "HavaleTaghirVaziateKalayeGhetehBardariShodeh")
                    ghabzOrhavaleItem.SetFieldValue("StuffStatus", ghetehBardariAzKala.GetFieldValue<Guid>("StuffStatus"));
                else if (ghabzOrHavaleTypeName.IsIn("GhabzeTaghirVaziateKalayeGhetehBardariShodeh"))
                    ghabzOrhavaleItem.SetFieldValue("StuffStatus", ghetehBardariAzKala.GetFieldValue<Guid>("VaziateSanaviehKalayeGhetehBardariShodeh"));

                if (ghabzOrHavaleTypeName == "HavaleKaheshArzesheKalayeGhetehBardariShodeh")
                    ghabzOrhavaleItem.SetFieldValue("Quantity", 0);
                else
                    ghabzOrhavaleItem.SetFieldValue("Quantity", 1);

                ghabzOrHavaleItems.Entities.Add(ghabzOrhavaleItem);
            }

            if (ghabzOrHavaleTypeName == "GhabzeKalahayeGhetehBardariShodeh")
            {
                var ghetehBardariAzKalaItems = ghetehBardariAzKala.GetFieldValue<EntityList>("GhetehBardariAzKalaItems").Entities;
                foreach (var ghetehBardariAzKalaItem in ghetehBardariAzKalaItems)
                {
                    ghabzOrhavaleItem = dbHelper.CreateNewEntity("wm.GhabzOrHavaleItem");

                    ghabzOrhavaleItem.SetFieldValue("RowNumber", rowNumber++);
                    ghabzOrhavaleItem.SetFieldValue("GhabzOrHavale", ghabzOrHavaleEntity.GetFieldValue<Guid>("ID"));
                    ghabzOrhavaleItem.SetFieldValue("Stuff", ghetehBardariAzKalaItem.GetFieldValue<Guid>("Stuff"));
                    ghabzOrhavaleItem.SetFieldValue("BatchNumber", ghetehBardariAzKalaItem.GetFieldValue<string>("BatchNumber"));
                    ghabzOrhavaleItem.SetFieldValue("StuffsSerialNumbers", ghetehBardariAzKalaItem.GetFieldValue<string>("StuffSerialNumbers"));
                    ghabzOrhavaleItem.SetFieldValue("StuffStatus", ghetehBardariAzKalaItem.GetFieldValue<Guid>("StuffStatus"));
                    ghabzOrhavaleItem.SetFieldValue("Quantity", 1);

                    ghabzOrHavaleItems.Entities.Add(ghabzOrhavaleItem);
                }
            }

            ghabzOrHavaleEntity.SetFieldValue("GhabzOrHavaleItems", ghabzOrHavaleItems);

            if (ghabzOrHavaleTypeName == "HavaleKaheshArzesheKalayeGhetehBardariShodeh")
            {
                var ghabzeKalahayeGhetehBardariShodeh = dbHelper.FetchSingle("wm.GhabzOrHavaleType", "Name = 'GhabzeKalahayeGhetehBardariShodeh'", null);

                if (ghabzeKalahayeGhetehBardariShodeh == null)
                    throw new AfwException("Can't find GhabzeKalahayeGhetehBardariShodeh type!");

                var filter = string.Format(@"
                    ReferenceDocType = '{0}' and
                    RefDoc_GhetehBardariAzKala = '{1}' and 
                    GhabzOrHavaleType = '{2}' and
                    IssueDate = '{3}'", 
                    refDocTypeEntity.GetFieldValue<Guid>("ID") ,
                    ghetehBardariAzKala.GetFieldValue<Guid>("ID"), 
                    ghabzeKalahayeGhetehBardariShodeh.GetFieldValue<Guid>("ID"),
                    ghetehBardariAzKala.GetFieldValue<DateTime>("IssueDate"));

                var wareHouseDocRialiReference = dbHelper.FetchMultiple("wm.GhabzOrHavale", filter, null, null, null, null);

                if (wareHouseDocRialiReference.Entities.Count < 1)
                    throw new AfwException("Cann't find GhabzeKalahayeGhetehBardariShodeh for this Operation before HavaleKaheshArzesheKalayeGhetehBardariShodeh");

                ghabzOrHavaleEntity.SetFieldValue("WareHouseDocRialiReference", wareHouseDocRialiReference.Entities[0].GetFieldValue<Guid>("ID"));
            }
            else if (ghabzOrHavaleTypeName == "GhabzeTaghirVaziateKalayeGhetehBardariShodeh")
            {
                var havaleTaghirVaziateKalayeGhetehBardariShodeh = dbHelper.FetchSingle("wm.GhabzOrHavaleType", "Name = 'HavaleTaghirVaziateKalayeGhetehBardariShodeh'", null);

                if (havaleTaghirVaziateKalayeGhetehBardariShodeh == null)
                    throw new AfwException("Can't find HavaleTaghirVaziateKalayeGhetehBardariShodeh type!");

                var filter = string.Format(@"
                    ReferenceDocType = '{0}' and
                    RefDoc_GhetehBardariAzKala = '{1}' and 
                    GhabzOrHavaleType = '{2}' and
                    IssueDate = '{3}'",
                    refDocTypeEntity.GetFieldValue<Guid>("ID"),
                    ghetehBardariAzKala.GetFieldValue<Guid>("ID"),
                    havaleTaghirVaziateKalayeGhetehBardariShodeh.GetFieldValue<Guid>("ID"),
                    ghetehBardariAzKala.GetFieldValue<DateTime>("IssueDate"));

                var wareHouseDocRialiReference = dbHelper.FetchMultiple("wm.GhabzOrHavale", filter, null, null, null, null);

                if (wareHouseDocRialiReference.Entities.Count < 1)
                    throw new AfwException("Cann't find HavaleTaghirVaziateKalayeGhetehBardariShodeh for this Operation before GhabzeTaghirVaziateKalayeGhetehBardariShodeh");

                ghabzOrHavaleEntity.SetFieldValue("WareHouseDocRialiReference", wareHouseDocRialiReference.Entities[0].GetFieldValue<Guid>("ID"));            
            }

            dbHelper.ApplyChanges(ghabzOrHavaleEntity);
        }
    }
}

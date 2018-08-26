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
    public class SalesCaseBL : EntityBL
    {
        public void SaveSalesCase(Entity salesCase)
        {
            //DebugHelper.Break();

            var core = CoreComponent.Instance;
            var dbHelper = CoreComponent.Instance.MainDbHelper;
            
            using (var tranManager = new DbTransactionManager(dbHelper))
            {
                if (salesCase.FieldExists("SalesCaseLoseInfo") 
                    && salesCase.ChangeStatus == EntityChangeTypes.Modify)
                {
                    var salesCaseLoseInfo = salesCase.GetFieldValue<Entity>("SalesCaseLoseInfo");
                    salesCaseLoseInfo.ChangeStatus = EntityChangeTypes.Modify;
                    dbHelper.ApplyChanges(salesCaseLoseInfo);
                    salesCase.FieldValues.Remove("SalesCaseLoseInfo");
                }

                salesCase.FieldValues["LastActionTime"] = core.GetServerDateTime();

                if (salesCase.ChangeStatus == EntityChangeTypes.Modify)
                {
                    var oldSaleCaseEntity = dbHelper.FetchSingle("crm.SalesCase", string.Format("ID = '{0}'", salesCase.GetFieldValue<Guid>("ID")), null);

                    if (oldSaleCaseEntity.GetFieldValue<Guid?>("SalesCaseStage") != salesCase.GetFieldValue<Guid?>("SalesCaseStage"))
                        SaveSalesCaseStageChangeHistory(salesCase);
                    if (oldSaleCaseEntity.GetFieldValue<Guid?>("OwnerUser") != salesCase.GetFieldValue<Guid?>("OwnerUser"))
                        SaveSalesCaseOwnerUserChangeHistory(salesCase);
                    if (oldSaleCaseEntity.GetFieldValue<Guid?>("Status") != salesCase.GetFieldValue<Guid?>("Status"))
                        SaveSalesCaseStatusChangeHistory(salesCase);

                    dbHelper.ApplyChanges(salesCase);
                }
                else if (salesCase.ChangeStatus == EntityChangeTypes.Add)
                {
                    dbHelper.ApplyChanges(salesCase);

                    SaveSalesCaseStageChangeHistory(salesCase);
                    SaveSalesCaseOwnerUserChangeHistory(salesCase);
                    SaveSalesCaseStatusChangeHistory(salesCase);
                }
                else
                    throw new AfwException("Invalid ChangeStatus for SaveSalesCase.");

                SetCustomerRole(salesCase);

                if (salesCase.GetFieldValue<Guid?>("MainConnectedPerson") != null)
                {
                    SetMainConnectedPersonRole(salesCase);
                    AddMainConnectedPersonToConnectedPersonsIfNot(salesCase);
                }

                if (salesCase.GetFieldValue<Guid?>("IntroducerPerson") != null)
                {
                    SetIntroducerPersonRole(salesCase);
                }

                tranManager.Commit();
            }
        }

        private void SetCustomerRole(Entity salesCase)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var customerRoleID = dbHelper.FetchSingle("cmn.PersonRole", "Name = 'Customer'", null).GetFieldValue<Guid>("ID");
            if (!dbHelper.EntityExists("cmn.PersonRoleRelation",
                    string.Format("Person = '{0}' and PersonRole = '{1}'", salesCase.GetFieldValue<Guid>("Customer"), customerRoleID)))
            {
                var customerRoleRelation = dbHelper.CreateNewEntity("cmn.PersonRoleRelation");
                customerRoleRelation.SetFieldValue("Person", salesCase.GetFieldValue<Guid>("Customer"));
                customerRoleRelation.SetFieldValue("PersonRole", customerRoleID);
                dbHelper.InsertEntity(customerRoleRelation);
            }
        }

        private void SetMainConnectedPersonRole(Entity salesCase)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var connectedPersonRoleID = dbHelper.FetchSingle("cmn.PersonRole", "Name = 'ConnectedPerson'", null).GetFieldValue<Guid>("ID");
            if (!dbHelper.EntityExists("cmn.PersonRoleRelation",
                    string.Format("Person = '{0}' and PersonRole = '{1}'", salesCase.GetFieldValue<Guid>("MainConnectedPerson"), connectedPersonRoleID)))
            {
                var connectedPersonRoleRelation = dbHelper.CreateNewEntity("cmn.PersonRoleRelation");
                connectedPersonRoleRelation.SetFieldValue("Person", salesCase.GetFieldValue<Guid>("MainConnectedPerson"));
                connectedPersonRoleRelation.SetFieldValue("PersonRole", connectedPersonRoleID);
                dbHelper.InsertEntity(connectedPersonRoleRelation);
            }
        }

        private void SetIntroducerPersonRole(Entity salesCase)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var marketerRoleID = dbHelper.FetchSingle("cmn.PersonRole", "Name = 'Marketer'", null).GetFieldValue<Guid>("ID");
            if (!dbHelper.EntityExists("cmn.PersonRoleRelation",
                    string.Format("Person = '{0}' and PersonRole = '{1}'", salesCase.GetFieldValue<Guid>("IntroducerPerson"), marketerRoleID)))
            {
                var marketerRoleRelation = dbHelper.CreateNewEntity("cmn.PersonRoleRelation");
                marketerRoleRelation.SetFieldValue("Person", salesCase.GetFieldValue<Guid>("IntroducerPerson"));
                marketerRoleRelation.SetFieldValue("PersonRole", marketerRoleID);
                dbHelper.InsertEntity(marketerRoleRelation);
            }
        }

        private void AddMainConnectedPersonToConnectedPersonsIfNot(Entity salesCase)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            if (!dbHelper.EntityExists("crm.SalesCaseConnectedPerson",
                string.Format("SalesCase = '{0}' and ConnectedPerson = '{1}'",
                    salesCase.GetFieldValue<Guid>("ID"), salesCase.GetFieldValue<Guid>("MainConnectedPerson")))
            )
            {
                var connectedPerson = dbHelper.CreateNewEntity("crm.SalesCaseConnectedPerson");
                connectedPerson.SetFieldValue("SalesCase", salesCase.GetFieldValue<Guid>("ID"));
                connectedPerson.SetFieldValue("ConnectedPerson", salesCase.GetFieldValue<Guid>("MainConnectedPerson"));
                connectedPerson.SetFieldValue("ConnectedPersonPost", salesCase.GetFieldValue<Guid?>("MainConnectedPersonPost"));
                dbHelper.InsertEntity(connectedPerson);
            }
        }

        public void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            //DebugHelper.Break();
             
            var salesCaseStatus_OpenID = OptionSetHelper.GetOptionSetItemID("crm.SalesCaseStatuses", "Open");
            var salesCaseStatus_WonID = OptionSetHelper.GetOptionSetItemID("crm.SalesCaseStatuses", "Won");

            if (entity.ChangeStatus == "Delete"
                || entity.FieldValues["Status"].ToString() == salesCaseStatus_OpenID.ToString()
                || entity.FieldValues["Status"].ToString() == salesCaseStatus_WonID.ToString())
            {
                var salesCaseLoseInfoEntity = dbHelper.FetchSingle("crm.SalesCaseLoseInfo",
                string.Format(@"SalesCase = '{0}'", entity.GetFieldValue<Guid>("ID")), null);
                if (salesCaseLoseInfoEntity != null)
                    dbHelper.DeleteEntity(salesCaseLoseInfoEntity);
            }

            if (entity.ChangeStatus == "Delete")
            {
                var salesCaseStageChangeHistoryEntityList = dbHelper.FetchMultiple("crm.SalesCaseStageChangeHistory",
                    string.Format(@"SalesCase = '{0}'", entity.GetFieldValue<Guid>("ID")), null, null, null, null);
                if (salesCaseStageChangeHistoryEntityList.Entities.Count != 0)
                    foreach (Entity salesCaseStageChangeHistoryEntity in salesCaseStageChangeHistoryEntityList.Entities)
                        dbHelper.DeleteEntity(salesCaseStageChangeHistoryEntity);

                var salesCaseOwnerUserChangeHistoryEntityList = dbHelper.FetchMultiple("crm.SalesCaseOwnerUserChangeHistory",
                    string.Format(@"SalesCase = '{0}'", entity.GetFieldValue<Guid>("ID")), null, null, null, null);
                if (salesCaseOwnerUserChangeHistoryEntityList.Entities.Count != 0)
                    foreach (Entity salesCaseOwnerUserChangeHistoryEntity in salesCaseOwnerUserChangeHistoryEntityList.Entities)
                        dbHelper.DeleteEntity(salesCaseOwnerUserChangeHistoryEntity);

                var salesCaseStatusChangeHistoryEntityList = dbHelper.FetchMultiple("crm.SalesCaseStatusChangeHistory",
                    string.Format(@"SalesCase = '{0}'", entity.GetFieldValue<Guid>("ID")), null, null, null, null);
                if (salesCaseStatusChangeHistoryEntityList.Entities.Count != 0)
                    foreach (Entity salesCaseStatusChangeHistoryEntity in salesCaseStatusChangeHistoryEntityList.Entities)
                        dbHelper.DeleteEntity(salesCaseStatusChangeHistoryEntity);
            }
        }

        public void UpdateSalesCaseLastActionTime(Guid salesCaseId)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var salesCase = dbHelper.FetchSingleByID("crm.SalesCase", salesCaseId, null);
            salesCase.FieldValues["LastActionTime"] = CoreComponent.Instance.GetServerDateTime();
            salesCase.ChangeStatus = EntityChangeTypes.Modify;
            dbHelper.ApplyChanges(salesCase);
        }

        public void SetSalesCaseStage(Guid salesCaseID, Guid newStageId)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var salesCase = dbHelper.FetchSingleByID("crm.SalesCase", salesCaseID, null);
            salesCase.SetFieldValue("SalesCaseStage", newStageId);
            salesCase.ChangeStatus = EntityChangeTypes.Modify;
            SaveSalesCase(salesCase);
        }

        public void SaveSalesCaseStageChangeHistory(Entity salesCase)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var salesCaseStageChangeHistory = dbHelper.CreateNewEntity("crm.SalesCaseStageChangeHistory");
            salesCaseStageChangeHistory.SetFieldValue("SalesCase", salesCase.GetFieldValue<Guid>("ID")); 
            salesCaseStageChangeHistory.SetFieldValue("SalesCaseStage", salesCase.GetFieldValue<Guid?>("SalesCaseStage"));
            salesCaseStageChangeHistory.SetFieldValue("CreatorUser", salesCase.GetFieldValue<Guid?>("CreatorUser"));

            dbHelper.ApplyChanges(salesCaseStageChangeHistory);
        }

        public void SaveSalesCaseOwnerUserChangeHistory(Entity salesCase)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var salesCaseOwnerUserChangeHistory = dbHelper.CreateNewEntity("crm.SalesCaseOwnerUserChangeHistory");
            salesCaseOwnerUserChangeHistory.SetFieldValue("SalesCase", salesCase.GetFieldValue<Guid>("ID"));
            salesCaseOwnerUserChangeHistory.SetFieldValue("OwnerUser", salesCase.GetFieldValue<Guid?>("OwnerUser"));
            salesCaseOwnerUserChangeHistory.SetFieldValue("CreatorUser", salesCase.GetFieldValue<Guid?>("CreatorUser"));

            dbHelper.ApplyChanges(salesCaseOwnerUserChangeHistory);
        }

        public void SaveSalesCaseStatusChangeHistory(Entity salesCase)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var salesCaseStatusChangeHistory = dbHelper.CreateNewEntity("crm.SalesCaseStatusChangeHistory");
            salesCaseStatusChangeHistory.SetFieldValue("SalesCase", salesCase.GetFieldValue<Guid>("ID"));
            salesCaseStatusChangeHistory.SetFieldValue("Status", salesCase.GetFieldValue<Guid?>("Status"));
            salesCaseStatusChangeHistory.SetFieldValue("CreatorUser", salesCase.GetFieldValue<Guid?>("CreatorUser"));

            dbHelper.ApplyChanges(salesCaseStatusChangeHistory);
        }
    }
}

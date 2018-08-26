using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Reflection;
using AppFramework.DataAccess;
using System.Diagnostics;
using AppFramework.Helpers;
using TarazNegarAppFrameworkPlugin.ServerPlugins;
using TarazNegarAppFrameworkPlugin.ServerPlugins.cmn;


namespace AppFramework.AppServer
{
    public class cmn : ISubsystem
    {
        public cmn()
        {
            if (CoreComponent.Instance.SubsystemObjectExists("cmn"))
                throw new AfwException("cmn component is already created!");

            _PersonConnectedPersonBL = new PersonConnectedPersonBL();
            CachedStuffs = new List<Entity>();
        }

        public static cmn Instance
        {
            get
            {
                return CoreComponent.Instance.GetSubsystemObject("cmn") as cmn;
            }
        }

        private ReminderBL _ReminderBL;
        public ReminderBL ReminderBL
        {
            get
            {
                if (_ReminderBL == null)
                    _ReminderBL = new ReminderBL();

                return _ReminderBL;
            }
        }

        private PersonConnectedPersonBL _PersonConnectedPersonBL;

        private StuffBL _StuffBL;
        public StuffBL StuffBL
        {
            get
            {
                if (_StuffBL == null)
                    _StuffBL = new StuffBL();

                return _StuffBL;
            }
        }

        public List<Entity> CachedStuffs;

        List<Entity> _CachedStuffLocations = null;
        public List<Entity> CachedStuffLocations
        {
            get
            {
                if (_CachedStuffLocations == null)
                    _CachedStuffLocations = CoreComponent.Instance.MainDbHelper
                        .FetchMultiple("cmn.StuffLocation", null, null, null, null, null).Entities;

                return _CachedStuffLocations;
            }
        }

        List<Entity> _CachedFinancialYears = null;
        public List<Entity> CachedFinancialYears
        {
            get
            {
                if (_CachedFinancialYears == null)
                    _CachedFinancialYears = CoreComponent.Instance.MainDbHelper
                        .FetchMultiple("cmn.FinancialYear", null, null, null, null, null).Entities;

                return _CachedFinancialYears;
            }
        }


        #region General Methods

        public int GetFieldMaxIntValue(string fieldName, string tableName, string whereStr)
        {
            //DebugHelper.Break();

            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var maxIntValue = 0;

            try
            {
                string sqlQuery = string.Format(@"select isnull(max(cast({0} as int)), 0) MaxValue from {1}", fieldName, tableName);
                if (!string.IsNullOrEmpty(whereStr))
                    sqlQuery += (" where " + whereStr);
                maxIntValue = dbHelper.AdoDbHelper.ExecuteScalar<int>(sqlQuery);
            }
            catch (Exception ex)
            {
                throw new Exception("Error in GetFieldMaxIntValue.", ex);
            }

            return (int)maxIntValue;
        }

        public void GrantEssentialPermissions()
        {
            PermissionHelper.SetEntityPermissionForAllSecurityRoles("cmn.UserSettings",
                new PermissionHelper.EntityPermissionInfo
                {
                    CanInsert = true,
                    CanViewUserData = true,
                    CanModifyUserData = true
                });
        }

        public int GetPrioriryMaxValue(Guid account, Guid financialYear)
        {
            //DebugHelper.Break();

            var dbHelper = CoreComponent.Instance.MainDbHelper;

            int maxIntValue = 0;

            try
            {
                string sqlQuery = string.Format(@"
                    select isnull(max(FloatPriority), 0) MaxFloatPriority 
                    from
                    	(select isnull(PersonPriority, 0) FloatPriority 
                    	 from cmn_FloatPriorities 
                    	 where account = '{0}' and FinancialYear = '{1}'
                    	 union
                    	 select isnull(CostCenterPriority, 0) FloatPriority 
                    	 from cmn_FloatPriorities 
                    	 where account = '{0}' and FinancialYear = '{1}'
                    	 union
                    	 select isnull(ProjectPriority, 0) FloatPriority 
                    	 from cmn_FloatPriorities 
                    	 where account = '{0}' and FinancialYear = '{1}'
                    	 union
                    	 select isnull(ForeignCurrencyPriority, 0) FloatPriority
                    	 from cmn_FloatPriorities 
                    	 where account = '{0}' and FinancialYear = '{1}') MaxFloatPriority
                    ", account, financialYear);

                maxIntValue = dbHelper.AdoDbHelper.ExecuteScalar<int>(sqlQuery);
            }
            catch (Exception ex)
            {
                throw new Exception("Error in GetPrioriryMaxValue.", ex);
            }

            return maxIntValue;
        }

        public EntityList GetOptionSetItemsList(string optionSetFullName)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var queryString = string.Format(@"
                select OptionSetItem.ID, 
                	OptionSetItem.OptionSetID,
                	OptionSetItem.DisplayOrder,
                	OptionSetItem.Name,
                	OptionSetItem.Title,
                	OptionSetItem.FullName
                from afw_OptionSetItemsView OptionSetItem
                	inner join afw_OptionSetsView OptionSet on OptionSet.ID = OptionSetItem.OptionSetID
                where OptionSet.FullName = '{0}'
                order by OptionSetItem.DisplayOrder", optionSetFullName);

            var optionSetItemsList = dbHelper.FetchMultipleBySqlQuery(queryString);
             
            return optionSetItemsList;
        }

        #endregion

        #region Reminder
        public EntityList GetUserReminderItems()
        {
            return ReminderBL.GetUserReminderItems();
        }

        public void SnoozeReminderItems(EntityList reminderItems)
        {
            ReminderBL.SnoozeReminderItems(reminderItems);
        }

        #endregion

        #region Person

        public void SavePerson(Entity person)
        {
            new PersonBL().SavePerson(person);
        }

        public Entity FetchPersonByID(Guid id, string[] navigationPropsToFetch)
        {
            return new PersonBL().FetchPersonByID(id, navigationPropsToFetch);
        }

        public EntityList FetchPersonList(string filterExpression, string sortExpression, int? startRecordNumber, int? maxRecords, string[] navigationPropsToFetch)
        {
            return new PersonBL().FetchPersonList(filterExpression, sortExpression, startRecordNumber, maxRecords, navigationPropsToFetch);
        }

        public bool PersonHasRole(Guid personID, string roleName)
        {
            return new PersonBL().PersonHasRole(personID, roleName);
        }

        public void AddRoleToPerson(Guid personID, string roleName)
        {
            new PersonBL().AddRoleToPerson(personID, roleName);
        }

        public Entity GetPersonPreviewInfo(Guid personID, int mode)
        {
            return new PersonBL().GetPersonPreviewInfo(personID, mode);
        }

        public void SaveNewConnectedPerson(Entity personConnectedPerson)
        {
            new PersonConnectedPersonBL().SaveNewConnectedPerson(personConnectedPerson);
        }

        #endregion

        #region ReceivedCall

        //public void DetectReceivedCallPerson(string callID, string callNumber)
        //{
        //    new ReceivedCallBL().DetectCallPerson(callID, callNumber);
        //}

        public void SetReceivedCallSalesCaseActivity(Guid receivedCallID, Guid activityID)
        {
            new ReceivedCallBL().SetSalesCaseActivity(receivedCallID, activityID);
        }

        public void DetectUndetectedCalls(string filterExpression, string sortExpression, int? startRecordNumber, int? pageSize)
        {
            new ReceivedCallBL().DetectUndetectedCalls(filterExpression, sortExpression, startRecordNumber, pageSize);
        }

        public EntityList GetPersonRelatedSalesCases(Guid callPersonId)
        {
            EntityList salesCaseEntityList = new ReceivedCallBL().GetPersonRelatedSalesCases(callPersonId);
            return salesCaseEntityList;
        }

        public EntityList GetPersonRelatedContracts(Guid personId)
        {
            EntityList contractEntityList = new ReceivedCallBL().GetPersonRelatedContracts(personId);
            return contractEntityList;
        }

        public void SetReceivedCallRelatedContract(Guid callID, Guid contractId)
        {
            new ReceivedCallBL().SetRelatedContract(callID, contractId);
        }

        public void DeleteReceivedCallCreatedActivity(string callID)
        {
            new ReceivedCallBL().DeleteCreatedActivity(callID);
        }
        #endregion

        #region PhoneNumber
        public void SavePhoneNumberForPerson(string callID, string callNumber, string PersonID)
        {
            new PhoneNumberBL().SavePhoneNumberForPerson(callID, callNumber, PersonID);
        }
        #endregion

        public Entity GetStuffLocationEntity(Guid id)
        {
            return CachedStuffLocations.FirstOrDefault(o => o.GetFieldValue<Guid>("ID") == id);
        }

        public Entity GetFinancialYearEntity(Guid id)
        {
            return CachedFinancialYears.FirstOrDefault(o => o.GetFieldValue<Guid>("ID") == id);
        }
        
        #region StuffDef
        public string GenerateStuffDefName(Guid stuffDefId)
        {
            return new StuffDefBL().GenerateStuffDefName(stuffDefId);
        }

        //public bool StuffDefHasTaxAndToll(Guid stuffDefId)
        //{
        //    return new StuffDefBL().StuffDefHasTaxAndToll(stuffDefId);
        //}

        public Entity GetStuffDefByStuffID(Guid stuffID)
        {
            return new StuffBL().GetStuffDefByStuffID(stuffID);
        }

        public string GetStuffTitle(Guid stuffID)
        {
            return StuffBL.GetStuffTitle(stuffID);
        }

        #endregion

        #region Stuff

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "Stuff")]
        public void BeforeApplyStuffChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new StuffBL().BeforeApplyChanges(dbHelper, entity);
        }

        #endregion

        #region PersonGroup

        public EntityList GetPersonGroupAccounts(Guid personGroupID, Guid financialYearID)
        {
            return new PersonGroupBL().GetPersonGroupAccounts(personGroupID, financialYearID);
        }

        public void SevePersonGroupAccounts(Guid accountID, Guid personGroupID, Guid financialYearID)
        {
            new PersonGroupBL().SevePersonGroupAccounts(accountID, personGroupID, financialYearID);
        }

        public void DeletePersonGroupAccount(Guid accountID, Guid personGroupID)
        {
            new PersonGroupBL().DeletePersonGroupAccount(accountID, personGroupID);
        }

        #endregion

        #region CostCenter

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "CostCenter")]
        public void BeforeApplyCostCenterChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new CostCenterBL().BeforeApplyChanges(dbHelper, entity);
        }

        public EntityList GetCostCenterGroupAccounts(Guid chargeGroupID, Guid financialYearID)
        {
            return new CostCenterGroupBL().GetCostCenterGroupAccounts(chargeGroupID, financialYearID);
        }

        public EntityList GetCostCenterAccounts(Guid costCenterID, Guid financialYearID)
        {
            return new CostCenterBL().GetCostCenterAccounts(costCenterID, financialYearID);
        }

        public EntityList GetPersonAccounts(Guid PersonID, Guid financialYearID)
        {
            return new PersonBL().GetPersonAccounts(PersonID, financialYearID);
        }

        public EntityList GetProjectAccounts(Guid projectID, Guid financialYearID)
        {
            return new ProjectBL().GetProjectAccounts(projectID, financialYearID);
        }

        public EntityList GetForeignCurrencyAccounts(Guid foreignCurrencyID, Guid financialYearID)
        {
            return new ForeignCurrencyBL().GetForeignCurrencyAccounts(foreignCurrencyID, financialYearID);
        }

        public void SeveCostCenterGroupAccounts(Guid accountID, Guid chargeGroupID, Guid financialYearID)
        {
            new CostCenterGroupBL().SeveCostCenterGroupAccounts(accountID, chargeGroupID, financialYearID);
        }

        public void DeleteCostCenterGroupAccount(Guid accountID, Guid chargeGroupID)
        {
            new CostCenterGroupBL().DeleteCostCenterGroupAccount(accountID, chargeGroupID);
        }

        #endregion

        #region ProjectGroup

        public EntityList GetProjectGroupAccounts(Guid projectGroupID, Guid financialYearID)
        {
            return new ProjectGroupBL().GetProjectGroupAccounts(projectGroupID, financialYearID);
        }

        public void SeveProjectGroupAccounts(Guid accountID, Guid projectGroupID, Guid financialYearID)
        {
            new ProjectGroupBL().SeveProjectGroupAccounts(accountID, projectGroupID, financialYearID);
        }

        public void DeleteProjectGroupAccount(Guid accountID, Guid projectGroupID)
        {
            new ProjectGroupBL().DeleteProjectGroupAccount(accountID, projectGroupID);
        }

        #endregion

        #region ForeignCurrencyGroup

        public EntityList GetForeignCurrencyGroupAccounts(Guid foreignCurrencyGroupID, Guid financialYearID)
        {
            return new ForeignCurrencyGroupBL().GetForeignCurrencyGroupAccounts(foreignCurrencyGroupID, financialYearID);
        }

        public void SeveForeignCurrencyGroupAccounts(Guid accountID, Guid foreignCurrencyGroupID, Guid financialYearID)
        {
            new ForeignCurrencyGroupBL().SeveForeignCurrencyGroupAccounts(accountID, foreignCurrencyGroupID, financialYearID);
        }

        public void DeleteForeignCurrencyGroupAccount(Guid accountID, Guid foreignCurrencyGroupID)
        {
            new ForeignCurrencyGroupBL().DeleteForeignCurrencyGroupAccount(accountID, foreignCurrencyGroupID);
        }

        #endregion

        #region Entity FinancialYear
        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "FinancialYear")]
        public void BeforeApplyFinancialYearChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new FinancialYearBL().BeforeApplyChanges(dbHelper, entity);
        }

        public void CopyFinancialYearSettings(Guid sourceFinancialYearID, Guid destinationFinancialYearID)
        {
            new FinancialYearBL().CopyFinancialYearSettings(sourceFinancialYearID, destinationFinancialYearID); 
        }

        #endregion

        #region Entity FinancialGroup
        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "FinancialGroup")]
        public void BeforeApplyFinancialGroupChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new FinancialGroupBL().BeforeApplyChanges(dbHelper, entity);
        }

        #endregion


        public void SavePurchaseRequestInfo(string purchaseRequestInfoJson)
        {
            new SiteTransactionBL().SavePurchaseRequestInfo(purchaseRequestInfoJson);
        }

        public List<int> NextStepPurchaseRequestInfo()
        {
            return new SiteTransactionBL().NextStepPurchaseRequestInfo();
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "WorkflowStage")]
        public void BeforeApplyWorkflowStageChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new WorkflowStageBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "WorkflowStageOrgPostion")]
        public void BeforeApplyWorkflowStageOrgPostionChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new WorkflowStageOrgPostionBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "WorkflowDef")]
        public void BeforeApplyWorkflowDefChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new WorkflowDefBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.OneMinuteClientSyncRequested)]
        public void OneMinuteClientSyncRequested(Entity syncResultEntity)
        {
            var userReminderItems = new ReminderBL().GetUserReminderItems();
            syncResultEntity.AddField("cmn_UserReminderItems", userReminderItems);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "Activity")]
        public void BeforeApplyActivityChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new ActivityBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.AfterApplyEntityChanges, "Activity")]
        public void AfterApplyActivityChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new ActivityBL().AfterApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "Person")]
        public void BeforeApplyPersonChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new PersonBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.AfterApplyEntityChanges, "Person")]
        public void AfterApplyPersonChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new PersonBL().AfterApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "PersonConnectedPerson")]
        public void BeforeApplyPersonConnectedPersonChanges(EntityDbHelper dbHelper, Entity entity)
        {
            _PersonConnectedPersonBL.BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.AfterApplyEntityChanges, "PersonConnectedPerson")]
        public void AfterApplyPersonConnectedPersonChanges(EntityDbHelper dbHelper, Entity entity)
        {
            _PersonConnectedPersonBL.AfterApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "OrganizationInformation")]
        public void BeforeApplyOrganizationInformationChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new OrganizationInformationBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.AfterApplyEntityChanges, "OrganizationInformation")]
        public void AfterApplyOrganizationInformationChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new OrganizationInformationBL().AfterApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.AfterApplyEntityChanges, "StuffMainCategory")]
        public void AfterApplyStuffMainCategoryChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new StuffMainCategoryBL().AfterApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.AfterApplyEntityChanges, "StuffSubCategory")]
        public void AfterApplyStuffSubCategoryChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new StuffSubCategoryBL().AfterApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "StuffDef")]
        public void BeforeApplyEntityChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new StuffDefBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.AfterApplyEntityChanges, "StuffDef")]
        public void AfterApplyStuffDefChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new StuffDefBL().AfterApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "StuffLabel")]
        public void BeforeApplyStuffLabelChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new StuffLabelBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "FloatPriority")]
        public void BeforeApplyFloatPriorityChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new FloatPriorityBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "Project")]
        public void BeforeApplyProjectChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new ProjectBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "ForeignCurrency")]
        public void BeforeApplyForeignCurrencyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new ForeignCurrencyBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "StuffBOM")]
        public void BeforeApplyStuffBOMChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new StuffBOMBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.AfterApplyEntityChanges, "StuffBOM")]
        public void AfterApplyStuffBOMChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new StuffBOMBL().AfterApplyChanges(dbHelper, entity);
        }

        public EntityList GetUsedFinancialGroups(string entity)
        {
            return new FinancialGroupBL().GetUsedFinancialGroups(entity);
        }

        public Entity GetEntityCreatorUser(string entityDefTableName, Guid entityID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var sqlQuery = string.Format(@"
                select CreatorUser.ID CreatorUser, CreatorUser.DisplayName CreatorUser_DisplayName
	            from {0}
		            left join afw_SystemUsersView CreatorUser on CreatorUser.ID = {0}.CreatorUser
                where {0}.ID = '{1}'", entityDefTableName, entityID);
            var creatorUser = dbHelper.FetchSingleBySqlQuery(sqlQuery);
            return creatorUser;
        }

        public void ExportEntityRecursive(Guid entityDefID, Guid entityID, string destinationDB)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var sqlQuery = string.Format("exec cmn.ExportEntityRecursive '{0}', '{1}', '{2}'", entityDefID, entityID, destinationDB);
            dbHelper.AdoDbHelper.ExecuteScalar(sqlQuery);
        }

        public void ExportBasicInformation()
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            dbHelper.AdoDbHelper.ExecuteNonQuery("exec cmn.ExportBasicInformation");
        }

        private Entity GetWorkflowDefByFormName(string workflowFormName)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var workflowFormID = GetWorkflowFormByName(workflowFormName).GetFieldValue<Guid>("ID");
            var workflowDefs = dbHelper.FetchMultiple("cmn.WorkflowDef", string.Format("WorkflowForm = '{0}'", workflowFormID), null, null, null, null).Entities;

            if (workflowDefs.Count == 0)
                throw new AfwException("WorkflowDef with Name '{0}' not exists!", workflowFormName);
            else if (workflowDefs.Count > 1)
                throw new AfwException("More than one WorkflowDef with Name '{0}' exists!", workflowFormName);
            else
                return workflowDefs[0];
        }

        private Entity GetWorkflowFormByName(string workflowFormName)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var workflowForms = dbHelper.FetchMultiple("cmn.WorkflowForm", string.Format("Name = '{0}'", workflowFormName), null, null, null, null).Entities;

            if (workflowForms.Count == 0)
                throw new AfwException("WorkflowForm with Name '{0}' not exists!", workflowFormName);
            else if (workflowForms.Count > 1)
                throw new AfwException("More than one WorkflowForm with Name '{0}' exists!", workflowFormName);
            else
                return workflowForms[0];
        }

        public Entity GetWorkflowStageNameByID(Guid workflowStageID)
        {
            var worlflowStages = GetWorkflowStages();
            foreach (var item in worlflowStages.Entities)
            {
                if (item.GetFieldValue<Guid>("ID") == workflowStageID)
                    return item;
            }

            return null;
        }

        private EntityList GetWorkflowStages()
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            return dbHelper.FetchMultiple("cmn.WorkflowStage", null, null, null, null, null);
        }

        public bool UserHasAccessToWorkflowStage(string workflowFormName, Guid workflowStageID)
        {
            var that = this;

            var userOrganizationalPosition = GetUserOrganizationalPosition();
            var workflowStageOrgPostions = GetWorkflowStageOrgPostions();
            var workflowDef = GetWorkflowDefByFormName(workflowFormName);

            if (userOrganizationalPosition == null)
                return false;
            
            foreach (var workflowStageOrgPostionEntity in workflowStageOrgPostions.Entities)
            {
                if (workflowStageOrgPostionEntity.GetFieldValue<Guid>("WorkflowStage") == workflowStageID
                    && workflowStageOrgPostionEntity.GetFieldValue<Guid>("OrgPostion") == userOrganizationalPosition
                    && workflowStageOrgPostionEntity.GetFieldValue<Guid>("WorkflowDef") == workflowDef.GetFieldValue<Guid>("ID"))
                {
                    return true;
                }
            }

            return false;
        }

        public Guid GetFinancialGroupID(Guid? organizationUnitID, Guid? financialYearID, Guid? financialDocTypeID)
        {
            return new FinancialGroupBL().GetFinancialGroupID(organizationUnitID, financialYearID, financialDocTypeID);
        }

        public bool IsMegaModavem
        {
            get
            {
                return new OrganizationInformationBL().IsMegaModavem;
            }
        }

        public Entity TryGetWorkflowDefByFormName(string workflowFormName)
        {
            return new WorkflowBL().TryGetWorkflowDefByFormName(workflowFormName);
        }

        public List<Entity> TryGetWorkflowStagesByWorkflowDefID(Guid workflowDefID)
        {
            return new WorkflowBL().TryGetWorkflowStagesByWorkflowDefID(workflowDefID);
        }

        private Guid? GetUserOrganizationalPosition()
        {
            return CoreComponent.Instance.CurrentSession.GetFieldValue<Entity>("SystemUser_Entity").GetFieldValue<Guid?>("OrganizationalPosition");
        }

        private EntityList GetWorkflowStageOrgPostions()
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            return dbHelper.FetchMultiple("cmn.WorkflowStageOrgPostion", null, null, null, null, null);
        }

        public List<string> GetChangedFieldsName(Entity oldEntity, Entity entity, string[] ignoredFieldNames)
        {
            var changedFields = new List<string>();

            foreach (var fieldName in entity.FieldValues.Keys)
            {
                if (ignoredFieldNames.Contains(fieldName))
                    continue;

                if (!entity.FieldExists(fieldName))
                    throw new AfwException("Error in GetChangedFieldValues:\r\nError compairing field '{0}'. field does not exist in entity.", fieldName);

                if (!oldEntity.FieldExists(fieldName))
                    throw new AfwException("Error in GetChangedFieldValues:\r\nError compairing field '{0}'. field does not exist in entity.", fieldName);

                var entityFieldValue = entity.FieldValues[fieldName];
                var oldEntityFieldValue = oldEntity.FieldValues[fieldName];
                string entityFieldTypeName = null;
                string oldEntityFieldTypeName = null;

                if (entityFieldValue != null)
                {
                    entityFieldTypeName = entityFieldValue.GetType().Name;

                    if (entityFieldTypeName.IsIn("Entity", "EntityList"))
                        throw new AfwException("Error in GetChangedFieldValues:\r\nError compairing field '{0}'. field of type '{1}' not supported.", fieldName, entityFieldTypeName);               
                }

                if (oldEntityFieldValue != null)
                {
                    oldEntityFieldTypeName = oldEntityFieldValue.GetType().Name;

                    if (oldEntityFieldTypeName.IsIn("Entity", "EntityList"))
                        throw new AfwException("Error in GetChangedFieldValues:\r\nError compairing field '{0}'. field of type '{1}' not supported.", fieldName, oldEntityFieldTypeName);
                }

                if (ConvertFieldValueToString(entityFieldValue) != ConvertFieldValueToString(oldEntityFieldValue))
                {
                    changedFields.Add(fieldName);
                }
            }

            return changedFields;
        }

        private string ConvertFieldValueToString(object fieldValue)
        {
            if (fieldValue == null)
                return null;

            switch (fieldValue.GetType().Name)
            {
                case "Guid":
                    return fieldValue.ToString();
                case "DateTime":
                    return DateTimeHelper.DateTimeToString((DateTime)fieldValue);
                case "Decimal":
                    return Convert.ToInt64(fieldValue).ToString();
                default:
                    return (fieldValue).ToString();
            }
        }

        public EntityList GetMahdudiatBatriEntityLists() {
            return new StuffDefBL().GetMahdudiatBatriEntityLists();
        }

        public Entity GetStuffDefFieldsMaxIntValue()
        {
            return new StuffDefBL().GetStuffDefFieldsMaxIntValue();
        }

        public string GetEntityFieldTitle(Guid entityDefID, string fieldName)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            return dbHelper.FetchSingle("afw_EntityFieldDefsView",
                string.Format("EntityDefID = '{0}' and Name = '{1}'", entityDefID, fieldName),
                null).GetFieldValue<string>("Title");
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "CustomTextFieldInfo")]
        public void BeforeApplyCustomTextFieldInfoChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new CustomTextFieldInfoBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "DiscountAccSetting")]
        public void BeforeApplyDiscountAccSettingChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new DiscountAccSettingBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "ServiceAccSetting")]
        public void BeforeApplyServiceAccSettingChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new ServiceAccSettingBL().BeforeApplyChanges(dbHelper, entity);
        }

        public void CheckServicesAccSetting(List<Entity> serviceEntities, Guid financialYear)
        {
            new ServiceAccSettingBL().CheckServicesAccSetting(serviceEntities, financialYear);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "StuffLocationAccSetting")]
        public void BeforeApplyStuffLocationAccSettingChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new StuffLocationAccSettingBL().BeforeApplyChanges(dbHelper, entity);
        }

        public void DeleteCustomTextFieldInfo(Guid entityID, bool isDeleteFromRefEntity) {
            new CustomTextFieldInfoBL().DeleteCustomTextFieldInfo(entityID, isDeleteFromRefEntity);
        }

        public EntityList GetStuffLocationIDsByStuffID(Guid stuffID)
        {
            return new StuffBL().GetStuffLocationIDsByStuffID(stuffID);
        }
    }
}

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
    class LeadBL : EntityBL
    {
        public void QualifyLead(Guid leadID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            using (var tranManager = new DbTransactionManager(dbHelper))
            {
                //DebugHelper.Break(); 
                var lead = dbHelper.FetchSingleByID("crm.Lead", leadID, null);
                
                ValidateLeadForQualify(lead);
                DoQualifyLead(lead);
                
                tranManager.Commit();
            }
        }

        public void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            using (var tranManager = new DbTransactionManager(dbHelper))
            {
                if (entity.ChangeStatus == EntityChangeTypes.Modify)
                {
                    var leadEntity = dbHelper.FetchSingleByID("crm.Lead", entity.GetFieldValue<Guid>("ID"), null);
                    var workflowStage = leadEntity.GetFieldValue<Guid?>("WorkflowStage");

                    var newWorkflowStage = entity.GetFieldValue<Guid?>("WorkflowStage");

                    if (workflowStage != newWorkflowStage)
                    {
                        var workflowStageEntity = dbHelper.FetchSingle("cmn.WorkflowStage", string.Format("ID = '{0}'", workflowStage.ToString()), null);
                        var workflowDef = dbHelper.FetchSingle("cmn.WorkflowDef", string.Format("ID = '{0}'", workflowStageEntity.GetFieldValue<Guid>("WorkflowDef").ToString()), null);
                        var systemAction = workflowStageEntity.GetFieldValue<Guid?>("SystemAction");

                        if (systemAction != null)
                        {
                            //DebugHelper.Break();
                            var systemActionEntity = dbHelper.FetchSingle("cmn.WorkfolwSystemAction", string.Format("ID = '{0}'", systemAction), null);
                            var stages = dbHelper.FetchMultiple("cmn.WorkflowStage", string.Format("WorkflowDef = '{0}'", workflowDef.GetFieldValue<Guid>("ID")), "StageOrder", null, null, null);
                            for (int i = 0; i < stages.Entities.Count(); i++)
                            {
                                if (stages.Entities[i].GetFieldValue<Guid>("ID") == workflowStage)
                                {
                                    if (stages.Entities[i + 1].GetFieldValue<Guid>("ID") == newWorkflowStage)
                                    {
                                        var systemActionName = systemActionEntity.GetFieldValue<string>("Name");
                                        if (systemActionName == "CreateSalesCase")
                                        {
                                            ValidateLeadForQualify(entity);
                                            DoQualifyLead(entity);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                tranManager.Commit();
            }
        }
        public void DisqualifyLead(Entity disqualifyInfo)
        {
            //DebugHelper.Break(); 
            var dbHelper = CoreComponent.Instance.MainDbHelper;
            
            using (var tranManager = new DbTransactionManager(dbHelper))
            {
                var disqualified = OptionSetHelper.GetOptionSetItemID("crm.LeadQualificationStatus", "Disqualified");
                
                var leadEntity = dbHelper.FetchSingle("crm.Lead", string.Format("ID = '{0}'", disqualifyInfo.GetFieldValue<Guid>("Lead")), null);
                var leadQualificationStatus = leadEntity.GetFieldValue<Guid?>("QualificationStatus");
                
                if (leadQualificationStatus == disqualified)
                    throw new AfwException("این سرنخ تجاری قبلاً تجاری رد شده است.");

                leadEntity.SetFieldValue("QualificationStatus", disqualified);
                dbHelper.UpdateEntity(leadEntity);
                dbHelper.InsertEntity(disqualifyInfo);

                tranManager.Commit();
            }
        }

        private void ValidateLeadForQualify(Entity lead)
        {
            //DebugHelper.Break();
            var core = CoreComponent.Instance;
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var post = lead.GetFieldValue<Guid?>("Post");
            var lastName = lead.GetFieldValue<string>("LastName");
            var companyName = lead.GetFieldValue<string>("CompanyName");
            var gender = lead.GetFieldValue<Guid?>("Gender");
            var companyTel = lead.GetFieldValue<string>("CompanyTel");
            var requestType = lead.GetFieldValue<Guid?>("RequestType");
            var customerType = lead.GetFieldValue<Guid?>("CustomerType");
            var businessField = lead.GetFieldValue<Guid?>("CustomerBusinessField");
            var personRank = lead.GetFieldValue<Guid?>("PersonRank");
            var shahr = lead.GetFieldValue<Guid?>("Shahr");
            var ostan = lead.GetFieldValue<Guid?>("Ostan");
            var educationLevle = lead.GetFieldValue<Guid?>("EducationLevle");
            var mobile = lead.GetFieldValue<string>("Mobile");

            var qualificationStatus = lead.GetFieldValue<Guid?>("QualificationStatus");
            var qualifiedID = OptionSetHelper.GetOptionSetItemID("crm.LeadQualificationStatus", "Qualified");
            var haghighi = OptionSetHelper.GetOptionSetItemID("cmn.PersonTypes", "Haghighi");

            if (qualificationStatus == qualifiedID)
                throw new AfwException("این سرنخ قبلاً تایید شده است.");

            if (customerType == null)
                throw new AfwException("نوع مشتری در سرنخ تجاری تعیین نشده است.");

            if (requestType == null)
                throw new AfwException("نوع درخواست در سرنخ تجاری تعیین نشده است.");

            if (post != null && string.IsNullOrEmpty(lastName))
                throw new AfwException("فیلد سمت در سرنخ تجاری مقدار دارد اما نام خانوادگی مفدار ندارد.");

            if (post != null && string.IsNullOrEmpty(companyName))
                throw new AfwException("فیلد سمت در سرنخ تجاری مقدار دارد اما نام شرکت مفدار ندارد.");

            if (!string.IsNullOrEmpty(lastName) && gender == null)
                throw new AfwException("فیلد نام خانوادگی در سرنخ تجاری مقدار دارد اما جنسیت مفدار ندارد.");

            if (!string.IsNullOrEmpty(lastName) && !string.IsNullOrEmpty(companyName) && post == null)
                throw new AfwException("فیلد نام خانوادگی و نام شرکت در سرنخ تجاری مقدار دارند اما سمت مفدار ندارد.");

            if (customerType == haghighi)
            {
                if (!string.IsNullOrEmpty(companyName))
                    throw new AfwException("نوع مشتری در سرنخ تجاری، حقیقی است اما نام شرکت مقدار دارد.");

                if (string.IsNullOrEmpty(lastName))
                    throw new AfwException("نوع مشتری در سرنخ تجاری، حقیقی است اما نام خانوادگی مقدار ندارد.");

                if (gender == null)
                    throw new AfwException("نوع مشتری در سرنخ تجاری، حقیقی است اما جنسیت مقدار ندارد.");
            }
            else
            {
                if (string.IsNullOrEmpty(companyName))
                    throw new AfwException("نوع مشتری در سرنخ تجاری، حقوقی است اما نام شرکت مقدار ندارد.");
                if (string.IsNullOrEmpty(lastName) && educationLevle != null)
                    throw new AfwException("تحصیلات در سرنخ تجاری مقدار دارد، اما نام خانوادگی مقدار ندارد");
            }

            if (!string.IsNullOrEmpty(companyTel) && string.IsNullOrEmpty(companyName))
                throw new AfwException("فیلد تلفن شرکت در سرنخ تجاری مقدار دارد اما نام شرکت مفدار ندارد.");

            if (!string.IsNullOrEmpty(mobile) && string.IsNullOrEmpty(lastName))
                throw new AfwException("فیلد تلفن همراه در سرنخ تجاری مقدار دارد اما نام خانوادگی مفدار ندارد.");
        }

        private void DoQualifyLead(Entity lead)
        {
           //DebugHelper.Break();
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var leadWebsite = lead.GetFieldValue<string>("WebsiteAddress");
            var leadEmail = lead.GetFieldValue<string>("Email");
            var leadCustomerType = lead.GetFieldValue<Guid>("CustomerType");
            var leadGender = lead.GetFieldValue<Guid?>("Gender");
            var leadPost = lead.GetFieldValue<Guid?>("Post");
            var leadCompanyName = lead.GetFieldValue<string>("CompanyName");
            var leadCompanyTel = lead.GetFieldValue<string>("CompanyTel");
            var leadLastName = lead.GetFieldValue<string>("LastName");
            var leadMobile = lead.GetFieldValue<string>("Mobile");
            var leadRequestType = lead.GetFieldValue<Guid>("RequestType");
            var leadNote = lead.GetFieldValue<string>("Note");
            var leadQualificationStatus = lead.GetFieldValue<Guid?>("QualificationStatus");
            var requestTypeTitle = dbHelper.FetchSingleByID("crm.SalesCaseRequestType", leadRequestType, null).GetFieldValue<string>("Title");
            var businessField = lead.GetFieldValue<Guid?>("CustomerBusinessField");
            var personRank = lead.GetFieldValue<Guid?>("PersonRank");
            var shahr = lead.GetFieldValue<Guid?>("Shahr");
            var ostan = lead.GetFieldValue<Guid?>("Ostan");
            var educationLevle = lead.GetFieldValue<Guid?>("EducationLevle");
            var mobile = lead.GetFieldValue<string>("Mobile");
            var salesCaseStatus_OpenID = OptionSetHelper.GetOptionSetItemID("crm.SalesCaseStatuses", "Open");
            var haghighi = OptionSetHelper.GetOptionSetItemID("cmn.PersonTypes", "Haghighi");
            var qualified = OptionSetHelper.GetOptionSetItemID("crm.LeadQualificationStatus", "Qualified");
            var disqualified = OptionSetHelper.GetOptionSetItemID("crm.LeadQualificationStatus", "Disqualified");

            if (leadQualificationStatus == disqualified)
            {
                var leadDisqualifiyInfoEntity = dbHelper.FetchSingle("crm.LeadDisqualifyInfo", string.Format("Lead = '{0}'", lead.GetFieldValue<Guid>("ID")), null);
                dbHelper.DeleteEntity(leadDisqualifiyInfoEntity);
            }

            lead.SetFieldValue("QualificationStatus", qualified);
            lead.ChangeStatus = EntityChangeTypes.Modify;
            dbHelper.ApplyChanges(lead);

            var customerEntity = dbHelper.CreateNewEntity("cmn.Person");
            var salesCaseEntity = dbHelper.CreateNewEntity("crm.SalesCase");

            customerEntity.SetFieldValue("WebsiteAddress", leadWebsite);
            customerEntity.SetFieldValue("PersonType", leadCustomerType);
            customerEntity.SetFieldValue("City", shahr);
            customerEntity.SetFieldValue("State", ostan);
            customerEntity.SetFieldValue("CustomerBusinessField", businessField);
            customerEntity.SetFieldValue("PersonRank", personRank);

            if (leadCustomerType == haghighi)
            {
                customerEntity.SetFieldValue("LastName", leadLastName);
                customerEntity.SetFieldValue("Gender", leadGender);
                customerEntity.SetFieldValue("Email", leadEmail);
                customerEntity.SetFieldValue("MobilePhoneNumber1", leadMobile);
                customerEntity.SetFieldValue("Education", educationLevle);
                
            }
            else
            {
                customerEntity.SetFieldValue("Name", leadCompanyName);
                customerEntity.SetFieldValue("TelNumber1", leadCompanyTel);

                if (string.IsNullOrEmpty(leadLastName))
                    customerEntity.SetFieldValue("Email", leadEmail);
            }

            dbHelper.InsertEntity(customerEntity);

            if (!string.IsNullOrEmpty(leadCompanyName) && !string.IsNullOrEmpty(leadLastName))
            {
                var connectedPersonEntity = dbHelper.CreateNewEntity("cmn.Person");

                connectedPersonEntity.SetFieldValue("PersonType", haghighi);
                connectedPersonEntity.SetFieldValue("LastName", leadLastName);
                connectedPersonEntity.SetFieldValue("Gender", leadGender);
                connectedPersonEntity.SetFieldValue("MobilePhoneNumber1", leadMobile);
                connectedPersonEntity.SetFieldValue("Email", leadEmail);
                connectedPersonEntity.SetFieldValue("Education", educationLevle);
                dbHelper.InsertEntity(connectedPersonEntity);
                salesCaseEntity.SetFieldValue("MainConnectedPerson", connectedPersonEntity.GetFieldValue<Guid>("ID"));
            }

            var salesCaseStages = dbHelper.FetchMultiple("crm.SalesCaseStage", String.Format("RequestType = '{0}'", leadRequestType), "StageNumber", 1, 1, null).Entities;
            if (salesCaseStages.Count > 0)
                salesCaseEntity.SetFieldValue("SalesCaseStage", salesCaseStages[0].GetFieldValue<Guid>("ID"));
            else
                throw new AfwException("مراحل نوع درخواست '{0}' تعریف نشده اند.", requestTypeTitle);

            var salesCaseTile = "";
            if (!string.IsNullOrEmpty(leadCompanyName))
                salesCaseTile = requestTypeTitle + " " + leadCompanyName;
            else
                salesCaseTile = requestTypeTitle + " " + leadLastName;
            //DebugHelper.Break();
            salesCaseEntity.SetFieldValue("Title", salesCaseTile);
            salesCaseEntity.SetFieldValue("RequestType", leadRequestType);
            salesCaseEntity.SetFieldValue("Customer", customerEntity.GetFieldValue<Guid>("ID"));
            salesCaseEntity.SetFieldValue("Status", salesCaseStatus_OpenID);
            salesCaseEntity.SetFieldValue("IsActive", true);
            salesCaseEntity.SetFieldValue("SourceLead", lead.GetFieldValue<Guid>("ID"));
            salesCaseEntity.SetFieldValue("SourceCampaing", lead.GetFieldValue<Guid?>("AdvertisingCampaign"));
            salesCaseEntity.SetFieldValue("OwnerUser", CoreComponent.Instance.GetCurrentSessionUserID());
            new SalesCaseBL().SaveSalesCase(salesCaseEntity);

            if (!string.IsNullOrEmpty(leadNote))
            {
                var salesCaseNoteEntity = dbHelper.CreateNewEntity("crm.SalesCaseNote");
                salesCaseNoteEntity.SetFieldValue("NoteText", leadNote);
                salesCaseNoteEntity.SetFieldValue("SalesCase", salesCaseEntity.GetFieldValue<Guid>("ID"));
                dbHelper.InsertEntity(salesCaseNoteEntity);
            }
        }
    }
}

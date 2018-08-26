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
    public class PersonBL : EntityBL
    {
        private List<Entity> _PersonRoles;
        private List<Entity> GetPersonRoles()
        {
            if (_PersonRoles == null)
            {
                var dbHelper = CoreComponent.Instance.MainDbHelper;
                _PersonRoles = dbHelper.FetchMultiple("cmn.PersonRole", null, null, null, null, null).Entities;
            }

            return _PersonRoles;
        }

        public void SavePerson(Entity person)
        {
            //DebugHelper.Break();

            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var personID = person.GetFieldValue<Guid>("ID");

            EntityList personRoleRelations = new EntityList();
            if (person.FieldExists("PersonRoleRelations"))
                personRoleRelations = person.GetFieldValue<EntityList>("PersonRoleRelations");

            EntityList personGroupRelations = null;
            if (person.FieldExists("PersonGroupRelations"))
                personGroupRelations = person.GetFieldValue<EntityList>("PersonGroupRelations");

            CheckRoleRelations(person);

            using (var tranManager = new DbTransactionManager(dbHelper))
            {
                var roleInfoEntities = new List<Entity>();

                foreach (var role in GetPersonRoles())
                {
                    var roleName = role.GetFieldValue<string>("Name");
                    if (person.FieldExists(roleName + "Info"))
                    {
                        var roleInfoEntity = person.GetFieldValue<Entity>(roleName + "Info");
                        if (roleInfoEntity.GetFieldValue<string>("PersonCode") == null)
                            roleInfoEntity.SetFieldValue("PersonCode", GetNewPersonCode(roleName));
                        roleInfoEntities.Add(roleInfoEntity);

                        if (role.GetFieldValue<bool>("HasFinancialAccount")
                            && string.IsNullOrEmpty(person.GetFieldValue<string>("FinancialAccountCode")))
                        {
                            person.SetFieldValue("FinancialAccountCode", GetNewFinancialAccountCode());
                        }

                        person.FieldValues.Remove(roleName + "Info");
                    }
                }

                dbHelper.ApplyChanges(person);

                foreach (Entity personRoleRelationEntity in personRoleRelations.Entities)
                {
                    dbHelper.ApplyChanges(personRoleRelationEntity);
                }

                foreach (var roleInfoEntity in roleInfoEntities)
                {
                    dbHelper.ApplyChanges(roleInfoEntity);
                }

                if (personGroupRelations != null)
                {
                    foreach (Entity personGroupRelationEntity in personGroupRelations.Entities)
                    {
                        dbHelper.ApplyChanges(personGroupRelationEntity);
                    }
                }

                if (PersonHasRole(personID, "PotentialCustomer") && PersonHasRole(personID, "Customer"))
                {
                    SetPotentialCustomerGroupingToCustomer(personID);
                    DeletePotentialCustomerRole(person);
                }

                tranManager.Commit();
            }
        }

        private void CheckRoleRelations(Entity person)
        {
            var roles = GetPersonRoles();

            EntityList personRoleRelations = new EntityList();
            if (person.FieldExists("PersonRoleRelations"))
                personRoleRelations = person.GetFieldValue<EntityList>("PersonRoleRelations");

            foreach (var role in roles)
            {
                var roleID = role.GetFieldValue<Guid>("ID");
                var roleName = role.GetFieldValue<string>("Name");

                Entity roleRelationEntity = personRoleRelations.Entities.FirstOrDefault(
                    o => o.GetFieldValue<Guid>("PersonRole") == roleID);

                Entity roleInfoEntity = null;
                if (person.FieldExists(roleName + "Info"))
                    roleInfoEntity = person.GetFieldValue<Entity>(roleName + "Info");

                if (roleRelationEntity != null && roleRelationEntity.ChangeStatus != EntityChangeTypes.Delete)
                {
                    if (roleInfoEntity == null || roleInfoEntity.ChangeStatus == EntityChangeTypes.Delete)
                        throw new AfwException(roleName + "Info not exists in person entity but RoleRelation exists.");
                }

                if (roleInfoEntity != null && roleInfoEntity.ChangeStatus != EntityChangeTypes.Delete)
                {
                    if (roleRelationEntity == null || roleRelationEntity.ChangeStatus == EntityChangeTypes.Delete)
                        throw new AfwException(roleName + "Info exists in person entity but RoleRelation not exists.");
                }
            }
        }

        //public void AddRoleToPerson(Guid personID, string roleName)
        //{
        //    var dbHelper = CoreComponent.Instance.MainDbHelper;

        //    var person = dbHelper.FetchSingleByID("cmn.Person", personID, new string[] { "PersonRoleRelations", "PersonGroupRelations" });

        //    if (!PersonHasRole(personID, roleName))
        //    {
        //        var roleID = GetPersonRoleID(roleName);

        //        var personRoleRelationEntity = dbHelper.CreateNewEntity("cmn.PersonRoleRelation");
        //        personRoleRelationEntity.SetFieldValue("Person", personID);
        //        personRoleRelationEntity.SetFieldValue("PersonRole", roleID);
        //        if (!person.FieldExists("PersonRoleRelations"))
        //        {
        //            var personRoleRelations = new EntityList();
        //            personRoleRelations.Entities.Add(personRoleRelationEntity);
        //            person.AddField("PersonRoleRelations", personRoleRelations);
        //        }
        //        else
        //            if (person.GetFieldValue<EntityList>("PersonRoleRelations") == null)
        //            {
        //                var personRoleRelations = new EntityList();
        //                personRoleRelations.Entities.Add(personRoleRelationEntity);
        //                person.SetFieldValue("PersonRoleRelations", personRoleRelations);
        //            }
        //            else
        //            {
        //                var personRoleRelations = person.GetFieldValue<EntityList>("PersonRoleRelations");
        //                personRoleRelations.Entities.Add(personRoleRelationEntity);
        //                person.SetFieldValue("PersonRoleRelations", personRoleRelations);
        //            }

        //        var roleInfoEntity = dbHelper.CreateNewEntity("cmn.Person_" + roleName + "Info");
        //        roleInfoEntity.SetFieldValue("Person", personID);
        //        person.AddField(roleName + "Info", roleInfoEntity);

        //        SavePerson(person);
        //    }

        //}

        public void AddRoleToPerson(Guid personID, string roleName)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            using(var tranManager = new DbTransactionManager(dbHelper))
            {
                if (!PersonHasRole(personID, roleName))
                {
                    var personRole = GetPersonRole(roleName);
                    var personRoleID = personRole.GetFieldValue<Guid>("ID");

                    var personRoleRelationEntity = dbHelper.CreateNewEntity("cmn.PersonRoleRelation");
                    personRoleRelationEntity.SetFieldValue("Person", personID);
                    personRoleRelationEntity.SetFieldValue("PersonRole", personRoleID);
                    dbHelper.ApplyChanges(personRoleRelationEntity);

                    var roleInfoEntity = dbHelper.CreateNewEntity("cmn.Person_" + roleName + "Info");
                    roleInfoEntity.SetFieldValue("Person", personID);
                    roleInfoEntity.SetFieldValue("PersonCode", GetNewPersonCode(roleName));
                    dbHelper.ApplyChanges(roleInfoEntity);

                    if (personRole.GetFieldValue<bool>("HasFinancialAccount"))
                    {
                        var person = dbHelper.FetchSingleByID("cmn.Person", personID, null);

                        if (string.IsNullOrEmpty(person.GetFieldValue<string>("FinancialAccountCode")))
                        {
                            person.SetFieldValue("FinancialAccountCode", GetNewFinancialAccountCode());
                            dbHelper.UpdateEntity(person);
                        }
                    }

                    tranManager.Commit();
                }
            }
        }

        private Entity GetPersonRole(string roleName)
        {
            var roleEntity = GetPersonRoles().FirstOrDefault(o => o.GetFieldValue<string>("Name") == roleName);

            if (roleEntity == null)
                throw new AfwException("PersonRole with Name '{0}' not exists.", roleName);

            return roleEntity;
        }

        private Entity GetPersonRole(Guid roleID)
        {
            var roleEntity = GetPersonRoles().FirstOrDefault(o => o.GetFieldValue<Guid>("ID") == roleID);

            if (roleEntity == null)
                throw new AfwException("PersonRole with ID '{0}' not exists.", roleID);

            return roleEntity;
        }

        public bool PersonHasRole(Guid personID, string roleName)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var roleID = GetPersonRole(roleName).GetFieldValue<Guid>("ID");

            var personRoleRelationEntity = dbHelper.FetchSingle("cmn.PersonRoleRelation", string.Format("Person = '{0}' and PersonRole = '{1}'", personID, roleID), null);
            if (personRoleRelationEntity == null)
                return false;
            else
                return true;
        }

        private int GetNewPersonCode(string roleName)
        {
            int? maxValue = cmn.Instance.GetFieldMaxIntValue("PersonCode", "cmn_Person_" + roleName + "Infos", null);

            return (maxValue == null) ? 1 : (int)maxValue + 1;
        }

        private int GetNewFinancialAccountCode()
        {
            int? maxValue = cmn.Instance.GetFieldMaxIntValue("FinancialAccountCode", "cmn_Persons", null);

            return (maxValue == null) ? 1 : (int)maxValue + 1;
        }

        public Entity FetchPersonByID(Guid id, string[] navigationPropsToFetch)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var person = dbHelper.FetchSingleByID("cmn.Person", id, navigationPropsToFetch);
            FetchPersonRoleInfoFields(person);
            return person;
        }

        public EntityList FetchPersonList(string filterExpression, string sortExpression, int? startRecordNumber, int? maxRecords, string[] navigationPropsToFetch)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var personList = dbHelper.FetchMultiple("cmn.Person", filterExpression, sortExpression, startRecordNumber, maxRecords, navigationPropsToFetch);

            foreach (var person in personList.Entities)
            {
                FetchPersonRoleInfoFields(person);
            }

            return personList;
        }

        private void FetchPersonRoleInfoFields(Entity person)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var personRoles = GetPersonRoles();

            List<Entity> personRoleRelations = null;

            if (person.FieldExists("PersonRoleRelations") && person.GetFieldValue<EntityList>("PersonRoleRelations") != null)
                personRoleRelations = person.GetFieldValue<EntityList>("PersonRoleRelations").Entities;
            else
                personRoleRelations = dbHelper.FetchMultiple("cmn.PersonRoleRelation",
                    string.Format("Person = '{0}'", person.GetFieldValue<Guid>("ID")), null, null, null, null).Entities;

            foreach (var personRoleRelation in personRoleRelations)
            {
                var roleName = personRoles.First(o => o.GetFieldValue<Guid>("ID") == personRoleRelation.GetFieldValue<Guid>("PersonRole")).GetFieldValue<string>("Name");
                var roleInfo = dbHelper.FetchSingle(string.Format("cmn.Person_{0}Info", roleName),
                    string.Format("Person = '{0}'", person.GetFieldValue<Guid>("ID")), null);
                person.AddField(roleName + "Info", roleInfo);
            }
        }

        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            //DebugHelper.Break();

            if (entity.ChangeStatus == EntityChangeTypes.Delete)
            {
                var personRoleRelations = dbHelper.FetchMultiple("cmn.PersonRoleRelation", string.Format("Person = '{0}'", entity.FieldValues["ID"].ToString()), null, null, null, null);
                foreach (Entity personRoleRelationEntity in personRoleRelations.Entities)
                {
                    dbHelper.DeleteEntity(personRoleRelationEntity);
                }

                var roles = dbHelper.FetchMultiple("cmn.PersonRole", null, null, null, null, null).Entities;
                foreach (var role in roles)
                {
                    var roleName = role.GetFieldValue<string>("Name");
                    var roleInfoEntity = dbHelper.FetchSingle("cmn.Person_" + roleName + "Info", string.Format("Person = '{0}'", entity.FieldValues["ID"].ToString()), null);

                    if (roleInfoEntity != null)
                        dbHelper.DeleteEntity(roleInfoEntity);
                }

                var personGroupRelations = dbHelper.FetchMultiple("cmn.PersonGroupRelation", string.Format("Person = '{0}'", entity.FieldValues["ID"].ToString()), null, null, null, null);
                foreach (Entity personGroupRelationEntity in personGroupRelations.Entities)
                {
                    dbHelper.DeleteEntity(personGroupRelationEntity);
                }
            }
            else
            {
                entity.SetFieldValue("StoredDisplayText", CalculateStoredDisplayText(entity));
            }

            //else if(entity.ChangeStatus == EntityChangeTypes.Add)
            //{
            //    //var entityList = AreExistPersonCodes(dbHelper, entity);
            //    //if (entityList != null)

            //}
        }

        public override void AfterApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.AfterApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus != EntityChangeTypes.Delete)
            {
                UpdateChildPersonsStoredDisplayText(entity);
            }
        }

        private void DeletePotentialCustomerRole(Entity entity)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var personID = entity.GetFieldValue<Guid>("ID");
            var roleID = GetPersonRole("PotentialCustomer").GetFieldValue<Guid>("ID");
            
            var personRoleRelationEntity = dbHelper.FetchSingle("cmn.PersonRoleRelation", string.Format("Person = '{0}' and PersonRole = '{1}'", personID, roleID), null);
            dbHelper.DeleteEntity(personRoleRelationEntity);

            var personRoleInfoEntity = dbHelper.FetchSingle("cmn.Person_PotentialCustomerInfo", string.Format("Person = '{0}'", personID), null);
            dbHelper.DeleteEntity(personRoleInfoEntity);
        }

        private void SetPotentialCustomerGroupingToCustomer(Guid personId)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;
            
            var potentialCustomer = dbHelper.FetchSingle("cmn.Person_PotentialCustomerInfo", string.Format("Person = '{0}'",personId), null);
            var customerInfo = dbHelper.FetchSingle("cmn.Person_CustomerInfo", string.Format("Person = '{0}'", personId), null);

            customerInfo.SetFieldValue("MainGroup", potentialCustomer.GetFieldValue<Guid?>("MainGroup"));
            customerInfo.SetFieldValue("SubGroup1", potentialCustomer.GetFieldValue<Guid?>("SubGroup1"));
            customerInfo.SetFieldValue("SubGroup2", potentialCustomer.GetFieldValue<Guid?>("SubGroup2"));

            dbHelper.ApplyChanges(customerInfo);
        }

        private void UpdateChildPersonsStoredDisplayText(Entity person)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var personID = person.GetFieldValue<Guid>("ID");
            var personConnectedPersons = dbHelper.FetchMultiple("cmn.PersonConnectedPerson", string.Format("ParentPerson = '{0}'", personID), null, null, null, null);

            foreach (var personConnectedPerson in personConnectedPersons.Entities)
            {
                var childPersonID = personConnectedPerson.GetFieldValue<Guid>("ConnectedPerson");
                UpdateStoredDisplayText(childPersonID);
            }
        }

        private string CalculateStoredDisplayText(Entity person)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var id = person.GetFieldValue<Guid>("ID");
            var haghighiID = OptionSetHelper.GetOptionSetItemID("cmn.PersonTypes", "Haghighi");
            var personType = person.GetFieldValue<Guid>("PersonType");
            var name = person.GetFieldValue<string>("Name") != null ? person.GetFieldValue<string>("Name").Trim() : "";
            var lastName = person.GetFieldValue<string>("LastName") != null ? person.GetFieldValue<string>("LastName").Trim() : "";
            var nameTag = person.GetFieldValue<string>("NameTag") != null ? person.GetFieldValue<string>("NameTag").Trim() : "";
            //var mobilePhoneNumber1 = person.GetFieldValue<string>("MobilePhoneNumber1") != null ? person.GetFieldValue<string>("MobilePhoneNumber1").Trim() : "";

            var storedDisplayText = "";

            if (name != "")
                storedDisplayText = name;

            if (personType == haghighiID && lastName != "")
            {
                if (storedDisplayText != "")
                    storedDisplayText += " ";
                storedDisplayText += lastName;
            }

            if (nameTag != "")
            {
                if (storedDisplayText != "")
                    storedDisplayText += " ";
                storedDisplayText += "(" + nameTag + ")";
            }

            //if (personType == haghighiID && mobilePhoneNumber1 != "")
            //{
            //    if (storedDisplayText != "")
            //        storedDisplayText += " | ";
            //    storedDisplayText += mobilePhoneNumber1;
            //}

            var parentsName = "";
            var personConnectedPersons = dbHelper.FetchMultiple("cmn.PersonConnectedPerson", 
                string.Format("ConnectedPerson = '{0}' and IsActive = 1", id), null, null, null, null);
            foreach (var personConnectedPerson in personConnectedPersons.Entities)
            {
                var parentPerson = dbHelper.FetchSingleByID("cmn.Person", personConnectedPerson.GetFieldValue<Guid>("ParentPerson"), null);

                var parentPersonFirstName = parentPerson.GetFieldValue<string>("Name") != null ? parentPerson.GetFieldValue<string>("Name").Trim() : "";
                var parentPersonLastName = parentPerson.GetFieldValue<string>("LastName") != null ? parentPerson.GetFieldValue<string>("LastName").Trim() : "";
                var parentPersonFullName = "";
                if (parentPersonFirstName == "")
                    parentPersonFullName = parentPersonLastName;
                else
                    parentPersonFullName = parentPersonFirstName + " " + parentPersonLastName;

                if (parentPersonFullName != "")
                    parentsName += parentPersonFullName + ", ";
            }

            if (parentsName != "")
            {
                parentsName = parentsName.Remove(parentsName.Length - 2);

                if (storedDisplayText != "")
                    storedDisplayText += " ";
                storedDisplayText += "(" + parentsName + ")";
            }

            return storedDisplayText;
        }

        public void UpdateStoredDisplayText(Guid personID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var person = dbHelper.FetchSingleByID("cmn.Person", personID, null);
            var storedDisplayText = CalculateStoredDisplayText(person);

            dbHelper.AdoDbHelper.ExecuteNonQuery(
                string.Format(@"update cmn_Persons set StoredDisplayText = N'{0}' where ID = '{1}'",
                storedDisplayText, personID));
        }

        public Entity GetPersonPreviewInfo(Guid personID, int mode)
        {
            //Modes:
            //1: get person phone numbers in a separate list
            //2: add an item to connected persons to view person phone numbers

            //DebugHelper.Break();

            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var personEntity = dbHelper.FetchSingleByID("cmn.Person", personID,
                new string[] {
                    "PhoneNumbers", 
                    "ConnectedPersons.ConnectedPerson.PhoneNumbers", 
                    "ConnectedPersons",
                    "PersonRoleRelations.PersonRole"
                });

            var connectedPersonsPosts = dbHelper.FetchMultiple("cmn.ConnectedPersonPost", null, null, null, null, null).Entities;
            var connectedPersonsOrgUnits = dbHelper.FetchMultiple("cmn.ConnectedPersonsOrganizationUnit", null, null, null, null, null).Entities;

            var personInfoEntity = new Entity();

            var isRealPerson = personEntity.GetFieldValue<Guid>("PersonType") == OptionSetHelper.GetOptionSetItemID("cmn.PersonTypes", "Haghighi");


            var state_PreNumber = "";
            var state_Text = "";
            if (personEntity.GetFieldValue<Guid?>("State") != null)
            {
                var state = dbHelper.FetchSingleByID("cmn.State", personEntity.GetFieldValue<Guid>("State"), null);
                state_Text = state.GetFieldValue<string>("Name");
                state_PreNumber = state.GetFieldValue<string>("StatePreNumber");
            }


            var recognitionMethod_Text = "";
            if (personEntity.GetFieldValue<Guid?>("RecognitionMethod") != null)
            {
                var recognitionMethod = dbHelper.FetchSingleByID("crm.RecognitionMethod", personEntity.GetFieldValue<Guid>("RecognitionMethod"), null);
                recognitionMethod_Text = recognitionMethod.GetFieldValue<string>("Title");
            }

            var rolesText = "";
            foreach (var personRoleRelation in personEntity.GetFieldValue<EntityList>("PersonRoleRelations").Entities)
            {
                if (rolesText != "")
                    rolesText += ", ";
                rolesText += personRoleRelation.GetFieldValue<Entity>("PersonRole_Entity").GetFieldValue<string>("Title");
            }

            var connectedPersonsInfos = new EntityList();

            if (mode == 2)
            {
                var selfConnectedPersonsInfo = new Entity();
                selfConnectedPersonsInfo.AddField("ID", personEntity.GetFieldValue<Guid>("ID"));
                selfConnectedPersonsInfo.AddField("DisplayName", "تلفن های اصلی");
                selfConnectedPersonsInfo.AddField("IsActive", true);

                var genderText = "";
                if (personEntity.GetFieldValue<Guid?>("Gender") != null)
                    genderText = OptionSetHelper.GetOptionSetItemTitle(personEntity.GetFieldValue<Guid>("Gender"));
                selfConnectedPersonsInfo.AddField("Gender_Text", genderText);

                selfConnectedPersonsInfo.AddField("Post_Text", "-");
                selfConnectedPersonsInfo.AddField("OrganizationUnit_Text", "-");
                selfConnectedPersonsInfo.AddField("OnvaneSazemani", "-");
                selfConnectedPersonsInfo.AddField("Email", personEntity.GetFieldValue<string>("Email"));
                selfConnectedPersonsInfo.AddField("PhoneNumbers", GetPersonPreviewInfo_PersonPhoneNumberInfos(personEntity));

                connectedPersonsInfos.Entities.Add(selfConnectedPersonsInfo);
            }

            foreach (var personConnectedPerson in personEntity.GetFieldValue<EntityList>("ConnectedPersons").Entities)
            {
                var connectedPersonInfo = new Entity();
                var connectedPerson = personConnectedPerson.GetFieldValue<Entity>("ConnectedPerson_Entity");

                connectedPersonInfo.AddField("ID", personConnectedPerson.GetFieldValue<Guid>("ID"));
                connectedPersonInfo.AddField("DisplayName", GetPersonDisplayName(connectedPerson));
                connectedPersonInfo.AddField("IsActive", personConnectedPerson.GetFieldValue<bool>("IsActive"));

                var genderText = "";
                if (connectedPerson.GetFieldValue<Guid?>("Gender") != null)
                    genderText = OptionSetHelper.GetOptionSetItemTitle(connectedPerson.GetFieldValue<Guid>("Gender"));

                connectedPersonInfo.AddField("Gender_Text", genderText);

                var post_Text = "";
                if (personConnectedPerson.GetFieldValue<Guid?>("ConnectedPersonPost") != null)
                    post_Text = connectedPersonsPosts.First(o => o.GetFieldValue<Guid>("ID") == personConnectedPerson.GetFieldValue<Guid>("ConnectedPersonPost")).GetFieldValue<string>("Title");
                connectedPersonInfo.AddField("Post_Text", post_Text);

                var organizationUnit_Text = "";
                if (personConnectedPerson.GetFieldValue<Guid?>("OrganizationUnit") != null)
                    organizationUnit_Text = connectedPersonsOrgUnits.First(
                        o => o.GetFieldValue<Guid>("ID") == personConnectedPerson.GetFieldValue<Guid>("OrganizationUnit")).GetFieldValue<string>("Title");
                connectedPersonInfo.AddField("OrganizationUnit_Text", organizationUnit_Text);

                connectedPersonInfo.AddField("OnvaneSazemani", personConnectedPerson.GetFieldValue<string>("OnvaneSazemani"));
                connectedPersonInfo.AddField("Email", connectedPerson.GetFieldValue<string>("Email"));
                connectedPersonInfo.AddField("PhoneNumbers", GetPersonPreviewInfo_PersonConnectedPersonPhoneNumberInfos(personConnectedPerson));

                connectedPersonsInfos.Entities.Add(connectedPersonInfo);
            }


            personInfoEntity.AddField("ID", personEntity.GetFieldValue<Guid>("ID"));
            personInfoEntity.AddField("DisplayName", GetPersonDisplayName(personEntity));
            personInfoEntity.AddField("IsRealPerson", isRealPerson);
            personInfoEntity.AddField("FinancialAccountCode", personEntity.GetFieldValue<string>("FinancialAccountCode"));
            personInfoEntity.AddField("RecognitionMethod_Text", recognitionMethod_Text);
            personInfoEntity.AddField("State_Text", state_Text);
            personInfoEntity.AddField("State_PreNumber", state_PreNumber);
            personInfoEntity.AddField("CodeEghtesadi", personEntity.GetFieldValue<string>("CodeEghtesadi"));
            personInfoEntity.AddField("NationalID", personEntity.GetFieldValue<string>("NationalID"));
            personInfoEntity.AddField("Address1", personEntity.GetFieldValue<string>("Address1"));
            personInfoEntity.AddField("PostalCode", personEntity.GetFieldValue<string>("PostalCode"));
            personInfoEntity.AddField("WebsiteAddress", personEntity.GetFieldValue<string>("WebsiteAddress"));
            personInfoEntity.AddField("Email", personEntity.GetFieldValue<string>("Email"));
            personInfoEntity.AddField("RolesText", rolesText);

            var creatorUser_Text = "";
            if (personEntity.GetFieldValue<Guid?>("CreatorUser") != null)
            {
                creatorUser_Text = dbHelper.FetchSingleByID("afw_SystemUsersView",
                    personEntity.GetFieldValue<Guid>("CreatorUser"), null).GetFieldValue<string>("DisplayName");
            }
            personInfoEntity.AddField("CreatorUser_Text", creatorUser_Text);

            var creationTime_Text = "";
            if (personEntity.GetFieldValue<DateTime?>("CreationTime") != null)
            {
                creationTime_Text = DateTimeHelper.GregorianDateToPersian(personEntity.GetFieldValue<DateTime>("CreationTime"));
            }
            personInfoEntity.AddField("CreationTime_Text", creationTime_Text);

            var lastModifierUser_Text = "";
            if (personEntity.GetFieldValue<Guid?>("LastModifierUser") != null)
            {
                lastModifierUser_Text = dbHelper.FetchSingleByID("afw_SystemUsersView",
                    personEntity.GetFieldValue<Guid>("LastModifierUser"), null).GetFieldValue<string>("DisplayName");
            }
            personInfoEntity.AddField("LastModifierUser_Text", lastModifierUser_Text);

            var lastModifyTime_Text = "";
            if (personEntity.GetFieldValue<DateTime?>("LastModifyTime") != null)
            {
                lastModifyTime_Text = DateTimeHelper.GregorianDateToPersian(personEntity.GetFieldValue<DateTime>("LastModifyTime"));
            }
            personInfoEntity.AddField("LastModifyTime_Text", lastModifyTime_Text);


            if (mode == 1)
                personInfoEntity.AddField("PhoneNumbers", GetPersonPreviewInfo_PersonPhoneNumberInfos(personEntity));
            
            personInfoEntity.AddField("ConnectedPersons", connectedPersonsInfos);

            return personInfoEntity;
        }

        private string GetPersonDisplayName (Entity person)
        {
            var displayName = person.GetFieldValue<string>("Name");

            if (!string.IsNullOrEmpty(person.GetFieldValue<string>("LastName")))
            {
                if (!string.IsNullOrEmpty((displayName)))
                    displayName += " ";
                
                displayName += person.GetFieldValue<string>("LastName");
            }

            return displayName;
        }

        private EntityList GetPersonPreviewInfo_PersonPhoneNumberInfos(Entity person)
        {
            var phoneNumbersInfos = new EntityList();

            if (!string.IsNullOrEmpty(person.GetFieldValue<string>("TelNumber1")))
            {
                var phoneNumberInfo = new Entity();
                phoneNumberInfo.AddField("PhoneType", "تلفن ثابت");
                phoneNumberInfo.AddField("PhoneNumber", person.GetFieldValue<string>("TelNumber1"));
                phoneNumberInfo.AddField("Description", null);
                phoneNumbersInfos.Entities.Add(phoneNumberInfo);
            }

            if (!string.IsNullOrEmpty(person.GetFieldValue<string>("WorkPhoneNumber")))
            {
                var phoneNumberInfo = new Entity();
                phoneNumberInfo.AddField("PhoneType", "تلفن محل کار");
                phoneNumberInfo.AddField("PhoneNumber", person.GetFieldValue<string>("WorkPhoneNumber"));
                phoneNumberInfo.AddField("Description", null);
                phoneNumbersInfos.Entities.Add(phoneNumberInfo);
            }

            if (!string.IsNullOrEmpty(person.GetFieldValue<string>("MobilePhoneNumber1")))
            {
                var phoneNumberInfo = new Entity();
                phoneNumberInfo.AddField("PhoneType", "تلفن همراه");
                phoneNumberInfo.AddField("PhoneNumber", person.GetFieldValue<string>("MobilePhoneNumber1"));
                phoneNumberInfo.AddField("Description", null);
                phoneNumbersInfos.Entities.Add(phoneNumberInfo);
            }
            
            if (!string.IsNullOrEmpty(person.GetFieldValue<string>("Fax")))
            {
                var phoneNumberInfo = new Entity();
                phoneNumberInfo.AddField("PhoneType", "فکس");
                phoneNumberInfo.AddField("PhoneNumber", person.GetFieldValue<string>("Fax"));
                phoneNumberInfo.AddField("Description", null);
                phoneNumbersInfos.Entities.Add(phoneNumberInfo);
            }

            foreach (var phoneNumber in person.GetFieldValue<EntityList>("PhoneNumbers").Entities)
            {
                var phoneNumberInfo = new Entity();
                var phoneType = OptionSetHelper.GetOptionSetItems("cmn.PhoneType").First(
                    o => o.GetFieldValue<Guid>("ID") == phoneNumber.GetFieldValue<Guid>("TelType")).GetFieldValue<string>("Title");
                phoneNumberInfo.AddField("PhoneType", phoneType);

                phoneNumberInfo.AddField("PhoneNumber", phoneNumber.GetFieldValue<string>("Phone"));
                phoneNumberInfo.AddField("Description", phoneNumber.GetFieldValue<string>("Note"));
                
                phoneNumbersInfos.Entities.Add(phoneNumberInfo);
            }

            return phoneNumbersInfos;
        }

        private EntityList GetPersonPreviewInfo_PersonConnectedPersonPhoneNumberInfos(Entity personConnectedPerson)
        {
            var phoneNumbersInfos = new EntityList();

            if (!string.IsNullOrEmpty(personConnectedPerson.GetFieldValue<string>("InternalCall")))
            {
                var internalPhoneNumberInfo = new Entity();
                internalPhoneNumberInfo.AddField("PhoneType", "شماره داخلی");
                internalPhoneNumberInfo.AddField("PhoneNumber", personConnectedPerson.GetFieldValue<string>("InternalCall"));
                internalPhoneNumberInfo.AddField("Description", null);
                phoneNumbersInfos.Entities.Add(internalPhoneNumberInfo);
            }

            var connectedPerson = personConnectedPerson.GetFieldValue<Entity>("ConnectedPerson_Entity");
            phoneNumbersInfos.Entities.AddRange(GetPersonPreviewInfo_PersonPhoneNumberInfos(connectedPerson).Entities);

            return phoneNumbersInfos;
        }

        public EntityList GetPersonAccounts(Guid PersonID, Guid financialYearID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            string query = string.Format(@"
            select Account.ID AccountID,
	            Account.FullCodeAndFullName AccountCodeAndName
            from acc_PersonGroupAccounts PersonGroupAccount
	            left join acc_AccountsView Account on Account.ID = PersonGroupAccount.Account
	            left join cmn_PersonGroupRelations PersonGroupRelation on PersonGroupRelation.PersonGroup = PersonGroupAccount.PersonGroup
	            where PersonGroupRelation.Person = '{0}' and Account.FinancialYear = '{1}'", PersonID, financialYearID);

            return dbHelper.FetchMultipleBySqlQuery(query);
        }
    }
}

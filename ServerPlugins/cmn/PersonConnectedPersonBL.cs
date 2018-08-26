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
    public class PersonConnectedPersonBL : EntityBL
    {
        private Guid? _OldConnectedPersonID { get; set; }

        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            var id = entity.GetFieldValue<Guid>("ID");

            if (entity.ChangeStatus == EntityChangeTypes.Modify)
            {
                _OldConnectedPersonID = dbHelper.FetchSingleByID("cmn.PersonConnectedPerson", id, null).GetFieldValue<Guid>("ConnectedPerson");
            }
        }

        public override void AfterApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.AfterApplyChanges(dbHelper, entity);

            //DebugHelper.Break();

            var personBL = new PersonBL();
            var connectedPersonID = entity.GetFieldValue<Guid>("ConnectedPerson");

            if (_OldConnectedPersonID != null && _OldConnectedPersonID != connectedPersonID)
                personBL.UpdateStoredDisplayText((Guid)_OldConnectedPersonID);

            personBL.UpdateStoredDisplayText(connectedPersonID);
            personBL.AddRoleToPerson(connectedPersonID, "ConnectedPerson");

            _OldConnectedPersonID = null;
        }

        public void SaveNewConnectedPerson(Entity personConnectedPerson)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var name = personConnectedPerson.GetFieldValue<string>("Name");
            var lastName = personConnectedPerson.GetFieldValue<string>("LastName");
            var gender = personConnectedPerson.GetFieldValue<Guid?>("Gender");
            var workPhoneNumber = personConnectedPerson.GetFieldValue<string>("WorkPhoneNumber");
            var faxNumber = personConnectedPerson.GetFieldValue<string>("FaxNumber");
            var mobileNumber1 = personConnectedPerson.GetFieldValue<string>("MobileNumber1");
            var mobileNumber2 = personConnectedPerson.GetFieldValue<string>("MobileNumber2");
            var email = personConnectedPerson.GetFieldValue<string>("Email");

            personConnectedPerson.RemoveField("Name");
            personConnectedPerson.RemoveField("LastName");
            personConnectedPerson.RemoveField("Gender");
            personConnectedPerson.RemoveField("WorkPhoneNumber");
            personConnectedPerson.RemoveField("FaxNumber");
            personConnectedPerson.RemoveField("MobileNumber1");
            personConnectedPerson.RemoveField("MobileNumber2");
            personConnectedPerson.RemoveField("Email");

            using (var tranManager = new DbTransactionManager(dbHelper))
            {
                var connectedPerson = dbHelper.CreateNewEntity("cmn.Person");
                connectedPerson.SetFieldValue("PersonType", OptionSetHelper.GetOptionSetItemID("cmn.PersonTypes", "Haghighi"));
                connectedPerson.SetFieldValue("Name", name);
                connectedPerson.SetFieldValue("LastName", lastName);
                connectedPerson.SetFieldValue("Gender", gender);
                connectedPerson.SetFieldValue("WorkPhoneNumber", workPhoneNumber);
                connectedPerson.SetFieldValue("Fax", faxNumber);
                connectedPerson.SetFieldValue("MobilePhoneNumber1", mobileNumber1);
                connectedPerson.SetFieldValue("Email", email);
                dbHelper.InsertEntity(connectedPerson);

                if (!string.IsNullOrEmpty(mobileNumber2))
                {
                    var mobileNumber2Entity = dbHelper.CreateNewEntity("cmn.PhoneNumber");
                    mobileNumber2Entity.SetFieldValue("Person", connectedPerson.GetFieldValue<Guid>("ID"));
                    mobileNumber2Entity.SetFieldValue("TelType", OptionSetHelper.GetOptionSetItemID("cmn.PhoneType", "Mobile"));
                    mobileNumber2Entity.SetFieldValue("Phone", mobileNumber2);
                    dbHelper.InsertEntity(mobileNumber2Entity);
                }

                personConnectedPerson.SetFieldValue("ConnectedPerson", connectedPerson.GetFieldValue<Guid>("ID"));
                dbHelper.InsertEntity(personConnectedPerson);

                tranManager.Commit();
            }
        }
    }
}

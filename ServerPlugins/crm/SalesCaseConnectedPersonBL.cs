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
    public class SalesCaseConnectedPersonBL : EntityBL
    {
        public override void AfterApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.AfterApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus != EntityChangeTypes.Delete)
            {
                new SalesCaseBL().UpdateSalesCaseLastActionTime(entity.GetFieldValue<Guid>("SalesCase"));
            }

            var connectedPersonID = entity.GetFieldValue<Guid>("ConnectedPerson");

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify))
            {
                //ایجاد یا به روز رسانی اشخاص مرتبط در موجودیت مشتری
                var salesCase = dbHelper.FetchSingleByID("crm.SalesCase", entity.GetFieldValue<Guid>("SalesCase"), null);

                var personConnectedPerson = dbHelper.FetchSingle("cmn.PersonConnectedPerson",
                    string.Format("ParentPerson = '{0}' and ConnectedPerson = '{1}'", 
                        salesCase.GetFieldValue<Guid>("Customer"), connectedPersonID), null);

                if (personConnectedPerson != null
                    && personConnectedPerson.GetFieldValue<Guid?>("ConnectedPersonPost") != entity.GetFieldValue<Guid?>("ConnectedPersonPost"))
                {
                    personConnectedPerson.SetFieldValue("ConnectedPersonPost", entity.GetFieldValue<Guid?>("ConnectedPersonPost"));
                    dbHelper.UpdateEntity(personConnectedPerson);
                }
                else
                {
                    personConnectedPerson = dbHelper.CreateNewEntity("cmn.PersonConnectedPerson");
                    personConnectedPerson.SetFieldValue("ParentPerson", salesCase.GetFieldValue<Guid>("Customer"));
                    personConnectedPerson.SetFieldValue("ConnectedPerson", connectedPersonID);
                    personConnectedPerson.SetFieldValue("ConnectedPersonPost", entity.GetFieldValue<Guid?>("ConnectedPersonPost"));
                    dbHelper.InsertEntity(personConnectedPerson);
                }
            }
        }
    }
}

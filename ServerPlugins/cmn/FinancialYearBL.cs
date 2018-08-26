using AppFramework;
using AppFramework.AppServer;
using AppFramework.DataAccess;
using AppFramework.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using TarazNegarAppFrameworkPlugin.ServerPlugins;

namespace AppFramework.AppServer
{
    public class FinancialYearBL : EntityBL
    {
        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify))
            {
                var redundantExists = dbHelper.EntityExists("cmn.FinancialYear",
                    string.Format("YearNo = '{0}' and ID <> '{1}'",
                        entity.GetFieldValue<string>("YearNo"),
                        entity.GetFieldValue<Guid>("ID")));

                if (redundantExists)
                    throw new AfwException("این سال مالی قبلا ثبت شده است.");
            }

            if (entity.ChangeStatus == EntityChangeTypes.Modify)
            {

                if (dbHelper.GetCount("acc.AccDoc", string.Format("FinancialYear = '{0}'", entity.GetFieldValue<Guid>("ID"))) != 0)
                {
                    var oldFinancialYear = dbHelper.FetchSingleByID("cmn.FinancialYear", entity.GetFieldValue<Guid>("ID"), null);

                    if (oldFinancialYear.GetFieldValue<int?>("AccSetting_ShomareShorooeAsnadeGhatei") !=
                        entity.GetFieldValue<int?>("AccSetting_ShomareShorooeAsnadeGhatei")
                        || oldFinancialYear.GetFieldValue<int?>("AccSetting_ShomareShorooeAsnadeGhateiePishnevis") !=
                            entity.GetFieldValue<int?>("AccSetting_ShomareShorooeAsnadeGhateiePishnevis")
                        || oldFinancialYear.GetFieldValue<int?>("AccSetting_ShomareShorooeAsnadeMovaghateAsli") !=
                            entity.GetFieldValue<int?>("AccSetting_ShomareShorooeAsnadeMovaghateAsli")
                        || oldFinancialYear.GetFieldValue<int?>("AccSetting_ShomareShorooeAsnadeGhateieAsli") !=
                            entity.GetFieldValue<int?>("AccSetting_ShomareShorooeAsnadeGhateieAsli")
                        || oldFinancialYear.GetFieldValue<int?>("AccSetting_ShomareShorooeAsnadeMovaghatePishnevis") !=
                            entity.GetFieldValue<int?>("AccSetting_ShomareShorooeAsnadeMovaghatePishnevis")
                        || oldFinancialYear.GetFieldValue<bool>("AccSetting_ShomareDehieMojazaBeAsnadeGhateieAsli") !=
                            entity.GetFieldValue<bool>("AccSetting_ShomareDehieMojazaBeAsnadeGhateieAsli"))
                        throw new AfwException("بدلیل وجود سند حسابداری امکان تغییر تنظیمات سال مالی وجود ندارد.");
                }
            }
        }

        public Guid? GetUserActiveFinancialYearID()
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var userSettings = dbHelper.FetchSingle("cmn.UserSettings",
                String.Format("SystemUser = '{0}'", CoreComponent.Instance.CurrentSession.GetFieldValue<Guid>("SystemUser")), null);

            if (userSettings == null)
                return null;
            else
                return userSettings.GetFieldValue<Guid?>("ActiveFinancialYear");
        }

        public Entity GetUserActiveFinancialYearEntity()
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;
            var userActiveFinancialYearID = GetUserActiveFinancialYearID();

            if (userActiveFinancialYearID == null)
                return null;
            else
                return dbHelper.FetchSingleByID("cmn.FinancialYear", (Guid)userActiveFinancialYearID, null);
        }

        internal void CopyFinancialYearSettings(Guid sourceFinancialYearID, Guid destinationFinancialYearID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;            
            dbHelper.AdoDbHelper.ExecuteNonQuery(string.Format(@"exec cmn.DeleteAllFinantialYearSettings '{0}'", destinationFinancialYearID));
                    
            acc.Instance.CopyAccountsAndDependencies(sourceFinancialYearID, destinationFinancialYearID);
            
            var Subsystems = CoreComponent.Instance.Subsystems;

            foreach (var subsystemEntity in Subsystems)
            {
                var subsystemAbbrevateName = subsystemEntity.GetFieldValue<string>("AbbrevateName");

                if (subsystemAbbrevateName.IsIn("afw", "sacc", "acc", "spm", "clin", "cdis", "clothMan", "crm",
                    "ctr", "grn", "rqr1", "sia", "tw2", "ureg1", "ureg2", "ureg3", "settings", "rf", "sal", "tram", "es", "test"))
                    continue;

                if (subsystemAbbrevateName == "cmn")
                {
                    dbHelper.AdoDbHelper.ExecuteNonQuery(string.Format(@"exec cmn.CopyFinancialYearSettings '{0}', '{1}'", sourceFinancialYearID, destinationFinancialYearID));
                    continue;
                }
                var subsystemObject = CoreComponent.Instance.GetSubsystemObject(subsystemAbbrevateName) as ISubsystem;

                if (subsystemObject == null)
                    throw new AfwException("Subsystem class '{0}' does not implement interface ISubsystem", subsystemAbbrevateName);

                subsystemObject.CopyFinancialYearSettings(sourceFinancialYearID, destinationFinancialYearID);
            }
        }
    }
}

using AppFramework;
using AppFramework.AppServer;
using AppFramework.DataAccess;
using AppFramework.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace AppFramework.AppServer.ReceiveAndPay
{
    public class ReceivedChequeBL : EntityBL
    {
        public override void BeforeApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.BeforeApplyChanges(dbHelper, entity);

            if (entity.ChangeStatus.IsIn(EntityChangeTypes.Add, EntityChangeTypes.Modify))
            {
                if (dbHelper.EntityExists("rp.ReceivedCheque",
                    string.Format("ChequeNumber = '{0}' and ID <> '{1}'",
                        entity.GetFieldValue<string>("ChequeNumber"),
                        entity.GetFieldValue<Guid>("ID"))))
                {
                    throw new AfwException("ChequeNumberExists");
                }

                if (dbHelper.EntityExists("rp.ReceivedCheque",
                    string.Format("RadifeDaftareChek = '{0}' and ID <> '{1}'",
                        entity.GetFieldValue<string>("RadifeDaftareChek"),
                        entity.GetFieldValue<Guid>("ID"))))
                {
                    throw new AfwException("RadifeDaftareChekExists");
                }
            }

            if (entity.ChangeStatus == EntityChangeTypes.Delete)
            {
                DeleteRelatedChequeStatusChanges(entity.GetFieldValue<Guid>("ID"));
            }
        }

        public override void AfterApplyChanges(EntityDbHelper dbHelper, Entity entity)
        {
            base.AfterApplyChanges(dbHelper, entity);

            //DebugHelper.Break();
        }

        public void CreateChequeStatusChange(Entity cheque, Entity receiveReceipt)
        {
            var financialYearID = receiveReceipt.GetFieldValue<Guid?>("FinancialYear");
            if (financialYearID == null)
                throw new AfwException("سال مالی در عملیات دریافت ثبت نشده است.");

            var financialGroupID = receiveReceipt.GetFieldValue<Guid?>("FinancialGroup");
            if (financialGroupID == null)
                throw new AfwException("گروه مالی در عملیات دریافت ثبت نشده است.");

            new ReceivedChequeStatusChangeBL().CreateChequeStatusChange(
                cheque.GetFieldValue<Guid>("ID"),
                cheque.GetFieldValue<Guid>("ChequeStatus"),
                (Guid)financialYearID,
                (Guid)financialGroupID,
                null,
                null,
                null,
                receiveReceipt.GetFieldValue<DateTime>("ReceiptDate"),
                cheque.GetFieldValue<string>("Description"),
                null,
                false);
        }

        public EntityList SearchReceivedCheques(string filter)
        {
            //DebugHelper.Break();

            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var cheques = dbHelper.FetchMultipleBySqlQuery(
                string.Format(@"select * from rp_ReceivedChequesView Cheque where {0}", filter));

            return cheques;

        }

        public Entity GetChequeInfoByNumber(Guid chequeID)
        {
            //DebugHelper.Break();

            var dbHelper = CoreComponent.Instance.MainDbHelper;

            return dbHelper.FetchSingleByID("rp_ReceivedChequesView", chequeID, null);
        }

        public Entity ChangeReceivedChequesStatus(EntityList cheques, Entity statusChangeEntity)
        {
            //DebugHelper.Break();

            var resultEntity = new Entity();

            var dbHelper = CoreComponent.Instance.MainDbHelper;
            var error = "";
            var errorChequeIDs = "";
            var succeedChequeIDs = "";

            var currentStatusText = dbHelper.FetchSingle("afw.OptionSetItem", string.Format("ID = '{0}'",
                statusChangeEntity.GetFieldValue<Guid>("CurrentStatus")), null).GetFieldValue<string>("Title");
            var newStatusText = dbHelper.FetchSingle("afw.OptionSetItem", string.Format("ID = '{0}'",
                statusChangeEntity.GetFieldValue<Guid>("NewStatus")), null).GetFieldValue<string>("Title");

            foreach (Entity chequeInfo in cheques.Entities)
            {
                using (var tranManager = new DbTransactionManager(dbHelper))
                {
                    var chequeID = chequeInfo.GetFieldValue<Guid>("ID");
                    var cheque = dbHelper.FetchSingleByID("rp.ReceivedCheque", chequeID, null);

                    if (chequeInfo.GetFieldValue<DateTime?>("LastModifyTime") !=
                        cheque.GetFieldValue<DateTime?>("LastModifyTime"))
                    {
                        error += string.Format("خطا در تغییر وضعیت چک به شماره {0}: چک توسط کاربر دیگری تغییر یافته است. \r\n",
                            chequeInfo.GetFieldValue<string>("ChequeNumber"));

                        if (errorChequeIDs != "")
                            errorChequeIDs += ",";
                        errorChequeIDs += chequeID.ToString();

                        continue;
                    }

                    try
                    {
                        var chequePersianDate = DateTimeHelper.GregorianDateTimeToPersianDate(cheque.GetFieldValue<DateTime>("DueDate"));
                        var newDesc = string.Format("انتقال چک به شماره {0} مورخ {1} ",
                            cheque.GetFieldValue<string>("ChequeNumber"),
                            chequePersianDate);

                        var financialGroupID = chequeInfo.GetFieldValue<Guid?>("ReceiveReceipt_FinancialGroup");
                        if (financialGroupID == null)
                            throw new AfwException("گروه مالی در عملیات دریافت ثبت نشده است.");

                        new ReceivedChequeStatusChangeBL().CreateChequeStatusChange(chequeID,
                            statusChangeEntity.GetFieldValue<Guid>("NewStatus"),
                            statusChangeEntity.GetFieldValue<Guid>("FinancialYear"),
                            (Guid)financialGroupID,
                            statusChangeEntity.GetFieldValue<Guid?>("Person"),
                            statusChangeEntity.GetFieldValue<Guid?>("BankAccount"),
                            statusChangeEntity.GetFieldValue<Guid?>("Cash"),
                            statusChangeEntity.GetFieldValue<DateTime>("ChangeDate"),
                            newDesc,
                            statusChangeEntity.GetFieldValue<Guid?>("ChequeStatusChangeAccSetting"),
                            true);

                        tranManager.Commit();

                        if (succeedChequeIDs != "")
                            succeedChequeIDs += ",";
                        succeedChequeIDs += chequeID.ToString();
                    }
                    catch (Exception ex)
                    {
                        error += string.Format("خطا در تغییر وضعیت چک به شماره {0}: {1}\r\n",
                            chequeInfo.GetFieldValue<string>("ChequeNumber"), ex.Message);

                        if (errorChequeIDs != "")
                            errorChequeIDs += ",";
                        errorChequeIDs += chequeID.ToString();
                    }
                }
            }

            resultEntity.AddField("Error", error);
            resultEntity.AddField("SucceedChequeIDs", succeedChequeIDs);
            resultEntity.AddField("ErrorChequeIDs", errorChequeIDs);

            return resultEntity;
        }

        public void GetAccDocItemAccounts(Guid chequeID, out Guid? creditorAccount, out Guid? debtorAccount)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var receiveReceiptItem = dbHelper.FetchSingle("rp.ReceiveReceiptItem", string.Format("FinancialItem_Cheque = '{0}'", chequeID), null);
            new ReceiveReceiptItemBL().GetAccDocItemAccounts(receiveReceiptItem, out creditorAccount, out debtorAccount);
        }

        private void DeleteRelatedChequeStatusChanges(Guid receiveChequeID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var receivedChequeStatusChanges = dbHelper.FetchMultiple("rp.ReceivedChequeStatusChange",
                string.Format("Cheque = '{0}'", receiveChequeID),
                "CreationTime desc", null, null, null).Entities;
            foreach (var receivedChequeStatusChange in receivedChequeStatusChanges)
            {
                dbHelper.DeleteEntity(receivedChequeStatusChange);
            }
        }
    }
}

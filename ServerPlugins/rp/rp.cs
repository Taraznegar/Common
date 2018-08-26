using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Reflection;
using AppFramework.DataAccess;
using System.Diagnostics;
using AppFramework.Helpers;
using AppFramework.AppServer.ReceiveAndPay;
using TarazNegarAppFrameworkPlugin.ServerPlugins;

namespace AppFramework.AppServer
{
    public class rp : ISubsystem
    {
        internal Guid? DeletingChequeID = null;

        public rp()
        {
            if (CoreComponent.Instance.SubsystemObjectExists("rp"))
                throw new AfwException("'rp' subsystem component is already created.");
        }

        public static rp Instance
        {
            get
            {
                return CoreComponent.Instance.GetSubsystemObject("rp") as rp;
            }
        }

        public Entity GetPaidChequeInfo(Guid chequeID)
        {
            return new PaidChequeBL().GetChequeInfo(chequeID);
        }

        public EntityList SearchPaidCheques(string filter)
        {
            return new PaidChequeBL().SearchPaidCheques(filter);
        }

        public Entity GetReceivedChequeInfo(Guid chequeID)
        {
            return new ReceivedChequeBL().GetChequeInfoByNumber(chequeID);
        }

        public EntityList SearchReceivedCheques(string filter)
        {
            return new ReceivedChequeBL().SearchReceivedCheques(filter);
        }

        public void SaveQuickSettelmentEntity(Entity receiveReceiptEntity, Entity fileSettlementEntity, bool isWorkShift)
        {
            new ReceiveReceiptBL().SaveQuickSettelmentEntity(receiveReceiptEntity, fileSettlementEntity, isWorkShift);
        }

        public Entity ChangeReceivedChequesStatus(EntityList cheques, Entity changeStatusEntity)
        {
            return new ReceivedChequeBL().ChangeReceivedChequesStatus(cheques, changeStatusEntity);
        }

        public Entity ChangePaidChequesStatus(EntityList cheques, Entity changeStatusEntity)
        {
            return new PaidChequeBL().ChangePaidChequesStatus(cheques, changeStatusEntity);
        }

        public Entity GetReceiveReportSummaryFields(string filterExpression)
        {
            return new ReceiveReceiptBL().GetReceiveReportSummaryFields(filterExpression);
        }

        public Entity GetPayReportSummaryFields(string filterExpression)
        {
            return new PayReceiptBL().GetPayReportSummaryFields(filterExpression);
        }

        public EntityList GetReceivedReceiptOptionSetItem()
        {
            return new ReceiveReceiptBL().GetReceivedReceiptOptionSetItem();
        }

        public void FinalSaveReceiveReceipt(Entity receiveReceiptEntity)
        {
            new ReceiveReceiptBL().FinalSaveReceiveReceipt(receiveReceiptEntity);
        }

        public void UpdateReceiveReceiptAccDocItems(Guid receiveReceiptID)
        {
            new ReceiveReceiptBL().UpdateAccDocItems(receiveReceiptID);
        }

        public void UpdatePayReceiptAccDocItems(Guid receiveReceiptID)
        {
            new PayReceiptBL().UpdateAccDocItems(receiveReceiptID);
        }

        public void FinalSavePayReceipt(Entity payReceiptEntity)
        {
            new PayReceiptBL().FinalSavePayReceipt(payReceiptEntity);
        }

        public void DeleteAccDoc(Guid? accDocID, string docKindEntityFullName, string opFieldNameInItemEntity, Guid opID)
        {
            acc.Instance.DeleteAccDoc(accDocID, docKindEntityFullName, opFieldNameInItemEntity, opID);
        }

        public string GetAutomaticAccDocSetting(string docKindName)
        {
            return new SettingBL().GetAutomaticAccDocSettingName(docKindName);
        }

        public Entity TankhahAccDocGenerate(bool repeatTotal, string tankhahID, string operationType, DateTime issueDate, string description)
        {
            return new TankhahBL().TankhahAccDocGenerate(repeatTotal, tankhahID, operationType, issueDate, description);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "ReceiveReceipt")]
        public void BeforeApplyReceiveReceiptChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new ReceiveReceiptBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.AfterApplyEntityChanges, "ReceiveReceipt")]
        public void AfterApplyReceiveReceiptChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new ReceiveReceiptBL().AfterApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "ReceivedCheque")]
        public void BeforeApplyReceivedChequeChanges(EntityDbHelper dbHelper, Entity entity)
        {
            if (entity.ChangeStatus == EntityChangeTypes.Delete)
                DeletingChequeID = entity.GetFieldValue<Guid>("ID");

            new ReceivedChequeBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.AfterApplyEntityChanges, "ReceivedCheque")]
        public void AfterApplyReceivedChequeChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new ReceivedChequeBL().AfterApplyChanges(dbHelper, entity);
            DeletingChequeID = null;
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "ReceiveReceiptItem")]
        public void BeforeApplyReceiveReceiptItemChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new ReceiveReceiptItemBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.AfterApplyEntityChanges, "ReceiveReceiptItem")]
        public void AfterApplyReceiveReceiptItemChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new ReceiveReceiptItemBL().AfterApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "ReceiveTypeOpKind")]
        public void BeforeApplyReceiveTypeOpKindChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new ReceiveTypeOpKindBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "ReceivedChequeStatusChange")]
        public void BeforeApplyReceivedChequeStatusChangeChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new ReceivedChequeStatusChangeBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.AfterApplyEntityChanges, "ReceivedChequeStatusChange")]
        public void AfterApplyReceivedChequeStatusChangeChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new ReceivedChequeStatusChangeBL().AfterApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "SafteDaryafti")]
        public void BeforeApplySafteDaryaftiChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new SafteDaryaftiBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "HavaleDaryafti")]
        public void BeforeApplyHavaleDaryaftiChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new HavaleDaryaftiBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "ChekeZemanateDaryafti")]
        public void BeforeApplyChekeZemanateDaryaftiChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new ChekeZemanateDaryaftiBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "PayReceipt")]
        public void BeforeApplyPayReceiptChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new PayReceiptBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.AfterApplyEntityChanges, "PayReceipt")]
        public void AfterApplyPayReceiptChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new PayReceiptBL().AfterApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "PaidCheque")]
        public void BeforeApplyPaidChequeChanges(EntityDbHelper dbHelper, Entity entity)
        {
            if (entity.ChangeStatus == EntityChangeTypes.Delete)
                DeletingChequeID = entity.GetFieldValue<Guid>("ID");

            new PaidChequeBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.AfterApplyEntityChanges, "PaidCheque")]
        public void AfterApplyPaidChequeChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new PaidChequeBL().AfterApplyChanges(dbHelper, entity);
            DeletingChequeID = null;
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "PayReceiptItem")]
        public void BeforeApplyPayReceiptItemChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new PayReceiptItemBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.AfterApplyEntityChanges, "PayReceiptItem")]
        public void AfterApplyPayReceiptItemChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new PayReceiptItemBL().AfterApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "PayTypeOpKind")]
        public void BeforeApplyPayTypeOpKindChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new PayTypeOpKindBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "PaidChequeStatusChange")]
        public void BeforeApplyPaidChequeStatusChangeChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new PaidChequeStatusChangeBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.AfterApplyEntityChanges, "PaidChequeStatusChange")]
        public void AfterApplyPaidChequeStatusChangeChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new PaidChequeStatusChangeBL().AfterApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "HavalePardakhti")]
        public void BeforeApplyHavalePardakhtiChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new HavalePardakhtiBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "ChequeStatusChangeAccSetting")]
        public void BeforeApplyChequeStatusChangeAccSettingChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new ChequeStatusChangeAccSettingBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.AfterApplyEntityChanges, "FinancialOpKindAccSetting")]
        public void AfterApplyFinancialOpKindAccSettingChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new FinancialOpKindAccSettingBL().AfterApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "Tankhah")]
        public void BeforeApplyTankhahChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new TankhahBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "TarafHesabeTankhahAccSetting")]
        public void BeforeApplyTarafHesabeTankhahAccSettingChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new TarafHesabeTankhahAccSettingBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "TankhahGardanAccSetting")]
        public void BeforeApplyTankhahGardanAccSettingChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new TankhahGardanAccSettingBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "TankhahItem")]
        public void BeforeApplyTankhahItemChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new TankhahItemBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "QuickSettlementCashItem")]
        public void BeforeApplyQuickSettlementCashItemChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new QuickSettlementCashItemBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "QuickSettlementHavaleItem")]
        public void BeforeApplyQuickSettlementHavaleItemChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new QuickSettlementHavaleItemBL().BeforeApplyChanges(dbHelper, entity);
        }

        [ServerEvent(ServerEventTypes.BeforeApplyEntityChanges, "QuickSettlementPosItem")]
        public void BeforeApplyQuickSettlementPosItemChanges(EntityDbHelper dbHelper, Entity entity)
        {
            new QuickSettlementPosItemBL().BeforeApplyChanges(dbHelper, entity);
        }

        public void CopyFinancialYearSettings(Guid sourceFinancialYearID, Guid destinationFinancialYearID)
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;
            dbHelper.AdoDbHelper.ExecuteNonQuery(string.Format(@"exec rp.CopyFinancialYearSettings '{0}', '{1}'", sourceFinancialYearID, destinationFinancialYearID));                  
        }
    }
}

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
    public class WarningPopupBL
    {
        //پرونده های معوق: بیش از زمان مجاز مرحله، در مرحله جاری مانده اند
        //پرونده های راکد: از زمان آخرین تغییر پرونده، تعداد روز مشخصی (با توجه به تنظیمات) گذشته است
        
        public int GetUserTotalWarningItemsCount()
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var count = dbHelper.GetCount("crm_SalesCasesView",
                string.Format(@"Status = '{0}' and IsActive = 1 
                    and (IsStagnant = 1 or DaysRemainedInCurrentStage > CurrentStageAllowedDays)",
                    OptionSetHelper.GetOptionSetItemID("crm.SalesCaseStatuses", "Open")));

            return count;
        }

        public Entity GetUserWarningItemsCount()
        {
            var resultEntity = new Entity();

            var core = CoreComponent.Instance;
            var dbHelper = core.MainDbHelper;
            var openStatusID = OptionSetHelper.GetOptionSetItemID("crm.SalesCaseStatuses", "Open");

            var tedadeParvandeHayeRakedeMan = dbHelper.GetCount("crm_SalesCasesView",
                string.Format("Status = '{0}' and IsActive = 1 and IsStagnant = 1 and OwnerUser = '{1}'", 
                    openStatusID, core.GetCurrentSessionUserID()));
            resultEntity.AddField("TedadeParvandehayeRakedeMan", tedadeParvandeHayeRakedeMan);

            var tedadeKolleParvandeHayeRaked = dbHelper.GetCount("crm_SalesCasesView",
                string.Format("Status = '{0}' and IsActive = 1 and IsStagnant = 1",
                    openStatusID));
            resultEntity.AddField("TedadeParvandehayeRakedeHame", tedadeKolleParvandeHayeRaked);

            var tedadeParvandeHayeMoavagheMan = dbHelper.GetCount("crm_SalesCasesView",
                string.Format("Status = '{0}' and IsActive = 1 and DaysRemainedInCurrentStage > CurrentStageAllowedDays and OwnerUser = '{0}'", 
                    openStatusID, core.GetCurrentSessionUserID()));
            resultEntity.AddField("TedadeParvandehayeMoavagheMan", tedadeParvandeHayeMoavagheMan);

            var tedadeKolleParvandeHayeMoavagh = dbHelper.GetCount("crm_SalesCasesView",
                string.Format("Status = '{0}' and IsActive = 1 and DaysRemainedInCurrentStage > CurrentStageAllowedDays",
                    openStatusID));
            resultEntity.AddField("TedadeParvandehayeMoavagheHame", tedadeKolleParvandeHayeMoavagh);

            return resultEntity;        
        }    
    }
}

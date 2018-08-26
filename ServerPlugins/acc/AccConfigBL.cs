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
    public class AccConfigBL : EntityBL
    {
        public Entity GetAccConfig()
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            var query = @"
                select Config.*, DefaultDocPrintType.Name DocTypePrintName
                from acc_Configs Config
                    left join afw_OptionSetItems DefaultDocPrintType on DefaultDocPrintType.ID = Config.DefaultDocPrintType";
            return dbHelper.FetchSingleBySqlQuery(query);
        }
    }
}

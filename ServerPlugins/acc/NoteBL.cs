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
    public class NoteBL
    {
        public Entity GetNote(string id)
        {
            //DebugHelper.Break();

            using (var dbHelper = DbHelperFactory.CreateMainDbEntityDbHelper())
            {
                var query = string.Format(@"select ID, CreationTime, Note from acc_PreDefinedNotes
                                            where ID = '{0}'", id);
                var note = dbHelper.FetchSingleBySqlQuery(query);

                return note;
            }
        }
    }
}

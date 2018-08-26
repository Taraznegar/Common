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
    public class DocKindBL : EntityBL
    {
        private List<Entity> _DocKinds = null;

        private List<Entity> GetDocKinds()
        {
            var dbHelper = CoreComponent.Instance.MainDbHelper;

            if (_DocKinds == null)
                _DocKinds = dbHelper.FetchMultiple("acc.DocKind", null, null, null, null, null).Entities;

            return _DocKinds;
        }

        public string GetDocKindName(Guid id)
        {
            var foundDocKinds = GetDocKinds().FindAll(x => x.GetFieldValue<Guid>("ID") == id);

            if (foundDocKinds.Count == 1)
                return foundDocKinds[0].GetFieldValue<string>("Name");
            else
                throw new AfwException("Invalid DocKind ID.");
        }

        public Guid GetDocKindID(string name)
        {
            var foundDocKinds = GetDocKinds().FindAll(x => x.GetFieldValue<string>("Name") == name);

            if (foundDocKinds.Count == 1)
                return foundDocKinds[0].GetFieldValue<Guid>("ID");
            else
                throw new AfwException("Invalid DocKind Name.");
        }


    }
}

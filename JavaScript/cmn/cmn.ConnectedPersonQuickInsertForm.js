(function () {
    var FormClass = afw.Window.extend({
        GetType: function () {
            return cmn.ConnectedPersonQuickInsertForm;
        },

        init: function (options) {
            var that = this;

            afw.Window.fn.init.call(that, options);
            var formObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (formObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, formObjectData, false);

            var parentPersonDisplayName = options.ParentPersonDisplayName;
            if (ValueIsEmpty(parentPersonDisplayName)) {
                var persons = afw.DataListHelper.FetchEntityListOfDataList("cmn.Persons", null, null,
                    String.Format("ID = '{0}'", options.ParentPersonID)).Entities;
                if (persons.length != 0)
                    parentPersonDisplayName = persons[0].GetFieldValue("FullName");
            }

            that.SetTitle("" + parentPersonDisplayName + " : ثبت شخص مرتبط");

            var entity = afw.uiApi.CreateNewEntity("cmn.PersonConnectedPerson");

            entity.SetFieldValue("ParentPerson", options.ParentPersonID);
            entity.SetFieldValue("IsActive", true);
            entity.AddField("Name");
            entity.AddField("LastName");
            entity.AddField("Gender");
            entity.AddField("WorkPhoneNumber");
            entity.AddField("FaxNumber");
            entity.AddField("MobileNumber1");
            entity.AddField("MobileNumber2");
            entity.AddField("Email");

            that._BindableEntity = entity.ToBindableEntity();
            that.InitDataBinding(that._BindableEntity);

            that.FindControl("OkButton").bind("Click", function (e) { that._OkButton_Click(e); });
        },

        _OnOpening: function (sender, e) {
            var that = this;

            afw.Window.fn._OnOpening.call(that);

            that.Center();
        },

        _OnOpened: function (sender, e) {
            var that = this;

            afw.Window.fn._OnOpened.call(that);

            setTimeout(function () {
                that.FindControl("NameTextBox").Focus();
            }, 400);
        },

        _OnClosed: function () {
            var that = this;

            afw.Window.fn._OnClosed.call(that);
        },

        _OkButton_Click: function (e) {
            var that = this;

            try {
                afw.uiApi.CallServerMethodSync("cmn.SaveNewConnectedPerson", [that._BindableEntity.GetEntity()]);

                that.SetDialogResult("Ok");
                that.Close();
            }
            catch (ex) {
                afw.App.HandleError(ex);
            }
        }
    });

    //Static Members:

    FormClass.TypeName = "cmn.ConnectedPersonQuickInsertForm";
    FormClass.BaseType = afw.Window;


    cmn.ConnectedPersonQuickInsertForm = FormClass;
})();
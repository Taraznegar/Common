(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return cmn.PersonPreviewControl1;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (designObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._BindableEntity = null;
            that._MainInfoPanel = that.FindControl("MainInfoPanel");

            that._PersonPhoneNumbersGridView = new afw.GridView({
                ParentControl: that.FindControl("PersonPhoneNumbersPanel"),
                Name: "PersonPhoneNumbersGridView",
                FillParent: true,
                Columns: [
                    {
                        title: "شماره",
                        field: "PhoneNumber",
                        rightToLeft: true,
                        width: 200
                    },
                    {
                        title: "توضیحات",
                        field: "Description",
                        rightToLeft: true
                    }
                ],

                SelectionMode: "SingleRow"
            });

            that._ConnectedPersonsGridView = new afw.GridView({
                ParentControl: that.FindControl("ConnectedPersonsPanel"),
                Name: "ConnectedPersonsGridView",
                FillParent: true,
                Columns: [
                    {
                        title: "ID",
                        field: "ID",
                        rightToLeft: true,
                        visible: false,
                    },
                    {
                        title: "نام",
                        field: "DisplayName",
                        rightToLeft: true,
                        width: 200,
                    },
                    {
                        title: "سمت",
                        field: "Post_Text",
                        rightToLeft: true,
                        width: 200
                    },
                    {
                        title: "واحد سازمانی",
                        field: "OrganizationUnit_Text",
                        rightToLeft: true,
                        width: 200
                    },
                    {
                        title: "عنوان سازمانی",
                        field: "OnvaneSazemani",
                        rightToLeft: true,
                        width: 200
                    },
                    {
                        title: "ایمیل",
                        field: "Email",
                        rightToLeft: true,
                        width: 200
                    }
                ],

                SelectionMode: "SingleRow"
            });

            that._ConnectedPersonsGridView.bind("SelectedRowsChanged", function (e) { that._ConnectedPersonsGridView_SelectedRowsChanged(e); });


            that._ConnectedPersonPhoneNumbersGridView = new afw.GridView({
                ParentControl: that.FindControl("ConnectedPersonPhoneNumbersPanel"),
                Name: "ConnectedPersonPhoneNumbersGridView",
                FillParent: true,
                Columns: [
                    {
                        title: "نوع",
                        field: "PhoneType",
                        rightToLeft: true,
                        width: 200,
                    },
                    {
                        title: "شماره",
                        field: "PhoneNumber",
                        rightToLeft: true,
                        width: 200
                    },
                    {
                        title: "توضیحات",
                        field: "Description",
                        rightToLeft: true
                    }
                ],

                SelectionMode: "SingleRow"
            });
        },

        SetPersonInfo: function (personInfoEntity) {
            var that = this;

            that._BindableEntity = personInfoEntity.ToBindableEntity();
            that._MainInfoPanel.InitDataBinding(that._BindableEntity);

            //that._HideConnectedPersonPhoneNumbers();

            that._PersonPhoneNumbersGridView.GetDataSource().data(
                personInfoEntity.GetFieldValue("PhoneNumbers").ToDataSourceData());

            var connectedPersonsData = personInfoEntity.GetFieldValue("ConnectedPersons").ToDataSourceData();
            connectedPersonsData = $.grep(connectedPersonsData,
                function (o) { return o.IsActive == true; });

            that._ConnectedPersonsGridView.GetDataSource().data(connectedPersonsData);
        },

        _ConnectedPersonsGridView_SelectedRowsChanged: function (e) {
            var that = this;

            if (e.SelectedRows.length != 0)
                that._ShowConnectedPersonPhoneNumbers();
            else
                that._HideConnectedPersonPhoneNumbers();
        },

        _ShowConnectedPersonPhoneNumbers: function () {
            var that = this;

            //that.FindControl("ConnectedPersonPhoneNumbersWrapperDockPanel").SetVisible(true);

            var selectedConnectedPerson = that._ConnectedPersonsGridView.GetSelectedRows()[0].DataItem.GetEntity();

            that._ConnectedPersonPhoneNumbersGridView.GetDataSource().data(
                selectedConnectedPerson.GetFieldValue("PhoneNumbers").ToDataSourceData());
        },

        _HideConnectedPersonPhoneNumbers: function () {
            var that = this;

            //that.FindControl("ConnectedPersonPhoneNumbersWrapperDockPanel").SetVisible(false);
            that._ConnectedPersonPhoneNumbersGridView.GetDataSource().data([]);
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "cmn.PersonPreviewControl1";
    FormClass.BaseType = afw.BasePanel;


    cmn.PersonPreviewControl1 = FormClass;
})();
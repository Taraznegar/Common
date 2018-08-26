(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return cmn.PersonPreviewControl2;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (designObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._BindableEntity = null;
            that._MainInfoPanel = that.FindControl("MainInfoPanel");

            that.FindControl("TitleLabel").SetText("");

            that._ConnectedPersonsGridView = new afw.GridView({
                ParentControl: that.FindControl("ConnectedPersonsPanel"),
                Name: "PersonsGridView",
                FillParent: true,
                Columns: [
                    {
                        title: "نام",
                        field: "DisplayName",
                        rightToLeft: true,
                        width: 200,
                    },
                    {
                        title: "جنسیت",
                        field: "Gender_Text",
                        rightToLeft: true,
                        width: 70,
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
                        width: 150,
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

            that.FindControl("MainTabControl").SelectTabByIndex(1);

            that._PersonNameSearchTextBox = that.FindControl("PersonNameSearchTextBox");
            that._DisplayInnactivePersonsCheckBox = that.FindControl("DisplayInnactivePersonsCheckBox");

            that._PersonNameSearchTextBox.bind("TextChanged", function (e) { that._RefreshConnectedPersonsGrid(); });
            that._DisplayInnactivePersonsCheckBox.bind("CheckedChanged", function (e) { that._RefreshConnectedPersonsGrid(); })
        },

        SetPersonInfo: function (personInfoEntity) {
            var that = this;

            that._BindableEntity = personInfoEntity.ToBindableEntity();
            that._MainInfoPanel.InitDataBinding(that._BindableEntity);

            that.FindControl("TitleLabel").SetText(personInfoEntity.GetFieldValue("DisplayName"));
            that.FindControl("StatePreNumberLabel").SetText(personInfoEntity.GetFieldValue("State_PreNumber"));
            that._PersonNameSearchTextBox.SetText(null);

            //that._HideConnectedPersonPhoneNumbers();

            that._RefreshConnectedPersonsGrid();
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

        _RefreshConnectedPersonsGrid: function () {
            var that = this;

            that._HideConnectedPersonPhoneNumbers();

            var personInfoEntity = that._BindableEntity.GetEntity();

            var personNameSearchText = that._PersonNameSearchTextBox.GetText().trim();
            if (ValueIsEmpty(personNameSearchText))
                personNameSearchText = "";

            var displayInnactives = that._DisplayInnactivePersonsCheckBox.GetValue();

            var connectedPersonsData = personInfoEntity.GetFieldValue("ConnectedPersons").ToDataSourceData();
            connectedPersonsData = $.grep(connectedPersonsData,
                function (o) {
                    return o.DisplayName.Contains(personNameSearchText)
                        && (displayInnactives || o.IsActive == true);
                });

            that._ConnectedPersonsGridView.GetDataSource().data(connectedPersonsData);
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "cmn.PersonPreviewControl2";
    FormClass.BaseType = afw.BasePanel;


    cmn.PersonPreviewControl2 = FormClass;
})();
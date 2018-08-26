(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return cmn.PersonConnectedPersonEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._ConnectedPersonAutoComplete = that.FindControl("ConnectedPersonFieldControl").FindControl("InnerControl").GetAutoComplete();
            that._NewConnectedPersonButton = that.FindControl("NewConnectedPersonButton");

            that._ConnectedPersonAutoComplete.bind("TextChanged", function (e) { that._ConnectedPersonAutoComplete_TextChanged(e); });
            that._ConnectedPersonAutoComplete.bind("ValueChanged", function (e) { that._ConnectedPersonAutoComplete_ValueChanged(e); });
            that._ConnectedPersonAutoComplete.bind("KeyPressed", function (e) { that._ConnectedPersonAutoComplete_KeyPressed(e); });
            that._NewConnectedPersonButton.SetVisible(false);
            that._NewConnectedPersonButton.bind("Click", function (e) { that._NewConnectedPersonButton_Click(e); });

            that._Toolbar.RemoveButton("Save");
        },

        _OnOpened: function (sender, e) {
            var that = this;

            afw.Window.fn._OnOpened.call(that);
        },

        _OnClosed: function () {
            var that = this;

            afw.Window.fn._OnClosed.call(that);
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            afw.EntityWindowBase.fn._OnToolbarButtonClicked.call(that, buttonKey);
        },

        _AdjustForm: function () {
            var that = this;

            afw.EntityWindowBase.fn._AdjustForm.call(that);
        },

        _ValidateForm: function () {
            var that = this;

            if (!afw.EntityWindowBase.fn._ValidateForm.call(that))
                return false;

            return true;
        },

        _Save: function () {
            var that = this;

            var saved = afw.EntityWindowBase.fn._Save.call(that);

            return saved;
        },

        _ConnectedPersonAutoComplete_TextChanged: function (e) {
            var that = this;

            var autoComplete = e.Sender;

            setTimeout(function () {
                if (autoComplete.GetText().length > 1 && autoComplete.GetValue() == null)
                    that._NewConnectedPersonButton.SetVisible(true);
                else
                    that._NewConnectedPersonButton.SetVisible(false);
            }, 500);
        },

        _ConnectedPersonAutoComplete_ValueChanged: function (e) {
            var that = this;

            var autoComplete = e.Sender;

            if (autoComplete.GetValue() != null)
                that._NewConnectedPersonButton.SetVisible(false);
        },

        _ConnectedPersonAutoComplete_KeyPressed: function (e) {
            var that = this;

            if (e.Key == "Enter")
                that._NewConnectedPerson();
        },

        _NewConnectedPersonButton_Click: function (e) {
            var that = this;

            that._NewConnectedPerson();
        },

        _NewConnectedPerson: function () {
            var that = this;

            var connectedPersonEntity = afw.uiApi.CreateNewEntity("cmn.Person");

            var connectedPersonWindow = null;

            if (cmn.OpenWindowExists())
                connectedPersonWindow = afw.EntityHelper.OpenEntityFormInWindow(connectedPersonEntity, "cmn.PersonEditForm", "New", 
                    {RoleName: "ConnectedPerson",
                    PersonType: afw.OptionSetHelper.GetOptionSetItemID("cmn.PersonTypes.Haghighi"),
                    PersonLastName: that._ConnectedPersonAutoComplete.GetText(),
                    Title: "شخص مرتبط جدید"
                    });
            else
                connectedPersonWindow = afw.EntityHelper.OpenEntityFormInMdiContainer(connectedPersonEntity, "cmn.PersonEditForm", "New", 
                    {RoleName: "ConnectedPerson",
                    PersonType: afw.OptionSetHelper.GetOptionSetItemID("cmn.PersonTypes.Haghighi"),
                    PersonLastName: that._ConnectedPersonAutoComplete.GetText(),
                    Title: "شخص مرتبط جدید"
                    });
          
            connectedPersonWindow.bind("Close", function (e) {
                if (e.Sender._DialogResult == "Ok") {
                    that._BindableEntity.set("ConnectedPerson", connectedPersonEntity.GetFieldValue("ID"));
                    that._NewConnectedPersonButton.SetVisible(false);
                }
            });
        }
    });

    //Static Members:

    FormClass.TypeName = "cmn.PersonConnectedPersonEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    cmn.PersonConnectedPersonEditForm = FormClass;
})();
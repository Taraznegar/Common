(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return crm.LeadDisqualifyInfoEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            var toolbar = that.FindControl("Toolbar");
            toolbar.RemoveButton("Save");
        },

        GetBindableEntity: function () {
            var that = this;

            return that._BindableEntity;
        },

        _OnOpened: function (sender, e) {
            var that = this;

            afw.Window.fn._OnOpened.call(that);

            that.Center();
        },

        _OnClosed: function () {
            var that = this;

            afw.Window.fn._OnClosed.call(that);
            
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            if (buttonKey == "SaveAndClose" && that._FormMode == "New") {
                if (that._ValidateForm()) {
                    try
                    {
                        afw.uiApi.CallServerMethodSync("crm.DisqualifyLead", [that._BindableEntity.GetEntity()]);
                        that.SetDialogResult("Ok");
                        that.Close();
                    }
                    catch (ex) {
                        afw.ErrorDialog.Show(ex);
                    }
                }

                return;
            }

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
        }
    });

    //Static Members:

    FormClass.TypeName = "crm.LeadDisqualifyInfoEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    crm.LeadDisqualifyInfoEditForm = FormClass;
})();
(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return crm.SalesCaseNoteEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);
             
            that._salesCaseNoteID = that._BindableEntity._Entity.FieldValues.ID;

            that._creationTimeControl = that.FindControl("CreationTimeFieldControl");
            that._creationTimeControl.SetReadOnly(true);

            if(that._FormMode == "New")
            {
                that._creationTimeControl.SetVisible(false);
            }

            var toolbar = that.FindControl("Toolbar");
            toolbar.RemoveButton("Save");
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
        }
    });

    //Static Members:

    FormClass.TypeName = "crm.SalesCaseNoteEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    crm.SalesCaseNoteEditForm = FormClass;
})();
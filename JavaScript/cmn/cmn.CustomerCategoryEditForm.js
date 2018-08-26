(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return cmn.CustomerCategoryEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._ParentFieldControl = that.FindControl("ParentFieldControl");
           // that._ParentLabel = that.FindControl("ParentLabel");
            
            if (that._FormMode == "New" && that._BindableEntity.GetEntity().GetFieldValue("LevelNumber") == 1) {
                that._ParentFieldControl.SetVisible(false);
                //that._ParentLabel.SetVisible(false);
            }
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
        }
    });

    //Static Members:

    FormClass.TypeName = "cmn.CustomerCategoryEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    cmn.CustomerCategoryEditForm = FormClass;
})();
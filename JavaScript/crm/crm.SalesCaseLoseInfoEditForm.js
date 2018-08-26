(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return crm.SalesCaseLoseInfoEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);
             
            var toolbar = that.FindControl("Toolbar");
            toolbar.RemoveButton("Save");
             
        },
        
        _OnOpening: function (sender, e) {
            var that = this;

            afw.Window.fn._OnOpening.call(that);

            that.SetSize(500, 300);
            that.Center();
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

    FormClass.TypeName = "crm.SalesCaseLoseInfoEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    crm.SalesCaseLoseInfoEditForm = FormClass;
})();
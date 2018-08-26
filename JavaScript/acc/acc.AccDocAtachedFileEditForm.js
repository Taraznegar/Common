(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return acc.AccDocAtachedFileEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            if ("AccDocID" in options)
                that._AccDocID = options.AccDocID;
            else
                that._AccDocID = null;

            if (that._FormMode == "New" && that._AccDocID != null)
                that._BindableEntity._Entity.SetFieldValue("AccDoc", that._AccDocID);
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

    FormClass.TypeName = "acc.AccDocAtachedFileEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    acc.AccDocAtachedFileEditForm = FormClass;
})();
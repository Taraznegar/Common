(function () {
    var objectEvents = afw.EntityWindowBase.Events.concat([]);

    var FormClass = afw.EntityWindowBase.extend({
        events: objectEvents,

        GetType: function () {
            return cmn.CustomTextFieldInfoEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._FieldNumberTextBox = that.FindControl("FieldNumberTextBox");
            that._TitleTextBox = that.FindControl("TitleTextBox");

            that._FieldNumberTextBox.InitDataBinding(that._BindableEntity);
            that._TitleTextBox.InitDataBinding(that._BindableEntity);

            that._FieldNumberTextBox.SetReadOnly(true);
            that._TitleTextBox.Focus();
            that._TitleTextBox.BindEvent("KeyPressed", function (e) {
                if (e.Key == "Enter")
                    that._Save();
            });
        },

        _OnOpening: function () {
            var that = this;

            afw.EntityWindowBase.fn._OnOpening.call(that);
        },

        _OnOpened: function () {
            var that = this;

            afw.EntityWindowBase.fn._OnOpened.call(that);
        },

        _OnClosed: function () {
            var that = this;

            afw.EntityWindowBase.fn._OnClosed.call(that);
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

        _OnPreviewKeyUp: function (e) {
            var that = this;

            if (e.Key == "Enter")
                that._Save();
            else
                afw.EntityWindowBase.fn._OnPreviewKeyUp.call(that, e);
        },

        _DoDestroy: function () {
            var that = this;

            afw.EntityWindowBase.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "cmn.CustomTextFieldInfoEditForm";
    FormClass.BaseType = afw.EntityWindowBase;
    FormClass.Events = objectEvents;

    cmn.CustomTextFieldInfoEditForm = FormClass;
})();
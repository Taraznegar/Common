(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return cmn.StuffLabelEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._LabelNoFieldControl = that.FindControl("LabelNoFieldControl");

            if (that._FormMode == "New") {  
                var lastLabelNo = afw.uiApi.CallServerMethodSync("cmn.GetFieldMaxIntValue", ["LabelNo", "cmn_StuffLabels", null]);
                that._LabelNoFieldControl.SetValue(lastLabelNo + 1);
            }
            else {

            }

            that._LabelNoFieldControl.SetReadOnly(true);
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

    FormClass.TypeName = "cmn.StuffLabelEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    cmn.StuffLabelEditForm = FormClass;
})();
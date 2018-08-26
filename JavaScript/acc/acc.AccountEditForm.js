(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return acc.AccountEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            var parent = that._BindableEntity.get("ParentAccount");
            var financialyearID = that._BindableEntity.get("FinancialYear");

            if ("Level_Text" in options)
                that._LevelText = options.Level_Text;
            else
                that._LevelText = null;

            if ("Parent_Text" in options)
                that._ParentText = options.Parent_Text;
            else
                that._ParentText = null;

            that._LevelLabel = that.FindControl("LevelLabel");
            that._ParentLabel = that.FindControl("ParentLabel");
            that._CodeFieldControl = that.FindControl("CodeFieldControl");
            that._AccountGroupFieldControl = that.FindControl("AccountGroupFieldControl");
            that._AccountNatureFieldControl = that.FindControl("AccountNatureFieldControl");

            that._LevelLabel.SetText(that._LevelText);
            that._ParentLabel.SetText(that._ParentText);

            if (that._FormMode == "New") {
                var lastAccountCode = afw.uiApi.CallServerMethodSync("acc.GetAccountCodeMaxIntValue", ["acc_Accounts", parent, financialyearID]);
                that._CodeFieldControl.SetValue(lastAccountCode + 1);
            }

            if (parent == null)
                that._AccountGroupFieldControl.SetReadOnly(true);
            else {
                that._AccountGroupFieldControl.SetVisible(false);
                that._AccountNatureFieldControl.SetVisible(false);
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

    FormClass.TypeName = "acc.AccountEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    acc.AccountEditForm = FormClass;
})();
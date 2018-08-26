(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return cmn.FinancialYearEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);
            
            that._YearNoFieldControl = that.FindControl("YearNoFieldControl");

            that._AccSetting_ShomareDehieMojazaBeAsnadeGhateieAsliFieldControl =
                that.FindControl("AccSetting_ShomareDehieMojazaBeAsnadeGhateieAsliFieldControl");
            that._AccSetting_ShomareShorooeAsnadeGhateiFieldControl =
                that.FindControl("AccSetting_ShomareShorooeAsnadeGhateiFieldControl");
            that._AccSetting_ShomareShorooeAsnadeGhateieAsliFieldControl =
                that.FindControl("AccSetting_ShomareShorooeAsnadeGhateieAsliFieldControl");
            that._AccSetting_ShomareShorooeAsnadeGhateiePishnevisFieldControl =
                that.FindControl("AccSetting_ShomareShorooeAsnadeGhateiePishnevisFieldControl");

            that._AccSetting_ShomareDehieMojazaBeAsnadeGhateieAsliFieldControl.bind("ValueChanged",
                function (e) { that._AccSetting_ShomareDehieMojazaBeAsnadeGhateieAsliFieldControl_ValueChanged(e); });

            that._AccSetting_ShomareDehieMojazaBeAsnadeGhateieAsliFieldControl.SetReadOnly(true);//این حالت موقتا غیرفعال شد. زیرا منطق آن در کدها در نظر گرفته نشده

            if (that._FormMode == "New")
                that._AccSetting_ShomareDehieMojazaBeAsnadeGhateieAsliFieldControl.SetValue(true);

            that._AdjustForm();
        },

        _ShomareDehieMojazaBeAsnadeGhateieAsliVaPishnevisFieldControl_ValueChanged: function (e) {
            var that = this;

            if (that._AccSetting_ShomareDehieMojazaBeAsnadeGhateieAsliFieldControl.GetValue() == true) {
                that._AccSetting_ShomareShorooeAsnadeGhateiFieldControl.SetVisible(false);
            }
            else {
                that._AccSetting_ShomareShorooeAsnadeGhateieAsliFieldControl.SetValue(null);
                that._AccSetting_ShomareShorooeAsnadeGhateiePishnevisFieldControl.SetValue(null);
            }

            that._AdjustForm();
        },

        _OnOpening: function () {
            var that = this;

            afw.Window.fn._OnOpening.call(that);

            that.Center();
        },

        _OnOpened: function (sender, e) {
            var that = this;

            afw.Window.fn._OnOpened.call(that);
        },

        _OnClosed: function () {
            var that = this;

            afw.Window.fn._OnClosed.call(that);
        },
        
        _CreateToolbar: function () {
            var that = this;

            afw.EntityWindowBase.fn._CreateToolbar.call(that);

            that._Toolbar = that.FindControl("ToolBar");

            if (that._FormMode != "New") {
                that._Toolbar.AddButton("CopyFinancialYearSettings", "کپی تنظیمات حسابداری از سال مالی دیگر ...",
                  { BackgroundColor: "#4b8df9", TextColor: "#ffffff" });
            }
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            if (buttonKey == "CopyFinancialYearSettings")
                that._OpenWarningDialog();

            afw.EntityWindowBase.fn._OnToolbarButtonClicked.call(that, buttonKey);
        },

        _OpenWarningDialog: function () {
            var that = this;

            var confirmDialog = afw.ConfirmDialog.Show(String.Format("در صورت وجود تنظیمات حسابداری در سال مالی {0} آن تنظیمات حذف خواهند شد.\r\nآیا ادامه میدهید؟" ,
                that._YearNoFieldControl.GetValue()));

            confirmDialog.bind("Opened", function (e) {
                e.Sender.FindControl("Button2").Focus(); //focus on no
            });

            confirmDialog.bind("Closed", function (e) {
                if (confirmDialog.GetDialogResult() == "No")
                    return;

                that._OpenGetFinancialYearPopupForm();
            })
        },

        _OpenGetFinancialYearPopupForm: function () {
            var that = this;

            that._GetFinancialYearPopupForm = afw.uiApi.OpenSavedFormWindow("cmn.GetFinancialYearPopupForm", {
                Name: "GetFinancialYearPopupForm",
                Modal: true
            });

            that._GetFinancialYearPopupForm.Center();

            that._GetFinancialYearPopupForm.FindControl("FinancialYearLookup")
                .SetBaseFilterExpression(String.Format("ID <> '{0}'", that._BindableEntity.get("ID")));
            that._GetFinancialYearPopupForm.FindControl("FinancialYearLookup").BindEvent("ValueChanged",
                function (e) {
                    that._SourceFinancialYearLookup_ValueChanged(e);
                })

            setTimeout(function () { that._GetFinancialYearPopupForm.FindControl("FinancialYearLookup").Focus(); }, 1000);
        },

        _SourceFinancialYearLookup_ValueChanged: function(e){
            var that = this;

            if(!ValueIsEmpty(e.Sender.GetValue()))            
                that._CopyFinancialYearSettings(e.Sender.GetValue());            
        },

        _CopyFinancialYearSettings: function (sourceFinantialYearID) {
            var that = this;

            afw.uiApi.ShowProgress(that._GetFinancialYearPopupForm);
            afw.uiApi.CallServerMethodAsync("cmn.CopyFinancialYearSettings", [sourceFinantialYearID, that._BindableEntity.get("ID")],
                function (result) {
                    if (that._IsDestroying)
                        return;

                    afw.uiApi.HideProgress(that._GetFinancialYearPopupForm);
                    that._GetFinancialYearPopupForm.Close();

                    if (result.HasError)
                        afw.ErrorDialog.Show(result.ErrorMessage);
                    else {
                        afw.MessageDialog.Show(String.Format("تمامی تنظیمات حسابداری از سال مالی {0} در سال مالی {1} کپی شد.",
                             cmn.GetFinantialYearNo(sourceFinantialYearID), that._YearNoFieldControl.GetValue()));
                        that.Close();
                    }
                });
        },

        _AdjustForm: function () {
            var that = this;

            afw.EntityWindowBase.fn._AdjustForm.call(that);

            if (that._AccSetting_ShomareDehieMojazaBeAsnadeGhateieAsliFieldControl.GetValue() == true) {
                that._AccSetting_ShomareShorooeAsnadeGhateiFieldControl.SetVisible(false);
                that._AccSetting_ShomareShorooeAsnadeGhateieAsliFieldControl.SetVisible(true);
                that._AccSetting_ShomareShorooeAsnadeGhateiePishnevisFieldControl.SetVisible(true);
            }
            else {
                that._AccSetting_ShomareShorooeAsnadeGhateieAsliFieldControl.SetVisible(false);
                that._AccSetting_ShomareShorooeAsnadeGhateiePishnevisFieldControl.SetVisible(false);
                that._AccSetting_ShomareShorooeAsnadeGhateiFieldControl.SetVisible(true);
            }
        },

        _ValidateForm: function () {
            var that = this;

            if (!afw.EntityWindowBase.fn._ValidateForm.call(that))
                return false;

            return true;
        },

        _Save: function () {
            var that = this;

            var saved = false;
            if (that._YearNoFieldControl.GetValue().length == 4)
                saved = afw.EntityWindowBase.fn._Save.call(that);
            else
                afw.MessageDialog.Show("فیلد سال مالی کامل وارد نشده است.");

            if (saved == true && !that._Toolbar.ButtonExists("CopyFinancialYearSettings"))
                that._Toolbar.AddButton("CopyFinancialYearSettings", "کپی تنظیمات حسابداری از سال مالی دیگر ...",
                  { BackgroundColor: "#4b8df9", TextColor: "#ffffff" });

            return saved;
        }
    });

    //Static Members:

    FormClass.TypeName = "cmn.FinancialYearEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    cmn.FinancialYearEditForm = FormClass;
})();
(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return crm.LeadEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._NotSetID = afw.OptionSetHelper.GetOptionSetItemID("crm.LeadQualificationStatus.NotSet");
            that._DisqualifiedID = afw.OptionSetHelper.GetOptionSetItemID("crm.LeadQualificationStatus.Disqualified");
            that._QualifiedID = afw.OptionSetHelper.GetOptionSetItemID("crm.LeadQualificationStatus.Qualified");
            if (options.FormMode == "New")
                that._BindableEntity._Entity.SetFieldValue("QualificationStatus", that._NotSetID);
            else
                that._QualifictionStatus = that._BindableEntity._Entity.GetFieldValue("QualificationStatus");

            that._SalesCaseRequestTypeFieldControl = that.FindControl("SalesCaseRequestTypeFieldControl");
            that._CustomerTypeFieldControl = that.FindControl("CustomerTypeFieldControl");

            
            var toolbar = that.FindControl("Toolbar");
            toolbar.AddButton("Qualify", "تایید و ایجاد پرونده فروش", { Image: "resource(crm.LeadQualifyButtonIcon)" });
            toolbar.AddButton("Disqualify", "رد سرنخ تجاری", { Image: "resource(crm.LeadDisqualifyButtonIcon)" });

            that.FindControl("QualificationStatusFieldControl").SetReadOnly(true);

            cmn.InitFormForWorkflow(that, "Lead");
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

            try {
                if (buttonKey == "Qualify") {
                    that._Save();
                    crm.QualifyLead(that._BindableEntity.GetEntity());
                    that.SetDialogResult("Ok");
                    that.Close();
                }
                if (buttonKey == "Disqualify") {
                    that._Save();

                    crm.DisqualifyLead(that._BindableEntity.GetEntity(),
                        function (succeed) {
                            if (succeed) {
                                that.SetDialogResult("Ok");
                                that.Close();
                            }
                        });
                }
            }
            catch (ex) {
                afw.App.HandleError(ex);
                return false;
            }
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

    FormClass.TypeName = "crm.LeadEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    crm.LeadEditForm = FormClass;
})();
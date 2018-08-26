(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return cmn.FinancialGroupEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._UserActiveFinancialYearID = cmn.GetUserActiveFinancialYearID();

            that._FinancialYearFieldControl = that.FindControl("FinancialYearFieldControl").FindControl("InnerControl");
            that._OrganizationUnitFieldControl = that.FindControl("OrganizationUnitFieldControl").FindControl("InnerControl");
            that._FinancialDocTypeFieldControl = that.FindControl("FinancialDocTypeFieldControl").FindControl("InnerControl");

            that._ShabloneSanad_HesabeMaliatBarArzeshAfzoode_ForooshLookupControl =
                that.FindControl("ShabloneSanad_HesabeMaliatBarArzeshAfzoode_ForooshFieldControl").FindControl("InnerControl");
            that._ShabloneSanad_HesabeAvarezBarArzeshAfzoode_ForooshLookupControl =
                that.FindControl("ShabloneSanad_HesabeAvarezBarArzeshAfzoode_ForooshFieldControl").FindControl("InnerControl");
            that._ShabloneSanad_HesabeTakhfifat_ForooshLookupControl =
                that.FindControl("ShabloneSanad_HesabeTakhfifat_ForooshFieldControl").FindControl("InnerControl");
            that._ShabloneSanad_HesabeForooshLookupControl =
                that.FindControl("ShabloneSanad_HesabeForooshFieldControl").FindControl("InnerControl");
            that._ShabloneSanad_HesabeForoosheAmaniLookupControl =
                that.FindControl("ShabloneSanad_HesabeForoosheAmaniFieldControl").FindControl("InnerControl");
            that._ShabloneSanad_HesabeBargashtAzForooshLookupControl =
                that.FindControl("ShabloneSanad_HesabeBargashtAzForooshFieldControl").FindControl("InnerControl");
            that._ShabloneSanad_HesabeBargashtAzForoosheAmaniLookupControl =
                that.FindControl("ShabloneSanad_HesabeBargashtAzForoosheAmaniFieldControl").FindControl("InnerControl");
            that._ShabloneSanad_HesabeMoshtarianLookupControl =
                that.FindControl("ShabloneSanad_HesabeMoshtarianFieldControl").FindControl("InnerControl");
            that._ShabloneSanad_HesabeMoshtarianAmaniLookupControl =
                that.FindControl("ShabloneSanad_HesabeMoshtarianAmaniFieldControl").FindControl("InnerControl");

            that._ShabloneSanad_HesabeMaliatBarArzeshAfzoode_KharidLookupControl =
                that.FindControl("ShabloneSanad_HesabeMaliatBarArzeshAfzoode_KharidFieldControl").FindControl("InnerControl");
            that._ShabloneSanad_HesabeAvarezBarArzeshAfzoode_KharidLookupControl =
                that.FindControl("ShabloneSanad_HesabeAvarezBarArzeshAfzoode_KharidFieldControl").FindControl("InnerControl");
            that._ShabloneSanad_HesabeTakhfifat_KharidLookupControl =
                that.FindControl("ShabloneSanad_HesabeTakhfifat_KharidFieldControl").FindControl("InnerControl");
            that._ShabloneSanad_HesabeKharidLookupControl =
                that.FindControl("ShabloneSanad_HesabeKharidFieldControl").FindControl("InnerControl");
            that._ShabloneSanad_HesabeTaminKonandeganLookupControl =
                that.FindControl("ShabloneSanad_HesabeTaminKonandeganFieldControl").FindControl("InnerControl");
            that._ShabloneSanad_HesabeBargashtAzKharidLookupControl =
                that.FindControl("ShabloneSanad_HesabeBargashtAzKharidFieldControl").FindControl("InnerControl");

            that._OrganizationUnitDropDownList = that._OrganizationUnitFieldControl.GetDropDownList();
            that._FinancialDocTypeDropDownList = that._FinancialDocTypeFieldControl.FindControl("InnerControl_DropDownList");

            that._FinancialYearFieldControl.SetShowRequiredStar(true);
            that._OrganizationUnitFieldControl.SetShowRequiredStar(true);

            that._TitleFieldControl = that.FindControl("TitleFieldControl");
            that._TitleFieldControl.SetReadOnly(true);

            that._TabControl = that.FindControl("TabControl1");
            that._TabControl.SelectTabByIndex(0);

            that._FinancialYearFieldControl.bind("ValueChanged", function (e) { that._FinancialYearFieldControl_ValueChanged(); });

            that._OrganizationUnitFieldControl.bind("ValueChanged", function (e) { that._OrganizationUnitAndFinancialDocTypeFieldControl_ValueChanged(); });
            that._FinancialDocTypeFieldControl.bind("ValueChanged", function (e) { that._OrganizationUnitAndFinancialDocTypeFieldControl_ValueChanged(); });

            // Sales tab
            that._ShabloneSanad_HesabeMaliatBarArzeshAfzoode_ForooshLookupControl.bind("OpeningLookup", function (e) { that._AccountsLookup_OpeningLookup(e); });
            that._ShabloneSanad_HesabeAvarezBarArzeshAfzoode_ForooshLookupControl.bind("OpeningLookup", function (e) { that._AccountsLookup_OpeningLookup(e); });
            that._ShabloneSanad_HesabeTakhfifat_ForooshLookupControl.bind("OpeningLookup", function (e) { that._AccountsLookup_OpeningLookup(e); });
            that._ShabloneSanad_HesabeForooshLookupControl.bind("OpeningLookup", function (e) { that._AccountsLookup_OpeningLookup(e); });
            that._ShabloneSanad_HesabeForoosheAmaniLookupControl.bind("OpeningLookup", function (e) { that._AccountsLookup_OpeningLookup(e); });
            that._ShabloneSanad_HesabeBargashtAzForooshLookupControl.bind("OpeningLookup", function (e) { that._AccountsLookup_OpeningLookup(e); });
            that._ShabloneSanad_HesabeBargashtAzForoosheAmaniLookupControl.bind("OpeningLookup", function (e) { that._AccountsLookup_OpeningLookup(e); });
            that._ShabloneSanad_HesabeMoshtarianLookupControl.bind("OpeningLookup", function (e) { that._AccountsLookup_OpeningLookup(e); });
            that._ShabloneSanad_HesabeMoshtarianAmaniLookupControl.bind("OpeningLookup", function (e) { that._AccountsLookup_OpeningLookup(e); });

            //Buy tab
            that._ShabloneSanad_HesabeMaliatBarArzeshAfzoode_KharidLookupControl.bind("OpeningLookup", function (e) { that._AccountsLookup_OpeningLookup(e); });
            that._ShabloneSanad_HesabeAvarezBarArzeshAfzoode_KharidLookupControl.bind("OpeningLookup", function (e) { that._AccountsLookup_OpeningLookup(e); });
            that._ShabloneSanad_HesabeTakhfifat_KharidLookupControl.bind("OpeningLookup", function (e) { that._AccountsLookup_OpeningLookup(e); });
            that._ShabloneSanad_HesabeKharidLookupControl.bind("OpeningLookup", function (e) { that._AccountsLookup_OpeningLookup(e); });
            that._ShabloneSanad_HesabeTaminKonandeganLookupControl.bind("OpeningLookup", function (e) { that._AccountsLookup_OpeningLookup(e); });
            that._ShabloneSanad_HesabeBargashtAzKharidLookupControl.bind("OpeningLookup", function (e) { that._AccountsLookup_OpeningLookup(e); });

            if (that._FormMode == "New")
                that._FinancialYearFieldControl.SetValue(that._UserActiveFinancialYearID);
            else {
                that._ShabloneSanad_HesabeMaliatBarArzeshAfzoode_ForooshLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._BindableEntity.get("FinancialYear")));
                that._ShabloneSanad_HesabeAvarezBarArzeshAfzoode_ForooshLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._BindableEntity.get("FinancialYear")));
                that._ShabloneSanad_HesabeTakhfifat_ForooshLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._BindableEntity.get("FinancialYear")));
                that._ShabloneSanad_HesabeForooshLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._BindableEntity.get("FinancialYear")));
                that._ShabloneSanad_HesabeForoosheAmaniLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._BindableEntity.get("FinancialYear")));
                that._ShabloneSanad_HesabeBargashtAzForooshLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._BindableEntity.get("FinancialYear")));
                that._ShabloneSanad_HesabeBargashtAzForoosheAmaniLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._BindableEntity.get("FinancialYear")));
                that._ShabloneSanad_HesabeMoshtarianLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._BindableEntity.get("FinancialYear")));
                that._ShabloneSanad_HesabeMoshtarianAmaniLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._BindableEntity.get("FinancialYear")));

                that._ShabloneSanad_HesabeMaliatBarArzeshAfzoode_KharidLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._BindableEntity.get("FinancialYear")));
                that._ShabloneSanad_HesabeAvarezBarArzeshAfzoode_KharidLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._BindableEntity.get("FinancialYear")));
                that._ShabloneSanad_HesabeTakhfifat_KharidLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._BindableEntity.get("FinancialYear")));
                that._ShabloneSanad_HesabeKharidLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._BindableEntity.get("FinancialYear")));
                that._ShabloneSanad_HesabeTaminKonandeganLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._BindableEntity.get("FinancialYear")));
                that._ShabloneSanad_HesabeBargashtAzKharidLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._BindableEntity.get("FinancialYear")));
            }
        },

        _FinancialYearFieldControl_ValueChanged: function (e) {
            var that = this;

            that._ShabloneSanad_HesabeMaliatBarArzeshAfzoode_ForooshLookupControl.SetValue(null);
            that._ShabloneSanad_HesabeAvarezBarArzeshAfzoode_ForooshLookupControl.SetValue(null);
            that._ShabloneSanad_HesabeTakhfifat_ForooshLookupControl.SetValue(null);
            that._ShabloneSanad_HesabeForooshLookupControl.SetValue(null);
            that._ShabloneSanad_HesabeForoosheAmaniLookupControl.SetValue(null);
            that._ShabloneSanad_HesabeBargashtAzForooshLookupControl.SetValue(null);
            that._ShabloneSanad_HesabeBargashtAzForoosheAmaniLookupControl.SetValue(null);
            that._ShabloneSanad_HesabeMoshtarianLookupControl.SetValue(null);
            that._ShabloneSanad_HesabeMoshtarianAmaniLookupControl.SetValue(null);

            that._ShabloneSanad_HesabeMaliatBarArzeshAfzoode_KharidLookupControl.SetValue(null);
            that._ShabloneSanad_HesabeAvarezBarArzeshAfzoode_KharidLookupControl.SetValue(null);
            that._ShabloneSanad_HesabeTakhfifat_KharidLookupControl.SetValue(null);
            that._ShabloneSanad_HesabeKharidLookupControl.SetValue(null);
            that._ShabloneSanad_HesabeTaminKonandeganLookupControl.SetValue(null);
            that._ShabloneSanad_HesabeBargashtAzKharidLookupControl.SetValue(null);

            if (that._FinancialYearFieldControl.GetValue() != null) {
                that._ShabloneSanad_HesabeMaliatBarArzeshAfzoode_ForooshLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._FinancialYearFieldControl.GetValue()));
                that._ShabloneSanad_HesabeAvarezBarArzeshAfzoode_ForooshLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._FinancialYearFieldControl.GetValue()));
                that._ShabloneSanad_HesabeTakhfifat_ForooshLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._FinancialYearFieldControl.GetValue()));
                that._ShabloneSanad_HesabeForooshLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._FinancialYearFieldControl.GetValue()));
                that._ShabloneSanad_HesabeForoosheAmaniLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._FinancialYearFieldControl.GetValue()));
                that._ShabloneSanad_HesabeBargashtAzForooshLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._FinancialYearFieldControl.GetValue()));
                that._ShabloneSanad_HesabeBargashtAzForoosheAmaniLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._FinancialYearFieldControl.GetValue()));
                that._ShabloneSanad_HesabeMoshtarianLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._FinancialYearFieldControl.GetValue()));
                that._ShabloneSanad_HesabeMoshtarianAmaniLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._FinancialYearFieldControl.GetValue()));

                that._ShabloneSanad_HesabeMaliatBarArzeshAfzoode_KharidLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._FinancialYearFieldControl.GetValue()));
                that._ShabloneSanad_HesabeAvarezBarArzeshAfzoode_KharidLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._FinancialYearFieldControl.GetValue()));
                that._ShabloneSanad_HesabeTakhfifat_KharidLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._FinancialYearFieldControl.GetValue()));
                that._ShabloneSanad_HesabeKharidLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._FinancialYearFieldControl.GetValue()));
                that._ShabloneSanad_HesabeTaminKonandeganLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._FinancialYearFieldControl.GetValue()));
                that._ShabloneSanad_HesabeBargashtAzKharidLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._FinancialYearFieldControl.GetValue()));
            }
            else {
                that._ShabloneSanad_HesabeMaliatBarArzeshAfzoode_ForooshLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._UserActiveFinancialYearID));
                that._ShabloneSanad_HesabeAvarezBarArzeshAfzoode_ForooshLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._UserActiveFinancialYearID));
                that._ShabloneSanad_HesabeTakhfifat_ForooshLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._UserActiveFinancialYearID));
                that._ShabloneSanad_HesabeForooshLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._UserActiveFinancialYearID));
                that._ShabloneSanad_HesabeForoosheAmaniLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._UserActiveFinancialYearID));
                that._ShabloneSanad_HesabeBargashtAzForooshLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._UserActiveFinancialYearID));
                that._ShabloneSanad_HesabeBargashtAzForoosheAmaniLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._UserActiveFinancialYearID));
                that._ShabloneSanad_HesabeMoshtarianLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._UserActiveFinancialYearID));
                that._ShabloneSanad_HesabeMoshtarianAmaniLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._UserActiveFinancialYearID));

                that._ShabloneSanad_HesabeMaliatBarArzeshAfzoode_KharidLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._UserActiveFinancialYearID));
                that._ShabloneSanad_HesabeAvarezBarArzeshAfzoode_KharidLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._UserActiveFinancialYearID));
                that._ShabloneSanad_HesabeTakhfifat_KharidLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._UserActiveFinancialYearID));
                that._ShabloneSanad_HesabeKharidLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._UserActiveFinancialYearID));
                that._ShabloneSanad_HesabeTaminKonandeganLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._UserActiveFinancialYearID));
                that._ShabloneSanad_HesabeBargashtAzKharidLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._UserActiveFinancialYearID));
            }
        },

        _OrganizationUnitAndFinancialDocTypeFieldControl_ValueChanged: function (e) {
            var that = this;

            var title = "";
            if (!ValueIsEmpty(that._OrganizationUnitDropDownList.GetText()))
                title = that._OrganizationUnitDropDownList.GetText();

            if (!ValueIsEmpty(that._FinancialDocTypeDropDownList.GetText()))
                title += " - " + that._FinancialDocTypeDropDownList.GetText();

            that._TitleFieldControl.SetValue(title);
        },

        _AccountsLookup_OpeningLookup: function (e) {
            var that = this;

            e.Sender.SetLookupDataListControlCustomOptions({ FinancialYear: that._FinancialYearFieldControl.GetValue() });
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

            if (ValueIsEmpty(that._FinancialYearFieldControl.GetValue())) {
                afw.MessageDialog.Show("سال مالی را انتخاب نمایید.");
                return false;
            }

            if (ValueIsEmpty(that._OrganizationUnitFieldControl.GetValue())) {
                afw.MessageDialog.Show("واحد سازمانی را انتخاب نمایید.");
                return false;
            }

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

    FormClass.TypeName = "cmn.FinancialGroupEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    cmn.FinancialGroupEditForm = FormClass;
})();
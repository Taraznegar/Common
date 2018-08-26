(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return cmn.FloatPriorityEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._AccountEntityLookupControl = that.FindControl("AccountEntityLookupControl");
  
            that._PersonPriorityFieldControl = that.FindControl("PersonPriorityFieldControl");
            that._CostCenterPriorityFieldControl = that.FindControl("CostCenterPriorityFieldControl");
            that._ProjectPriorityFieldControl = that.FindControl("ProjectPriorityFieldControl");
            that._ForeignCurrencyPriorityFieldControl = that.FindControl("ForeignCurrencyPriorityFieldControl");

            that._PersonPanel = that.FindControl("PersonPanel");
            that._PersonLabel = that.FindControl("PersonLabel");

            that._CostCenterPanel = that.FindControl("CostCenterPanel");
            that._CostCenterLabel = that.FindControl("CostCenterLabel");

            that._ProjectLabel = that.FindControl("ProjectLabel");
            that._ProjectPanel = that.FindControl("ProjectPanel");

            that._ForeignCurrencyLabel = that.FindControl("ForeignCurrencyLabel");
            that._ForeignCurrencyPanel = that.FindControl("ForeignCurrencyPanel");

            that._AccountEntityLookupControl.bind("ValueChanged", function (e) { that._AccountEntityLookupControl_ValueChanged(e); });
             
            that._FinancialYearID = cmn.GetUserActiveFinancialYearID();

            if (that._FormMode == "New") {
               that._BindableEntity.set("FinancialYear", that._FinancialYearID);
            }
            else if (that._FormMode == "Edit") {
                that.SetVisibleControl(that._BindableEntity.get("Account"));
            }

            that._AccountEntityLookupControl.SetBaseFilterExpression(String.Format("FinancialYear = '{0}'", that._BindableEntity.get("FinancialYear")));
        },
   
        _AccountEntityLookupControl_ValueChanged: function (e) {
            var that = this;

            if (that._AccountEntityLookupControl.GetValue() != null) {

                var account = that._AccountEntityLookupControl.GetValue();

                that.SetVisibleControl(account);
            }
        },

        SetVisibleControl: function(account){
            var that = this;

            var personGroupEntity = afw.uiApi.FetchEntityList("acc.PersonGroupAccount", String.Format("Account = '{0}'", account));
            var costCenterGroupEntity = afw.uiApi.FetchEntityList("acc.CostCenterGroupAccount", String.Format("Account = '{0}'", account));
            var projectGroupEntity = afw.uiApi.FetchEntityList("acc.ProjectGroupAccount", String.Format("Account = '{0}'", account));
            var foreignCurrencyGroupEntity = afw.uiApi.FetchEntityList("acc.ForeignCurrencyGroupAccount", String.Format("Account = '{0}'", account));
            
            if (personGroupEntity.Entities.length > 0) {
                that._PersonPriorityFieldControl.SetVisible(true);
                that._PersonPanel.SetVisible(true);
                that._PersonLabel.SetVisible(true);
            }
            else {
                that._PersonPriorityFieldControl.SetVisible(false);
                that._PersonPanel.SetVisible(false);
                that._PersonLabel.SetVisible(false);
            }

            if (costCenterGroupEntity.Entities.length > 0) {
                that._CostCenterPriorityFieldControl.SetVisible(true);
                that._CostCenterPanel.SetVisible(true);
                that._CostCenterLabel.SetVisible(true);
            }
            else {
                that._CostCenterPriorityFieldControl.SetVisible(false);
                that._CostCenterPanel.SetVisible(false);
                that._CostCenterLabel.SetVisible(false);
            }

            if (projectGroupEntity.Entities.length > 0) {
                that._ProjectPriorityFieldControl.SetVisible(true);
                that._ProjectLabel.SetVisible(true);
                that._ProjectPanel.SetVisible(true);
            }
            else {
                that._ProjectPriorityFieldControl.SetVisible(false);
                that._ProjectLabel.SetVisible(false);
                that._ProjectPanel.SetVisible(false);
            }

            if (foreignCurrencyGroupEntity.Entities.length > 0) {
                that._ForeignCurrencyPriorityFieldControl.SetVisible(true);
                that._ForeignCurrencyLabel.SetVisible(true);
                that._ForeignCurrencyPanel.SetVisible(true);
            }
            else {
                that._ForeignCurrencyPriorityFieldControl.SetVisible(false);
                that._ForeignCurrencyLabel.SetVisible(false);
                that._ForeignCurrencyPanel.SetVisible(false);
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
             
            var saved = false;
             
            if (that._PersonPriorityFieldControl.GetValue() > 4 || that._PersonPriorityFieldControl.GetValue() < 0 ||
                that._CostCenterPriorityFieldControl.GetValue() > 4 || that._CostCenterPriorityFieldControl.GetValue() < 0 ||
                that._ProjectPriorityFieldControl.GetValue() > 4 || that._ProjectPriorityFieldControl.GetValue() < 0 ||
                that._ForeignCurrencyPriorityFieldControl.GetValue() > 4 || that._ForeignCurrencyPriorityFieldControl.GetValue() < 0 ||
                that._PersonPriorityFieldControl.GetValue() == that._CostCenterPriorityFieldControl.GetValue() ||
                that._PersonPriorityFieldControl.GetValue() == that._ProjectPriorityFieldControl.GetValue() ||
                that._PersonPriorityFieldControl.GetValue() == that._ForeignCurrencyPriorityFieldControl.GetValue() ||
                that._CostCenterPriorityFieldControl.GetValue() == that._ProjectPriorityFieldControl.GetValue() ||
                that._CostCenterPriorityFieldControl.GetValue() == that._ForeignCurrencyPriorityFieldControl.GetValue() ||
                that._ProjectPriorityFieldControl.GetValue() == that._ForeignCurrencyPriorityFieldControl.GetValue()) {
                afw.MessageDialog.Show("مقادیر نباید کمتر از صفر و یا بیشتر از 4 و یا برابر باهم باشند.");
            }
            else
                saved = afw.EntityWindowBase.fn._Save.call(that);
            return saved;
        }

    });

    //Static Members:

    FormClass.TypeName = "cmn.FloatPriorityEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    cmn.FloatPriorityEditForm = FormClass;
})();
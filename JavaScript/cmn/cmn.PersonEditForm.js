(function () {
    var FormClass = afw.EntityFormBase.extend({
        GetType: function () {
            return cmn.PersonEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityFormBase.fn.init.call(that, options);

            that._Toolbar = that.FindControl("Toolbar");
            that._ShouldCloseWindowAfterSave = false;

            if ("RoleName" in options)
                that._RoleName = options.RoleName;
            else
                that._RoleName = null;

            that._StateControl = that.FindControl("StateFieldControl").FindControl("InnerControl");
            that._CityControl = that.FindControl("CityFieldControl").FindControl("InnerControl");
            that._ShahrestanControl = that.FindControl("ShahrestanFieldControl").FindControl("InnerControl");
            that._AreaControl = that.FindControl("AreaFieldControl").FindControl("InnerControl");
            that._CustomerCategorySelectDockPanel = that.FindControl("CustomerCategorySelectDockPanel");
            that._StatePreNumberTextBox = that.FindControl("StatePreNumberTextBox");

            that._NameControl = that.FindControl("NameFieldControl").FindControl("InnerControl");
            that._LastNameControl = that.FindControl("LastNameFieldControl").FindControl("InnerControl");
            that._GenderControl = that.FindControl("GenderFieldControl");
            that._BirthDateControl = that.FindControl("BirthDateFieldControl");
            that._CodeMelliControl = that.FindControl("CodeMelliFieldControl");
            that._PersonTypeControl = that.FindControl("PersonTypeFieldControl").FindControl("InnerControl");
            that._PostalCodeControl = that.FindControl("PostalCodeFieldControl").FindControl("InnerControl");
            that._CodeEghtesadiControl = that.FindControl("CodeEghtesadiFieldControl");
            that._CodeEghtesadiPanel = that.FindControl("CodeEghtesadiPanel");
            that._Address1FieldControl = that.FindControl("Address1FieldControl");
            that._CodesDockPanel = that.FindControl("CodesDockPanel");
            that._CustomerCategorySelectPanel = that.FindControl("CustomerCategorySelectPanel");
            that._CaptionLabel = that.FindControl("CaptionLabel");
            that._Tab1DockPanel = that.FindControl("Tab1DockPanel");
            that._RolesWrapperDockPanel = that.FindControl("RolesWrapperDockPanel");

            that._MobilePhoneNumber1IconPanel = that.FindControl("MobilePhoneNumber1IconPanel");
            that._MobilePhoneNumber1Control = that.FindControl("MobilePhoneNumber1FieldControl").FindControl("InnerControl");
            that._MobilePhoneNumber1IconPanel.SetVisible(false);
            that._MobilePhoneNumber1Control.SetVisible(false);

            that._NameControl.bind("ValueChanged", function (e) { that._NameControl_ValueChanged(e); });
            that._LastNameControl.bind("ValueChanged", function (e) { that._LastNameControl_ValueChanged(e); });
            that._MobilePhoneNumber1Control.bind("ValueChanged", function (e) { that._MobilePhoneNumber1Control_ValueChanged(e); });

            that._StateControl.bind("ValueChanged", function (e) { that._StateControl_ValueChanged(e); });
            that._CityControl.bind("ValueChanged", function (e) { that._CityControl_ValueChanged(e); });
            that._ShahrestanControl.bind("ValueChanged", function (e) { that._ShahrestanControl_ValueChanged(e); });

            that._CityControl.bind("LoadingEntityList", function (e) { that._CityControl_LoadingEntityList(e); });
            that._ShahrestanControl.bind("LoadingEntityList", function (e) { that._ShahrestanControl_LoadingEntityList(e); });
            that._AreaControl.bind("LoadingEntityList", function (e) { that._AreaControl_LoadingEntityList(e); });

            that._PersonTypeControl.bind("ValueChanged", function (e) { that._PersonTypeControl_ValueChanged(e); });

            that._PersonID = that._BindableEntity.get("ID");
            that._MainTabControl = that.FindControl("MainTabControl");
            that._PersonRoles = afw.uiApi.FetchEntityList("cmn.PersonRole").Entities;
            that._PersonGroups = afw.uiApi.FetchEntityList("cmn.PersonGroup").Entities;

            that._PersonRoleRelationEntityList = null;
            that._PersonGroupRelationEntityList = null;

            if (!that._BindableEntity._Entity.FieldExists("PersonRoleRelations"))
                that._BindableEntity._Entity.AddField("PersonRoleRelations");

            if (!that._BindableEntity._Entity.FieldExists("PersonGroupRelations"))
                that._BindableEntity._Entity.AddField("PersonGroupRelations");

            if (that._FormMode == "New") {
                that._CityControl.SetReadOnly(true);
                that._ShahrestanControl.SetReadOnly(true);
                that._AreaControl.SetReadOnly(true);

                that._PersonRoleRelationEntityList = afw.uiApi.CreateEntityList("cmn.PersonRoleRelation");
                that._PersonGroupRelationEntityList = afw.uiApi.CreateEntityList("cmn.PersonGroupRelation");

                if ("PersonType" in options)
                    that._BindableEntity.set("PersonType", options.PersonType);

                if ("PersonName" in options)
                    that._BindableEntity.set("Name", options.PersonName);

                if ("PersonLastName" in options)
                    that._BindableEntity.set("LastName", options.PersonLastName);

            }
            else if (that._FormMode == "Edit") {
                that._InitForEdit();
                that._AdjustCodesDockPanel();
            }

            that._InitForRoles();
            that._InitForGroups();
        },

        _OnOpening: function () {
            var that = this;

            afw.EntityFormBase.fn._OnOpening.call(that);
        },

        _OnOpened: function () {
            var that = this;

            afw.EntityFormBase.fn._OnOpened.call(that);

            that._AdjustForm();
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            that._ShouldCloseWindowAfterSave = buttonKey == "SaveAndClose";

            afw.EntityFormBase.fn._OnToolbarButtonClicked.call(that, buttonKey);
        },

        _InitForEdit: function () {
            var that = this;

            that._PersonRoleRelationEntityList = afw.uiApi.FetchEntityList("cmn.PersonRoleRelation", String.Format("Person = '{0}'", that._BindableEntity.get("ID")));
            that._PersonGroupRelationEntityList = afw.uiApi.FetchEntityList("cmn.PersonGroupRelation", String.Format("Person = '{0}'", that._BindableEntity.get("ID")));

            that._SetCaptionLabel();

            var stateID = that._StateControl.GetValue();
            if (stateID != null) {
                that._SetStatePreNumber(stateID);
            }

        },

        _SetCaptionLabel: function () {
            var that = this;

            var name = that._BindableEntity.get("Name");
            var lastName = that._BindableEntity.get("LastName");
            var financialAccountCode = that._BindableEntity.get("FinancialAccountCode");

            var caption = "";

            if (!ValueIsEmpty(name))
                caption = name;

            if (!ValueIsEmpty(lastName)) {
                if (!ValueIsEmpty(caption))
                    caption += " ";

                caption += lastName;
            }

            if (!ValueIsEmpty(financialAccountCode))
                caption += "       | " + "کد حساب مالی: " + financialAccountCode;

            that._CaptionLabel.SetText(caption);
        },

        _InitForRoles: function () {
            var that = this;

            that._BindableEntity._Entity.SetFieldValue("PersonRoleRelations", that._PersonRoleRelationEntityList);

            if (that._RoleName != null) {
                if (that._FormMode != "New")
                    throw "RoleName can set just in New mode";

                that._Tab1DockPanel.SetPaneSizeSetting(1, 1);

                var roleId = that._GetRoleId(that._RoleName);

                var person_RoleInfoEntity = afw.uiApi.CreateNewEntity("cmn.Person_" + that._RoleName + "Info");

                var personRoleEntity = afw.uiApi.FetchEntity("cmn.PersonRole", String.Format("Name = '{0}'", that._RoleName));

                that._TryCreateRoleInfoTab(that._RoleName, personRoleEntity.GetFieldValue("Title"), person_RoleInfoEntity);

                person_RoleInfoEntity.SetFieldValue("Person", that._PersonID);

                that._BindableEntity._Entity.AddField(that._RoleName + "Info", person_RoleInfoEntity);

                var personRoleRelationEntity = afw.uiApi.CreateNewEntity("cmn.PersonRoleRelation");
                personRoleRelationEntity.SetFieldValue("Person", that._PersonID);
                personRoleRelationEntity.SetFieldValue("PersonRole", roleId);
                personRoleRelationEntity.ChangeStatus = "Add";
                that._PersonRoleRelationEntityList.Entities.push(personRoleRelationEntity);
            }
            else {
                that._Tab1DockPanel.SetPaneSizeSetting(1, 250);

                var rolesDockPanel =
                    new afw.DockPanel({
                        ParentControl: that._RolesWrapperDockPanel.Panes[0],
                        Name: "RolesDockPanel",
                        Orientation: afw.Constants.Vertical,
                        PanesCount: that._PersonRoles.length + 1
                    });

                rolesDockPanel.SetPaneSizeSetting(0, 40);

                var roleTitleDockPanel = new afw.DockPanel({
                    ParentControl: rolesDockPanel.Panes[0],
                    Name: "RoleTitleDockPanel",
                    Orientation: afw.Constants.Horizontal,
                    PanesCount: 2
                });

                roleTitleDockPanel.SetPaneSizeSetting(0, 140);

                var rolesNameLabel = new afw.Label({
                    ParentControl: roleTitleDockPanel.Panes[0],
                    Name: "RolesNameLabel",
                    Text: "نقش های شخص",
                    FontBold: true
                });

                var rolesCodeLabel = new afw.Label({
                    ParentControl: roleTitleDockPanel.Panes[1],
                    Name: "RolesCodeLabel",
                    Text: "کد",
                    FontBold: true
                });

                for (var roleIndex = 0; roleIndex < that._PersonRoles.length ; roleIndex++) {

                    rolesDockPanel.SetPaneSizeSetting(roleIndex + 1, 33);

                    var roleId = that._PersonRoles[roleIndex].GetFieldValue("ID");
                    var roleName = that._PersonRoles[roleIndex].GetFieldValue("Name");
                    var roleTitle = that._PersonRoles[roleIndex].GetFieldValue("Title");

                    var roleIsChecked = false;

                    var personCode = "";

                    if (that._FormMode == "Edit") {

                        var roleRelationEntity = null;
                        if ($.grep(that._PersonRoleRelationEntityList.Entities, function (o) { return o.GetFieldValue("PersonRole") == roleId; }).length > 0)
                            roleRelationEntity = $.grep(that._PersonRoleRelationEntityList.Entities, function (o) { return o.GetFieldValue("PersonRole") == roleId; })[0];

                        if (roleRelationEntity != null) {
                            roleIsChecked = true;

                            var personRoleInfoEntity = afw.uiApi.FetchEntity("cmn.Person_" + roleName + "Info", String.Format("Person = '{0}'", that._PersonID));
                            if (personRoleInfoEntity != null) {
                                that._BindableEntity._Entity.AddField(roleName + "Info", personRoleInfoEntity);

                                that._TryCreateRoleInfoTab(roleName, roleTitle, personRoleInfoEntity);

                                personCode = personRoleInfoEntity.GetFieldValue("PersonCode");
                            }
                        }
                    }

                    that._CreateRolePanel(rolesDockPanel.Panes[roleIndex + 1], roleName, roleTitle, roleIsChecked, personCode);

                }

                for (var i = 0; i < that._PersonRoles.length ; i++) {
                    var checkBoxName = that._PersonRoles[i].GetFieldValue("Name") + "RoleCheckBox";
                    var personRoleCheckBoxControl = that.FindControl(checkBoxName);
                    personRoleCheckBoxControl.bind("ValueChanged", function (e) { that._PersonRoleCheckBoxControl_ValueChanged(e); });
                }

                //////کوچک کردن پانل نوع مشتری 

                that._AdjustForm();
            }
        },

        _TryCreateRoleInfoTab: function (roleName, roleTitle, personRoleInfoEntity) {
            var that = this;

            var roleInfoEditFormEntity = afw.FormHelper.TryGetFormByFullName("cmn.Person_" + roleName + "InfoEditForm");
            if (roleInfoEditFormEntity != null) {
                var roleTabName = roleName + "Tab";
                that._MainTabControl.AppendTab(roleTabName, roleTitle);
                afw.uiApi.CreateSavedFormByName(that.FindControl(roleTabName), "cmn.Person_" + roleName + "InfoEditForm");

                var roleBindableEntity = personRoleInfoEntity.ToBindableEntity();
                that.FindControl(roleTabName).InitDataBinding(roleBindableEntity);
            }
        },

        _CreateRolePanel: function (parentControl, roleName, roleTitle, roleIsChecked, personCode) {
            var that = this;

            var roleDockPanel = new afw.DockPanel({
                ParentControl: parentControl,
                Name: "RoleDockPanel",
                Orientation: afw.Constants.Horizontal,
                PanesCount: 3
            });

            roleDockPanel.SetPaneSizeSetting(1, 30);

            var label = new afw.Label({
                ParentControl: roleDockPanel.Panes[0],
                Name: roleName + "RoleLabel",
                Text: roleTitle,
                FillParent: true
            });

            var checkBox = new afw.CheckBox({
                ParentControl: roleDockPanel.Panes[1],
                Name: roleName + "RoleCheckBox",
                LabelVisible: false,
                Checked: roleIsChecked,
                FillParent: true
            });

            var textBox = new afw.TextBox({
                ParentControl: roleDockPanel.Panes[2],
                Name: roleName + "CodeTextBox",
                Text: personCode,
                LabelVisible: false,
                Multiline: false,
                ReadOnly: true,
                FillParent: true,
                Visible: (roleIsChecked && (personCode != ""))
            });
        },

        _NameControl_ValueChanged: function (e) {
            var that = this;

            that._SetCaptionLabel();
        },

        _LastNameControl_ValueChanged: function (e) {
            var that = this;

            that._SetCaptionLabel();
        },

        _MobilePhoneNumber1Control_ValueChanged: function (e) {
            var that = this;

            var mobileNumber = that._CreateValidNumber(that._MobilePhoneNumber1Control.GetValue());
            that._MobilePhoneNumber1Control.SetValue(mobileNumber);

            if (!ValueIsEmpty(mobileNumber)) {
                if (that._IsValidNumber(mobileNumber)) {
                    var personEntityList = afw.uiApi.FetchEntityList("cmn.Person", String.Format("MobilePhoneNumber1 like '%{0}%'", mobileNumber));
                    if (personEntityList.Entities.length > 0) {
                        if (that._FormMode == "New") {
                            var messageDialog = afw.MessageDialog.Show("این شخص قبلا ثبت شده است.");
                            messageDialog.bind("Close", function (e) {
                                var entity = personEntityList.Entities[0];
                                afw.EntityHelper.ShowEntityWindow(entity, "cmn.PersonEditForm", "Edit");
                                that.Close();
                            });
                        }
                        else if (that._FormMode == "Edit") {
                            if (personEntityList.Entities[0].GetFieldValue("ID") == that._BindableEntity.get("ID"))
                                return;
                            else {
                                var messageDialog = afw.MessageDialog.Show("این شخص قبلا ثبت شده است.");
                                messageDialog.bind("Close", function (e) {
                                    var entity = personEntityList.Entities[0];
                                    afw.EntityHelper.ShowEntityWindow(entity, "cmn.PersonEditForm", "Edit");
                                    that.Close();
                                });
                            }
                        }
                    }
                }

                else
                    afw.ErrorDialog.Show("شماره همراه وارد شده نامعتبر است");
            }
        },

        _IsValidNumber: function (number) {
            var that = this;

            if (ValueIsEmpty(number))
                return false;
            if (number.startsWith("09") && number.length == 11)
                return true;
            else if (number.startsWith("+989") && number.length == 13)
                return true;
            else if (number.startsWith("9") && number.length == 10)
                return true;

            return false;

        },

        _CreateValidNumber: function (number) {
            var that = this;

            while (!ValueIsEmpty(number)) {
                if (number.length < 10) {
                    afw.ErrorDialog.Show("شماره همراه وارد شده نامعتبر است");
                    return null;
                }
                if (number.startsWith("09") && number.length == 11)
                    return number;
                else if (number.startsWith("+989") && number.length == 13)
                    return number;
                else if (number.startsWith("9") && number.length == 10)
                    return "0" + number;
                else if (number.length > 9)
                    number = number.substring(0, number.length - 1)
            }

            return null;
        },

        _AdjustCodesDockPanel: function () {
            var that = this;

            if (that._PersonTypeControl.GetValue() == null)
                return;

            var personTypeName = afw.OptionSetHelper.GetOptionSetItemName(that._PersonTypeControl.GetValue());

            if (personTypeName == "Haghighi") {
                that._CodesDockPanel.SetPaneSizeSetting(0, "fill");//CodeMelli
                that._CodesDockPanel.SetPaneSizeSetting(1, 1);//NationalID
                that._CodesDockPanel.SetPaneSizeSetting(4, 1);//ShomareSabt
            }
            else {
                that._CodesDockPanel.SetPaneSizeSetting(0, 1);//CodeMelli
                that._CodesDockPanel.SetPaneSizeSetting(1, "fill");//NationalID
                that._CodesDockPanel.SetPaneSizeSetting(4, "fill");//ShomareSabt
            }

        },

        _PersonTypeControl_ValueChanged: function (e) {
            var that = this;

            if (that._PersonTypeControl.GetValue() == null) {
                var defaultPersonTypeID = afw.OptionSetHelper.GetOptionSetItemID("cmn.PersonTypes.Haghighi");
                that._PersonTypeControl.SetValue(defaultPersonTypeID);
                return;
            }

            var personTypeName = afw.OptionSetHelper.GetOptionSetItemName(that._PersonTypeControl.GetValue());
            if (personTypeName == "Haghighi") {
                if (that._FormMode == "New") {
                    var name = that._BindableEntity.get("Name");
                    that._BindableEntity.set("Name", "");
                    that._BindableEntity.set("LastName", name);
                }
            }

            that._AdjustForm();
        },

        _PersonRoleCheckBoxControl_ValueChanged: function (e) {
            var that = this;

            var roleCheckBox = e.Sender;

            var roleName = roleCheckBox.GetName().replace("RoleCheckBox", "");
            var roleEntity = that._GetRoleEntityByName(roleName);
            var roleID = roleEntity.GetFieldValue("ID");
            var roleTitle = roleEntity.GetFieldValue("Title");

            if (that.FindControl(roleName + "CodeTextBox").GetText() != "" && roleCheckBox.GetValue())
                that.FindControl(roleName + "CodeTextBox").SetVisible(true);
            else
                that.FindControl(roleName + "CodeTextBox").SetVisible(false);

            var foundPersonRoleRelationEntity = $.grep(that._PersonRoleRelationEntityList.Entities,
                function (o) { return o.GetFieldValue("PersonRole") === roleID; });

            var personRoleRelationEntity = null;
            if (foundPersonRoleRelationEntity.length > 0)
                personRoleRelationEntity = foundPersonRoleRelationEntity[0];

            var roleTabName = roleName + "Tab";

            if (roleCheckBox.GetValue() == true) {
                /* اضافه کردن رابطه نقش اشخاص به موجودیت شخص با توجه به فعال کردن نقش ها */
                if (personRoleRelationEntity != null) {
                    if (personRoleRelationEntity.ChangeStatus == "Delete") {
                        personRoleRelationEntity.ChangeStatus = "None";
                        that._BindableEntity._Entity.GetFieldValue(roleName + "Info").ChangeStatus = "None";
                    }

                }
                else {
                    var PersonRoleRelationEntity = afw.uiApi.CreateNewEntity("cmn.PersonRoleRelation");
                    PersonRoleRelationEntity.SetFieldValue("PersonRole", roleID);
                    PersonRoleRelationEntity.SetFieldValue("Person", that._PersonID);
                    that._PersonRoleRelationEntityList.Entities.push(PersonRoleRelationEntity);

                    var roleInfoEntity = afw.uiApi.CreateNewEntity("cmn.Person_" + roleName + "Info");
                    roleInfoEntity.SetFieldValue("Person", that._PersonID);
                    that._BindableEntity._Entity.AddField(roleName + "Info", roleInfoEntity);
                }

                if (!that._MainTabControl.TabExists(roleTabName))
                    that._TryCreateRoleInfoTab(roleName, roleTitle,
                        that._BindableEntity._Entity.GetFieldValue(roleName + "Info"));
                else
                    that._MainTabControl.SetTabEnabled(roleTabName, true);
            }
            else {
                if (personRoleRelationEntity != null) {
                    if (personRoleRelationEntity.ChangeStatus == "None") {
                        personRoleRelationEntity.ChangeStatus = "Delete";
                        that._BindableEntity._Entity.FieldValues[roleName + "Info"].ChangeStatus = "Delete";
                    }
                    else if (personRoleRelationEntity.ChangeStatus == "Add") {
                        var personRoleRelationIndex = that._PersonRoleRelationEntityList.Entities.FindIndex(
                            function (o) { return o.GetFieldValue("ID") == personRoleRelationEntity.GetFieldValue("ID"); });

                        that._PersonRoleRelationEntityList.Entities.RemoveItem(personRoleRelationIndex);
                        that._BindableEntity._Entity.RemoveField(roleName + "Info");
                    }
                }

                if (that._MainTabControl.TabExists(roleTabName))
                    that._MainTabControl.SetTabEnabled(roleTabName, false);

            }

            that._AdjustForm();
        },

        _PersonGroupCheckBoxControl_ValueChanged: function (e) {
            var that = this;

            var groupCheckBox = e.Sender;

            var groupID = groupCheckBox.GetName().replace("GroupCheckBox", "");
            var groupEntity = that._GetGroupEntityByID(groupID);
            var groupTitle = groupEntity.GetFieldValue("Title");

            var foundPersonGroupRelationEntity = $.grep(that._PersonGroupRelationEntityList.Entities,
                function (o) { return o.GetFieldValue("PersonGroup") === groupID; });

            var personGroupRelationEntity = null;
            if (foundPersonGroupRelationEntity.length > 0)
                personGroupRelationEntity = foundPersonGroupRelationEntity[0];

            if (groupCheckBox.GetValue() == true) {
                /* اضافه کردن رابطه گروه اشخاص به موجودیت شخص با توجه به فعال کردن گروه ها */
                if (personGroupRelationEntity != null) {
                    if (personGroupRelationEntity.ChangeStatus == "Delete") {
                        personGroupRelationEntity.ChangeStatus = "None";
                    }
                }
                else {
                    var PersonGroupRelationEntity = afw.uiApi.CreateNewEntity("cmn.PersonGroupRelation");
                    PersonGroupRelationEntity.SetFieldValue("PersonGroup", groupID);
                    PersonGroupRelationEntity.SetFieldValue("Person", that._PersonID);
                    PersonGroupRelationEntity.ChangeStatus = "Add";

                    that._PersonGroupRelationEntityList.Entities.push(PersonGroupRelationEntity);
                }
            }
            else {
                if (personGroupRelationEntity != null) {
                    if (personGroupRelationEntity.ChangeStatus == "None") {
                        personGroupRelationEntity.ChangeStatus = "Delete";
                    }
                    else if (personGroupRelationEntity.ChangeStatus == "Add") {
                        var personGroupRelationIndex = that._PersonGroupRelationEntityList.Entities.FindIndex(
                            function (o) { return o.GetFieldValue("ID") == personGroupRelationEntity.GetFieldValue("ID"); });

                        that._PersonGroupRelationEntityList.Entities.RemoveItem(personGroupRelationIndex);
                    }
                }
            }

            that._AdjustForm();
        },

        _StateControl_ValueChanged: function (e) {
            var that = this;

            that._CityControl.SetValue(null);

            var stateID = that._StateControl.GetValue();
            if (stateID == null)
                that._CityControl.SetReadOnly(true);
            else {
                that._CityControl.SetReadOnly(false);
                // that._Address1FieldControl.SetValue(e.Sender._ValueText);
                that._SetStatePreNumber(stateID);
            }
        },

        _CityControl_ValueChanged: function (e) {
            var that = this;

            that._ShahrestanControl.SetValue(null);

            var cityID = that._CityControl.GetValue();
            if (cityID == null)
                that._ShahrestanControl.SetReadOnly(true);
            else {
                that._ShahrestanControl.SetReadOnly(false);
                // that._Address1FieldControl.SetValue(that._Address1FieldControl.GetValue() + " ، " + e.Sender._ValueText);
            }
        },

        _ShahrestanControl_ValueChanged: function (e) {
            var that = this;

            that._AreaControl.SetValue(null);

            var shahrestanID = that._ShahrestanControl.GetValue();
            if (shahrestanID == null)
                that._AreaControl.SetReadOnly(true);
            else {
                that._AreaControl.SetReadOnly(false);
                //  that._Address1FieldControl.SetValue(that._Address1FieldControl.GetValue() + " ، " + e.Sender._ValueText);
            }
        },

        _CityControl_LoadingEntityList: function (e) {
            var that = this;

            var stateID = that._StateControl.GetValue();
            if (stateID != null)
                e.Sender.SetBaseFilterExpression(String.Format("State = '{0}'", stateID));
        },

        _ShahrestanControl_LoadingEntityList: function (e) {
            var that = this;

            var cityID = that._CityControl.GetValue();
            if (cityID != null)
                e.Sender.SetBaseFilterExpression(String.Format("City = '{0}'", cityID));
        },

        _AreaControl_LoadingEntityList: function (e) {
            var that = this;

            var shahrestanID = that._ShahrestanControl.GetValue();
            if (shahrestanID != null)
                e.Sender.SetBaseFilterExpression(String.Format("Shahrestan = '{0}'", shahrestanID));
        },

        _SetStatePreNumber: function (stateID) {
            var that = this;

            var stateEntity = afw.uiApi.FetchEntity("cmn.State", String.Format("ID = '{0}'", stateID));
            if (!ValueIsEmpty(stateEntity.GetFieldValue("StatePreNumber")))
                that._StatePreNumberTextBox.SetText(stateEntity.GetFieldValue("StatePreNumber"));
        },

        _PersonHasRole: function (roleId) {
            var that = this;

            if ($.grep(that._PersonRoleRelationEntityList.Entities, function (o) { return o.GetFieldValue("PersonRole") == roleId && e.ChangeStatus != "Delete"; }).length > 0)
                return true;
            else
                return false;
        },

        _InitForGroups: function () {
            var that = this;

            that._BindableEntity._Entity.SetFieldValue("PersonGroupRelations", that._PersonGroupRelationEntityList);

            var groupsDockPanel = new afw.DockPanel({
                ParentControl: that._RolesWrapperDockPanel.Panes[2],
                Name: "GroupsDockPanel",
                Orientation: afw.Constants.Vertical,
                PanesCount: that._PersonGroups.length + 1
            });

            groupsDockPanel.SetPaneSizeSetting(0, 40);
            var groupsPanelTitleLable = new afw.Label({
                ParentControl: groupsDockPanel.Panes[0],
                Name: "GroupsPanelTitleLable",
                Text: "گروه های شخص",
                Visible: true,
                FontBold: true
            });

            for (var personGroupIndex = 0; personGroupIndex < that._PersonGroups.length ; personGroupIndex++) {
                groupsDockPanel.SetPaneSizeSetting(personGroupIndex + 1, 30);
                var groupId = that._PersonGroups[personGroupIndex].GetFieldValue("ID");

                var groupIsChecked = false;

                var groupRelationEntity = null;
                if ($.grep(that._PersonGroupRelationEntityList.Entities, function (o) { return o.GetFieldValue("PersonGroup") == groupId; }).length > 0)
                    groupRelationEntity = $.grep(that._PersonGroupRelationEntityList.Entities, function (o) { return o.GetFieldValue("PersonGroup") == groupId; })[0];

                if (groupRelationEntity != null)
                    groupIsChecked = true;
                else
                    groupIsChecked = false;

                var checkBox1 = new afw.CheckBox({
                    ParentControl: groupsDockPanel.Panes[personGroupIndex + 1],
                    Name: "GroupCheckBox" + that._PersonGroups[personGroupIndex].GetFieldValue("ID"),
                    LabelText: that._PersonGroups[personGroupIndex].GetFieldValue("Title"),
                    LabelVisible: true,
                    Checked: groupIsChecked
                });
            }

            for (var i = 0; i < that._PersonGroups.length ; i++) {
                var checkBoxName = "GroupCheckBox" + that._PersonGroups[i].GetFieldValue("ID");
                var personGroupCheckBoxControl = that.FindControl(checkBoxName);
                personGroupCheckBoxControl.bind("ValueChanged", function (e) { that._PersonGroupCheckBoxControl_ValueChanged(e); });
            }
        },

        _AdjustForm: function () {
            var that = this;

            afw.EntityFormBase.fn._AdjustForm.call(that);

            that._RolesWrapperDockPanel.Panes[0].SetBackColor("#e0e4e7");
            that._RolesWrapperDockPanel.Panes[1].SetBackColor("#c2c8cd");
            that._RolesWrapperDockPanel.Panes[2].SetBackColor("#e0e4e7");

            that._AdjustCodesDockPanel();

            that._AdjustCustomerCategorySelectControl();

            if (that._PersonTypeControl.GetValue() == null) {
                that._LastNameControl.SetVisible(false);
                that._GenderControl.SetVisible(false);
                that._BirthDateControl.SetVisible(false);
                that._CodeEghtesadiControl.SetVisible(false);
                that._CodeEghtesadiPanel.SetVisible(false);
            }
            else {
                var personTypeName = afw.OptionSetHelper.GetOptionSetItemName(that._PersonTypeControl.GetValue());
                if (personTypeName == "Haghighi") {
                    that._BindableEntity.set("CodeEghtesadi", null);

                    that._LastNameControl.SetVisible(true);
                    that._GenderControl.SetVisible(true);
                    that._BirthDateControl.SetVisible(true);
                    that._CodeEghtesadiControl.SetVisible(false);
                    that._CodeEghtesadiPanel.SetVisible(false);

                    that._NameControl.SetLabelText("نام");

                    that._MobilePhoneNumber1IconPanel.SetVisible(true);
                    that._MobilePhoneNumber1Control.SetVisible(true);

                    that._MobilePhoneNumber1Control.Focus();

                    that._LastNameControl.SetShowRequiredStar(true);
                }
                else {
                    that._MobilePhoneNumber1IconPanel.SetVisible(false);
                    that._MobilePhoneNumber1Control.SetVisible(false);

                    that._BindableEntity.set("Gender", null);
                    that._BindableEntity.set("LastName", null);
                    that._BindableEntity.set("BirthDate", null);

                    that._LastNameControl.SetVisible(false);
                    that._GenderControl.SetVisible(false);
                    that._BirthDateControl.SetVisible(false);
                    that._CodeEghtesadiControl.SetVisible(true);

                    if (personTypeName == "Institue")
                        that._NameControl.SetLabelText("نام مؤسسه");
                    else
                        that._NameControl.SetLabelText("نام سازمان/شرکت");

                    that._NameControl.SetShowRequiredStar(true);
                }
            }

            if (that._GenderControl.GetVisible() == true)
                that.FindControl("GenderDockPanel").SetHeight(40);
            else
                that.FindControl("GenderDockPanel").SetHeight(1);

            if (that._LastNameControl.GetVisible() == true)
                that.FindControl("LastNameDockPanel").SetHeight(40);
            else
                that.FindControl("LastNameDockPanel").SetHeight(1);

            if (that._HasRoleExceptConnectedPersonRole()) {
                that.FindControl("RecognitionMethodFieldControl").SetVisible(true);
            }
            else {
                that.FindControl("RecognitionMethodFieldControl").SetVisible(false);
                that._BindableEntity.set("RecognitionMethod", null);
            }

            that.FindControl("FirstTabularPanel").AdjustRows();
            that.FindControl("SecondTabularPanel").AdjustRows();

            var stateID = that._StateControl.GetValue();
            var cityID = that._CityControl.GetValue();
            var shahrestanID = that._ShahrestanControl.GetValue();

            if (stateID == null)
                that._CityControl.SetReadOnly(true);
            else
                that._CityControl.SetReadOnly(false);

            if (cityID == null)
                that._ShahrestanControl.SetReadOnly(true);
            else
                that._ShahrestanControl.SetReadOnly(false);

            if (shahrestanID == null)
                that._AreaControl.SetReadOnly(true);
            else
                that._AreaControl.SetReadOnly(false);

        },

        _AdjustCustomerCategorySelectControl: function () {
            var that = this;

            var control = that._CustomerCategorySelectDockPanel.Panes[1].FindControl("CustomerCategorySelectControl");
            if (control != null)
                control.Destroy();

            var roleInfoEntity = null;

            var customerRoleCheckBox = that.FindControl("CustomerRoleCheckBox");
            var potentialCustomerRoleCheckBox = that.FindControl("PotentialCustomerRoleCheckBox");

            if (customerRoleCheckBox != null && customerRoleCheckBox.GetChecked())
                roleInfoEntity = that._BindableEntity._Entity.GetFieldValue("CustomerInfo");
            else
                if (potentialCustomerRoleCheckBox != null && potentialCustomerRoleCheckBox.GetChecked())
                    roleInfoEntity = that._BindableEntity._Entity.GetFieldValue("PotentialCustomerInfo");

            if (roleInfoEntity != null) {
                that._CustomerCategorySelectPanel.SetBorderWidth(1);
                that._CustomerCategorySelectDockPanel.SetPaneSizeSetting(0, 30);
                that._CustomerCategorySelectDockPanel.SetPaneSizeSetting(1, 124);
                var control = new cmn.CustomerCategorySelectControl({ Name: "CustomerCategorySelectControl", ParentControl: that._CustomerCategorySelectDockPanel.Panes[1], RoleInfoEntitiy: roleInfoEntity });
            }
            else {
                //وقتی که نقش متری از حالت انتخاب خارج شده باشد اما گروهبندی ان پاک نشده باشد
                if (that._BindableEntity._Entity.FieldExists("CustomerInfo"))
                    roleInfoEntity = that._BindableEntity._Entity.GetFieldValue("CustomerInfo");

                if (roleInfoEntity != null) {
                    roleInfoEntity.SetFieldValue("MainGroup", null);
                    roleInfoEntity.SetFieldValue("SubGroup1", null);
                    roleInfoEntity.SetFieldValue("SubGroup2", null);
                }
                that._CustomerCategorySelectPanel.SetBorderWidth(0);
                that._CustomerCategorySelectDockPanel.SetPaneSizeSetting(0, 1);
                that._CustomerCategorySelectDockPanel.SetPaneSizeSetting(1, 1);
            }

        },

        _ValidateForm: function () {
            var that = this;

            if (that._LastNameControl.GetVisible() == true && ValueIsEmpty(that._LastNameControl.GetValue())) {
                afw.ErrorDialog.Show("نام خانوادگی وارد نشده است.");
                return false;
            }

            if (that._NameControl.GetVisible() == true && ValueIsEmpty(that._NameControl.GetValue())) {
                afw.ErrorDialog.Show("نام وارد نشده است.");
                return false;
            }

            if (!afw.EntityFormBase.fn._ValidateForm.call(that))
                return false;

            return true;
        },

        _Save: function () {
            var that = this;

            if (ValueIsEmpty(that._BindableEntity.get("StoredDisplayText")))
                that._BindableEntity.set("StoredDisplayText", " ");

            try {
                if (that._ValidateForm()) {
                    afw.uiApi.CallServerMethodSync("cmn.SavePerson", [that._BindableEntity.GetEntity()]);
                    that._OnFormSaved();
                    return true;
                }
                else
                    return false;
            }
            catch (ex) {
                afw.App.HandleError(ex);
                return false;
            }

        },

        _OnFormSaved: function () {
            var that = this;

            var personEntity = that._BindableEntity.GetEntity();

            if (that._ShouldCloseWindowAfterSave == false) {
                if (that._FormMode == "New") {
                    personEntity.ChangeStatus = "Modify"; //Allow saving again if form is not closed
                }

                for (var i = 0 ; i < personEntity.FieldValues["PersonRoleRelations"].Entities.length ; i++)
                    personEntity.FieldValues["PersonRoleRelations"].Entities[i].ChangeStatus = "Modify";

                for (var i = 0 ; i < that._PersonRoles.length ; i++) {
                    var roleName = that._PersonRoles[i].GetFieldValue("Name");
                    if (personEntity.FieldExists(roleName + "Info") == true)
                        personEntity.GetFieldValue(roleName + "Info").ChangeStatus = "Modify";
                }

                that._AdjustForm();

                if (ValueIsEmpty(personEntity.GetFieldValue("FinancialAccountCode"))) {
                    var fetchedPerson = afw.uiApi.FetchEntityByID("cmn.Person", personEntity.GetFieldValue("ID"));
                    that._BindableEntity.set("FinancialAccountCode", fetchedPerson.GetFieldValue("FinancialAccountCode"));
                    that._SetCaptionLabel();
                }
            }
        },

        _GetRoleEntityByName: function (roleName) {
            var that = this;

            var roleEntity = $.grep(that._PersonRoles, function (o) { return o.GetFieldValue("Name") === roleName; })[0];
            return roleEntity;
        },

        _GetGroupEntityByID: function (groupID) {
            var that = this;

            var groupEntity = $.grep(that._PersonGroups, function (o) { return o.GetFieldValue("ID") === groupID; })[0];
            return groupEntity;
        },

        _GetRoleId: function (roleName) {
            var that = this;

            return that._GetRoleEntityByName(roleName).GetFieldValue("ID");
        },

        _GetRoleName: function (roleId) {
            var that = this;

            var roleEntity = $.grep(that._PersonRoles, function (o) { return o.GetFieldValue("ID") === roleId; })[0];
            return roleEntity.GetFieldValue("Name");
        },

        _HasRoleExceptConnectedPersonRole: function () {
            var that = this;

            for (var i = 0; i < that._PersonRoleRelationEntityList.Entities.length; i++) {
                var roleRelationEntity = that._PersonRoleRelationEntityList.Entities[i];
                if (roleRelationEntity.GetFieldValue("PersonRole") != that._GetRoleId("ConnectedPerson") && roleRelationEntity.ChangeStatus != "Delete")
                    return true;
            }

            return false;
        }

    });

    //Static Members:
    FormClass.TypeName = "cmn.PersonEditForm";
    FormClass.BaseType = afw.EntityFormBase;


    cmn.PersonEditForm = FormClass;
})();
